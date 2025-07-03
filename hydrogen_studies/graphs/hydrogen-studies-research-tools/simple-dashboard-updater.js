/**
 * Simple Dashboard Updater
 * Directly updates the existing dashboard with all CSV files
 */

class SimpleDashboardUpdater {
    constructor() {
        this.csvFiles = [
            '../Hydrogen Research Database - Primary.csv',
            '../Hydrogen Research Database - Engineering.csv',
            '../Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        this.allStudies = [];
        this.originalProcessor = null;
    }

    /**
     * Initialize and find the existing processor
     */
    async initialize() {
        console.log('Initializing Simple Dashboard Updater...');
        
        // Wait for the page to load completely
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                window.addEventListener('load', resolve);
            });
        }
        
        // Try to find the existing processor
        if (typeof HydrogenDataProcessor !== 'undefined') {
            this.originalProcessor = new HydrogenDataProcessor();
            console.log('Found existing HydrogenDataProcessor');
        } else {
            console.warn('HydrogenDataProcessor not found, creating a basic processor');
            // Create a basic processor if the original one isn't available
            this.originalProcessor = this.createBasicProcessor();
        }

        return true;
    }

    /**
     * Create a basic processor when the original one isn't available
     */
    createBasicProcessor() {
        return {
            studies: [],
            statistics: {},
            generateStatistics: function() {
                const stats = {
                    totalStudies: this.studies.length,
                    yearDistribution: {},
                    journalDistribution: {},
                    countryDistribution: {},
                    topicDistribution: {}
                };
                
                this.studies.forEach(study => {
                    // Year distribution
                    const year = study.year || 'Unknown';
                    stats.yearDistribution[year] = (stats.yearDistribution[year] || 0) + 1;
                    
                    // Journal distribution
                    const journal = study.journal || 'Unknown';
                    stats.journalDistribution[journal] = (stats.journalDistribution[journal] || 0) + 1;
                    
                    // Country distribution
                    const country = study.country || 'Unknown';
                    stats.countryDistribution[country] = (stats.countryDistribution[country] || 0) + 1;
                    
                    // Topic distribution
                    const topic = study.topic || 'Unknown';
                    stats.topicDistribution[topic] = (stats.topicDistribution[topic] || 0) + 1;
                });
                
                this.statistics = stats;
                return stats;
            }
        };
    }

    /**
     * Load a single CSV file
     */
    async loadCSVFile(csvFile) {
        try {
            console.log(`Loading ${csvFile}...`);
            const response = await fetch(csvFile);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvData = await response.text();
            console.log(`${csvFile} loaded successfully (${csvData.length} characters)`);
            
            return csvData;
        } catch (error) {
            console.error(`Error loading ${csvFile}:`, error);
            return null;
        }
    }

    /**
     * Process CSV data using Papa Parse
     */
    processCSVData(csvData, sourceName) {
        try {
            if (typeof Papa === 'undefined') {
                throw new Error('Papa Parse not available');
            }

            const results = Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                transform: (value, field) => {
                    if (typeof value === 'string') {
                        value = value.trim();
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                    }
                    return value;
                }
            });

            if (results.errors.length > 0) {
                console.warn(`CSV parsing warnings for ${sourceName}:`, results.errors);
            }

            const studies = results.data.map((row, index) => {
                return this.normalizeStudy(row, index, sourceName);
            }).filter(study => study.title && study.title.trim() !== '');

            console.log(`${sourceName}: ${studies.length} valid studies processed`);
            return studies;

        } catch (error) {
            console.error(`Error processing ${sourceName}:`, error);
            return [];
        }
    }

    /**
     * Normalize study data
     */
    normalizeStudy(row, index, sourceName) {
        const study = {
            id: `${sourceName}_${index + 1}`,
            title: this.extractField(row, ['Title', 'title']),
            year: this.parseYear(this.extractField(row, ['Publish Year', 'Year', 'year'])),
            journal: this.extractField(row, ['Journal', 'journal']),
            doi: this.extractField(row, ['DOI/PMID/Link', 'DOI', 'doi', 'Link']),
            abstract: this.extractField(row, ['Abstract', 'abstract']),
            designation: this.extractField(row, ['Designation', 'designation', 'Rank', 'rank']),
            topic: this.extractField(row, ['Primary Topic', 'Topic', 'topic', 'PrimaryTopic']),
            country: this.extractField(row, ['Country', 'country']),
            firstAuthor: this.extractField(row, ['First Author', 'FirstAuthor', 'firstAuthor']),
            otherAuthors: this.parseAuthors(this.extractField(row, ['Other Authors', 'OtherAuthors', 'otherAuthors'])),
            lastAuthor: this.extractField(row, ['Last Author', 'LastAuthor', 'lastAuthor']),
            sourceType: sourceName,
            allAuthors: []
        };

        // Combine all authors
        study.allAuthors = [
            study.firstAuthor,
            ...study.otherAuthors,
            study.lastAuthor
        ].filter(author => author && author.trim());

        return study;
    }

    /**
     * Extract field value with multiple possible field names
     */
    extractField(row, fieldNames) {
        for (const fieldName of fieldNames) {
            if (row[fieldName] !== undefined && row[fieldName] !== null) {
                return String(row[fieldName]).trim();
            }
        }
        return '';
    }

    /**
     * Parse year from various formats
     */
    parseYear(yearStr) {
        if (!yearStr || yearStr.trim() === '') return null;
        
        const cleanYear = yearStr.toString().trim();
        let year = parseInt(cleanYear);
        
        if (isNaN(year)) {
            const yearMatch = cleanYear.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                year = parseInt(yearMatch[0]);
            }
        }
        
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
            return null;
        }
        
        return year;
    }

    /**
     * Parse authors string into array
     */
    parseAuthors(authorsStr) {
        if (!authorsStr) return [];
        
        return authorsStr
            .split(/[;,\n]/)
            .map(author => author.trim())
            .filter(author => author && author.length > 0);
    }

    /**
     * Find and remove duplicates based on year and title
     */
    removeDuplicates(studies) {
        const uniqueStudies = [];
        const seen = new Set();
        const duplicates = [];

        studies.forEach(study => {
            // Create a unique key based on year and title
            const key = this.createYearTitleKey(study);
            
            if (!seen.has(key)) {
                seen.add(key);
                uniqueStudies.push(study);
            } else {
                // Track duplicates for reporting
                const original = uniqueStudies.find(s => this.createYearTitleKey(s) === key);
                duplicates.push({
                    original: original,
                    duplicate: study,
                    matchType: 'Year + Title'
                });
            }
        });

        const duplicatesRemoved = studies.length - uniqueStudies.length;
        console.log(`Removed ${duplicatesRemoved} duplicates based on year and title matching`);
        
        // Store duplicates for reporting
        this.duplicates = duplicates;
        
        return uniqueStudies;
    }

    /**
     * Create a unique key based on year and title
     */
    createYearTitleKey(study) {
        const year = study.year || 'Unknown';
        const title = (study.title || '').toLowerCase().trim();
        return `${year}_${title}`;
    }

    /**
     * Create a unique key for a study (legacy method)
     */
    createStudyKey(study) {
        // Try DOI first (most reliable)
        if (study.doi && study.doi.trim()) {
            return `doi:${study.doi.toLowerCase().trim()}`;
        }
        
        // Try title + year + first author
        if (study.title && study.year && study.firstAuthor) {
            return `title_year_author:${study.title.toLowerCase().trim()}_${study.year}_${study.firstAuthor.toLowerCase().trim()}`;
        }
        
        // Fallback to title only
        if (study.title) {
            return `title:${study.title.toLowerCase().trim()}`;
        }
        
        // Last resort
        return `id:${study.id}`;
    }

    /**
     * Update the dashboard with all CSV files
     */
    async updateDashboard() {
        console.log('Starting dashboard update...');
        
        try {
            if (!this.originalProcessor) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Failed to initialize processor');
                }
            }

            let totalStudies = 0;
            let allStudies = [];

            // Load and process each CSV file
            for (let i = 0; i < this.csvFiles.length; i++) {
                const csvFile = this.csvFiles[i];
                const sourceName = this.getSourceName(csvFile);
                
                console.log(`Processing ${sourceName}...`);
                
                const csvData = await this.loadCSVFile(csvFile);
                if (csvData) {
                    const studies = this.processCSVData(csvData, sourceName);
                    allStudies = [...allStudies, ...studies];
                    totalStudies += studies.length;
                    console.log(`${sourceName}: ${studies.length} studies added`);
                }
            }

            if (totalStudies === 0) {
                throw new Error('No studies were loaded from CSV files');
            }

            // Remove duplicates
            console.log('Removing duplicates based on year and title...');
            const uniqueStudies = this.removeDuplicates(allStudies);
            
            // Ensure processor exists and update it
            if (!this.originalProcessor) {
                this.originalProcessor = this.createBasicProcessor();
            }
            
            this.originalProcessor.studies = uniqueStudies;
            this.originalProcessor.generateStatistics();
            
            // Store the updated data globally
            window.updatedStudies = uniqueStudies;
            window.updatedStatistics = this.originalProcessor.statistics;
            
            console.log('Dashboard update completed!');
            console.log(`Total studies processed: ${totalStudies}`);
            console.log(`Unique studies: ${uniqueStudies.length}`);
            console.log(`Duplicates removed: ${totalStudies - uniqueStudies.length}`);
            console.log(`Duplicates found: ${this.duplicates ? this.duplicates.length : 0}`);
            
            // Show results
            this.showResults(totalStudies, uniqueStudies.length, totalStudies - uniqueStudies.length);
            
            return {
                success: true,
                totalStudies: totalStudies,
                uniqueStudies: uniqueStudies.length,
                duplicatesRemoved: totalStudies - uniqueStudies.length,
                studies: uniqueStudies,
                statistics: this.originalProcessor.statistics,
                duplicates: this.duplicates || []
            };
            
        } catch (error) {
            console.error('Error in updateDashboard:', error);
            return {
                success: false,
                error: error.message,
                totalStudies: 0,
                uniqueStudies: 0,
                duplicatesRemoved: 0,
                studies: [],
                statistics: {},
                duplicates: []
            };
        }
    }

    /**
     * Get source name from file path
     */
    getSourceName(csvFile) {
        if (csvFile.includes('Primary')) return 'Primary';
        if (csvFile.includes('Engineering')) return 'Engineering';
        if (csvFile.includes('Secondary')) return 'Secondary';
        return 'Unknown';
    }

    /**
     * Show update results
     */
    showResults(totalStudies, uniqueStudies, duplicatesRemoved) {
        // Create or update results display
        let resultsDiv = document.getElementById('update-results');
        if (!resultsDiv) {
            resultsDiv = document.createElement('div');
            resultsDiv.id = 'update-results';
            resultsDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
                border-radius: 8px;
                padding: 20px;
                max-width: 300px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;
            document.body.appendChild(resultsDiv);
        }

        resultsDiv.innerHTML = `
            <h3 style="margin: 0 0 15px 0; color: #155724;">✅ Dashboard Updated!</h3>
            <div style="margin-bottom: 10px;">
                <strong>Total Studies:</strong> ${totalStudies}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Unique Studies:</strong> ${uniqueStudies}
            </div>
            <div style="margin-bottom: 15px;">
                <strong>Duplicates Removed:</strong> ${duplicatesRemoved}
            </div>
            <button onclick="window.location.reload()" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
            ">Refresh Dashboard</button>
            <button onclick="this.parentElement.remove()" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            ">Close</button>
        `;

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (resultsDiv.parentElement) {
                resultsDiv.remove();
            }
        }, 10000);
    }

    /**
     * Get current statistics
     */
    getStatistics() {
        if (this.originalProcessor) {
            return this.originalProcessor.statistics;
        }
        return null;
    }

    /**
     * Get all studies
     */
    getAllStudies() {
        return this.originalProcessor ? this.originalProcessor.studies : [];
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.SimpleDashboardUpdater = SimpleDashboardUpdater;
    
    // Auto-initialize when script is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Simple Dashboard Updater loaded');
        
        // Create global instance
        window.simpleDashboardUpdater = new SimpleDashboardUpdater();
        
        // Add to window for easy access
        window.updateDashboardSimple = async () => {
            return await window.simpleDashboardUpdater.updateDashboard();
        };
        
        window.getDashboardStats = () => {
            return window.simpleDashboardUpdater.getStatistics();
        };
        
        window.getAllStudies = () => {
            return window.simpleDashboardUpdater.getAllStudies();
        };
    });
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SimpleDashboardUpdater;
} 