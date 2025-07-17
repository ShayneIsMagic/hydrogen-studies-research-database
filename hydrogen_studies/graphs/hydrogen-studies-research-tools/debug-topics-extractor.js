/**
 * Debug Topics Extractor for Hydrogen Studies
 * This version saves the raw HTML and analyzes the page structure
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DebugTopicsExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 1000;
        this.maxRetries = 3;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async fetchWithRetry(url, retries = this.maxRetries) {
        for (let i = 0; i < retries; i++) {
            try {
                this.log(`Attempting to fetch: ${url} (attempt ${i + 1}/${retries})`);
                
                const data = await this.fetchUrl(url);
                return data;

            } catch (error) {
                this.log(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
                
                if (i === retries - 1) {
                    throw error;
                }
                
                await this.delay(this.delayMs * (i + 1));
            }
        }
    }

    fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    analyzeHtmlStructure(html) {
        this.log('Analyzing HTML structure...');
        
        // Save raw HTML for inspection
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const htmlFilename = `debug-topics-page-${timestamp}.html`;
        const htmlPath = path.join(__dirname, htmlFilename);
        fs.writeFileSync(htmlPath, html, 'utf8');
        this.log(`Raw HTML saved to: ${htmlFilename}`);
        
        // Basic analysis
        this.log(`Total HTML length: ${html.length} characters`);
        
        // Check for common patterns
        const patterns = {
            headings: (html.match(/<h[1-6][^>]*>/gi) || []).length,
            links: (html.match(/<a[^>]*>/gi) || []).length,
            divs: (html.match(/<div[^>]*>/gi) || []).length,
            sections: (html.match(/<section[^>]*>/gi) || []).length,
            articles: (html.match(/<article[^>]*>/gi) || []).length,
            lists: (html.match(/<ul[^>]*>|<ol[^>]*>/gi) || []).length,
            studyMentions: (html.match(/study|research|article/gi) || []).length,
            topicMentions: (html.match(/topic|category|section/gi) || []).length
        };
        
        this.log('HTML Structure Analysis:');
        Object.entries(patterns).forEach(([key, count]) => {
            this.log(`  ${key}: ${count}`);
        });
        
        // Look for specific content
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            this.log(`Page title: ${titleMatch[1].trim()}`);
        }
        
        // Check for JavaScript content
        const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptTags) {
            this.log(`Found ${scriptTags.length} script tags`);
        }
        
        // Check for dynamic content indicators
        const dynamicIndicators = [
            'loading',
            'spinner',
            'ajax',
            'fetch',
            'api',
            'json',
            'react',
            'vue',
            'angular'
        ];
        
        dynamicIndicators.forEach(indicator => {
            const count = (html.match(new RegExp(indicator, 'gi')) || []).length;
            if (count > 0) {
                this.log(`  Found ${count} instances of "${indicator}"`);
            }
        });
        
        // Extract first 1000 characters for preview
        const preview = html.substring(0, 1000);
        this.log('\nFirst 1000 characters preview:');
        console.log('='.repeat(50));
        console.log(preview);
        console.log('='.repeat(50));
        
        return patterns;
    }

    async startDebug() {
        try {
            this.log('Starting debug analysis...');
            
            // Fetch the topics page
            const html = await this.fetchWithRetry(this.topicsUrl);
            this.log('Successfully fetched topics page');
            
            // Analyze the HTML structure
            const analysis = this.analyzeHtmlStructure(html);
            
            this.log('\nDebug analysis complete!');
            this.log('Check the generated HTML file to see the actual page content.');
            
            return {
                success: true,
                htmlLength: html.length,
                analysis: analysis
            };
            
        } catch (error) {
            this.log(`Debug failed: ${error.message}`, 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in other modules
module.exports = DebugTopicsExtractor;

// If run directly, execute the debug
if (require.main === module) {
    const debugExtractor = new DebugTopicsExtractor();
    
    debugExtractor.startDebug()
        .then(result => {
            if (result.success) {
                console.log('\n✅ Debug analysis completed successfully!');
                console.log(`📊 HTML length: ${result.htmlLength} characters`);
                console.log('📁 Check the generated HTML file for detailed analysis.');
            } else {
                console.error('\n❌ Debug failed:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n❌ Unexpected error:', error.message);
            process.exit(1);
        });
} 