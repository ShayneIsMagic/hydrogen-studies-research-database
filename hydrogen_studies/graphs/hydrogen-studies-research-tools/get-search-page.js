/**
 * Fetch and save the search page for analysis
 */

const https = require('https');
const fs = require('fs');

async function fetchSearchPage() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'hydrogenstudies.com',
            port: 443,
            path: '/search/',
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
                console.log(`Content length: ${data.length} characters`);
                
                // Save to file
                fs.writeFileSync('search-page.html', data);
                console.log('Saved to search-page.html');
                
                // Look for study links
                const studyLinks = extractStudyLinks(data);
                console.log(`Found ${studyLinks.length} potential study links:`);
                studyLinks.forEach((link, index) => {
                    console.log(`${index + 1}. ${link}`);
                });
                
                resolve(data);
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

function extractStudyLinks(html) {
    const links = [];
    
    // Look for various link patterns
    const patterns = [
        /href="([^"]*\/study\/[^"]*)"/gi,
        /href="([^"]*\/search\/[^"]*)"/gi,
        /href="([^"]*\/research\/[^"]*)"/gi,
        /href="([^"]*\/publication\/[^"]*)"/gi,
        /href="([^"]*\/article\/[^"]*)"/gi,
        /href="([^"]*\/paper\/[^"]*)"/gi,
        /href="([^"]*\/hydrogen[^"]*)"/gi,
        /href="([^"]*\/water[^"]*)"/gi
    ];
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
            const href = match[1];
            if (href && !links.includes(href) && !href.includes('wp-content')) {
                links.push(href);
            }
        }
    }
    
    return links;
}

fetchSearchPage().catch(console.error); 