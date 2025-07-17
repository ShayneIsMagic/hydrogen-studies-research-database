const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DetailedTopicsScraper {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delay = 2000; // 2 second delay between requests
        this.userAgents = [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];
        this.currentUserAgentIndex = 0;
        this.results = [];
        this.failedTopics = [];
        this.processedCount = 0;
        this.totalTopics = 0;
    }

    getRandomUserAgent() {
        return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
    }

    rotateUserAgent() {
        this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
        return this.userAgents[this.currentUserAgentIndex];
    }

    async fetchWithRetry(url, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const userAgent = this.getRandomUserAgent();
                console.log(`Attempt ${attempt}: Fetching ${url} with UA: ${userAgent.substring(0, 50)}...`);
                
                const response = await this.makeRequest(url, userAgent);
                
                if (response.statusCode === 200) {
                    return response.data;
                } else if (response.statusCode === 403) {
                    console.log(`Cloudflare protection detected. Rotating user agent...`);
                    this.rotateUserAgent();
                    await this.sleep(5000); // Wait longer for Cloudflare
                } else {
                    console.log(`HTTP ${response.statusCode} for ${url}`);
                }
            } catch (error) {
                console.log(`Attempt ${attempt} failed: ${error.message}`);
                if (attempt < maxRetries) {
                    await this.sleep(3000 * attempt); // Exponential backoff
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

    extractStudyData(html, topicName) {
        try {
            // Extract main content
            const contentMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || 
                               html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                               html.match(/<div[^>]*class="[^"]*main[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
            
            let mainContent = contentMatch ? contentMatch[1] : html;
            
            // Clean HTML tags
            mainContent = mainContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                                   .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                                   .replace(/<[^>]+>/g, ' ')
                                   .replace(/\s+/g, ' ')
                                   .trim();

            // Extract study information
            const studies = [];
            
            // Look for study patterns
            const studyPatterns = [
                /(?:study|research|trial|investigation)[^.]*(?:hydrogen|H2)[^.]*\./gi,
                /(?:hydrogen|H2)[^.]*(?:study|research|trial|investigation)[^.]*\./gi,
                /(?:published|reported|found|showed)[^.]*(?:hydrogen|H2)[^.]*\./gi
            ];

            studyPatterns.forEach(pattern => {
                const matches = mainContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 20 && match.length < 500) {
                            studies.push(match.trim());
                        }
                    });
                }
            });

            // Extract potential authors (look for patterns like "et al.", "and colleagues", etc.)
            const authorPatterns = [
                /([A-Z][a-z]+ [A-Z][a-z]+(?: et al\.?| and colleagues?| and coworkers?))/gi,
                /(?:by|authors?|researchers?)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+(?:, [A-Z][a-z]+ [A-Z][a-z]+)*)/gi
            ];

            const authors = [];
            authorPatterns.forEach(pattern => {
                const matches = mainContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        const authorMatch = match.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:, [A-Z][a-z]+ [A-Z][a-z]+)*)/);
                        if (authorMatch && authorMatch[1].length > 5) {
                            authors.push(authorMatch[1].trim());
                        }
                    });
                }
            });

            // Extract years
            const yearMatches = mainContent.match(/\b(19|20)\d{2}\b/g);
            const years = yearMatches ? [...new Set(yearMatches)] : [];

            // Extract potential DOIs
            const doiMatches = mainContent.match(/10\.\d{4,}\/[-._;()\/:A-Z0-9]+/gi);
            const dois = doiMatches ? [...new Set(doiMatches)] : [];

            // Extract key findings
            const findingPatterns = [
                /(?:found|showed|demonstrated|revealed|indicated)[^.]*\./gi,
                /(?:results|findings|conclusion)[^.]*\./gi,
                /(?:benefit|effect|improvement|reduction)[^.]*\./gi
            ];

            const findings = [];
            findingPatterns.forEach(pattern => {
                const matches = mainContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        if (match.length > 30 && match.length < 300) {
                            findings.push(match.trim());
                        }
                    });
                }
            });

            return {
                topic: topicName,
                url: `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`,
                mainContent: mainContent.substring(0, 2000), // Limit content length
                studies: studies.slice(0, 10), // Limit to 10 studies
                authors: authors.slice(0, 5), // Limit to 5 authors
                years: years.slice(0, 5), // Limit to 5 years
                dois: dois.slice(0, 5), // Limit to 5 DOIs
                findings: findings.slice(0, 10), // Limit to 10 findings
                wordCount: mainContent.split(/\s+/).length,
                extractedAt: new Date().toISOString()
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
                wordCount: 0,
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    async processTopic(topicName) {
        try {
            const url = `${this.baseUrl}/study/${topicName.toLowerCase().replace(/\s+/g, '-')}`;
            console.log(`\n[${++this.processedCount}/${this.totalTopics}] Processing: ${topicName}`);
            
            const html = await this.fetchWithRetry(url);
            const studyData = this.extractStudyData(html, topicName);
            
            this.results.push(studyData);
            
            console.log(`✓ Extracted ${studyData.wordCount} words, ${studyData.studies.length} studies, ${studyData.authors.length} authors`);
            
            // Save progress every 10 topics
            if (this.processedCount % 10 === 0) {
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
                wordCount: 0,
                extractedAt: new Date().toISOString(),
                error: error.message
            };
        }
    }

    saveProgress() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save detailed results
        const detailedFile = `detailed_topics_data_${timestamp}.json`;
        fs.writeFileSync(detailedFile, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Progress saved to: ${detailedFile}`);
        
        // Save failed topics
        if (this.failedTopics.length > 0) {
            const failedFile = `failed_topics_${timestamp}.json`;
            fs.writeFileSync(failedFile, JSON.stringify(this.failedTopics, null, 2));
            console.log(`⚠️  Failed topics saved to: ${failedFile}`);
        }
        
        // Create CSV summary
        this.createCSVSummary();
    }

    createCSVSummary() {
        const csvHeader = 'Topic,URL,Word Count,Studies Found,Authors Found,Years Found,DOIs Found,Findings Found,Status,Error\n';
        const csvRows = this.results.map(result => {
            const status = result.error ? 'Failed' : 'Success';
            const error = result.error || '';
            return `"${result.topic}","${result.url}",${result.wordCount},${result.studies.length},${result.authors.length},${result.years.length},${result.dois.length},${result.findings.length},"${status}","${error}"`;
        });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const csvFile = `detailed_topics_summary_${timestamp}.csv`;
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
            console.log(`🚀 Starting detailed extraction for ${this.totalTopics} topics...`);
            console.log(`⏱️  Estimated time: ${Math.round(this.totalTopics * this.delay / 1000 / 60)} minutes`);
            
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
            
            console.log(`\n🎉 Extraction complete!`);
            console.log(`✅ Successfully processed: ${this.results.filter(r => !r.error).length} topics`);
            console.log(`❌ Failed: ${this.failedTopics.length} topics`);
            console.log(`📊 Total data extracted: ${this.results.reduce((sum, r) => sum + r.wordCount, 0)} words`);
            
        } catch (error) {
            console.error('Fatal error:', error);
            this.saveProgress();
        }
    }
}

// Run the scraper
const scraper = new DetailedTopicsScraper();
scraper.run().catch(console.error); 