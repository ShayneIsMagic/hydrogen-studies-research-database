/**
 * Robust Topic Content Extractor for Hydrogen Studies
 * Handles actual website structure and extracts all content from each topic page
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class RobustTopicExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 3000;
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
            
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            this.log('Browser initialized successfully');
        } catch (error) {
            this.log(`Failed to initialize browser: ${error.message}`, 'error');
            throw error;
        }
    }

    async extractTopicsList() {
        try {
            this.log('Navigating to topics page...');
            await this.page.goto(this.topicsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.delay(5000);

            // First, let's see what's actually on the page
            const pageInfo = await this.page.evaluate(() => {
                const allLinks = Array.from(document.querySelectorAll('a'));
                const linkInfo = allLinks.map(link => ({
                    href: link.getAttribute('href'),
                    text: link.textContent.trim(),
                    className: link.className,
                    id: link.id
                })).filter(link => link.href && link.text.length > 0);

                return {
                    title: document.title,
                    url: window.location.href,
                    allLinks: linkInfo,
                    bodyText: document.body.innerText.substring(0, 1000)
                };
            });

            this.log(`Page title: ${pageInfo.title}`);
            this.log(`Page URL: ${pageInfo.url}`);
            this.log(`Found ${pageInfo.allLinks.length} total links`);

            // Now try to find topic links with multiple strategies
            const topics = await this.page.evaluate(() => {
                const topicsList = [];
                
                // Strategy 1: Look for links with "topics" in href
                const topicLinks = document.querySelectorAll('a[href*="topics"]');
                topicLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    if (href && text && text.length > 2 && !href.includes('#')) {
                        topicsList.push({
                            title: text,
                            url: href.startsWith('http') ? href : `https://hydrogenstudies.com${href}`,
                            strategy: 'href-topics'
                        });
                    }
                });

                // Strategy 2: Look for links in content areas
                const contentAreas = document.querySelectorAll('main, .content, .post-content, article, .topics-list');
                contentAreas.forEach(area => {
                    const links = area.querySelectorAll('a');
                    links.forEach(link => {
                        const href = link.getAttribute('href');
                        const text = link.textContent.trim();
                        if (href && text && text.length > 2 && !href.includes('#') && !href.includes('mailto:')) {
                            topicsList.push({
                                title: text,
                                url: href.startsWith('http') ? href : `https://hydrogenstudies.com${href}`,
                                strategy: 'content-area'
                            });
                        }
                    });
                });

                // Strategy 3: Look for any links that might be topics
                const allLinks = document.querySelectorAll('a');
                allLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const text = link.textContent.trim();
                    
                    // Filter for potential topic links
                    if (href && text && text.length > 2 && text.length < 100 && 
                        !href.includes('#') && !href.includes('mailto:') && 
                        !href.includes('javascript:') && !text.includes('Home') &&
                        !text.includes('About') && !text.includes('Contact') &&
                        !text.includes('Privacy') && !text.includes('Terms')) {
                        
                        topicsList.push({
                            title: text,
                            url: href.startsWith('http') ? href : `https://hydrogenstudies.com${href}`,
                            strategy: 'general'
                        });
                    }
                });

                return topicsList;
            });

            // Remove duplicates
            const uniqueTopics = [];
            const seenUrls = new Set();
            
            topics.forEach(topic => {
                if (!seenUrls.has(topic.url)) {
                    seenUrls.add(topic.url);
                    uniqueTopics.push(topic);
                }
            });

            this.log(`Found ${uniqueTopics.length} unique topics`);
            
            // Log first few topics for debugging
            uniqueTopics.slice(0, 5).forEach(topic => {
                this.log(`  - ${topic.title} (${topic.strategy}): ${topic.url}`);
            });

            return uniqueTopics;
        } catch (error) {
            this.log(`Failed to extract topics list: ${error.message}`, 'error');
            throw error;
        }
    }

    async extractTopicContent(topicUrl, topicTitle) {
        try {
            this.log(`Extracting content from: ${topicTitle}`);
            
            await this.page.goto(topicUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.delay(3000);

            const pageContent = await this.page.evaluate(() => {
                // Remove UI elements
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

                // Get main content
                const mainContent = document.querySelector('main') || 
                                  document.querySelector('.content') || 
                                  document.querySelector('.post-content') ||
                                  document.querySelector('article') ||
                                  document.querySelector('.entry-content') ||
                                  document.body;

                if (!mainContent) return { content: '', studies: '' };

                const allText = mainContent.innerText || mainContent.textContent || '';
                
                // Split content and studies
                let content = allText;
                let studies = '';

                const studiesKeywords = ['Studies', 'Research', 'Clinical Trials', 'Scientific Studies', 'References'];
                const lines = allText.split('\n');
                let studiesStartIndex = -1;

                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (studiesKeywords.some(keyword => line.toLowerCase().includes(keyword.toLowerCase()))) {
                        studiesStartIndex = i;
                        break;
                    }
                }

                if (studiesStartIndex !== -1) {
                    content = lines.slice(0, studiesStartIndex).join('\n').trim();
                    studies = lines.slice(studiesStartIndex).join('\n').trim();
                }

                // Clean up
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

    async extractAllTopics() {
        try {
            this.isRunning = true;
            this.log('Starting robust topic content extraction...');

            const topics = await this.extractTopicsList();
            
            if (topics.length === 0) {
                throw new Error('No topics found');
            }

            this.log(`Found ${topics.length} topics. Starting individual page extraction...`);

            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                
                if (this.onProgress) {
                    this.onProgress(i + 1, topics.length, topic.title);
                }

                const topicData = await this.extractTopicContent(topic.url, topic.title);
                this.extractedData.push(topicData);

                this.log(`Extracted ${i + 1}/${topics.length}: ${topic.title}`);
                
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

    saveToCSV(data, filename) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const csvFilename = filename || `robust_topic_content_${timestamp}.csv`;
            
            let csvContent = 'Topic,Content,Studies\n';
            
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

    async close() {
        if (this.browser) {
            await this.browser.close();
            this.log('Browser closed');
        }
    }
}

async function main() {
    const extractor = new RobustTopicExtractor();
    
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

if (require.main === module) {
    main();
}

module.exports = RobustTopicExtractor; 