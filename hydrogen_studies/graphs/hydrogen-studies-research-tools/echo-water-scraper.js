/**
 * EchoWater Scraper for Hydrogen Studies
 * Extracts data from https://hydrogenstudies.com for EchoWater team
 * Admin: shayne@devpipeline.com
 */

class EchoWaterScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delayMs = 1000; // 1 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.onLog = null;
        this.useCorsProxy = true; // Enable CORS proxy for browser usage
        this.corsProxy = 'https://corsproxy.io/?'; // CORS proxy service
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * Set log callback
     */
    setLogCallback(callback) {
        this.onLog = callback;
    }

    /**
     * Log message
     */
    log(message, type = 'info') {
        if (this.onLog) {
            this.onLog(message, type);
        }
        console.log(`[EchoWaterScraper] ${message}`);
    }

    /**
     * Update progress
     */
    updateProgress(current, total, percentage) {
        if (this.onProgress) {
            this.onProgress(current, total, percentage);
        }
    }

    /**
     * Delay function
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch URL with retry logic
     */
    async fetchWithRetry(url, retries = this.maxRetries) {
        // Apply CORS proxy if enabled and running in browser
        let fetchUrl = url;
        if (this.useCorsProxy && typeof window !== 'undefined') {
            fetchUrl = this.corsProxy + encodeURIComponent(url);
            this.log(`Using CORS proxy: ${fetchUrl}`);
        }
        
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(fetchUrl, {
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

                return await response.text();
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
     * Extract study data from HTML
     */
    extractStudyData(html, url) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract basic study information
            const title = this.extractText(doc, 'h1, .study-title, .title') || 'Untitled Study';
            const authors = this.extractText(doc, '.authors, .author-list, .study-authors') || 'Unknown Authors';
            const year = this.extractYear(doc);
            const journal = this.extractText(doc, '.journal, .publication, .study-journal') || 'Unknown Journal';
            const abstract = this.extractText(doc, '.abstract, .summary, .study-abstract') || 'No abstract available';
            const doi = this.extractDOI(doc);
            
            // Extract metadata
            const topic = this.extractText(doc, '.topic, .health-topic, .study-topic') || 'General';
            const organism = this.extractText(doc, '.organism, .model, .study-organism') || 'Not specified';
            const bodySystem = this.extractText(doc, '.body-system, .system, .study-system') || 'Not specified';
            const country = this.extractText(doc, '.country, .location, .study-country') || 'Not specified';
            const outcome = this.extractText(doc, '.outcome, .result, .study-outcome') || 'Not specified';
            const designation = this.extractText(doc, '.designation, .type, .study-type') || 'Research Study';

            return {
                title: this.cleanText(title),
                authors: this.cleanText(authors),
                year: year,
                journal: this.cleanText(journal),
                abstract: this.cleanText(abstract),
                doi: doi,
                url: url,
                topic: this.cleanText(topic),
                organism: this.cleanText(organism),
                bodySystem: this.cleanText(bodySystem),
                country: this.cleanText(country),
                outcome: this.cleanText(outcome),
                designation: this.cleanText(designation)
            };
        } catch (error) {
            this.log(`Error extracting data from ${url}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Extract text from DOM element
     */
    extractText(doc, selector) {
        const element = doc.querySelector(selector);
        return element ? element.textContent.trim() : null;
    }

    /**
     * Extract year from various sources
     */
    extractYear(doc) {
        // Try to find year in various formats
        const yearSelectors = [
            '.year, .study-year, .publication-year',
            '.date, .publication-date',
            'time[datetime]',
            '.meta .year'
        ];

        for (const selector of yearSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                const yearMatch = text.match(/\b(19|20)\d{2}\b/);
                if (yearMatch) {
                    return parseInt(yearMatch[0]);
                }
            }
        }

        // Try to extract from URL or other sources
        const url = doc.URL || '';
        const urlYearMatch = url.match(/\b(19|20)\d{2}\b/);
        if (urlYearMatch) {
            return parseInt(urlYearMatch[0]);
        }

        return new Date().getFullYear(); // Default to current year
    }

    /**
     * Extract DOI from various sources
     */
    extractDOI(doc) {
        // Look for DOI in various formats
        const doiSelectors = [
            '.doi, .study-doi, .publication-doi',
            'a[href*="doi.org"]',
            '.meta .doi'
        ];

        for (const selector of doiSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                const doiMatch = text.match(/10\.\d{4,}\/[-._;()\/:A-Z0-9]+/i);
                if (doiMatch) {
                    return doiMatch[0];
                }
            }
        }

        return null;
    }

    /**
     * Clean text content
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .replace(/\n+/g, ' ') // Replace newlines with spaces
            .trim();
    }

    /**
     * Extract all studies from the main database
     */
    async extractAllStudies() {
        this.log('Starting extraction of all studies from Hydrogen Studies database...');
        this.isRunning = true;
        this.extractedData = [];

        try {
            // Get the main studies page
            const mainPageUrl = `${this.baseUrl}/studies`;
            this.log(`Fetching main studies page: ${mainPageUrl}`);
            
            const mainPageHtml = await this.fetchWithRetry(mainPageUrl);
            const studyUrls = this.extractStudyUrls(mainPageHtml);
            
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
                    
                    // Update progress
                    const progress = ((i + 1) / studyUrls.length) * 100;
                    this.updateProgress(i + 1, studyUrls.length, progress);
                    
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
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for study links in various formats
        const linkSelectors = [
            'a[href*="/study/"]',
            'a[href*="/research/"]',
            'a[href*="/publication/"]',
            '.study-link a',
            '.research-link a'
        ];
        
        for (const selector of linkSelectors) {
            const links = doc.querySelectorAll(selector);
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    if (!urls.includes(fullUrl)) {
                        urls.push(fullUrl);
                    }
                }
            });
        }
        
        return urls;
    }

    /**
     * Extract studies by year range
     */
    async extractByYearRange(startYear, endYear) {
        this.log(`Extracting studies from ${startYear} to ${endYear}...`);
        
        // For now, extract all and filter by year
        const allStudies = await this.extractAllStudies();
        
        return allStudies.filter(study => {
            const year = study.year || 0;
            return year >= startYear && year <= endYear;
        });
    }

    /**
     * Extract studies by topic
     */
    async extractByTopic(topic) {
        this.log(`Extracting studies for topic: ${topic}...`);
        
        // For now, extract all and filter by topic
        const allStudies = await this.extractAllStudies();
        
        return allStudies.filter(study => {
            const studyTopic = (study.topic || '').toLowerCase();
            return studyTopic.includes(topic.toLowerCase());
        });
    }

    /**
     * Extract studies by organism
     */
    async extractByOrganism(organism) {
        this.log(`Extracting studies for organism: ${organism}...`);
        
        // For now, extract all and filter by organism
        const allStudies = await this.extractAllStudies();
        
        return allStudies.filter(study => {
            const studyOrganism = (study.organism || '').toLowerCase();
            return studyOrganism.includes(organism.toLowerCase());
        });
    }

    /**
     * Extract studies by body system
     */
    async extractByBodySystem(bodySystem) {
        this.log(`Extracting studies for body system: ${bodySystem}...`);
        
        // For now, extract all and filter by body system
        const allStudies = await this.extractAllStudies();
        
        return allStudies.filter(study => {
            const studyBodySystem = (study.bodySystem || '').toLowerCase();
            return studyBodySystem.includes(bodySystem.toLowerCase());
        });
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

    /**
     * Validate extracted data
     */
    validateData() {
        const issues = [];
        
        this.extractedData.forEach((study, index) => {
            if (!study.title) {
                issues.push(`Study ${index + 1}: Missing title`);
            }
            
            if (!study.authors) {
                issues.push(`Study ${index + 1}: Missing authors`);
            }
            
            if (!study.year) {
                issues.push(`Study ${index + 1}: Missing year`);
            }
        });
        
        return {
            totalStudies: this.extractedData.length,
            issues: issues,
            isValid: issues.length === 0
        };
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.EchoWaterScraper = EchoWaterScraper;
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EchoWaterScraper;
} 