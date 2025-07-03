/**
 * Hydrogen Studies Database Update Script
 * Updates the database with latest CSV files and handles duplicate detection
 */

// Import required classes (if running in Node.js environment)
if (typeof require !== 'undefined') {
    const fs = require('fs');
    const path = require('path');
}

class DatabaseUpdater {
    constructor() {
        this.csvFiles = [
            'Hydrogen Research Database - Primary.csv',
            'Hydrogen Research Database - Engineering.csv',
            'Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        this.processor = null;
        this.duplicateDetector = null;
    }

    /**
     * Initialize the database updater
     */
    async initialize() {
        console.log('Initializing Hydrogen Studies Database Updater...');
        
        // Initialize enhanced data processor
        if (typeof EnhancedHydrogenDataProcessor !== 'undefined') {
            this.processor = new EnhancedHydrogenDataProcessor();
        } else {
            console.error('EnhancedHydrogenDataProcessor not available');
            return false;
        }

        // Initialize duplicate detector
        if (typeof DuplicateDetector !== 'undefined') {
            this.duplicateDetector = new DuplicateDetector();
        } else {
            console.warn('DuplicateDetector not available - duplicate detection disabled');
        }

        return true;
    }

    /**
     * Update database with latest CSV files
     */
    async updateDatabase() {
        try {
            console.log('Starting database update...');
            
            if (!this.processor) {
                await this.initialize();
            }

            // Load all data from CSV files
            const result = await this.processor.loadAllData();
            
            if (result.success) {
                console.log('\n✅ Database update completed successfully!');
                console.log(`📊 Total studies in database: ${result.studiesCount}`);
                console.log(`📈 Statistics generated: ${Object.keys(result.statistics).length} categories`);
                
                // Display summary
                this.displayUpdateSummary(result);
                
                return result;
            } else {
                console.error('❌ Database update failed:', result.error);
                return result;
            }

        } catch (error) {
            console.error('❌ Error during database update:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Display update summary
     */
    displayUpdateSummary(result) {
        console.log('\n📋 UPDATE SUMMARY:');
        console.log('==================');
        
        if (result.processingResults) {
            Object.entries(result.processingResults).forEach(([source, data]) => {
                if (data.success) {
                    console.log(`✅ ${source.toUpperCase()}: ${data.count} studies`);
                    if (data.duplicates > 0) {
                        console.log(`   └─ ${data.duplicates} duplicates removed`);
                    }
                } else {
                    console.log(`❌ ${source.toUpperCase()}: Failed to load`);
                }
            });
        }

        if (result.statistics) {
            console.log('\n📊 DATABASE STATISTICS:');
            console.log('======================');
            console.log(`Total Studies: ${result.statistics.totalStudies}`);
            
            if (result.statistics.yearRange) {
                console.log(`Year Range: ${result.statistics.yearRange.earliest} - ${result.statistics.yearRange.latest}`);
            }
            
            console.log(`Unique Topics: ${result.statistics.topicsCount}`);
            console.log(`Unique Countries: ${result.statistics.countriesCount}`);
            console.log(`Unique Journals: ${result.statistics.journalsCount}`);
            console.log(`Unique Authors: ${result.statistics.authorsCount}`);
        }
    }

    /**
     * Export updated database to JSON
     */
    exportDatabase() {
        if (!this.processor) {
            console.error('Processor not initialized');
            return null;
        }

        try {
            const jsonData = this.processor.exportAsJSON();
            console.log('📤 Database exported to JSON format');
            return jsonData;
        } catch (error) {
            console.error('❌ Error exporting database:', error);
            return null;
        }
    }

    /**
     * Search studies in updated database
     */
    searchStudies(query, filters = {}) {
        if (!this.processor) {
            console.error('Processor not initialized');
            return [];
        }

        try {
            const results = this.processor.searchStudies(query, filters);
            console.log(`🔍 Search results for "${query}": ${results.length} studies found`);
            return results;
        } catch (error) {
            console.error('❌ Error searching studies:', error);
            return [];
        }
    }

    /**
     * Get database statistics
     */
    getStatistics() {
        if (!this.processor) {
            console.error('Processor not initialized');
            return null;
        }

        return this.processor.statistics;
    }

    /**
     * Get top topics from database
     */
    getTopTopics(limit = 10) {
        if (!this.processor) {
            console.error('Processor not initialized');
            return [];
        }

        return this.processor.getTopTopics(limit);
    }

    /**
     * Get top countries from database
     */
    getTopCountries(limit = 10) {
        if (!this.processor) {
            console.error('Processor not initialized');
            return [];
        }

        return this.processor.getTopCountries(limit);
    }

    /**
     * Get recent studies from database
     */
    getRecentStudies(limit = 10) {
        if (!this.processor) {
            console.error('Processor not initialized');
            return [];
        }

        return this.processor.getRecentStudies(limit);
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.DatabaseUpdater = DatabaseUpdater;
    
    // Auto-initialize when script is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Hydrogen Studies Database Updater loaded');
        
        // Create global instance
        window.databaseUpdater = new DatabaseUpdater();
        
        // Add to window for easy access
        window.updateHydrogenDatabase = async () => {
            return await window.databaseUpdater.updateDatabase();
        };
        
        window.searchHydrogenStudies = (query, filters) => {
            return window.databaseUpdater.searchStudies(query, filters);
        };
        
        window.getHydrogenStatistics = () => {
            return window.databaseUpdater.getStatistics();
        };
    });
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseUpdater;
}

// Usage examples:
/*
// Browser usage:
const updater = new DatabaseUpdater();
const result = await updater.updateDatabase();

// Search studies:
const studies = updater.searchStudies('hydrogen water', { yearRange: [2020, 2024] });

// Get statistics:
const stats = updater.getStatistics();

// Get top topics:
const topTopics = updater.getTopTopics(5);
*/ 