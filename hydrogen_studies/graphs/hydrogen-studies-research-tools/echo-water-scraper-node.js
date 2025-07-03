/**
 * EchoWater Scraper for Hydrogen Studies - Node.js Version
 * Extracts data from https://hydrogenstudies.com for EchoWater team
 * Admin: shayne@devpipeline.com
 * 
 * Run with: node echo-water-scraper-node.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class EchoWaterScraperNode {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delayMs = 1000; // 1 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
    }

    /**
     * Log message
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [EchoWaterScraper] ${message}`);
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch URL with retry logic
     */
    async fetchWithRetry(url, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                this.log(`Attempt ${i + 1}: Fetching ${url}`);
                
                const response = await this.fetchUrl(url);
                return response;
            } catch (error) {
                this.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`, 'warning');
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // Wait before retry
                await this.delay(this.delayMs * (i + 1));
            }
        }
    }

    /**
     * Fetch URL using Node.js http/https with redirect support
     */
    fetchUrl(url, maxRedirects = 5) {
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
                    'User-Agent': 'EchoWater-Data-Extractor/1.0 (shayne@devpipeline.com)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';
                
                // Handle redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    if (maxRedirects > 0) {
                        this.log(`Following redirect to: ${res.headers.location}`);
                        const redirectUrl = res.headers.location.startsWith('http') 
                            ? res.headers.location 
                            : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
                        return this.fetchUrl(redirectUrl, maxRedirects - 1)
                            .then(resolve)
                            .catch(reject);
                    } else {
                        return reject(new Error('Too many redirects'));
                    }
                }
                
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
     * Extract study data from HTML (simplified for Node.js)
     */
    extractStudyData(html, url) {
        try {
            // Simple regex-based extraction for Node.js
            const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                              html.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Untitled Study';
            
            const authorsMatch = html.match(/authors?[^>]*>([^<]+)</i) ||
                                html.match(/by\s+([^<]+)</i);
            const authors = authorsMatch ? authorsMatch[1].trim() : 'Unknown Authors';
            
            const yearMatch = html.match(/\b(19|20)\d{2}\b/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            
            const journalMatch = html.match(/journal[^>]*>([^<]+)</i) ||
                                 html.match(/published\s+in\s+([^<]+)</i);
            const journal = journalMatch ? journalMatch[1].trim() : 'Unknown Journal';
            
            const abstractMatch = html.match(/abstract[^>]*>([^<]+)</i) ||
                                  html.match(/summary[^>]*>([^<]+)</i);
            const abstract = abstractMatch ? abstractMatch[1].trim() : 'No abstract available';

            return {
                title: this.cleanText(title),
                authors: this.cleanText(authors),
                year: year,
                journal: this.cleanText(journal),
                abstract: this.cleanText(abstract),
                doi: this.extractDOI(html),
                url: url,
                topic: 'General',
                organism: 'Not specified',
                bodySystem: 'Not specified',
                country: 'Not specified',
                outcome: 'Not specified',
                designation: 'Research Study'
            };
        } catch (error) {
            this.log(`Error extracting data from ${url}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Extract DOI from HTML
     */
    extractDOI(html) {
        const doiMatch = html.match(/10\.\d{4,}\/[-._;()\/:A-Z0-9]+/i);
        return doiMatch ? doiMatch[0] : '';
    }

    /**
     * Clean text
     */
    cleanText(text) {
        if (!text) return '';
        return text.replace(/\s+/g, ' ').trim();
    }

    /**
     * Extract all studies
     */
    async extractAllStudies() {
        this.log('Starting extraction of all studies from Hydrogen Studies database...');
        this.isRunning = true;
        this.extractedData = [];

        try {
            // Try different possible URL patterns based on the website structure
            const possibleUrls = [
                `${this.baseUrl}/search/`,  // Main search page with all studies
                `${this.baseUrl}/search`,   // Search without trailing slash
                `${this.baseUrl}/start/`,   // Featured studies
                `${this.baseUrl}/topics`,   // Health topics
                `${this.baseUrl}/`,         // Main page
                `${this.baseUrl}/studies`   // Fallback
            ];
            
            let mainPageHtml = null;
            let mainPageUrl = null;
            
            for (const url of possibleUrls) {
                try {
                    this.log(`Trying URL: ${url}`);
                    mainPageHtml = await this.fetchWithRetry(url);
                    mainPageUrl = url;
                    this.log(`Successfully fetched: ${url}`);
                    break;
                } catch (error) {
                    this.log(`Failed to fetch ${url}: ${error.message}`);
                    continue;
                }
            }
            
            if (!mainPageHtml) {
                throw new Error('Could not fetch any page from the website');
            }
            
            // Extract study URLs from the main page
            let studyUrls = this.extractStudyUrls(mainPageHtml);
            
            // If no study URLs found on main page, try pagination
            if (studyUrls.length === 0) {
                this.log('No study URLs found on main page, trying pagination...');
                studyUrls = await this.extractStudyUrlsFromPagination();
            }
            
            this.log(`Found ${studyUrls.length} study URLs to process`);
            
            // Process each study URL
            for (let i = 0; i < studyUrls.length && this.isRunning; i++) {
                const studyUrl = studyUrls[i];
                
                try {
                    this.log(`Processing study ${i + 1}/${studyUrls.length}: ${studyUrl}`);
                    
                    const studyHtml = await this.fetchWithRetry(studyUrl);
                    const studyData = this.extractStudyData(studyHtml, studyUrl);
                    
                    if (studyData) {
                        this.extractedData.push(studyData);
                        this.log(`Successfully extracted: ${studyData.title}`);
                    }
                    
                    // Respectful delay between requests
                    await this.delay(this.delayMs);
                    
                } catch (error) {
                    this.log(`Failed to process ${studyUrl}: ${error.message}`, 'error');
                }
            }
            
            this.log(`Extraction completed. Total studies extracted: ${this.extractedData.length}`);
            return this.extractedData;
            
        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Extract study URLs from main page
     */
    extractStudyUrls(html) {
        const urls = [];
        
        // Look for study links in various formats based on the website structure
        const linkPatterns = [
            /href="([^"]*\/study\/[^"]*)"/gi,           // /study/ URLs
            /href="([^"]*\/search\/[^"]*)"/gi,          // /search/ URLs (might contain study links)
            /href="([^"]*\/research\/[^"]*)"/gi,        // /research/ URLs
            /href="([^"]*\/publication\/[^"]*)"/gi,     // /publication/ URLs
            /href="([^"]*\/article\/[^"]*)"/gi,         // /article/ URLs
            /href="([^"]*\/paper\/[^"]*)"/gi,           // /paper/ URLs
            /href="([^"]*\/hydrogen[^"]*)"/gi,          // /hydrogen/ URLs
            /href="([^"]*\/water[^"]*)"/gi              // /water/ URLs
        ];
        
        for (const pattern of linkPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const href = match[1];
                if (href) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    if (!urls.includes(fullUrl) && !fullUrl.includes('wp-content')) {
                        urls.push(fullUrl);
                    }
                }
            }
        }
        
        // Also look for any links that might be study pages
        const generalStudyPattern = /href="([^"]*\/[^"]*study[^"]*)"/gi;
        let match;
        while ((match = generalStudyPattern.exec(html)) !== null) {
            const href = match[1];
            if (href) {
                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                if (!urls.includes(fullUrl) && !fullUrl.includes('wp-content')) {
                    urls.push(fullUrl);
                }
            }
        }
        
        this.log(`Extracted ${urls.length} potential study URLs`);
        return urls;
    }

    /**
     * Extract study URLs from pagination
     */
    async extractStudyUrlsFromPagination() {
        const urls = [];
        const maxPages = 54; // Based on the pagination links found
        
        this.log(`Attempting to extract study URLs from ${maxPages} pages...`);
        
        for (let page = 1; page <= maxPages && this.isRunning; page++) {
            try {
                const pageUrl = `${this.baseUrl}/search/?pg=${page}`;
                this.log(`Fetching page ${page}: ${pageUrl}`);
                
                const pageHtml = await this.fetchWithRetry(pageUrl);
                const pageUrls = this.extractStudyUrls(pageHtml);
                
                if (pageUrls.length > 0) {
                    urls.push(...pageUrls);
                    this.log(`Found ${pageUrls.length} study URLs on page ${page}`);
                } else {
                    this.log(`No study URLs found on page ${page}`);
                }
                
                // Respectful delay between pages
                await this.delay(this.delayMs);
                
            } catch (error) {
                this.log(`Failed to fetch page ${page}: ${error.message}`, 'error');
                // Continue with next page
            }
        }
        
        // Remove duplicates
        const uniqueUrls = [...new Set(urls)];
        this.log(`Total unique study URLs found across all pages: ${uniqueUrls.length}`);
        
        return uniqueUrls;
    }

    /**
     * Save data to JSON file
     */
    saveToJson(data, filename = 'echo-water-extracted-data.json') {
        try {
            const filepath = path.join(__dirname, filename);
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
            this.log(`Data saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            this.log(`Error saving data: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Stop extraction
     */
    stop() {
        this.isRunning = false;
        this.log('Extraction stopped by user');
    }

    /**
     * Get extraction statistics
     */
    getStats() {
        return {
            totalExtracted: this.extractedData.length,
            isRunning: this.isRunning,
            lastUpdate: new Date().toISOString()
        };
    }
}

// Main execution
async function main() {
    const scraper = new EchoWaterScraperNode();
    
    try {
        console.log('=== EchoWater Hydrogen Studies Scraper (Node.js) ===');
        console.log('Admin: shayne@devpipeline.com');
        console.log('Starting extraction...\n');
        
        const data = await scraper.extractAllStudies();
        
        console.log('\n=== Extraction Complete ===');
        console.log(`Total studies extracted: ${data.length}`);
        
        // Save to JSON file
        const filepath = scraper.saveToJson(data);
        console.log(`Data saved to: ${filepath}`);
        
        // Show sample data
        if (data.length > 0) {
            console.log('\n=== Sample Data ===');
            console.log(JSON.stringify(data[0], null, 2));
        }
        
    } catch (error) {
        console.error('Extraction failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = EchoWaterScraperNode; 