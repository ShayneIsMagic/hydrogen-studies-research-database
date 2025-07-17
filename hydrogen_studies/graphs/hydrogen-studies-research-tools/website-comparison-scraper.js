/**
 * Website Comparison Scraper for Hydrogen Studies
 * Compares data from https://hydrogenstudies.com with local CSV databases
 * Admin: shayne@devpipeline.com
 */

class WebsiteComparisonScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delayMs = 1500; // 1.5 second delay between requests
        this.maxRetries = 3;
        this.extractedData = [];
        this.localData = [];
        this.comparisonResults = {
            totalWebsiteStudies: 0,
            totalLocalStudies: 0,
            matches: [],
            websiteOnly: [],
            localOnly: [],
            statistics: {}
        };
        this.isRunning = false;
        this.onProgress = null;
        this.onLog = null;
    }

    /**
     * Log messages with timestamp
     */
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        }
    }

    /**
     * Update progress
     */
    updateProgress(current, total, message) {
        const percentage = Math.round((current / total) * 100);
        const progressMessage = `${message} (${current}/${total} - ${percentage}%)`;
        this.log(progressMessage);
        
        if (this.onProgress) {
            this.onProgress(current, total, percentage, message);
        }
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
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'HydrogenStudies-Comparison-Tool/1.0 (shayne@devpipeline.com)',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.text();

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
     * Load local CSV data
     */
    async loadLocalData() {
        this.log('Loading local CSV data...');
        
        const csvFiles = [
            '../Hydrogen Research Database - Primary.csv',
            '../Hydrogen Research Database - Engineering.csv',
            '../Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        
        let allStudies = [];
        
        for (const csvFile of csvFiles) {
            try {
                this.log(`Loading ${csvFile}...`);
                const response = await fetch(csvFile);
                
                if (!response.ok) {
                    this.log(`Failed to load ${csvFile}: ${response.status}`, 'warning');
                    continue;
                }
                
                const csvData = await response.text();
                const studies = this.parseCSV(csvData);
                allStudies = allStudies.concat(studies);
                
                this.log(`Loaded ${studies.length} studies from ${csvFile}`);
                
            } catch (error) {
                this.log(`Error loading ${csvFile}: ${error.message}`, 'error');
            }
        }
        
        // Remove duplicates from local data
        this.localData = this.removeDuplicates(allStudies);
        this.log(`Total local studies after deduplication: ${this.localData.length}`);
        
        return this.localData;
    }

    /**
     * Parse CSV data
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const studies = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length < headers.length) continue;
            
            const study = {};
            headers.forEach((header, index) => {
                study[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            // Normalize study data
            study.title = study.title || study.Title || '';
            study.year = this.extractYear(study.year || study['Publish Year'] || study.Year || '');
            study.authors = study.authors || study.Authors || study['First Author'] || '';
            study.journal = study.journal || study.Journal || '';
            study.doi = study.doi || study.DOI || study['DOI/PMID/Link'] || '';
            study.abstract = study.abstract || study.Abstract || '';
            study.topic = study.topic || study.Topic || study['Primary Topic'] || '';
            study.country = study.country || study.Country || '';
            
            if (study.title) {
                studies.push(study);
            }
        }
        
        return studies;
    }

    /**
     * Parse CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }

    /**
     * Extract year from string
     */
    extractYear(yearStr) {
        if (!yearStr) return null;
        
        const yearMatch = yearStr.toString().match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            if (year >= 1800 && year <= new Date().getFullYear() + 1) {
                return year;
            }
        }
        
        return null;
    }

    /**
     * Remove duplicates from studies
     */
    removeDuplicates(studies) {
        const seen = new Set();
        const uniqueStudies = [];
        
        studies.forEach(study => {
            const key = this.createStudyKey(study);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueStudies.push(study);
            }
        });
        
        return uniqueStudies;
    }

    /**
     * Create unique key for study
     */
    createStudyKey(study) {
        const title = (study.title || '').toLowerCase().trim();
        const year = study.year || '';
        const firstAuthor = (study.authors || '').toLowerCase().trim().split(',')[0];
        
        return `${title}_${year}_${firstAuthor}`;
    }

    /**
     * Extract data from hydrogenstudies.com
     */
    async extractWebsiteData() {
        this.log('Starting extraction from hydrogenstudies.com...');
        
        try {
            // Get main page
            const mainPageUrl = `${this.baseUrl}/`;
            this.log(`Fetching main page: ${mainPageUrl}`);
            
            const mainPageHtml = await this.fetchWithRetry(mainPageUrl);
            
            // Extract study URLs from main page
            const studyUrls = this.extractStudyUrls(mainPageHtml);
            this.log(`Found ${studyUrls.length} study URLs on main page`);
            
            // Try to get more URLs from search page
            const searchPageUrl = `${this.baseUrl}/search/`;
            this.log(`Fetching search page: ${searchPageUrl}`);
            
            const searchPageHtml = await this.fetchWithRetry(searchPageUrl);
            const searchUrls = this.extractStudyUrls(searchPageHtml);
            
            // Combine and deduplicate URLs
            const allUrls = [...new Set([...studyUrls, ...searchUrls])];
            this.log(`Total unique study URLs found: ${allUrls.length}`);
            
            // Extract data from each study page
            this.extractedData = [];
            
            for (let i = 0; i < allUrls.length && this.isRunning; i++) {
                const studyUrl = allUrls[i];
                
                try {
                    this.log(`Processing study ${i + 1}/${allUrls.length}: ${studyUrl}`);
                    
                    const studyHtml = await this.fetchWithRetry(studyUrl);
                    const studyData = this.extractStudyData(studyHtml, studyUrl);
                    
                    if (studyData && studyData.title) {
                        this.extractedData.push(studyData);
                    }
                    
                    this.updateProgress(i + 1, allUrls.length, `Processing studies`);
                    
                    // Respectful delay
                    await this.delay(this.delayMs);
                    
                } catch (error) {
                    this.log(`Failed to process ${studyUrl}: ${error.message}`, 'error');
                }
            }
            
            this.log(`Website extraction completed. Total studies: ${this.extractedData.length}`);
            return this.extractedData;
            
        } catch (error) {
            this.log(`Website extraction failed: ${error.message}`, 'error');
            throw error;
        }
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
     * Extract study data from HTML
     */
    extractStudyData(html, url) {
        const study = {
            title: '',
            authors: '',
            year: null,
            journal: '',
            doi: '',
            abstract: '',
            url: url,
            topic: '',
            country: '',
            source: 'website'
        };

        // Extract title
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                          html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            study.title = titleMatch[1].trim();
        }

        // Extract authors
        const authorsMatch = html.match(/authors?[^>]*>([^<]+)</i) ||
                            html.match(/by\s+([^<]+)</i);
        if (authorsMatch) {
            study.authors = authorsMatch[1].trim();
        }

        // Extract year
        const yearMatch = html.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            study.year = parseInt(yearMatch[0]);
        }

        // Extract journal
        const journalMatch = html.match(/journal[^>]*>([^<]+)</i) ||
                             html.match(/published\s+in\s+([^<]+)</i);
        if (journalMatch) {
            study.journal = journalMatch[1].trim();
        }

        // Extract DOI
        const doiMatch = html.match(/doi[^:]*:\s*([^\s<]+)/i) ||
                        html.match(/10\.\d{4,}\/[^\s<]+/i);
        if (doiMatch) {
            study.doi = doiMatch[1] || doiMatch[0];
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
     * Compare website data with local data
     */
    compareData() {
        this.log('Starting data comparison...');
        
        this.comparisonResults = {
            totalWebsiteStudies: this.extractedData.length,
            totalLocalStudies: this.localData.length,
            matches: [],
            websiteOnly: [],
            localOnly: [],
            statistics: {}
        };

        // Create lookup maps for efficient comparison
        const websiteMap = new Map();
        const localMap = new Map();

        // Index website data
        this.extractedData.forEach(study => {
            const key = this.createStudyKey(study);
            websiteMap.set(key, study);
        });

        // Index local data
        this.localData.forEach(study => {
            const key = this.createStudyKey(study);
            localMap.set(key, study);
        });

        // Find matches and differences
        const allKeys = new Set([...websiteMap.keys(), ...localMap.keys()]);

        allKeys.forEach(key => {
            const websiteStudy = websiteMap.get(key);
            const localStudy = localMap.get(key);

            if (websiteStudy && localStudy) {
                // Match found
                this.comparisonResults.matches.push({
                    website: websiteStudy,
                    local: localStudy,
                    key: key
                });
            } else if (websiteStudy) {
                // Only in website
                this.comparisonResults.websiteOnly.push(websiteStudy);
            } else {
                // Only in local data
                this.comparisonResults.localOnly.push(localStudy);
            }
        });

        // Calculate statistics
        this.comparisonResults.statistics = {
            matchPercentage: Math.round((this.comparisonResults.matches.length / Math.max(this.comparisonResults.totalWebsiteStudies, this.comparisonResults.totalLocalStudies)) * 100),
            websiteOnlyPercentage: Math.round((this.comparisonResults.websiteOnly.length / this.comparisonResults.totalWebsiteStudies) * 100),
            localOnlyPercentage: Math.round((this.comparisonResults.localOnly.length / this.comparisonResults.totalLocalStudies) * 100)
        };

        this.log(`Comparison completed:`);
        this.log(`- Website studies: ${this.comparisonResults.totalWebsiteStudies}`);
        this.log(`- Local studies: ${this.comparisonResults.totalLocalStudies}`);
        this.log(`- Matches: ${this.comparisonResults.matches.length}`);
        this.log(`- Website only: ${this.comparisonResults.websiteOnly.length}`);
        this.log(`- Local only: ${this.comparisonResults.localOnly.length}`);

        return this.comparisonResults;
    }

    /**
     * Generate comparison report
     */
    generateReport() {
        const report = {
            summary: {
                timestamp: new Date().toISOString(),
                websiteStudies: this.comparisonResults.totalWebsiteStudies,
                localStudies: this.comparisonResults.totalLocalStudies,
                matches: this.comparisonResults.matches.length,
                websiteOnly: this.comparisonResults.websiteOnly.length,
                localOnly: this.comparisonResults.localOnly.length,
                matchPercentage: this.comparisonResults.statistics.matchPercentage
            },
            details: {
                matches: this.comparisonResults.matches.slice(0, 10), // First 10 matches
                websiteOnly: this.comparisonResults.websiteOnly.slice(0, 10), // First 10 website-only
                localOnly: this.comparisonResults.localOnly.slice(0, 10) // First 10 local-only
            },
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    /**
     * Generate recommendations based on comparison
     */
    generateRecommendations() {
        const recommendations = [];

        if (this.comparisonResults.statistics.matchPercentage < 50) {
            recommendations.push("Low match percentage suggests significant differences between website and local data");
        }

        if (this.comparisonResults.websiteOnly.length > 0) {
            recommendations.push(`Consider adding ${this.comparisonResults.websiteOnly.length} studies from website to local database`);
        }

        if (this.comparisonResults.localOnly.length > 0) {
            recommendations.push(`Local database contains ${this.comparisonResults.localOnly.length} studies not found on website`);
        }

        if (this.comparisonResults.totalWebsiteStudies !== 1335) {
            recommendations.push(`Website shows ${this.comparisonResults.totalWebsiteStudies} studies, expected 1335 - may need to scrape more pages`);
        }

        return recommendations;
    }

    /**
     * Start the complete comparison process
     */
    async startComparison() {
        if (this.isRunning) {
            throw new Error('Comparison already in progress');
        }

        this.isRunning = true;
        
        try {
            this.log('Starting comprehensive website vs local database comparison...');
            
            // Load local data
            await this.loadLocalData();
            
            // Extract website data
            await this.extractWebsiteData();
            
            // Compare data
            this.compareData();
            
            // Generate report
            const report = this.generateReport();
            
            this.log('Comparison process completed successfully');
            return report;
            
        } catch (error) {
            this.log(`Comparison failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }
} 