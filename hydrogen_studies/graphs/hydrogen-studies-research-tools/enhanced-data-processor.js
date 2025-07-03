/**
 * Enhanced Hydrogen Studies Research Database - Data Processor
 * Handles CSV data processing, duplicate detection, and statistics generation
 * Updated to work with latest CSV files and prevent duplicate entries
 */

class EnhancedHydrogenDataProcessor {
    constructor() {
        this.studies = [];
        this.statistics = {};
        this.topics = new Map();
        this.countries = new Map();
        this.years = new Map();
        this.designations = new Map();
        this.journals = new Map();
        this.authors = new Map();
        this.duplicateDetector = null;
        this.dataSources = {
            primary: 'Hydrogen Research Database - Primary.csv',
            engineering: 'Hydrogen Research Database - Engineering.csv',
            secondary: 'Hydrogen Research Database - Secondary, Tertiary.csv'
        };
    }

    /**
     * Initialize duplicate detector
     */
    initializeDuplicateDetector() {
        if (typeof DuplicateDetector !== 'undefined') {
            this.duplicateDetector = new DuplicateDetector();
            console.log('Duplicate detector initialized');
        } else {
            console.warn('DuplicateDetector not available - duplicate detection disabled');
        }
    }

    /**
     * Load and merge data from all CSV files
     * @returns {Promise<Object>} Processing results
     */
    async loadAllData() {
        try {
            console.log('Starting comprehensive data load from all CSV files...');
            
            // Initialize duplicate detector
            this.initializeDuplicateDetector();
            
            let allStudies = [];
            let processingResults = {
                primary: { success: false, count: 0, duplicates: 0 },
                engineering: { success: false, count: 0, duplicates: 0 },
                secondary: { success: false, count: 0, duplicates: 0 }
            };

            // Load Primary CSV (largest dataset)
            console.log('Loading Primary CSV...');
            const primaryResult = await this.loadCSVFile(this.dataSources.primary, 'primary');
            if (primaryResult.success) {
                allStudies = [...primaryResult.studies];
                processingResults.primary = {
                    success: true,
                    count: primaryResult.studies.length,
                    duplicates: 0
                };
                console.log(`Primary CSV loaded: ${primaryResult.studies.length} studies`);
            }

            // Load Engineering CSV
            console.log('Loading Engineering CSV...');
            const engineeringResult = await this.loadCSVFile(this.dataSources.engineering, 'engineering');
            if (engineeringResult.success) {
                const engineeringStudies = engineeringResult.studies;
                const duplicateCheck = this.checkForDuplicates(engineeringStudies, allStudies);
                
                // Add only unique studies
                const uniqueEngineeringStudies = engineeringStudies.filter(study => 
                    !duplicateCheck.duplicates.some(dup => dup.newStudy === study)
                );
                
                allStudies = [...allStudies, ...uniqueEngineeringStudies];
                processingResults.engineering = {
                    success: true,
                    count: engineeringStudies.length,
                    duplicates: duplicateCheck.duplicates.length
                };
                console.log(`Engineering CSV loaded: ${engineeringStudies.length} studies (${duplicateCheck.duplicates.length} duplicates removed)`);
            }

            // Load Secondary/Tertiary CSV
            console.log('Loading Secondary/Tertiary CSV...');
            const secondaryResult = await this.loadCSVFile(this.dataSources.secondary, 'secondary');
            if (secondaryResult.success) {
                const secondaryStudies = secondaryResult.studies;
                const duplicateCheck = this.checkForDuplicates(secondaryStudies, allStudies);
                
                // Add only unique studies
                const uniqueSecondaryStudies = secondaryStudies.filter(study => 
                    !duplicateCheck.duplicates.some(dup => dup.newStudy === study)
                );
                
                allStudies = [...allStudies, ...uniqueSecondaryStudies];
                processingResults.secondary = {
                    success: true,
                    count: secondaryStudies.length,
                    duplicates: duplicateCheck.duplicates.length
                };
                console.log(`Secondary CSV loaded: ${secondaryStudies.length} studies (${duplicateCheck.duplicates.length} duplicates removed)`);
            }

            // Set final studies array
            this.studies = allStudies;
            
            // Generate statistics
            this.generateStatistics();
            
            // Generate comprehensive report
            const report = this.generateComprehensiveReport(processingResults);
            console.log(report);

            return {
                success: true,
                studiesCount: this.studies.length,
                statistics: this.statistics,
                processingResults: processingResults,
                report: report
            };

        } catch (error) {
            console.error('Error loading all data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load data from a specific CSV file
     * @param {string} filename - CSV filename
     * @param {string} sourceType - Type of source (primary, engineering, secondary)
     * @returns {Promise<Object>} Processing results
     */
    async loadCSVFile(filename, sourceType) {
        try {
            const response = await fetch(`../${filename}`);
            if (!response.ok) {
                throw new Error(`Failed to load ${filename}: ${response.statusText}`);
            }
            
            const csvData = await response.text();
            return await this.processCSVData(csvData, sourceType);
            
        } catch (error) {
            console.error(`Error loading ${filename}:`, error);
            return {
                success: false,
                error: error.message,
                studies: []
            };
        }
    }

    /**
     * Process CSV data with enhanced parsing
     * @param {string} csvData - Raw CSV data
     * @param {string} sourceType - Type of source
     * @returns {Promise<Object>} Processing results
     */
    async processCSVData(csvData, sourceType) {
        try {
            // Check if Papa Parse is available
            if (typeof Papa === 'undefined') {
                throw new Error('Papa Parse library is not loaded. Please check your internet connection and refresh the page.');
            }
            
            // Parse CSV using Papa Parse with enhanced options
            const results = Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                transform: (value, field) => {
                    // Enhanced data cleaning
                    if (typeof value === 'string') {
                        value = value.trim();
                        // Remove quotes if present
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                        // Remove extra whitespace
                        value = value.replace(/\s+/g, ' ');
                    }
                    return value;
                }
            });

            if (results.errors.length > 0) {
                console.warn(`CSV parsing warnings for ${sourceType}:`, results.errors);
            }

            // Process all rows with enhanced normalization
            const allStudies = results.data.map((row, index) => {
                return this.enhancedNormalizeStudy(row, index, sourceType);
            });
            
            // Enhanced filtering
            const filteredStudies = allStudies.filter(study => 
                study.title && study.title.trim() !== '' && 
                study.title.length > 10 // Minimum title length
            );
            
            const rejectedStudies = allStudies.filter(study => 
                !study.title || study.title.trim() === '' || study.title.length <= 10
            );
            
            console.log(`${sourceType} CSV processing:`);
            console.log(`  Total rows: ${results.data.length}`);
            console.log(`  Valid studies: ${filteredStudies.length}`);
            console.log(`  Rejected studies: ${rejectedStudies.length}`);
            
            if (rejectedStudies.length > 0) {
                console.log('Rejected studies details:');
                rejectedStudies.slice(0, 5).forEach((study, index) => {
                    console.log(`    ${index + 1}. Title: "${study.title}" | Year: "${study.year}"`);
                });
                if (rejectedStudies.length > 5) {
                    console.log(`    ... and ${rejectedStudies.length - 5} more`);
                }
            }

            return {
                success: true,
                studies: filteredStudies,
                totalRows: results.data.length,
                validStudies: filteredStudies.length,
                rejectedStudies: rejectedStudies.length
            };

        } catch (error) {
            console.error(`Error processing ${sourceType} CSV data:`, error);
            return {
                success: false,
                error: error.message,
                studies: []
            };
        }
    }

    /**
     * Enhanced study normalization with better field mapping
     * @param {Object} row - Raw CSV row
     * @param {number} index - Row index
     * @param {string} sourceType - Type of source
     * @returns {Object} Normalized study object
     */
    enhancedNormalizeStudy(row, index, sourceType) {
        // Enhanced field mapping for different CSV formats
        const study = {
            id: `${sourceType}_${index + 1}`,
            title: this.extractField(row, ['Title', 'title']),
            year: this.parseYear(this.extractField(row, ['Publish Year', 'Year', 'year'])),
            journal: this.extractField(row, ['Journal', 'journal']),
            doi: this.extractField(row, ['DOI/PMID/Link', 'DOI', 'doi', 'Link']),
            abstract: this.extractField(row, ['Abstract', 'abstract']),
            designation: this.extractField(row, ['Designation', 'designation', 'Rank', 'rank']),
            topic: this.extractField(row, ['Primary Topic', 'Topic', 'topic', 'PrimaryTopic']),
            secondaryTopic: this.extractField(row, ['Secondary Topic', 'SecondaryTopic']),
            tertiaryTopic: this.extractField(row, ['Tertiary Topic', 'TertiaryTopic']),
            country: this.extractField(row, ['Country', 'country']),
            firstAuthor: this.extractField(row, ['First Author', 'FirstAuthor', 'firstAuthor']),
            otherAuthors: this.parseAuthors(this.extractField(row, ['Other Authors', 'OtherAuthors', 'otherAuthors'])),
            lastAuthor: this.extractField(row, ['Last Author', 'LastAuthor', 'lastAuthor']),
            model: this.extractField(row, ['Model', 'model']),
            vehicle: this.extractField(row, ['Vehicle', 'vehicle']),
            pH: this.extractField(row, ['pH', 'ph']),
            application: this.extractField(row, ['Application', 'application']),
            comparison: this.extractField(row, ['Comparison', 'comparison']),
            complement: this.extractField(row, ['Complement', 'complement']),
            sourceType: sourceType,
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
     * @param {Object} row - CSV row
     * @param {Array} fieldNames - Array of possible field names
     * @returns {string} Field value
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
     * Check for duplicates using the duplicate detector
     * @param {Array} newStudies - New studies to check
     * @param {Array} existingStudies - Existing studies to compare against
     * @returns {Object} Duplicate check results
     */
    checkForDuplicates(newStudies, existingStudies) {
        if (!this.duplicateDetector) {
            console.warn('Duplicate detector not available - skipping duplicate check');
            return {
                duplicates: [],
                potentialDuplicates: [],
                unique: newStudies
            };
        }

        // Load existing studies into duplicate detector
        this.duplicateDetector.loadExistingStudies(existingStudies);
        
        // Check for duplicates
        const results = this.duplicateDetector.detectDuplicates(newStudies);
        
        console.log(`Duplicate check results:`);
        console.log(`  Total new: ${results.totalNew}`);
        console.log(`  Duplicates: ${results.duplicates.length}`);
        console.log(`  Potential duplicates: ${results.potentialDuplicates.length}`);
        console.log(`  Unique: ${results.unique.length}`);
        
        return results;
    }

    /**
     * Generate comprehensive processing report
     * @param {Object} processingResults - Results from processing each CSV
     * @returns {string} Formatted report
     */
    generateComprehensiveReport(processingResults) {
        let report = `=== HYDROGEN STUDIES DATABASE - COMPREHENSIVE UPDATE REPORT ===\n\n`;
        
        report += `DATABASE SUMMARY:\n`;
        report += `- Total studies in database: ${this.studies.length}\n`;
        report += `- Data sources processed: ${Object.keys(processingResults).length}\n\n`;
        
        report += `SOURCE BREAKDOWN:\n`;
        Object.entries(processingResults).forEach(([source, result]) => {
            if (result.success) {
                report += `- ${source.toUpperCase()}: ${result.count} studies loaded`;
                if (result.duplicates > 0) {
                    report += ` (${result.duplicates} duplicates removed)`;
                }
                report += `\n`;
            } else {
                report += `- ${source.toUpperCase()}: FAILED TO LOAD\n`;
            }
        });
        
        report += `\nSTATISTICS:\n`;
        report += `- Year range: ${this.statistics.yearRange?.earliest || 'N/A'} to ${this.statistics.yearRange?.latest || 'N/A'}\n`;
        report += `- Unique topics: ${this.statistics.topicsCount || 0}\n`;
        report += `- Unique countries: ${this.statistics.countriesCount || 0}\n`;
        report += `- Unique journals: ${this.statistics.journalsCount || 0}\n`;
        report += `- Unique authors: ${this.statistics.authorsCount || 0}\n`;
        
        report += `\nTOP TOPICS:\n`;
        const topTopics = this.getTopTopics(5);
        topTopics.forEach((topic, index) => {
            report += `${index + 1}. ${topic.topic}: ${topic.count} studies\n`;
        });
        
        report += `\nTOP COUNTRIES:\n`;
        const topCountries = this.getTopCountries(5);
        topCountries.forEach((country, index) => {
            report += `${index + 1}. ${country.country}: ${country.count} studies\n`;
        });
        
        report += `\nUpdate completed: ${new Date().toLocaleString()}\n`;
        
        return report;
    }

    // Inherit all existing methods from the original HydrogenDataProcessor
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
            console.warn(`Invalid year found: "${yearStr}" -> parsed as ${year}`);
            return null;
        }
        
        return year;
    }

    parseAuthors(authorsStr) {
        if (!authorsStr) return [];
        
        return authorsStr
            .split(/[;,\n]/)
            .map(author => author.trim())
            .filter(author => author && author.length > 0);
    }

    generateStatistics() {
        this.statistics = {
            totalStudies: this.studies.length,
            yearRange: this.getYearRange(),
            topicsCount: this.getTopicsCount(),
            countriesCount: this.getCountriesCount(),
            designationsCount: this.getDesignationsCount(),
            journalsCount: this.getJournalsCount(),
            authorsCount: this.getAuthorsCount(),
            recentStudies: this.getRecentStudies(),
            topTopics: this.getTopTopics(),
            topCountries: this.getTopCountries(),
            topJournals: this.getTopJournals(),
            topAuthors: this.getTopAuthors(),
            growthTrends: this.getGrowthTrends()
        };
    }

    getYearRange() {
        const years = this.studies
            .map(study => study.year)
            .filter(year => year !== null && !isNaN(year))
            .sort((a, b) => a - b);

        if (years.length === 0) {
            return {
                earliest: null,
                latest: null,
                span: 0,
                studiesWithYears: 0,
                totalStudies: this.studies.length
            };
        }

        return {
            earliest: years[0],
            latest: years[years.length - 1],
            span: years[years.length - 1] - years[0] + 1,
            studiesWithYears: years.length,
            totalStudies: this.studies.length
        };
    }

    getTopicsCount() {
        const topics = new Set(this.studies
            .map(study => study.topic)
            .filter(topic => topic && topic.trim()));
        return topics.size;
    }

    getCountriesCount() {
        const countries = new Set(this.studies
            .map(study => study.country)
            .filter(country => country && country.trim()));
        return countries.size;
    }

    getDesignationsCount() {
        const designations = new Set(this.studies
            .map(study => study.designation)
            .filter(designation => designation && designation.trim()));
        return designations.size;
    }

    getJournalsCount() {
        const journals = new Set(this.studies
            .map(study => study.journal)
            .filter(journal => journal && journal.trim()));
        return journals.size;
    }

    getAuthorsCount() {
        const authors = new Set();
        this.studies.forEach(study => {
            study.allAuthors.forEach(author => {
                if (author && author.trim()) {
                    authors.add(author.trim());
                }
            });
        });
        return authors.size;
    }

    getRecentStudies(limit = 10) {
        return this.studies
            .filter(study => study.year && study.year >= new Date().getFullYear() - 2)
            .sort((a, b) => b.year - a.year)
            .slice(0, limit);
    }

    getTopTopics(limit = 10) {
        const topicCounts = {};
        this.studies.forEach(study => {
            if (study.topic && study.topic.trim()) {
                topicCounts[study.topic] = (topicCounts[study.topic] || 0) + 1;
            }
        });

        return Object.entries(topicCounts)
            .map(([topic, count]) => ({ topic, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopCountries(limit = 10) {
        const countryCounts = {};
        this.studies.forEach(study => {
            if (study.country && study.country.trim()) {
                countryCounts[study.country] = (countryCounts[study.country] || 0) + 1;
            }
        });

        return Object.entries(countryCounts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopJournals(limit = 10) {
        const journalCounts = {};
        this.studies.forEach(study => {
            if (study.journal && study.journal.trim()) {
                journalCounts[study.journal] = (journalCounts[study.journal] || 0) + 1;
            }
        });

        return Object.entries(journalCounts)
            .map(([journal, count]) => ({ journal, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getTopAuthors(limit = 10) {
        const authorCounts = {};
        this.studies.forEach(study => {
            study.allAuthors.forEach(author => {
                if (author && author.trim()) {
                    authorCounts[author] = (authorCounts[author] || 0) + 1;
                }
            });
        });

        return Object.entries(authorCounts)
            .map(([author, count]) => ({ author, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    getGrowthTrends() {
        const yearCounts = {};
        this.studies.forEach(study => {
            if (study.year) {
                yearCounts[study.year] = (yearCounts[study.year] || 0) + 1;
            }
        });

        return Object.entries(yearCounts)
            .map(([year, count]) => ({ year: parseInt(year), count }))
            .sort((a, b) => a.year - b.year);
    }

    searchStudies(query, filters = {}) {
        if (!query && Object.keys(filters).length === 0) {
            return this.studies;
        }

        return this.studies.filter(study => {
            // Universal search with partial matching across all fields
            if (query) {
                const searchTerms = query.toLowerCase().trim().split(/\s+/);
                const searchableText = [
                    study.title || '',
                    study.abstract || '',
                    study.topic || '',
                    study.journal || '',
                    study.firstAuthor || '',
                    study.lastAuthor || '',
                    study.country || '',
                    study.designation || '',
                    ...(study.otherAuthors || [])
                ].join(' ').toLowerCase();

                // Check if ALL search terms are found in ANY field (universal search)
                const allTermsFound = searchTerms.every(term => {
                    // Skip very short terms (less than 2 characters)
                    if (term.length < 2) return true;
                    
                    // Check if term appears in any searchable field
                    return searchableText.includes(term) ||
                           (study.topic && study.topic.toLowerCase().includes(term)) ||
                           (study.country && study.country.toLowerCase().includes(term)) ||
                           (study.designation && study.designation.toLowerCase().includes(term));
                });

                if (!allTermsFound) {
                    return false;
                }
            }

            // Apply filters
            if (filters.yearRange && filters.yearRange.length === 2) {
                const [startYear, endYear] = filters.yearRange;
                if (study.year < startYear || study.year > endYear) {
                    return false;
                }
            }

            if (filters.topic && study.topic !== filters.topic) {
                return false;
            }

            if (filters.country && study.country !== filters.country) {
                return false;
            }

            if (filters.designation && study.designation !== filters.designation) {
                return false;
            }

            return true;
        });
    }

    getSearchSuggestions(query) {
        if (!query || query.trim().length < 2) return [];
        
        const searchTerm = query.toLowerCase().trim();
        const suggestions = new Set();
        
        // Get topic suggestions
        const topics = this.getTopics();
        topics.forEach(topic => {
            if (topic.toLowerCase().includes(searchTerm)) {
                suggestions.add(`Topic: ${topic}`);
            }
        });
        
        // Get country suggestions
        const countries = this.getCountries();
        countries.forEach(country => {
            if (country.toLowerCase().includes(searchTerm)) {
                suggestions.add(`Country: ${country}`);
            }
        });
        
        // Get designation suggestions
        const designations = this.getDesignations();
        designations.forEach(designation => {
            if (designation.toLowerCase().includes(searchTerm)) {
                suggestions.add(`Type: ${designation}`);
            }
        });
        
        // Get journal suggestions
        const journals = this.getJournals();
        journals.forEach(journal => {
            if (journal.toLowerCase().includes(searchTerm)) {
                suggestions.add(`Journal: ${journal}`);
            }
        });
        
        // Get author suggestions
        const authors = this.getAuthors();
        authors.forEach(author => {
            if (author.toLowerCase().includes(searchTerm)) {
                suggestions.add(`Author: ${author}`);
            }
        });
        
        return Array.from(suggestions).slice(0, 15);
    }

    getTopics() {
        const topicSet = new Set();
        this.studies.forEach(study => {
            if (study.topic && study.topic.trim()) {
                topicSet.add(study.topic.trim());
            }
        });
        return Array.from(topicSet).sort();
    }

    getCountries() {
        const countrySet = new Set();
        this.studies.forEach(study => {
            if (study.country && study.country.trim()) {
                countrySet.add(study.country.trim());
            }
        });
        return Array.from(countrySet).sort();
    }

    getDesignations() {
        const designationSet = new Set();
        this.studies.forEach(study => {
            if (study.designation && study.designation.trim()) {
                designationSet.add(study.designation.trim());
            }
        });
        return Array.from(designationSet).sort();
    }

    getJournals() {
        const journalSet = new Set();
        this.studies.forEach(study => {
            if (study.journal && study.journal.trim()) {
                journalSet.add(study.journal.trim());
            }
        });
        return Array.from(journalSet).sort();
    }

    getAuthors() {
        const authorSet = new Set();
        this.studies.forEach(study => {
            if (study.firstAuthor && study.firstAuthor.trim()) {
                authorSet.add(study.firstAuthor.trim());
            }
            if (study.lastAuthor && study.lastAuthor.trim()) {
                authorSet.add(study.lastAuthor.trim());
            }
            if (study.otherAuthors && study.otherAuthors.length > 0) {
                study.otherAuthors.forEach(author => {
                    if (author && author.trim()) {
                        authorSet.add(author.trim());
                    }
                });
            }
        });
        return Array.from(authorSet).sort();
    }

    exportStatistics() {
        return JSON.stringify(this.statistics, null, 2);
    }

    exportAsJSON() {
        return JSON.stringify({
            studies: this.studies,
            statistics: this.statistics,
            metadata: {
                exportDate: new Date().toISOString(),
                totalStudies: this.studies.length,
                version: '2.0',
                enhanced: true
            }
        }, null, 2);
    }

    getStudiesByTopic(topic) {
        return this.studies.filter(study => 
            study.topic && study.topic.toLowerCase() === topic.toLowerCase()
        );
    }

    getStudiesByCountry(country) {
        return this.studies.filter(study => 
            study.country && study.country.toLowerCase() === country.toLowerCase()
        );
    }

    getStudiesByYearRange(startYear, endYear) {
        return this.studies.filter(study => 
            study.year && study.year >= startYear && study.year <= endYear
        );
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedHydrogenDataProcessor;
} 