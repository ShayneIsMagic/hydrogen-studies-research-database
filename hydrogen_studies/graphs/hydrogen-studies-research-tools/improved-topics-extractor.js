/**
 * Improved Topics Extractor for Hydrogen Studies
 * Properly separates content from studies and removes HTML tags/links
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class ImprovedTopicsExtractor {
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
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        } else {
            console.log(logMessage);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchWithProxies(url, retries = this.maxRetries) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                this.log(`Fetching ${url} (attempt ${attempt}/${retries})`);
                const html = await this.fetchUrl(url);
                if (html && html.length > 1000) {
                    return html;
                }
            } catch (error) {
                this.log(`Attempt ${attempt} failed: ${error.message}`, 'warning');
                if (attempt < retries) {
                    await this.delay(1000 * attempt);
                }
            }
        }
        throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
    }

    fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            
            const req = protocol.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            }, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode === 200) {
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
     * Extract content and studies separately from a topic page
     */
    extractContentAndStudiesFromTopicPage(html, topicName) {
        const result = {
            topic: topicName,
            content: '',
            studies: []
        };
        
        // Extract clean content (introductory paragraphs)
        result.content = this.extractCleanContent(html);
        
        // Extract studies separately
        result.studies = this.extractStudies(html);
        
        return result;
    }

    /**
     * Extract clean content without HTML tags or links
     */
    extractCleanContent(html) {
        // Look for main content areas
        const contentPatterns = [
            /<main[^>]*>(.*?)<\/main>/gis,
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
            /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>(.*?)<\/div>/gis,
            /<div[^>]*class="[^"]*post-content[^"]*"[^>]*>(.*?)<\/div>/gis,
            /<article[^>]*>(.*?)<\/article>/gis
        ];
        
        let content = '';
        for (const pattern of contentPatterns) {
            const matches = html.match(pattern);
            if (matches) {
                content = matches.map(match => this.cleanText(match)).join(' ').trim();
                if (content.length > 100) break; // Get substantial content
            }
        }
        
        // If no main content found, try paragraphs
        if (!content || content.length < 100) {
            const paragraphMatches = html.match(/<p[^>]*>(.*?)<\/p>/gis);
            if (paragraphMatches) {
                content = paragraphMatches
                    .map(p => this.cleanText(p))
                    .filter(text => text.length > 20) // Filter out short paragraphs
                    .slice(0, 5) // Take first 5 substantial paragraphs
                    .join(' ');
            }
        }
        
        return this.cleanText(content);
    }

    /**
     * Extract studies separately from content
     */
    extractStudies(html) {
        const studies = [];
        
        // Look for study links and titles
        const studyPatterns = [
            // Study links with titles
            /<a[^>]*href="([^"]*study[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Research links
            /<a[^>]*href="([^"]*research[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Article links
            /<a[^>]*href="([^"]*article[^"]*)"[^>]*>([^<]+)<\/a>/gi,
            // Any links that might be studies
            /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
        ];
        
        for (const pattern of studyPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const href = match[1];
                const linkText = match[2].trim();
                
                // Filter for likely study links
                if (href && linkText && 
                    (href.includes('study') || 
                     href.includes('research') || 
                     href.includes('article') ||
                     href.includes('/202') || // Year patterns
                     href.includes('/201') ||
                     href.includes('/200')) &&
                    linkText.length > 5 &&
                    !linkText.includes('Home') &&
                    !linkText.includes('About') &&
                    !linkText.includes('Contact')) {
                    
                    const study = {
                        title: this.cleanText(linkText),
                        url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
                        authors: this.extractAuthors(linkText),
                        year: this.extractYear(linkText),
                        doi: this.extractDOI(linkText)
                    };
                    
                    // Avoid duplicates
                    const existingStudy = studies.find(s => s.title === study.title);
                    if (!existingStudy) {
                        studies.push(study);
                    }
                }
            }
        }
        
        return studies;
    }

    /**
     * Clean text by removing HTML tags and normalizing whitespace
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Extract authors from study title
     */
    extractAuthors(text) {
        const authorPatterns = [
            /by\s+([^,]+)/i,
            /authors?:\s*([^,]+)/i,
            /author:\s*([^,]+)/i
        ];
        
        for (const pattern of authorPatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }
        
        return '';
    }

    /**
     * Extract year from study title
     */
    extractYear(text) {
        const yearMatch = text.match(/(19|20)\d{2}/);
        return yearMatch ? yearMatch[0] : '';
    }

    /**
     * Extract DOI from study title
     */
    extractDOI(text) {
        const doiPatterns = [
            /doi[^:]*:\s*([^\s<]+)/i,
            /10\.\d{4,}\/[^\s<]+/i
        ];
        
        for (const pattern of doiPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        
        return '';
    }

    /**
     * Convert extracted data to CSV format with separate columns
     */
    convertToCSV(data) {
        const csvRows = [];
        
        // Add header
        csvRows.push('Topic,Content,Studies');
        
        // Add data rows
        for (const item of data) {
            const topic = item.topic.replace(/"/g, '""'); // Escape quotes
            const content = item.content.replace(/"/g, '""'); // Escape quotes
            
            // Format studies as a clean list
            const studiesList = item.studies.map(study => {
                let studyText = study.title;
                if (study.authors) studyText += ` (${study.authors})`;
                if (study.year) studyText += ` - ${study.year}`;
                return studyText;
            }).join('; ');
            
            const studies = studiesList.replace(/"/g, '""'); // Escape quotes
            
            csvRows.push(`"${topic}","${content}","${studies}"`);
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
     * Start the improved extraction process
     */
    async startExtraction() {
        if (this.isRunning) {
            this.log('Extraction already in progress...', 'warning');
            return;
        }

        this.isRunning = true;
        this.extractedData = [];
        
        try {
            this.log('Starting improved topics extraction...');
            
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
                    
                    // Extract content and studies separately
                    const topicData = this.extractContentAndStudiesFromTopicPage(topicPageHtml, topic.name);
                    
                    // Add to extracted data
                    this.extractedData.push(topicData);
                    totalStudies += topicData.studies.length;
                    
                    this.log(`Found ${topicData.studies.length} studies for topic: ${topic.name}`);
                    
                    // Delay between requests
                    if (i < topics.length - 1) {
                        await this.delay(this.delayMs);
                    }
                    
                } catch (error) {
                    this.log(`Failed to process topic "${topic.name}": ${error.message}`, 'error');
                    // Add empty data for failed topics
                    this.extractedData.push({
                        topic: topic.name,
                        content: '',
                        studies: []
                    });
                }
            }
            
            this.log(`Extraction complete! Found ${totalStudies} total studies across ${topics.length} topics`);
            
            // Convert to CSV
            const csvContent = this.convertToCSV(this.extractedData);
            
            // Save the CSV file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `improved_topics_content_${timestamp}.csv`;
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

    stopExtraction() {
        this.isRunning = false;
        this.log('Extraction stopped by user');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            extractedCount: this.extractedData.length
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImprovedTopicsExtractor;
}

// Run if called directly
if (require.main === module) {
    const extractor = new ImprovedTopicsExtractor();
    
    extractor.onLog = (message, type) => {
        const colors = {
            'info': '\x1b[36m',
            'success': '\x1b[32m',
            'warning': '\x1b[33m',
            'error': '\x1b[31m'
        };
        const color = colors[type] || '\x1b[0m';
        console.log(`${color}${message}\x1b[0m`);
    };
    
    extractor.startExtraction()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Extraction completed successfully!');
                console.log(`📊 Topics processed: ${result.topicsCount}`);
                console.log(`📚 Total studies found: ${result.totalStudies}`);
                console.log(`📁 Output file: ${result.filename}`);
            } else {
                console.log('\n❌ Extraction failed!');
                console.log(`Error: ${result.error}`);
            }
        })
        .catch(error => {
            console.error('\n❌ Unexpected error:', error);
        });
} 