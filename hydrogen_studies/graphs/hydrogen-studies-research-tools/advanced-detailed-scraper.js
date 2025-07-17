const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class AdvancedDetailedScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delay = 3000; // 3 second delay between requests
        this.userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
        
        // Free proxy list (you can add more)
        this.proxies = [
            // Add proxy servers here if needed
            // { host: 'proxy1.com', port: 8080 },
            // { host: 'proxy2.com', port: 3128 }
        ];
        
        this.currentUserAgentIndex = 0;
        this.currentProxyIndex = 0;
        this.results = [];
        this.failedTopics = [];
        this.processedCount = 0;
        this.totalTopics = 0;
        this.sessionCookies = {};
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    rotateUserAgent() {
        this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
        return this.userAgents[this.currentUserAgentIndex];
    }

    getProxy() {
        if (this.proxies.length === 0) return null;
        this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxies.length;
        return this.proxies[this.currentProxyIndex];
    }

    async fetchWithRetry(url, maxRetries = 5) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const userAgent = this.getRandomUserAgent();
                const proxy = this.getProxy();
                
                console.log(`Attempt ${attempt}: Fetching ${url}`);
                console.log(`UA: ${userAgent.substring(0, 50)}...`);
                if (proxy) console.log(`Proxy: ${proxy.host}:${proxy.port}`);
                
                const response = await this.makeRequest(url, userAgent, proxy);
                
                if (response.statusCode === 200) {
                    // Check if it's a Cloudflare challenge page
                    if (response.data.includes('challenge-form') || response.data.includes('cf-browser-verification')) {
                        console.log(`Cloudflare challenge detected, retrying...`);
                        await this.sleep(10000); // Wait 10 seconds
                        continue;
                    }
                    
                    return response.data;
                } else if (response.statusCode === 403) {
                    console.log(`HTTP 403 - Cloudflare protection. Rotating user agent...`);
                    this.rotateUserAgent();
                    await this.sleep(8000); // Wait longer for Cloudflare
                } else if (response.statusCode === 429) {
                    console.log(`HTTP 429 - Rate limited. Waiting longer...`);
                    await this.sleep(15000); // Wait 15 seconds
                } else {
                    console.log(`HTTP ${response.statusCode} for ${url}`);
                    if (attempt < maxRetries) {
                        await this.sleep(5000);
                    }
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    await this.sleep(5000 * attempt); // Exponential backoff
                }
            }
        }
        throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
    }

    makeRequest(url, userAgent, proxy = null) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https') ? https : http;
            
            const options = {
                headers: {
                    'User-Agent': userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'DNT': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1'
                },
                timeout: 45000,
                followRedirect: true
            };

            if (proxy) {
                options.host = proxy.host;
                options.port = proxy.port;
                options.path = url;
            }

            const req = client.get(url, options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    // Store cookies for session management
                    if (res.headers['set-cookie']) {
                        this.sessionCookies[url] = res.headers['set-cookie'];
                    }
                    
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

    extractDetailedStudyData(html, topicName) {
        try {
            // Extract main content with multiple strategies
            let mainContent = '';
            
            // Strategy 1: Look for main content areas
            const contentSelectors = [
                /<main[^>]*>([\s\S]*?)<\/main>/i,
                /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<article[^>]*>([\s\S]*?)<\/article>/i,
                /<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
                /<div[^>]*class="[^"]*entry[^"]*"[^>]*>([\s\S]*?)<\/div>/i
            ];

            for (const selector of contentSelectors) {
                const match = html.match(selector);
                if (match && match[1].length > 500) {
                    mainContent = match[1];
                    break;
                }
            }

            // Strategy 2: If no main content found, use body
            if (!mainContent || mainContent.length < 500) {
                const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                if (bodyMatch) {
                    mainContent = bodyMatch[1];
                }
            }

            // Clean HTML tags and normalize
            mainContent = mainContent
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
                .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
                .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
                .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .trim();

            // Extract study information with enhanced patterns
            const studies = this.extractStudies(mainContent);
            const authors = this.extractAuthors(mainContent);
            const years = this.extractYears(mainContent);
            const dois = this.extractDOIs(mainContent);
            const findings = this.extractFindings(mainContent);
            const keywords = this.extractKeywords(mainContent);
            const references = this.extractReferences(mainContent);

            return {
                topic: topicName,
                url: `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`,
                mainContent: mainContent.substring(0, 3000), // Increased limit
                studies: studies.slice(0, 15), // More studies
                authors: authors.slice(0, 10), // More authors
                years: years.slice(0, 10), // More years
                dois: dois.slice(0, 10), // More DOIs
                findings: findings.slice(0, 15), // More findings
                keywords: keywords.slice(0, 20), // Keywords
                references: references.slice(0, 10), // References
                wordCount: mainContent.split(/\s+/).length,
                extractedAt: new Date().toISOString(),
                contentQuality: this.assessContentQuality(mainContent)
            };

        } catch (error) {
            console.error(`Error extracting data for ${topicName}:`, error.message);
            return {
                topic: topicName,
                url: `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`,
                mainContent: 'Error extracting content',
                studies: [],
                authors: [],
                years: [],
                dois: [],
                findings: [],
                keywords: [],
                references: [],
                wordCount: 0,
                extractedAt: new Date().toISOString(),
                error: error.message,
                contentQuality: 'error'
            };
        }
    }

    extractStudies(content) {
        const studies = [];
        const patterns = [
            /(?:study|research|trial|investigation|experiment)[^.]*(?:hydrogen|H2|molecular hydrogen)[^.]*\./gi,
            /(?:hydrogen|H2|molecular hydrogen)[^.]*(?:study|research|trial|investigation|experiment)[^.]*\./gi,
            /(?:published|reported|found|showed|demonstrated)[^.]*(?:hydrogen|H2)[^.]*\./gi,
            /(?:clinical|randomized|controlled|double-blind)[^.]*(?:trial|study)[^.]*\./gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match.length > 25 && match.length < 600) {
                        studies.push(match.trim());
                    }
                });
            }
        });

        return [...new Set(studies)]; // Remove duplicates
    }

    extractAuthors(content) {
        const authors = [];
        const patterns = [
            /([A-Z][a-z]+ [A-Z][a-z]+(?: et al\.?| and colleagues?| and coworkers?| et al\.?))/gi,
            /(?:by|authors?|researchers?|investigators?)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+(?:, [A-Z][a-z]+ [A-Z][a-z]+)*)/gi,
            /([A-Z][a-z]+ [A-Z][a-z]+(?:, [A-Z][a-z]+ [A-Z][a-z]+)*)(?: et al\.?| and colleagues?)/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    const authorMatch = match.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:, [A-Z][a-z]+ [A-Z][a-z]+)*)/);
                    if (authorMatch && authorMatch[1].length > 5 && !authorMatch[1].includes('Hydrogen')) {
                        authors.push(authorMatch[1].trim());
                    }
                });
            }
        });

        return [...new Set(authors)];
    }

    extractYears(content) {
        const yearMatches = content.match(/\b(19|20)\d{2}\b/g);
        return yearMatches ? [...new Set(yearMatches)].sort((a, b) => b - a) : [];
    }

    extractDOIs(content) {
        const doiMatches = content.match(/10\.\d{4,}\/[-._;()\/:A-Z0-9]+/gi);
        return doiMatches ? [...new Set(doiMatches)] : [];
    }

    extractFindings(content) {
        const findings = [];
        const patterns = [
            /(?:found|showed|demonstrated|revealed|indicated|concluded)[^.]*\./gi,
            /(?:results|findings|conclusion|outcome)[^.]*\./gi,
            /(?:benefit|effect|improvement|reduction|increase|decrease)[^.]*\./gi,
            /(?:significant|statistical|clinical)[^.]*(?:improvement|reduction|effect)[^.]*\./gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match.length > 40 && match.length < 400) {
                        findings.push(match.trim());
                    }
                });
            }
        });

        return [...new Set(findings)];
    }

    extractKeywords(content) {
        const keywords = [];
        const patterns = [
            /(?:hydrogen|H2|molecular hydrogen|hydrogen water|hydrogen gas)/gi,
            /(?:antioxidant|anti-inflammatory|oxidative stress|free radicals)/gi,
            /(?:clinical|therapeutic|treatment|therapy)/gi,
            /(?:study|research|trial|investigation)/gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (!keywords.includes(match.toLowerCase())) {
                        keywords.push(match.toLowerCase());
                    }
                });
            }
        });

        return keywords;
    }

    extractReferences(content) {
        const references = [];
        const patterns = [
            /(?:reference|ref\.?|cited|source)[^.]*\./gi,
            /(?:journal|publication|paper)[^.]*\./gi,
            /(?:doi|digital object identifier)[^.]*\./gi
        ];

        patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    if (match.length > 30 && match.length < 300) {
                        references.push(match.trim());
                    }
                });
            }
        });

        return [...new Set(references)];
    }

    assessContentQuality(content) {
        const wordCount = content.split(/\s+/).length;
        const hasStudies = content.toLowerCase().includes('study') || content.toLowerCase().includes('research');
        const hasHydrogen = content.toLowerCase().includes('hydrogen');
        const hasNumbers = /\d+/.test(content);
        
        if (wordCount > 500 && hasStudies && hasHydrogen && hasNumbers) return 'high';
        if (wordCount > 200 && hasHydrogen) return 'medium';
        if (wordCount > 50) return 'low';
        return 'very_low';
    }

    async processTopic(topicName) {
        try {
            const url = `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`;
            console.log(`\n[${++this.processedCount}/${this.totalTopics}] Processing: ${topicName}`);
            
            const html = await this.fetchWithRetry(url);
            const studyData = this.extractDetailedStudyData(html, topicName);
            
            this.results.push(studyData);
            
            console.log(`✓ Extracted ${studyData.wordCount} words, ${studyData.studies.length} studies, ${studyData.authors.length} authors (Quality: ${studyData.contentQuality})`);
            
            // Save progress every 5 topics (more frequent saves)
            if (this.processedCount % 5 === 0) {
                this.saveProgress();
            }
            
            return studyData;
            
        } catch (error) {
            console.error(`✗ Failed to process ${topicName}:`, error.message);
            this.failedTopics.push({
                topic: topicName,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            
            return {
                topic: topicName,
                url: `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`,
                mainContent: 'Failed to fetch content',
                studies: [],
                authors: [],
                years: [],
                dois: [],
                findings: [],
                keywords: [],
                references: [],
                wordCount: 0,
                extractedAt: new Date().toISOString(),
                error: error.message,
                contentQuality: 'failed'
            };
        }
    }

    saveProgress() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results
        const detailedFile = `advanced_detailed_topics_${timestamp}.json`;
        fs.writeFileSync(detailedFile, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Progress saved to: ${detailedFile}`);
        
        // Save failed topics
        if (this.failedTopics.length > 0) {
            const failedFile = `advanced_failed_topics_${timestamp}.json`;
            fs.writeFileSync(failedFile, JSON.stringify(this.failedTopics, null, 2));
            console.log(`⚠️  Failed topics saved to: ${failedFile}`);
        }
        
        // Create CSV summary
        this.createCSVSummary();
    }

    createCSVSummary() {
        const csvHeader = 'Topic,URL,Word Count,Studies Found,Authors Found,Years Found,DOIs Found,Findings Found,Keywords Found,References Found,Content Quality,Status,Error\n';
        const csvRows = this.results.map(result => {
            const status = result.error ? 'Failed' : 'Success';
            const error = result.error || '';
            return `"${result.topic}","${result.url}",${result.wordCount},${result.studies.length},${result.authors.length},${result.years.length},${result.dois.length},${result.findings.length},${result.keywords.length},${result.references.length},"${result.contentQuality}","${status}","${error}"`;
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFile = `advanced_detailed_summary_${timestamp}.csv`;
        fs.writeFileSync(csvFile, csvHeader + csvRows.join('\n'));
        console.log(`📊 CSV summary saved to: ${csvFile}`);
    }

    async run() {
        try {
            // Read the existing topics from CSV
            const csvContent = fs.readFileSync('hydrogen_studies_by_topic.csv', 'utf8');
            const lines = csvContent.split('\n').slice(1); // Skip header
            const topics = lines.map(line => {
                const parts = line.split(',');
                return parts[0] ? parts[0].trim() : '';
            }).filter(topic => topic.length > 0);

            this.totalTopics = topics.length;
            console.log(`🚀 Starting advanced detailed extraction for ${this.totalTopics} topics...`);
            console.log(`⏱️  Estimated time: ${Math.round(this.totalTopics * this.delay / 1000 / 60)} minutes`);
            console.log(`🔄 Progress will be saved every 5 topics`);
            
            // Process topics with delay
            for (let i = 0; i < topics.length; i++) {
                await this.processTopic(topics[i]);
                
                if (i < topics.length - 1) {
                    console.log(`⏳ Waiting ${this.delay/1000}s before next request...`);
                    await this.sleep(this.delay);
                }
            }
            
            // Final save
            this.saveProgress();
            
            console.log(`\n🎉 Advanced extraction complete!`);
            console.log(`✅ Successfully processed: ${this.results.filter(r => !r.error).length} topics`);
            console.log(`❌ Failed: ${this.failedTopics.length} topics`);
            console.log(`📊 Total data extracted: ${this.results.reduce((sum, r) => sum + r.wordCount, 0)} words`);
            
            // Quality summary
            const qualityStats = {};
            this.results.forEach(r => {
                qualityStats[r.contentQuality] = (qualityStats[r.contentQuality] || 0) + 1;
            });
            console.log(`📈 Content quality distribution:`, qualityStats);
            
        } catch (error) {
            console.error('Fatal error:', error);
            this.saveProgress();
        }
    }
}

// Run the advanced scraper
const scraper = new AdvancedDetailedScraper();
scraper.run().catch(console.error); 