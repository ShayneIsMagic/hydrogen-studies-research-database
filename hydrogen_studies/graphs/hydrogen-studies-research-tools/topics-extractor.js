/**
 * Topics Extractor for Hydrogen Studies
 * Extracts all topics and their associated study links from https://hydrogenstudies.com/topics/
 * Admin: shayne@devpipeline.com
 */

class TopicsExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 1000; // 1 second delay between requests
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
                        'User-Agent': 'Hydrogen-Studies-Topics-Extractor/1.0 (shayne@devpipeline.com)',
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
     * Extract topics and their study links from the topics page
     */
    extractTopicsFromHtml(html) {
        const topics = [];
        
        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Look for topic sections - common patterns for topic organization
        const topicSelectors = [
            'h1, h2, h3, h4, h5, h6', // All heading elements
            '[class*="topic"]', // Elements with "topic" in class
            '[class*="category"]', // Elements with "category" in class
            '[class*="section"]', // Elements with "section" in class
            'div[class*="topic"], div[class*="category"], div[class*="section"]' // Specific div patterns
        ];
        
        let topicElements = [];
        for (const selector of topicSelectors) {
            const elements = doc.querySelectorAll(selector);
            if (elements.length > 0) {
                topicElements = Array.from(elements);
                break;
            }
        }
        
        // If no specific topic elements found, look for any heading elements
        if (topicElements.length === 0) {
            topicElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        }
        
        this.log(`Found ${topicElements.length} potential topic elements`);
        
        // Process each topic element
        for (const topicElement of topicElements) {
            const topicName = topicElement.textContent.trim();
            
            // Skip empty or very short topic names
            if (topicName.length < 3) continue;
            
            // Look for study links associated with this topic
            const studyLinks = this.findStudyLinksForTopic(topicElement, doc);
            
            if (studyLinks.length > 0) {
                topics.push({
                    topic: topicName,
                    studyLinks: studyLinks
                });
                
                this.log(`Topic: "${topicName}" - Found ${studyLinks.length} study links`);
            }
        }
        
        // If no structured topics found, try alternative approach
        if (topics.length === 0) {
            this.log('No structured topics found, trying alternative extraction method...');
            return this.extractTopicsAlternative(html);
        }
        
        return topics;
    }

    /**
     * Alternative method to extract topics when structured approach fails
     */
    extractTopicsAlternative(html) {
        const topics = [];
        
        // Look for patterns that might indicate topics
        const topicPatterns = [
            // Pattern for topic headings followed by study links
            /<h[1-6][^>]*>([^<]+)<\/h[1-6]>(.*?)(?=<h[1-6]|$)/gis,
            // Pattern for topic sections
            /<div[^>]*class="[^"]*topic[^"]*"[^>]*>(.*?)<\/div>/gis,
            // Pattern for category sections
            /<section[^>]*class="[^"]*category[^"]*"[^>]*>(.*?)<\/section>/gis
        ];
        
        for (const pattern of topicPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const topicName = match[1] ? match[1].trim() : 'Unknown Topic';
                const topicContent = match[2] || match[1];
                
                // Extract study links from the topic content
                const studyLinks = this.extractStudyLinksFromText(topicContent);
                
                if (studyLinks.length > 0) {
                    topics.push({
                        topic: topicName,
                        studyLinks: studyLinks
                    });
                }
            }
        }
        
        return topics;
    }

    /**
     * Find study links associated with a specific topic element
     */
    findStudyLinksForTopic(topicElement, doc) {
        const studyLinks = [];
        
        // Look for links in the same section as the topic
        let currentElement = topicElement.nextElementSibling;
        const topicLevel = parseInt(topicElement.tagName.charAt(1));
        
        while (currentElement) {
            // Stop if we encounter another heading of the same or higher level
            if (currentElement.tagName && currentElement.tagName.match(/^H[1-6]$/)) {
                const currentLevel = parseInt(currentElement.tagName.charAt(1));
                if (currentLevel <= topicLevel) break;
            }
            
            // Look for study links in this element
            const links = currentElement.querySelectorAll('a[href*="study"], a[href*="research"], a[href*="article"]');
            
            for (const link of links) {
                const href = link.getAttribute('href');
                const text = link.textContent.trim();
                
                if (href && text) {
                    const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                    studyLinks.push({
                        title: text,
                        url: fullUrl
                    });
                }
            }
            
            currentElement = currentElement.nextElementSibling;
        }
        
        return studyLinks;
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
            const text = match[2].trim();
            
            // Check if this looks like a study link
            if (href && (href.includes('study') || href.includes('research') || href.includes('article'))) {
                const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
                studyLinks.push({
                    title: text,
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
     * Download CSV file
     */
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
            this.log('Starting topics extraction...');
            this.updateProgress(0, 1, 'Fetching topics page...');
            
            // Fetch the topics page
            const html = await this.fetchWithRetry(this.topicsUrl);
            this.log('Successfully fetched topics page');
            
            this.updateProgress(50, 100, 'Extracting topics and study links...');
            
            // Extract topics and study links
            const topics = this.extractTopicsFromHtml(html);
            this.extractedData = topics;
            
            this.log(`Extraction complete! Found ${topics.length} topics with study links`);
            this.updateProgress(100, 100, 'Extraction complete!');
            
            // Convert to CSV
            const csvContent = this.convertToCSV(topics);
            
            // Download the CSV file
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `hydrogen-studies-topics-${timestamp}.csv`;
            this.downloadCSV(csvContent, filename);
            
            this.log(`CSV file downloaded: ${filename}`);
            
            return {
                success: true,
                topicsCount: topics.length,
                totalStudies: topics.reduce((sum, topic) => sum + topic.studyLinks.length, 0),
                filename: filename,
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TopicsExtractor;
} 