/**
 * Comprehensive Topics Scraper for Hydrogen Studies
 * Extracts topics from main page and detailed study info from each topic page
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class ComprehensiveTopicsScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 2000; // 2 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.onLog = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch URL using multiple proxy strategies
     */
    async fetchWithProxies(url, retries = this.maxRetries) {
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ];

        for (let attempt = 0; attempt < retries; attempt++) {
            for (const proxyUrl of proxies) {
                try {
                    this.log(`Trying proxy: ${proxyUrl.split('/')[2]} (attempt ${attempt + 1})`);
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
            
            if (attempt < retries - 1) {
                await this.delay(this.delayMs * (attempt + 1));
            }
        }
        
        throw new Error('All proxy services failed');
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
     * Extract topics from the main topics page
     */
    extractTopicsFromMainPage(html) {
        const topics = [];
        
        // Save HTML for debugging
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const htmlFilename = `main-topics-page-${timestamp}.html`;
        const htmlPath = path.join(__dirname, htmlFilename);
        fs.writeFileSync(htmlPath, html, 'utf8');
        this.log(`Main page HTML saved to: ${htmlFilename}`);
        
        // Look for topic links in the HTML
        const topicLinkPatterns = [
            // Pattern for topic links
            /<a[^>]*href="([^"]*topic[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Pattern for category links
            /<a[^>]*href="([^"]*category[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Pattern for any links that might be topics
            /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
        ];
        
        for (const pattern of topicLinkPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const href = match[1];
                const linkText = match[2].trim();
                
                // Filter for likely topic links
                if (href && linkText && 
                    (href.includes('topic') || 
                     href.includes('category') || 
                     href.includes('/study/') ||
                     href.includes('/research/') ||
                     href.includes('/article/')) &&
                    !href.includes('http') && // Relative links only
                    linkText.length > 2) {
                    
                    const fullUrl = href.startsWith('/') ? `${this.baseUrl}${href}` : `${this.baseUrl}/${href}`;
                    
                    // Avoid duplicates
                    const existingTopic = topics.find(t => t.url === fullUrl);
                    if (!existingTopic) {
                        topics.push({
                            name: linkText,
                            url: fullUrl
                        });
                        this.log(`Found topic: "${linkText}" -> ${fullUrl}`);
                    }
                }
            }
        }
        
        return topics;
    }

    /**
     * Extract detailed study information from a topic page
     */
    extractStudiesFromTopicPage(html, topicName) {
        const studies = [];
        
        // Extract page content (introductory paragraphs)
        const pageContent = this.extractPageContent(html);
        
        // Look for study patterns in the HTML
        const studyPatterns = [
            // Pattern for study titles in headings
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi,
            // Pattern for study links
            /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Pattern for study containers
            /<div[^>]*class="[^"]*study[^"]*"[^>]*>(.*?)<\/div>/gis,
            // Pattern for article containers
            /<article[^>]*>(.*?)<\/article>/gis
        ];
        
        for (const pattern of studyPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const studyData = this.parseStudyFromMatch(match, topicName, pageContent);
                if (studyData && studyData.title) {
                    // Avoid duplicates
                    const existingStudy = studies.find(s => 
                        s.title === studyData.title && s.url === studyData.url
                    );
                    if (!existingStudy) {
                        studies.push(studyData);
                    }
                }
            }
        }
        
        return studies;
    }

    /**
     * Extract page content (introductory paragraphs)
     */
    extractPageContent(html) {
        // Look for main content areas
        const contentPatterns = [
            /<main[^>]*>(.*?)<\/main>/gis,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
            /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>(.*?)<\/div>/gis,
            /<p[^>]*>(.*?)<\/p>/gis
        ];
        
        let content = '';
        for (const pattern of contentPatterns) {
            const matches = html.match(pattern);
            if (matches) {
                content = matches.map(match => this.stripHtmlTags(match)).join(' ').trim();
                if (content.length > 50) break; // Get substantial content
            }
        }
        
        return content;
    }

    /**
     * Parse study information from HTML match
     */
    parseStudyFromMatch(match, topicName, pageContent) {
        const study = {
            topic: topicName,
            pageContent: pageContent,
            title: '',
            authors: '',
            year: '',
            doi: '',
            url: ''
        };
        
        if (match[1] && match[2]) {
            // Link pattern
            const href = match[1];
            const linkText = match[2].trim();
            
            if (href && linkText && 
                (href.includes('study') || href.includes('research') || href.includes('article'))) {
                study.title = linkText;
                study.url = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
            }
        } else if (match[1]) {
            // Heading or content pattern
            const content = match[1];
            study.title = this.stripHtmlTags(content).trim();
        }
        
        // Extract additional information from the content
        if (study.title) {
            // Look for authors
            const authorsMatch = study.title.match(/(?:by|authors?|author:)\s*([^,]+)/i);
            if (authorsMatch) {
                study.authors = authorsMatch[1].trim();
            }
            
            // Look for year
            const yearMatch = study.title.match(/(19|20)\d{2}/);
            if (yearMatch) {
                study.year = yearMatch[0];
            }
            
            // Look for DOI
            const doiMatch = study.title.match(/doi[^:]*:\s*([^\s<]+)/i) ||
                            study.title.match(/10\.\d{4,}\/[^\s<]+/i);
            if (doiMatch) {
                study.doi = doiMatch[1] || doiMatch[0];
            }
        }
        
        return study;
    }

    /**
     * Strip HTML tags from text
     */
    stripHtmlTags(text) {
        return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Convert extracted data to CSV format
     */
    convertToCSV(data) {
        const csvRows = [];
        
        // Add header
        csvRows.push('Topic,Page Content,Study Title,Authors,Year,DOI or Study Link');
        
        // Add data rows
        for (const study of data) {
            const topic = study.topic.replace(/"/g, '""'); // Escape quotes
            const pageContent = study.pageContent.replace(/"/g, '""'); // Escape quotes
            const title = study.title.replace(/"/g, '""'); // Escape quotes
            const authors = study.authors.replace(/"/g, '""'); // Escape quotes
            const year = study.year;
            const doiOrLink = study.doi || study.url;
            
            csvRows.push(`"${topic}","${pageContent}","${title}","${authors}","${year}","${doiOrLink}"`);
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
     * Start the comprehensive extraction process
     */
    async startExtraction() {
        if (this.isRunning) {
            this.log('Extraction already in progress...', 'warning');
            return;
        }

        this.isRunning = true;
        this.extractedData = [];
        
        try {
            this.log('Starting comprehensive topics extraction...');
            
            // Step 1: Fetch and extract topics from main page
            this.log('Step 1: Fetching main topics page...');
            const mainPageHtml = await this.fetchWithProxies(this.topicsUrl);
            const topics = this.extractTopicsFromMainPage(mainPageHtml);
            
            this.log(`Found ${topics.length} topics to process`);
            
            if (topics.length === 0) {
                this.log('No topics found. The page structure may have changed or Cloudflare is blocking access.');
                return {
                    success: false,
                    error: 'No topics found on main page'
                };
            }
            
            // Step 2: Process each topic page
            this.log('Step 2: Processing individual topic pages...');
            let totalStudies = 0;
            
            for (let i = 0; i < topics.length && this.isRunning; i++) {
                const topic = topics[i];
                this.log(`Processing topic ${i + 1}/${topics.length}: ${topic.name}`);
                
                try {
                    // Fetch topic page
                    const topicPageHtml = await this.fetchWithProxies(topic.url);
                    
                    // Extract studies from topic page
                    const studies = this.extractStudiesFromTopicPage(topicPageHtml, topic.name);
                    
                    // Add to extracted data
                    this.extractedData.push(...studies);
                    totalStudies += studies.length;
                    
                    this.log(`Found ${studies.length} studies for topic: ${topic.name}`);
                    
                    // Delay between requests
                    if (i < topics.length - 1) {
                        await this.delay(this.delayMs);
                    }
                    
                } catch (error) {
                    this.log(`Failed to process topic "${topic.name}": ${error.message}`, 'error');
                    // Continue with next topic
                }
            }
            
            this.log(`Extraction complete! Found ${totalStudies} total studies across ${topics.length} topics`);
            
            // Convert to CSV
            const csvContent = this.convertToCSV(this.extractedData);
            
            // Save the CSV file
            const filename = 'hydrogen_studies_by_topic.csv';
            const filePath = this.saveCSVToFile(csvContent, filename);
            
            return {
                success: true,
                topicsCount: topics.length,
                totalStudies: totalStudies,
                filename: filename,
                filePath: filePath,
                data: this.extractedData
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
module.exports = ComprehensiveTopicsScraper;

// If run directly, execute the extraction
if (require.main === module) {
    const scraper = new ComprehensiveTopicsScraper();
    
    scraper.startExtraction()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Comprehensive extraction completed successfully!');
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