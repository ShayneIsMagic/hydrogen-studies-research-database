#!/usr/bin/env node
/**
 * Test script for Google Sheets Topics Scraper
 * Verifies the scraper works correctly with a small subset of topics
 */

const GoogleSheetsTopicsScraper = require('./google-sheets-topics-scraper.js');

async function testScraper() {
    console.log('🧪 Testing Google Sheets Topics Scraper...');
    console.log('==========================================');
    
    // Create scraper instance
    const scraper = new GoogleSheetsTopicsScraper();
    
    // Use a small subset of topics for testing
    scraper.topicsList = [
        "Acne",
        "Alzheimer's Disease", 
        "Cancer",
        "Diabetes (Type I)",
        "Heart Disease"
    ];
    
    // Set shorter delays for testing
    scraper.delayMs = 500;
    scraper.maxRetries = 2;
    
    // Set up logging
    scraper.onLog = (message, type) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    };
    
    // Set up progress tracking
    scraper.onProgress = (current, total, topic) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`📈 Progress: ${current}/${total} (${percentage}%) - ${topic}`);
    };
    
    try {
        console.log(`📋 Testing with ${scraper.topicsList.length} topics:`);
        scraper.topicsList.forEach((topic, index) => {
            console.log(`   ${index + 1}. ${topic}`);
        });
        console.log('');
        
        // Start the extraction
        await scraper.startExtraction();
        
        // Get final status
        const status = scraper.getStatus();
        
        console.log('');
        console.log('✅ Test completed!');
        console.log('📊 Test Results:');
        console.log(`   • Topics Tested: ${status.totalTopics}`);
        console.log(`   • Processed: ${status.processedTopics}`);
        console.log(`   • Data Extracted: ${status.extractedData.length}`);
        
        // Show results
        if (status.extractedData.length > 0) {
            console.log('');
            console.log('📋 Extracted Data:');
            status.extractedData.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.topic}`);
                if (item.study_info) console.log(`      Study Info: ${item.study_info.substring(0, 50)}...`);
                if (item.source) console.log(`      Source: ${item.source}`);
                console.log('');
            });
        }
        
        // Test passed if we got some data
        if (status.extractedData.length > 0) {
            console.log('🎉 Test PASSED - Scraper is working correctly!');
            return true;
        } else {
            console.log('❌ Test FAILED - No data extracted');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Test FAILED with error:', error.message);
        return false;
    }
}

// Run the test
if (require.main === module) {
    testScraper()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test error:', error);
            process.exit(1);
        });
}

module.exports = { testScraper }; 