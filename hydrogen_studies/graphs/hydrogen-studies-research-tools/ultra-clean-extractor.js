/**
 * Ultra-Clean Topics Extractor for Hydrogen Studies
 * Extracts only pure topic content, filtering out all navigation and UI elements
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class UltraCleanExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 2000;
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
            throw error;
        }
    }

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

    async extractTopicContent(topic) {
        try {
            this.log(`Extracting content for: ${topic.name}`);
            
            await this.page.goto(topic.url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await this.delay(2000);

            const result = await this.page.evaluate(() => {
                const cleanText = (text) => {
                    if (!text) return '';
                    return text.replace(/\s+/g, ' ').trim();
                };

                // Function to check if element should be excluded
                const shouldExclude = (element) => {
                    const text = element.textContent.toLowerCase();
                    const excludeKeywords = [
                        'search options', 'test subjects', 'all years', 'all outcomes', 
                        'all countries', 'all body parts', 'advanced options', 'secondary topics',
                        'tertiary topics', 'all authors', 'all ph', 'all applications',
                        'select all', 'deselect all', 'skip to content', 'chart created',
                        'zoom out', 'zoom level', 'positive:', 'neutral:', 'negative:',
                        'studies:', 'study', 'research', 'clinical trial', 'experiment',
                        'investigation', 'analysis', 'evaluation', 'assessment',
                        'give us feedback', 'copyright', 'all rights reserved',
                        'hydrogen studies does not provide medical advice',
                        'see additional information', 'feedback', 'contact'
                    ];
                    
                    return excludeKeywords.some(keyword => text.includes(keyword));
                };

                // Function to check if element contains actual topic content
                const hasTopicContent = (element) => {
                    const text = element.textContent;
                    if (!text || text.length < 20) return false;
                    
                    // Look for health-related keywords that indicate actual content
                    const healthKeywords = [
                        'acne', 'diabetes', 'cancer', 'heart', 'brain', 'liver', 'kidney',
                        'lung', 'skin', 'bone', 'muscle', 'blood', 'eye', 'ear', 'nose',
                        'throat', 'stomach', 'intestine', 'pancreas', 'spleen', 'thyroid',
                        'adrenal', 'pituitary', 'ovary', 'testes', 'uterus', 'prostate',
                        'bladder', 'gallbladder', 'appendix', 'tonsil', 'lymph', 'nerve',
                        'artery', 'vein', 'capillary', 'cartilage', 'tendon', 'ligament',
                        'joint', 'spine', 'skull', 'rib', 'pelvis', 'femur', 'humerus',
                        'tibia', 'fibula', 'radius', 'ulna', 'clavicle', 'scapula'
                    ];
                    
                    return healthKeywords.some(keyword => text.toLowerCase().includes(keyword));
                };

                let content = '';
                let studies = '';

                // First, try to find the main topic content
                const possibleContentElements = [
                    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                    'p', 'div', 'section', 'article', 'main'
                ];

                for (const tag of possibleContentElements) {
                    const elements = document.querySelectorAll(tag);
                    for (const element of elements) {
                        if (!shouldExclude(element) && hasTopicContent(element)) {
                            const elementText = cleanText(element.textContent);
                            if (elementText.length > 50) {
                                content = elementText;
                                break;
                            }
                        }
                    }
                    if (content) break;
                }

                // If no specific content found, try to extract from the main content area
                if (!content) {
                    const mainContentSelectors = [
                        'main',
                        'article',
                        '.content',
                        '.entry-content',
                        '.post-content',
                        '.main-content',
                        '#content',
                        '.topic-content'
                    ];

                    for (const selector of mainContentSelectors) {
                        const element = document.querySelector(selector);
                        if (element && !shouldExclude(element)) {
                            const elementText = cleanText(element.textContent);
                            if (elementText.length > 100) {
                                content = elementText;
                                break;
                            }
                        }
                    }
                }

                // Look for studies section specifically
                const studiesSelectors = [
                    '.studies',
                    '.research-studies',
                    '.related-studies',
                    '[class*="studies"]',
                    '[class*="research"]'
                ];

                for (const selector of studiesSelectors) {
                    const element = document.querySelector(selector);
                    if (element) {
                        const elementText = cleanText(element.textContent);
                        if (elementText.length > 20) {
                            studies = elementText;
                            break;
                        }
                    }
                }

                // If no studies found, look for any section with "studies" in the text
                if (!studies) {
                    const allElements = document.querySelectorAll('*');
                    for (const element of allElements) {
                        const text = element.textContent.toLowerCase();
                        if (text.includes('studies') && !shouldExclude(element)) {
                            const elementText = cleanText(element.textContent);
                            if (elementText.length > 20) {
                                studies = elementText;
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

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async extract() {
        if (this.isRunning) {
            this.log('Extraction already in progress', 'warn');
            return;
        }

        this.isRunning = true;
        this.log('Starting ultra-clean extraction...');

        try {
            await this.initializeBrowser();

            const topics = await this.extractTopics();
            
            if (topics.length === 0) {
                this.log('No topics found.', 'error');
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
            const filename = `ultra_clean_extracted_data_${timestamp}.csv`;
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
module.exports = UltraCleanExtractor;

// Run if called directly
if (require.main === module) {
    const extractor = new UltraCleanExtractor();
    
    extractor.onProgress = (current, total, topicName) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topicName}`);
    };

    extractor.extract().catch(console.error);
} 