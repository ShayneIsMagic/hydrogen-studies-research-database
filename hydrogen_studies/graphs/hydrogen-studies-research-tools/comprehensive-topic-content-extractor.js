/**
 * Comprehensive Topic Content Extractor for Hydrogen Studies
 * Navigates to each topic page and extracts all content and studies
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveTopicContentExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 3000; // 3 second delay between requests
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.browser = null;
        this.page = null;
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
     * Initialize Puppeteer browser
     */
    async initializeBrowser() {
        try {
            const puppeteer = require('puppeteer');
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });
            this.page = await this.browser.newPage();
            
            // Set realistic user agent
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            this.log('Browser initialized successfully');
        } catch (error) {
            this.log(`Failed to initialize browser: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Extract topics list from main topics page
     */
    async extractTopicsList() {
        try {
            this.log('Navigating to topics page...');
            await this.page.goto(this.topicsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.delay(3000);

            const topics = await this.page.evaluate(() => {
                const topicElements = document.querySelectorAll('a[href*="/topics/"]');
                const topicsList = [];
                
                topicElements.forEach(element => {
                    const href = element.getAttribute('href');
                    const text = element.textContent.trim();
                    
                    // Only include actual topic links (not navigation)
                    if (href && text && href.includes('/topics/') && !href.includes('#') && text.length > 2) {
                        topicsList.push({
                            title: text,
                            url: href.startsWith('http') ? href : `https://hydrogenstudies.com${href}`
                        });
                    }
                });
                
                return topicsList;
            });

            this.log(`Found ${topics.length} topics`);
            return topics;
        } catch (error) {
            this.log(`Failed to extract topics list: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Extract content from individual topic page
     */
    async extractTopicContent(topicUrl, topicTitle) {
        try {
            this.log(`Extracting content from: ${topicTitle}`);
            
            await this.page.goto(topicUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.delay(2000);

            const pageContent = await this.page.evaluate(() => {
                // Remove navigation, headers, footers, and other UI elements
                const elementsToRemove = [
                    'nav', 'header', 'footer', '.navigation', '.menu', '.sidebar',
                    '.filter', '.search', '.breadcrumb', '.pagination',
                    '.social-share', '.related-posts', '.comments',
                    'script', 'style', 'noscript'
                ];

                elementsToRemove.forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => el.remove());
                });

                // Get main content area
                const mainContent = document.querySelector('main') || 
                                  document.querySelector('.content') || 
                                  document.querySelector('.post-content') ||
                                  document.querySelector('article') ||
                                  document.body;

                if (!mainContent) return { content: '', studies: '' };

                // Extract all text content
                const allText = mainContent.innerText || mainContent.textContent || '';
                
                // Look for studies section
                let content = allText;
                let studies = '';

                // Try to find studies section by looking for keywords
                const studiesKeywords = ['Studies', 'Research', 'Clinical Trials', 'Scientific Studies'];
                const lines = allText.split('\n');
                let studiesStartIndex = -1;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (studiesKeywords.some(keyword => line.includes(keyword))) {
                        studiesStartIndex = i;
                        break;
                    }
                }

                if (studiesStartIndex !== -1) {
                    content = lines.slice(0, studiesStartIndex).join('\n').trim();
                    studies = lines.slice(studiesStartIndex).join('\n').trim();
                }

                // Clean up content
                const cleanContent = content
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();

                const cleanStudies = studies
                    .replace(/\s+/g, ' ')
                    .replace(/\n\s*\n/g, '\n')
                    .trim();

                return {
                    content: cleanContent,
                    studies: cleanStudies
                };
            });

            return {
                topic: topicTitle,
                content: pageContent.content,
                studies: pageContent.studies
            };

        } catch (error) {
            this.log(`Failed to extract content from ${topicTitle}: ${error.message}`, 'error');
            return {
                topic: topicTitle,
                content: `Error extracting content: ${error.message}`,
                studies: ''
            };
        }
    }

    /**
     * Main extraction process
     */
    async extractAllTopics() {
        try {
            this.isRunning = true;
            this.log('Starting comprehensive topic content extraction...');

            // Get topics list
            const topics = await this.extractTopicsList();
            
            if (topics.length === 0) {
                throw new Error('No topics found');
            }

            this.log(`Found ${topics.length} topics. Starting individual page extraction...`);

            // Extract content from each topic
            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                
                if (this.onProgress) {
                    this.onProgress(i + 1, topics.length, topic.title);
                }

                const topicData = await this.extractTopicContent(topic.url, topic.title);
                this.extractedData.push(topicData);

                this.log(`Extracted ${i + 1}/${topics.length}: ${topic.title}`);
                
                // Delay between requests
                if (i < topics.length - 1) {
                    await this.delay(this.delayMs);
                }
            }

            this.log('Extraction completed successfully!');
            return this.extractedData;

        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Save extracted data to CSV
     */
    saveToCSV(data, filename) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const csvFilename = filename || `comprehensive_topic_content_${timestamp}.csv`;
            
            // CSV header
            let csvContent = 'Topic,Content,Studies\n';
            
            // Add data rows
            data.forEach(item => {
                const topic = `"${item.topic.replace(/"/g, '""')}"`;
                const content = `"${item.content.replace(/"/g, '""')}"`;
                const studies = `"${item.studies.replace(/"/g, '""')}"`;
                
                csvContent += `${topic},${content},${studies}\n`;
            });
            
            fs.writeFileSync(csvFilename, csvContent, 'utf8');
            this.log(`Data saved to: ${csvFilename}`);
            this.log(`Total topics extracted: ${data.length}`);
            
            return csvFilename;
        } catch (error) {
            this.log(`Failed to save CSV: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            this.log('Browser closed');
        }
    }
}

// Main execution
async function main() {
    const extractor = new ComprehensiveTopicContentExtractor();
    
    try {
        await extractor.initializeBrowser();
        
        extractor.onProgress = (current, total, topic) => {
            console.log(`Progress: ${current}/${total} - ${topic}`);
        };
        
        const data = await extractor.extractAllTopics();
        const filename = extractor.saveToCSV(data);
        
        console.log('\n✅ Extraction completed successfully!');
        console.log(`📁 Results saved to: ${filename}`);
        console.log(`📊 Total topics extracted: ${data.length}`);
        
    } catch (error) {
        console.error('❌ Extraction failed:', error.message);
        process.exit(1);
    } finally {
        await extractor.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = ComprehensiveTopicContentExtractor; 