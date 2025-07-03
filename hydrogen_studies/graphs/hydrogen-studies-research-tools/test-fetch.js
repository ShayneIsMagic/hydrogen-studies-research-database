/**
 * Test script to examine the Hydrogen Studies website structure
 */

const https = require('https');

async function testFetch(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`Status: ${res.statusCode}`);
            console.log(`Headers:`, res.headers);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\nContent length: ${data.length} characters`);
                console.log(`\nFirst 1000 characters:`);
                console.log(data.substring(0, 1000));
                resolve(data);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function main() {
    const urls = [
        'https://hydrogenstudies.com/',
        'https://hydrogenstudies.com/studies',
        'https://hydrogenstudies.com/research',
        'https://hydrogenstudies.com/database'
    ];
    
    for (const url of urls) {
        console.log(`\n=== Testing ${url} ===`);
        try {
            await testFetch(url);
        } catch (error) {
            console.error(`Error fetching ${url}:`, error.message);
        }
        console.log('\n' + '='.repeat(50));
    }
}

main(); 