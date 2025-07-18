/**
 * Puppeteer-Based Topics Extractor for Hydrogen Studies
 * Uses real browser to bypass Cloudflare protection
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class PuppeteerExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 2000; // 2 second delay between requests
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

    /**
     * Initialize Puppeteer browser
     */
    async initializeBrowser() {
        try {
            // Check if puppeteer is available
            const puppeteer = require('puppeteer');
            
            this.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: false, // Set to true for production
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
            
            // Set user agent
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            
            // Set viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // Enable JavaScript
            await this.page.setJavaScriptEnabled(true);
            
            this.log('Browser initialized successfully');
        } catch (error) {
            this.log(`Failed to initialize browser: ${error.message}`, 'error');
            this.log('Please install puppeteer: npm install puppeteer', 'error');
            throw error;
        }
    }

    /**
     * Extract topics from the main topics page
     */
    async extractTopics() {
        try {
            this.log('Navigating to topics page...');
            await this.page.goto(this.topicsUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await this.delay(3000);

            // Extract topics using page.evaluate
            const topics = await this.page.evaluate(() => {
                const topicLinks = Array.from(document.querySelectorAll('a[href^="/topics/"]'));
                const topics = [];
                
                topicLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    
                    if (href && text && !topics.find(t => t.slug === href.split('/')[2])) {
                        topics.push({
                            name: text,
                            slug: href.split('/')[2],
                            url: `https://hydrogenstudies.com${href}`
                        });
                    }
                });
                
                return topics;
            });

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
            
            // Navigate to topic page
            await this.page.goto(topic.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait for content to load
            await this.delay(2000);

            // Extract content and studies using page.evaluate
            const result = await this.page.evaluate(() => {
                // Function to clean HTML content
                const cleanHtml = (html) => {
                    if (!html) return '';
                    
                    // Create a temporary div to parse HTML
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    
                    // Remove script and style tags
                    const scripts = temp.querySelectorAll('script, style');
                    scripts.forEach(script => script.remove());
                    
                    // Get text content and clean up
                    let text = temp.textContent || temp.innerText || '';
                    
                    // Clean up whitespace
                    text = text.replace(/\s+/g, ' ').trim();
                    
                    return text;
                };

                // Try to find content section
                let content = '';
                let studies = '';

                // Look for content before studies
                const contentSelectors = [
                    '.content',
                    '.entry-content',
                    '.post-content',
                    'article',
                    'main'
                ];

                for (const selector of contentSelectors) {
                    const contentElement = document.querySelector(selector);
                    if (contentElement) {
                        content = cleanHtml(contentElement.innerHTML);
                        break;
                    }
                }

                // Look for studies section
                const studiesSelectors = [
                    '.studies',
                    '.research-studies',
                    '.related-studies'
                ];

                for (const selector of studiesSelectors) {
                    const studiesElement = document.querySelector(selector);
                    if (studiesElement) {
                        studies = cleanHtml(studiesElement.innerHTML);
                        break;
                    }
                }

                // Look for headings containing "Studies" or "Research"
                if (!studies) {
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    for (const heading of headings) {
                        if (heading.textContent.toLowerCase().includes('studies') || 
                            heading.textContent.toLowerCase().includes('research')) {
                            const parent = heading.closest('section, div, article');
                            if (parent) {
                                studies = cleanHtml(parent.innerHTML);
                                break;
                            }
                        }
                    }
                }

                // Fallback: look for any section with "studies" in the text
                if (!studies) {
                    const allElements = document.querySelectorAll('*');
                    for (const element of allElements) {
                        if (element.textContent.toLowerCase().includes('studies')) {
                            const parent = element.closest('section, div, article');
                            if (parent) {
                                studies = cleanHtml(parent.innerHTML);
                                break;
                            }
                        }
                    }
                }

                return { content, studies };
            });

            return {
                topic: topic.name,
                content: result.content.trim(),
                studies: result.studies.trim()
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
        this.log('Starting Puppeteer-based extraction...');

        try {
            // Initialize browser
            await this.initializeBrowser();

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

                // Add delay between requests
                if (i < topics.length - 1) {
                    await this.delay(this.delayMs);
                }
            }

            // Save results
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `puppeteer_extracted_data_${timestamp}.csv`;
            this.saveToCSV(this.extractedData, filename);

            this.log(`Extraction completed! Found ${this.extractedData.length} topics.`);
            this.log(`Results saved to: ${filename}`);

        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
        } finally {
            // Clean up
            if (this.browser) {
                await this.browser.close();
            }
            this.isRunning = false;
        }
    }
}

// Export for use
module.exports = PuppeteerExtractor;

// Run if called directly
if (require.main === module) {
    const extractor = new PuppeteerExtractor();
    
    extractor.onProgress = (current, total, topicName) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topicName}`);
    };

    extractor.extract().catch(console.error);
} 