/**
 * Cloudflare-Aware Topics Extractor for Hydrogen Studies
 * Uses proper headers and request patterns to bypass Cloudflare protection
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class CloudflareAwareExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 3000; // 3 second delay between requests
        this.maxRetries = 5;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.sessionCookies = new Map();
        
        // Cloudflare-aware headers
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0'
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
    }

    /**
     * Make HTTP request with Cloudflare-aware headers and retry logic
     */
    async makeRequest(url, retryCount = 0) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    ...this.headers,
                    'Host': urlObj.hostname,
                    'Referer': this.baseUrl
                }
            };

            // Add cookies if available
            if (this.sessionCookies.has(urlObj.hostname)) {
                options.headers['Cookie'] = this.sessionCookies.get(urlObj.hostname);
            }

            const client = urlObj.protocol === 'https:' ? https : http;
            
            const req = client.request(options, (res) => {
                let data = '';
                
                // Handle gzip compression
                if (res.headers['content-encoding'] === 'gzip') {
                    const zlib = require('zlib');
                    const gunzip = zlib.createGunzip();
                    res.pipe(gunzip);
                    gunzip.on('data', chunk => data += chunk);
                    gunzip.on('end', () => this.handleResponse(res, data, resolve, reject, url));
                } else {
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => this.handleResponse(res, data, resolve, reject, url));
                }
            });

            req.on('error', (error) => {
                this.log(`Request error for ${url}: ${error.message}`, 'error');
                if (retryCount < this.maxRetries) {
                    this.log(`Retrying ${url} (attempt ${retryCount + 1}/${this.maxRetries})`, 'warn');
                    setTimeout(() => {
                        this.makeRequest(url, retryCount + 1).then(resolve).catch(reject);
                    }, this.delayMs * (retryCount + 1));
                } else {
                    reject(error);
                }
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Handle HTTP response and extract cookies
     */
    handleResponse(res, data, resolve, reject, url) {
        // Extract and store cookies for session management
        if (res.headers['set-cookie']) {
            const urlObj = new URL(url);
            const cookies = res.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
            this.sessionCookies.set(urlObj.hostname, cookies);
        }

        // Check for Cloudflare challenge
        if (data.includes('Checking your browser') || data.includes('cf-browser-verification')) {
            this.log('Cloudflare challenge detected, waiting...', 'warn');
            setTimeout(() => {
                this.makeRequest(url).then(resolve).catch(reject);
            }, 5000);
            return;
        }

        resolve(data);
    }

    /**
     * Extract topics from the main topics page
     */
    async extractTopics() {
        try {
            this.log('Extracting topics from main page...');
            const html = await this.makeRequest(this.topicsUrl);
            
            // Parse topics using regex patterns
            const topicPattern = /<a[^>]*href="\/topics\/([^"]+)"[^>]*>([^<]+)<\/a>/gi;
            const topics = [];
            let match;

            while ((match = topicPattern.exec(html)) !== null) {
                const topicSlug = match[1];
                const topicName = match[2].trim();
                
                if (topicName && topicSlug && !topics.find(t => t.slug === topicSlug)) {
                    topics.push({
                        name: topicName,
                        slug: topicSlug,
                        url: `${this.baseUrl}/topics/${topicSlug}`
                    });
                }
            }

            this.log(`Found ${topics.length} topics`);
            return topics;
        } catch (error) {
            this.log(`Error extracting topics: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Extract content and studies from a topic page
     */
    async extractTopicContent(topic) {
        try {
            this.log(`Extracting content for: ${topic.name}`);
            
            // Add delay to avoid rate limiting
            await this.delay(this.delayMs);
            
            const html = await this.makeRequest(topic.url);
            
            // Extract main content (before studies)
            const contentMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<div[^>]*class="[^"]*studies[^"]*"[^>]*>/i);
            let content = '';
            
            if (contentMatch) {
                content = this.cleanHtml(contentMatch[1]);
            } else {
                // Fallback: extract content before any "Studies" section
                const beforeStudies = html.split(/<h[1-6][^>]*>.*?studies.*?<\/h[1-6]>/i)[0];
                if (beforeStudies) {
                    const contentSection = beforeStudies.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)(?=<div|$)/i);
                    if (contentSection) {
                        content = this.cleanHtml(contentSection[1]);
                    }
                }
            }

            // Extract studies section
            const studiesMatch = html.match(/<div[^>]*class="[^"]*studies[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*|$)/i);
            let studies = '';
            
            if (studiesMatch) {
                studies = this.cleanHtml(studiesMatch[1]);
            } else {
                // Fallback: extract after "Studies" heading
                const afterStudies = html.split(/<h[1-6][^>]*>.*?studies.*?<\/h[1-6]>/i)[1];
                if (afterStudies) {
                    studies = this.cleanHtml(afterStudies);
                }
            }

            return {
                topic: topic.name,
                content: content.trim(),
                studies: studies.trim()
            };
        } catch (error) {
            this.log(`Error extracting content for ${topic.name}: ${error.message}`, 'error');
            return {
                topic: topic.name,
                content: '',
                studies: ''
            };
        }
    }

    /**
     * Clean HTML content by removing tags and links
     */
    cleanHtml(html) {
        if (!html) return '';
        
        // Remove script and style tags
        html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Remove HTML comments
        html = html.replace(/<!--[\s\S]*?-->/g, '');
        
        // Remove all HTML tags but preserve line breaks
        html = html.replace(/<br\s*\/?>/gi, '\n');
        html = html.replace(/<\/p>/gi, '\n');
        html = html.replace(/<\/div>/gi, '\n');
        html = html.replace(/<\/h[1-6]>/gi, '\n');
        html = html.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        html = html.replace(/&nbsp;/g, ' ');
        html = html.replace(/&amp;/g, '&');
        html = html.replace(/&lt;/g, '<');
        html = html.replace(/&gt;/g, '>');
        html = html.replace(/&quot;/g, '"');
        html = html.replace(/&#39;/g, "'");
        
        // Clean up whitespace
        html = html.replace(/\n\s*\n/g, '\n');
        html = html.replace(/^\s+|\s+$/g, '');
        
        return html;
    }

    /**
     * Save data to CSV file
     */
    saveToCSV(data, filename) {
        const csvContent = [
            'Topic,Content,Studies',
            ...data.map(item => {
                const content = `"${item.content.replace(/"/g, '""')}"`;
                const studies = `"${item.studies.replace(/"/g, '""')}"`;
                return `${item.topic},${content},${studies}`;
            })
        ].join('\n');

        fs.writeFileSync(filename, csvContent, 'utf8');
        this.log(`Data saved to ${filename}`);
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Main extraction process
     */
    async extract() {
        if (this.isRunning) {
            this.log('Extraction already in progress', 'warn');
            return;
        }

        this.isRunning = true;
        this.log('Starting Cloudflare-aware extraction...');

        try {
            // Extract topics
            const topics = await this.extractTopics();
            
            if (topics.length === 0) {
                this.log('No topics found. The website might be protected or the structure has changed.', 'error');
                return;
            }

            this.log(`Processing ${topics.length} topics...`);

            // Extract content for each topic
            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                
                if (this.onProgress) {
                    this.onProgress(i + 1, topics.length, topic.name);
                }

                const content = await this.extractTopicContent(topic);
                this.extractedData.push(content);

                this.log(`Processed ${i + 1}/${topics.length}: ${topic.name}`);
            }

            // Save results
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `cloudflare_extracted_data_${timestamp}.csv`;
            this.saveToCSV(this.extractedData, filename);

            this.log(`Extraction completed! Found ${this.extractedData.length} topics.`);
            this.log(`Results saved to: ${filename}`);

        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }
}

// Export for use
module.exports = CloudflareAwareExtractor;

// Run if called directly
if (require.main === module) {
    const extractor = new CloudflareAwareExtractor();
    
    extractor.onProgress = (current, total, topicName) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topicName}`);
    };

    extractor.extract().catch(console.error);
} 