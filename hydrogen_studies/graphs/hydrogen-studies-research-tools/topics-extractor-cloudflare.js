/**
 * Cloudflare-Bypass Topics Extractor for Hydrogen Studies
 * Uses CORS proxy and advanced techniques to bypass Cloudflare protection
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class TopicsExtractorCloudflare {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 2000; // 2 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch URL using CORS proxy to bypass Cloudflare
     */
    async fetchWithCorsProxy(url, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                this.log(`Attempting to fetch via CORS proxy: ${url} (attempt ${i + 1}/${retries})`);
                
                // Use CORS proxy
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const data = await this.fetchUrl(proxyUrl);
                return data;

            } catch (error) {
                this.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                await this.delay(this.delayMs * (i + 1));
            }
        }
    }

    /**
     * Fetch URL using Node.js http/https modules
     */
    fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Try alternative proxy services if CORS proxy fails
     */
    async fetchWithAlternativeProxies(url) {
        const proxies = [
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ];

        for (const proxyUrl of proxies) {
            try {
                this.log(`Trying proxy: ${proxyUrl.split('/')[2]}`);
                const data = await this.fetchUrl(proxyUrl);
                
                // Check if we got actual content or an error page
                if (data.includes('Just a moment') || data.includes('Cloudflare')) {
                    this.log('Got Cloudflare challenge page, trying next proxy...');
                    continue;
                }
                
                return data;
            } catch (error) {
                this.log(`Proxy failed: ${error.message}`);
                continue;
            }
        }
        
        throw new Error('All proxy services failed');
    }

    /**
     * Extract topics and their study links from the topics page
     */
    extractTopicsFromHtml(html) {
        const topics = [];
        
        // Save HTML for debugging
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const htmlFilename = `topics-page-${timestamp}.html`;
        const htmlPath = path.join(__dirname, htmlFilename);
        fs.writeFileSync(htmlPath, html, 'utf8');
        this.log(`HTML saved to: ${htmlFilename}`);
        
        // Check if we got a Cloudflare challenge page
        if (html.includes('Just a moment') || html.includes('Cloudflare')) {
            this.log('Warning: Received Cloudflare challenge page');
            return this.extractTopicsFromChallengePage(html);
        }
        
        // Look for topic patterns in the HTML
        const topicPatterns = [
            // Pattern for topic headings followed by content
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>(.*?)(?=<h[1-6]|$)/gis,
            // Pattern for topic sections
            /<div[^>]*class="[^"]*topic[^"]*"[^>]*>(.*?)<\/div>/gis,
            // Pattern for category sections
            /<section[^>]*class="[^"]*category[^"]*"[^>]*>(.*?)<\/section>/gis,
            // Pattern for any heading with content
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi
        ];
        
        // First, try to find structured topic sections
        let foundStructured = false;
        
        for (let i = 0; i < topicPatterns.length - 1; i++) {
            const pattern = topicPatterns[i];
            let match;
            
            while ((match = pattern.exec(html)) !== null) {
                const topicName = match[1] ? match[1].trim() : 'Unknown Topic';
                const topicContent = match[2] || match[1];
                
                // Skip very short topic names
                if (topicName.length < 3) continue;
                
                // Extract study links from the topic content
                const studyLinks = this.extractStudyLinksFromText(topicContent);
                
                if (studyLinks.length > 0) {
                    topics.push({
                        topic: topicName,
                        studyLinks: studyLinks
                    });
                    
                    this.log(`Topic: "${topicName}" - Found ${studyLinks.length} study links`);
                    foundStructured = true;
                }
            }
            
            if (foundStructured) break;
        }
        
        // If no structured topics found, try alternative approach
        if (!foundStructured) {
            this.log('No structured topics found, trying alternative extraction method...');
            return this.extractTopicsAlternative(html);
        }
        
        return topics;
    }

    /**
     * Handle Cloudflare challenge page
     */
    extractTopicsFromChallengePage(html) {
        this.log('Attempting to extract topics from Cloudflare challenge page...');
        
        // Look for any content that might indicate the actual page structure
        const contentIndicators = [
            'hydrogen',
            'study',
            'research',
            'topic',
            'category'
        ];
        
        const foundContent = [];
        contentIndicators.forEach(indicator => {
            const matches = html.match(new RegExp(indicator, 'gi'));
            if (matches) {
                foundContent.push(`${indicator}: ${matches.length} instances`);
            }
        });
        
        if (foundContent.length > 0) {
            this.log('Found content indicators: ' + foundContent.join(', '));
        }
        
        // Return empty array for now - would need browser automation to handle this
        return [];
    }

    /**
     * Alternative method to extract topics when structured approach fails
     */
    extractTopicsAlternative(html) {
        const topics = [];
        
        // Look for all headings and try to associate them with nearby links
        const headingPattern = /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi;
        const headings = [];
        let match;
        
        while ((match = headingPattern.exec(html)) !== null) {
            const topicName = match[1].trim();
            if (topicName.length >= 3) {
                headings.push({
                    name: topicName,
                    index: match.index,
                    level: parseInt(match[0].match(/<h([1-6])/)[1])
                });
            }
        }
        
        this.log(`Found ${headings.length} potential topic headings`);
        
        // For each heading, look for study links in the following content
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            const nextHeading = headings[i + 1];
            
            // Determine the content range for this topic
            const startIndex = heading.index + heading.name.length;
            const endIndex = nextHeading ? nextHeading.index : html.length;
            const topicContent = html.substring(startIndex, endIndex);
            
            // Extract study links from this content
            const studyLinks = this.extractStudyLinksFromText(topicContent);
            
            if (studyLinks.length > 0) {
                topics.push({
                    topic: heading.name,
                    studyLinks: studyLinks
                });
                
                this.log(`Topic: "${heading.name}" - Found ${studyLinks.length} study links`);
            }
        }
        
        return topics;
    }

    /**
     * Extract study links from text content
     */
    extractStudyLinksFromText(text) {
        const studyLinks = [];
        
        // Look for link patterns in the text
        const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        
        while ((match = linkPattern.exec(text)) !== null) {
            const href = match[1];
            const linkText = match[2].trim();
            
            // Check if this looks like a study link
            if (href && linkText && (
                href.includes('study') || 
                href.includes('research') || 
                href.includes('article') ||
                href.includes('/study/') ||
                href.includes('/research/') ||
                href.includes('/article/') ||
                href.includes('/post/') ||
                href.includes('/page/')
            )) {
                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                studyLinks.push({
                    title: linkText,
                    url: fullUrl
                });
            }
        }
        
        return studyLinks;
    }

    /**
     * Convert extracted data to CSV format
     */
    convertToCSV(data) {
        const csvRows = [];
        
        // Add header
        csvRows.push('Topic,Study Title,Study URL');
        
        // Add data rows
        for (const topicData of data) {
            const topic = topicData.topic.replace(/"/g, '""'); // Escape quotes
            
            for (const study of topicData.studyLinks) {
                const studyTitle = study.title.replace(/"/g, '""'); // Escape quotes
                const studyUrl = study.url;
                
                csvRows.push(`"${topic}","${studyTitle}","${studyUrl}"`);
            }
        }
        
        return csvRows.join('\n');
    }

    /**
     * Save CSV to file
     */
    saveCSVToFile(csvContent, filename) {
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, csvContent, 'utf8');
        this.log(`CSV file saved: ${filePath}`);
        return filePath;
    }

    /**
     * Start the extraction process
     */
    async startExtraction() {
        if (this.isRunning) {
            this.log('Extraction already in progress...', 'warning');
            return;
        }

        this.isRunning = true;
        this.extractedData = [];
        
        try {
            this.log('Starting Cloudflare-bypass topics extraction...');
            
            // Try CORS proxy first
            let html;
            try {
                html = await this.fetchWithCorsProxy(this.topicsUrl);
                this.log('Successfully fetched topics page via CORS proxy');
            } catch (error) {
                this.log('CORS proxy failed, trying alternative proxies...');
                html = await this.fetchWithAlternativeProxies(this.topicsUrl);
                this.log('Successfully fetched topics page via alternative proxy');
            }
            
            // Extract topics and study links
            const topics = this.extractTopicsFromHtml(html);
            this.extractedData = topics;
            
            this.log(`Extraction complete! Found ${topics.length} topics with study links`);
            
            // Convert to CSV
            const csvContent = this.convertToCSV(topics);
            
            // Save the CSV file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `hydrogen-studies-topics-cloudflare-${timestamp}.csv`;
            const filePath = this.saveCSVToFile(csvContent, filename);
            
            const totalStudies = topics.reduce((sum, topic) => sum + topic.studyLinks.length, 0);
            
            return {
                success: true,
                topicsCount: topics.length,
                totalStudies: totalStudies,
                filename: filename,
                filePath: filePath,
                data: topics
            };
            
        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop the extraction process
     */
    stopExtraction() {
        this.isRunning = false;
        this.log('Extraction stopped by user');
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            extractedCount: this.extractedData.length,
            data: this.extractedData
        };
    }
}

// Export for use in other modules
module.exports = TopicsExtractorCloudflare;

// If run directly, execute the extraction
if (require.main === module) {
    const extractor = new TopicsExtractorCloudflare();
    
    extractor.startExtraction()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Cloudflare-bypass extraction completed successfully!');
                console.log(`📊 Found ${result.topicsCount} topics with ${result.totalStudies} total studies`);
                console.log(`📁 CSV file saved: ${result.filename}`);
                console.log(`📂 Full path: ${result.filePath}`);
            } else {
                console.error('\n❌ Extraction failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Unexpected error:', error.message);
            process.exit(1);
        });
} 