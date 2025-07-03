/**
 * Advanced Web Scraper for Hydrogen Studies
 * Handles dynamic content and JavaScript-loaded data
 * Admin: shayne@devpipeline.com
 */

class WebScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delayMs = 2000; // 2 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.onLog = null;
    }

    /**
     * Log message
     */
    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        }
    }

    /**
     * Update progress
     */
    updateProgress(current, total, message = '') {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        
        if (this.onProgress) {
            this.onProgress(percentage, current, total, message);
        }
    }

    /**
     * Delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch URL with retry logic and CORS proxy
     */
    async fetchWithRetry(url, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                // Use CORS proxy for browser compatibility
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'EchoWater-Data-Extractor/1.0 (shayne@devpipeline.com)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.text();
                return data;

            } catch (error) {
                this.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                // Wait before retry
                await this.delay(this.delayMs * (i + 1));
            }
        }
    }

    /**
     * Extract study data from search results
     */
    extractStudyData(html) {
        const studies = [];
        
        // Look for study containers in the HTML
        const studyPatterns = [
            // Pattern for study cards/containers
            /<div[^>]*class="[^"]*study[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
            // Pattern for article containers
            /<article[^>]*>([\s\S]*?)<\/article>/gi,
            // Pattern for list items with study data
            /<li[^>]*class="[^"]*study[^"]*"[^>]*>([\s\S]*?)<\/li>/gi
        ];

        for (const pattern of studyPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const studyHtml = match[1];
                const study = this.parseStudyFromHtml(studyHtml);
                if (study && study.title) {
                    studies.push(study);
                }
            }
        }

        return studies;
    }

    /**
     * Parse individual study from HTML
     */
    parseStudyFromHtml(html) {
        const study = {
            title: '',
            authors: '',
            year: '',
            journal: '',
            doi: '',
            abstract: '',
            url: '',
            topics: [],
            organism: ''
        };

        // Extract title
        const titleMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i) ||
                          html.match(/<a[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/a>/i) ||
                          html.match(/<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/i);
        if (titleMatch) {
            study.title = titleMatch[1].trim();
        }

        // Extract authors
        const authorsMatch = html.match(/<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i) ||
                            html.match(/authors?[^:]*:\s*([^<]+)/i);
        if (authorsMatch) {
            study.authors = authorsMatch[1].trim();
        }

        // Extract year
        const yearMatch = html.match(/(19|20)\d{2}/);
        if (yearMatch) {
            study.year = yearMatch[0];
        }

        // Extract DOI
        const doiMatch = html.match(/doi[^:]*:\s*([^\s<]+)/i) ||
                        html.match(/10\.\d{4,}\/[^\s<]+/i);
        if (doiMatch) {
            study.doi = doiMatch[1] || doiMatch[0];
        }

        // Extract URL
        const urlMatch = html.match(/href="([^"]*study[^"]*)"/i) ||
                        html.match(/href="([^"]*research[^"]*)"/i);
        if (urlMatch) {
            study.url = urlMatch[1].startsWith('http') ? urlMatch[1] : `${this.baseUrl}${urlMatch[1]}`;
        }

        // Extract abstract
        const abstractMatch = html.match(/<p[^>]*class="[^"]*abstract[^"]*"[^>]*>([^<]+)<\/p>/i) ||
                             html.match(/<div[^>]*class="[^"]*abstract[^"]*"[^>]*>([^<]+)<\/div>/i);
        if (abstractMatch) {
            study.abstract = abstractMatch[1].trim();
        }

        return study;
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
                    this.log(`Found ${pageUrls.length} URLs on page ${page}`);
                } else {
                    this.log(`No URLs found on page ${page}`);
                }
                
                // Respectful delay between requests
                await this.delay(this.delayMs);
                
                this.updateProgress(page, maxPages, `Processing page ${page}`);
                
            } catch (error) {
                this.log(`Failed to fetch page ${page}: ${error.message}`);
                if (page > 10) break; // Stop if we can't get many pages
            }
        }
        
        return urls;
    }

    /**
     * Extract study URLs from HTML
     */
    extractStudyUrls(html) {
        const urls = [];
        
        // Look for study links in various formats
        const linkPatterns = [
            /href="([^"]*\/study\/[^"]*)"/gi,
            /href="([^"]*\/research\/[^"]*)"/gi,
            /href="([^"]*\/publication\/[^"]*)"/gi,
            /href="([^"]*\/article\/[^"]*)"/gi
        ];
        
        for (const pattern of linkPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const href = match[1];
                if (href) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    if (!urls.includes(fullUrl)) {
                        urls.push(fullUrl);
                    }
                }
            }
        }
        
        return urls;
    }

    /**
     * Start extraction process
     */
    async startExtraction(options = {}) {
        if (this.isRunning) {
            throw new Error('Extraction already in progress');
        }

        this.isRunning = true;
        this.extractedData = [];
        
        try {
            this.log('Starting advanced extraction from Hydrogen Studies website...');
            
            // Get the main search page
            const searchPageUrl = `${this.baseUrl}/search/`;
            this.log(`Fetching search page: ${searchPageUrl}`);
            
            const searchPageHtml = await this.fetchWithRetry(searchPageUrl);
            
            // Extract study data from the search page
            const studies = this.extractStudyData(searchPageHtml);
            this.log(`Found ${studies.length} studies on main search page`);
            
            // If we found studies, add them
            if (studies.length > 0) {
                this.extractedData.push(...studies);
            }
            
            // Try to get more studies from pagination
            const additionalUrls = await this.extractStudyUrlsFromPagination();
            this.log(`Found ${additionalUrls.length} additional study URLs`);
            
            // Process additional URLs if any
            if (additionalUrls.length > 0) {
                for (let i = 0; i < additionalUrls.length && this.isRunning; i++) {
                    try {
                        const studyUrl = additionalUrls[i];
                        this.log(`Fetching study: ${studyUrl}`);
                        
                        const studyHtml = await this.fetchWithRetry(studyUrl);
                        const study = this.parseStudyFromHtml(studyHtml);
                        
                        if (study && study.title) {
                            study.url = studyUrl;
                            this.extractedData.push(study);
                        }
                        
                        this.updateProgress(i + 1, additionalUrls.length, `Processing study ${i + 1}`);
                        
                        // Respectful delay between requests
                        await this.delay(this.delayMs);
                        
                    } catch (error) {
                        this.log(`Failed to fetch study ${additionalUrls[i]}: ${error.message}`);
                    }
                }
            }
            
            this.log(`Extraction completed. Total studies found: ${this.extractedData.length}`);
            return this.extractedData;
            
        } catch (error) {
            this.log(`Extraction failed: ${error.message}`);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop extraction
     */
    stopExtraction() {
        this.isRunning = false;
        this.log('Extraction stopped by user');
    }

    /**
     * Get extraction status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            totalStudies: this.extractedData.length,
            extractedData: this.extractedData
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebScraper;
} 
} 