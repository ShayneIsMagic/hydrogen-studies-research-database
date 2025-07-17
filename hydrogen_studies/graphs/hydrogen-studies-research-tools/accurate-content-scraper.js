const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class AccurateContentScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delay = 2000;
        this.userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        this.results = [];
        this.failedTopics = [];
        this.processedCount = 0;
        this.totalTopics = 0;
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    async fetchWithRetry(url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const userAgent = this.getRandomUserAgent();
                console.log(`Attempt ${attempt}: Fetching ${url}`);
                
                const response = await this.makeRequest(url, userAgent);
                
                if (response.statusCode === 200) {
                    return response.data;
                } else if (response.statusCode === 403) {
                    console.log(`Cloudflare protection detected. Waiting...`);
                    await this.sleep(5000);
                } else {
                    console.log(`HTTP ${response.statusCode} for ${url}`);
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    await this.sleep(3000 * attempt);
                }
            }
        }
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
    }

    makeRequest(url, userAgent) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            const options = {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'max-age=0',
                    'DNT': '1'
                },
                timeout: 30000
            };

            const req = client.get(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    extractAccurateContent(html, topicName) {
        try {
            // First, let's save the raw HTML for debugging
            const debugFile = `debug_${topicName.toLowerCase().replace(/\s+/g, '_')}.html`;
            fs.writeFileSync(debugFile, html);
            console.log(`📄 Saved debug HTML to: ${debugFile}`);

            // Extract the main content with multiple strategies
            let mainContent = '';
            let title = topicName;
            
            // Strategy 1: Look for the main content area
            const contentSelectors = [
                /<main[^>]*>([\s\S]*?)<\/main>/i,
                /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<article[^>]*>([\s\S]*?)<\/article>/i,
                /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*entry[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*page[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            ];

            for (const selector of contentSelectors) {
                const match = html.match(selector);
                if (match && match[1].length > 200) {
                    mainContent = match[1];
                    console.log(`✓ Found content with selector: ${selector}`);
                    break;
                }
            }

            // Strategy 2: If no main content found, use body
            if (!mainContent || mainContent.length < 200) {
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    mainContent = bodyMatch[1];
                    console.log(`✓ Using body content as fallback`);
                }
            }

            // Extract title
            const titleMatch = mainContent.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                             mainContent.match(/<h2[^>]*>([^<]+)<\/h2>/i) ||
                             html.match(/<title[^>]*>([^<]+)<\/title>/i);
            
            if (titleMatch) {
                title = titleMatch[1].trim();
                console.log(`✓ Found title: ${title}`);
            }

            // Extract the main description content
            let description = '';
            
            // Look for paragraphs that contain the main description
            const paragraphs = mainContent.match(/<p[^>]*>([^<]+)<\/p>/gi);
            if (paragraphs) {
                description = paragraphs.map(p => {
                    return p.replace(/<[^>]+>/g, '').trim();
                }).filter(p => p.length > 20).join('\n\n');
                console.log(`✓ Found ${paragraphs.length} paragraphs`);
            }

            // If no paragraphs found, try to extract text content
            if (!description) {
                description = mainContent
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                console.log(`✓ Extracted text content: ${description.length} characters`);
            }

            // Extract studies section
            const studiesSection = this.extractStudiesSection(mainContent);
            
            // Extract any lists or bullet points
            const lists = this.extractLists(mainContent);

            // Extract any headings for structure
            const headings = this.extractHeadings(mainContent);

            return {
                topic: topicName,
                title: title,
                url: `${this.baseUrl}/tertiary-topic/${topicName.toLowerCase().replace(/\s+/g, '-')}/`,
                description: description,
                studies: studiesSection,
                lists: lists,
                headings: headings,
                rawHtml: mainContent.substring(0, 2000),
                extractedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Error extracting content for ${topicName}:`, error.message);
            return {
                topic: topicName,
                title: topicName,
                url: `${this.baseUrl}/tertiary-topic/${topicName.toLowerCase().replace(/\s+/g, '-')}/`,
                description: 'Error extracting content',
                studies: [],
                lists: [],
                headings: [],
                rawHtml: '',
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    extractStudiesSection(content) {
        const studies = [];
        
        // Look for study entries
        const studyMatches = content.match(/<div[^>]*class="[^"]*study[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
        if (studyMatches) {
            studyMatches.forEach(match => {
                const studyTitle = match.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
                const studyYear = match.match(/(\d{4})/);
                const studyBody = match.match(/<p[^>]*>([^<]+)<\/p>/i);
                
                if (studyTitle) {
                    studies.push({
                        title: studyTitle[1].trim(),
                        year: studyYear ? studyYear[1] : '',
                        body: studyBody ? studyBody[1].trim() : ''
                    });
                }
            });
        }

        // If no structured studies found, look for text patterns
        if (studies.length === 0) {
            const textContent = content.replace(/<[^>]+>/g, ' ');
            const studyPatterns = [
                /([^.]*(?:study|research|trial|investigation)[^.]*\.)/gi,
                /([^.]*(?:efficacy|effect|treatment)[^.]*\.)/gi
            ];

            studyPatterns.forEach(pattern => {
                const matches = textContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 30 && match.length < 500) {
                            studies.push({
                                title: match.trim(),
                                year: '',
                                body: ''
                            });
                        }
                    });
                }
            });
        }

        return studies;
    }

    extractLists(content) {
        const lists = [];
        
        // Extract unordered lists
        const ulMatches = content.match(/<ul[^>]*>([\s\S]*?)<\/ul>/gi);
        if (ulMatches) {
            ulMatches.forEach(ul => {
                const items = ul.match(/<li[^>]*>([^<]+)<\/li>/gi);
                if (items) {
                    const listItems = items.map(item => {
                        return item.replace(/<[^>]+>/g, '').trim();
                    }).filter(item => item.length > 0);
                    
                    if (listItems.length > 0) {
                        lists.push({
                            type: 'unordered',
                            items: listItems
                        });
                    }
                }
            });
        }

        // Extract ordered lists
        const olMatches = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/gi);
        if (olMatches) {
            olMatches.forEach(ol => {
                const items = ol.match(/<li[^>]*>([^<]+)<\/li>/gi);
                if (items) {
                    const listItems = items.map(item => {
                        return item.replace(/<[^>]+>/g, '').trim();
                    }).filter(item => item.length > 0);
                    
                    if (listItems.length > 0) {
                        lists.push({
                            type: 'ordered',
                            items: listItems
                        });
                    }
                }
            });
        }

        return lists;
    }

    extractHeadings(content) {
        const headings = [];
        
        // Extract all headings
        const headingMatches = content.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/gi);
        if (headingMatches) {
            headingMatches.forEach(match => {
                const level = match.match(/<h([1-6])/i)[1];
                const text = match.replace(/<[^>]+>/g, '').trim();
                if (text.length > 0) {
                    headings.push({
                        level: parseInt(level),
                        text: text
                    });
                }
            });
        }

        return headings;
    }

    async processTopic(topicName) {
        try {
            const url = `${this.baseUrl}/tertiary-topic/${topicName.toLowerCase().replace(/\s+/g, '-')}/`;
            console.log(`\n[${++this.processedCount}/${this.totalTopics}] Processing: ${topicName}`);
            console.log(`URL: ${url}`);
            
            const html = await this.fetchWithRetry(url);
            const contentData = this.extractAccurateContent(html, topicName);
            
            this.results.push(contentData);
            
            console.log(`✓ Extracted: "${contentData.title}"`);
            console.log(`  Description length: ${contentData.description.length} characters`);
            console.log(`  Studies found: ${contentData.studies.length}`);
            console.log(`  Lists found: ${contentData.lists.length}`);
            console.log(`  Headings found: ${contentData.headings.length}`);
            
            // Save progress every 3 topics
            if (this.processedCount % 3 === 0) {
                this.saveProgress();
            }
            
            return contentData;
            
        } catch (error) {
            console.error(`✗ Failed to process ${topicName}:`, error.message);
            this.failedTopics.push({
                topic: topicName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return {
                topic: topicName,
                title: topicName,
                url: `${this.baseUrl}/tertiary-topic/${topicName.toLowerCase().replace(/\s+/g, '-')}/`,
                description: 'Failed to fetch content',
                studies: [],
                lists: [],
                headings: [],
                rawHtml: '',
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    saveProgress() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results as JSON
        const jsonFile = `accurate_content_data_${timestamp}.json`;
        fs.writeFileSync(jsonFile, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Progress saved to: ${jsonFile}`);
        
        // Save as CSV for easy viewing
        this.createCSV();
        
        // Save failed topics
        if (this.failedTopics.length > 0) {
            const failedFile = `accurate_failed_topics_${timestamp}.json`;
            fs.writeFileSync(failedFile, JSON.stringify(this.failedTopics, null, 2));
            console.log(`⚠️  Failed topics saved to: ${failedFile}`);
        }
    }

    createCSV() {
        const csvHeader = 'Topic,Title,URL,Description,Studies Count,Lists Count,Headings Count,Status,Error\n';
        const csvRows = this.results.map(result => {
            const status = result.error ? 'Failed' : 'Success';
            const error = result.error || '';
            const description = result.description.replace(/"/g, '""'); // Escape quotes
            return `"${result.topic}","${result.title}","${result.url}","${description}",${result.studies.length},${result.lists.length},${result.headings.length},"${status}","${error}"`;
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFile = `accurate_content_summary_${timestamp}.csv`;
        fs.writeFileSync(csvFile, csvHeader + csvRows.join('\n'));
        console.log(`📊 CSV summary saved to: ${csvFile}`);
    }

    async run() {
        try {
            // Start with just a few topics to test
            const testTopics = ['Acne', 'Depression', 'Diabetes Type 2', 'Cancer', 'Heart Disease'];
            
            this.totalTopics = testTopics.length;
            console.log(`🚀 Starting accurate content extraction for ${this.totalTopics} test topics...`);
            console.log(`📝 Testing with: ${testTopics.join(', ')}`);
            
            // Process test topics
            for (let i = 0; i < testTopics.length; i++) {
                await this.processTopic(testTopics[i]);
                
                if (i < testTopics.length - 1) {
                    console.log(`⏳ Waiting ${this.delay/1000}s before next request...`);
                    await this.sleep(this.delay);
                }
            }
            
            // Final save
            this.saveProgress();
            
            console.log(`\n🎉 Test extraction complete!`);
            console.log(`✅ Successfully processed: ${this.results.filter(r => !r.error).length} topics`);
            console.log(`❌ Failed: ${this.failedTopics.length} topics`);
            console.log(`📊 Total content extracted: ${this.results.reduce((sum, r) => sum + r.description.length, 0)} characters`);
            
            // Show sample of extracted content
            const successfulResults = this.results.filter(r => !r.error && r.description.length > 0);
            if (successfulResults.length > 0) {
                console.log(`\n📄 Sample extracted content:`);
                const sample = successfulResults[0];
                console.log(`Topic: ${sample.topic}`);
                console.log(`Description: ${sample.description.substring(0, 200)}...`);
            }
            
        } catch (error) {
            console.error('Fatal error:', error);
            this.saveProgress();
        }
    }
}

// Run the accurate content scraper
const scraper = new AccurateContentScraper();
scraper.run().catch(console.error); 