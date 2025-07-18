/**
 * Final Improved Topics Extractor for Hydrogen Studies
 * Properly separates content from studies and filters out navigation elements
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class FinalImprovedExtractor {
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
            const puppeteer = require('puppeteer');
            
            this.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: false,
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
            
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await this.page.setViewport({ width: 1920, height: 1080 });
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

            await this.delay(3000);

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
            
            await this.page.goto(topic.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await this.delay(2000);

            const result = await this.page.evaluate(() => {
                const cleanHtml = (html) => {
                    if (!html) return '';
                    
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

                // Function to check if element contains navigation/filter content
                const isNavigationContent = (element) => {
                    const text = element.textContent.toLowerCase();
                    const navigationKeywords = [
                        'search options', 'test subjects', 'all years', 'all outcomes', 
                        'all countries', 'all body parts', 'advanced options', 'secondary topics',
                        'tertiary topics', 'all authors', 'all ph', 'all applications',
                        'select all', 'deselect all', 'skip to content', 'chart created',
                        'zoom out', 'zoom level', 'positive:', 'neutral:', 'negative:'
                    ];
                    
                    return navigationKeywords.some(keyword => text.includes(keyword));
                };

                // Function to check if element contains studies data
                const isStudiesData = (element) => {
                    const text = element.textContent.toLowerCase();
                    const studiesKeywords = [
                        'studies:', 'study', 'research', 'clinical trial', 'experiment',
                        'investigation', 'analysis', 'evaluation', 'assessment'
                    ];
                    
                    return studiesKeywords.some(keyword => text.includes(keyword));
                };

                let content = '';
                let studies = '';

                // Look for main content area (excluding navigation)
                const mainContentSelectors = [
                    'main',
                    'article',
                    '.content',
                    '.entry-content',
                    '.post-content',
                    '.main-content'
                ];

                for (const selector of mainContentSelectors) {
                    const element = document.querySelector(selector);
                    if (element && !isNavigationContent(element)) {
                        const elementText = cleanHtml(element.innerHTML);
                        if (elementText.length > 50) { // Ensure it's substantial content
                            content = elementText;
                            break;
                        }
                    }
                }

                // If no main content found, try to extract from body excluding navigation
                if (!content) {
                    const body = document.body;
                    const allElements = body.querySelectorAll('*');
                    
                    for (const element of allElements) {
                        if (element.children.length === 0 && // Leaf element
                            !isNavigationContent(element) &&
                            element.textContent.trim().length > 100) {
                            
                            const parent = element.closest('div, section, article');
                            if (parent && !isNavigationContent(parent)) {
                                content = cleanHtml(parent.innerHTML);
                                break;
                            }
                        }
                    }
                }

                // Look for studies section
                const studiesSelectors = [
                    '.studies',
                    '.research-studies',
                    '.related-studies',
                    '[class*="studies"]',
                    '[class*="research"]'
                ];

                for (const selector of studiesSelectors) {
                    const element = document.querySelector(selector);
                    if (element && isStudiesData(element)) {
                        studies = cleanHtml(element.innerHTML);
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
                            if (parent && isStudiesData(parent)) {
                                studies = cleanHtml(parent.innerHTML);
                                break;
                            }
                        }
                    }
                }

                // Fallback: extract any section with studies data
                if (!studies) {
                    const allElements = document.querySelectorAll('*');
                    for (const element of allElements) {
                        if (isStudiesData(element) && !isNavigationContent(element)) {
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
        this.log('Starting final improved extraction...');

        try {
            await this.initializeBrowser();

            const topics = await this.extractTopics();
            
            if (topics.length === 0) {
                this.log('No topics found. The website might be protected or the structure has changed.', 'error');
                return;
            }

            this.log(`Processing ${topics.length} topics...`);

            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                
                if (this.onProgress) {
                    this.onProgress(i + 1, topics.length, topic.name);
                }

                const content = await this.extractTopicContent(topic);
                this.extractedData.push(content);

                this.log(`Processed ${i + 1}/${topics.length}: ${topic.name}`);

                if (i < topics.length - 1) {
                    await this.delay(this.delayMs);
                }
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `final_improved_extracted_data_${timestamp}.csv`;
            this.saveToCSV(this.extractedData, filename);

            this.log(`Extraction completed! Found ${this.extractedData.length} topics.`);
            this.log(`Results saved to: ${filename}`);

        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
            this.isRunning = false;
        }
    }
}

// Export for use
module.exports = FinalImprovedExtractor;

// Run if called directly
if (require.main === module) {
    const extractor = new FinalImprovedExtractor();
    
    extractor.onProgress = (current, total, topicName) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topicName}`);
    };

    extractor.extract().catch(console.error);
} 