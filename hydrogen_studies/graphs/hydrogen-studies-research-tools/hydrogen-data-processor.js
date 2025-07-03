/**
 * Hydrogen Studies Research Database - Data Processor
 * Handles CSV data processing, statistics generation, and chart creation
 */

class HydrogenDataProcessor {
    constructor() {
        this.studies = [];
        this.statistics = {};
        this.topics = new Map();
        this.countries = new Map();
        this.years = new Map();
        this.designations = new Map();
        this.journals = new Map();
        this.authors = new Map();
    }

    /**
     * Load data from CSV string
     * @param {string} csvData - Raw CSV data
     * @returns {Promise<Object>} Processing results
     */
    async loadDataFromCSV(csvData) {
        try {
            // Check if Papa Parse is available
            if (typeof Papa === 'undefined') {
                throw new Error('Papa Parse library is not loaded. Please check your internet connection and refresh the page.');
            }
            
            // Parse CSV using Papa Parse
            const results = Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                transform: (value, field) => {
                    // Clean and normalize data
                    if (typeof value === 'string') {
                        value = value.trim();
                        // Remove quotes if present
                        if (value.startsWith('"') && value.endsWith('"')) {
                            value = value.slice(1, -1);
                        }
                    }
                    return value;
                }
            });

            if (results.errors.length > 0) {
                console.warn('CSV parsing warnings:', results.errors);
            }

            // First, let's see what's being filtered out
            const allStudies = results.data.map((row, index) => {
                return this.normalizeStudy(row, index);
            });
            
            // More lenient filtering - include studies with titles even if year is missing
            const filteredStudies = allStudies.filter(study => study.title && study.title.trim() !== '');
            const rejectedStudies = allStudies.filter(study => !study.title || study.title.trim() === '');
            
            console.log(`Total rows processed: ${results.data.length}`);
            console.log(`Valid studies: ${filteredStudies.length}`);
            console.log(`Rejected studies: ${rejectedStudies.length}`);
            
            if (rejectedStudies.length > 0) {
                console.log('Rejected studies details:');
                rejectedStudies.forEach((study, index) => {
                    console.log(`  ${index + 1}. Title: "${study.title}" | Year: "${study.year}" | Row: ${study.id}`);
                });
            }
            
            this.studies = filteredStudies;

            this.generateStatistics();
            return {
                success: true,
                studiesCount: this.studies.length,
                statistics: this.statistics
            };

        } catch (error) {
            console.error('Error loading CSV data:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Normalize study data structure
     * @param {Object} row - Raw CSV row
     * @param {number} index - Row index
     * @returns {Object} Normalized study object
     */
    normalizeStudy(row, index) {
        const study = {
            id: index + 1,
            title: (row.Title || row['Title'] || '').trim(),
            year: this.parseYear(row['Publish Year'] || row.year || ''),
            journal: (row.Journal || row.journal || '').trim(),
            doi: (row['DOI/PMID/Link'] || row.doi || '').trim(),
            abstract: (row.Abstract || row.abstract || '').trim(),
            designation: (row.Designation || row.designation || '').trim(),
            topic: (row.Topic || row.topic || '').trim(),
            country: (row.Country || row.country || '').trim(),
            firstAuthor: (row['First Author'] || row.firstAuthor || '').trim(),
            otherAuthors: this.parseAuthors(row['Other Authors'] || row.otherAuthors || ''),
            lastAuthor: (row['Last Author'] || row.lastAuthor || '').trim(),
            // Additional fields from Primary CSV
            rank: (row.Rank || row.rank || '').trim(),
            model: (row.Model || row.model || '').trim(),
            primaryTopic: (row['Primary Topic'] || row.primaryTopic || '').trim(),
            secondaryTopic: (row['Secondary Topic'] || row.secondaryTopic || '').trim(),
            tertiaryTopic: (row['Tertiary Topic'] || row.tertiaryTopic || '').trim(),
            vehicle: (row.Vehicle || row.vehicle || '').trim(),
            ph: (row.pH || row.ph || '').trim(),
            application: (row.Application || row.application || '').trim(),
            comparison: (row.Comparison || row.comparison || '').trim(),
            complement: (row.Complement || row.complement || '').trim(),
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
     * Parse year from various formats
     * @param {string} yearStr - Year string
     * @returns {number} Parsed year
     */
    parseYear(yearStr) {
        if (!yearStr || yearStr.trim() === '') return null;
        
        // Clean the year string
        const cleanYear = yearStr.toString().trim();
        
        // Try to extract year from various formats
        let year = parseInt(cleanYear);
        
        // If direct parsing fails, try to extract year from text
        if (isNaN(year)) {
            const yearMatch = cleanYear.match(/\b(19|20)\d{2}\b/);
            if (yearMatch) {
                year = parseInt(yearMatch[0]);
            }
        }
        
        // Validate year range (allow years from 1800 to current year + 1 for future publications)
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
            console.warn(`Invalid year found: "${yearStr}" -> parsed as ${year}`);
            return null;
        }
        
        return year;
    }

    /**
     * Parse authors string into array
     * @param {string} authorsStr - Authors string
     * @returns {Array} Array of author names
     */
    parseAuthors(authorsStr) {
        if (!authorsStr) return [];
        
        return authorsStr
            .split(/[;,\n]/)
            .map(author => author.trim())
            .filter(author => author && author.length > 0);
    }

    /**
     * Generate comprehensive statistics
     */
    generateStatistics() {
        this.statistics = {
            totalStudies: this.studies.length,
            uniqueTitles: this.getUniqueTitlesCount(),
            uniqueAuthors: this.getAuthorsCount(),
            withHyperlinks: this.getStudiesWithHyperlinksCount(),
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

    /**
     * Get year range statistics
     * @returns {Object} Year range data
     */
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

    /**
     * Get topics count
     * @returns {number} Number of unique topics
     */
    getTopicsCount() {
        const topics = new Set(this.studies
            .map(study => study.topic)
            .filter(topic => topic && topic.trim()));
        return topics.size;
    }

    /**
     * Get countries count
     * @returns {number} Number of unique countries
     */
    getCountriesCount() {
        const countries = new Set(this.studies
            .map(study => study.country)
            .filter(country => country && country.trim()));
        return countries.size;
    }

    /**
     * Get designations count
     * @returns {number} Number of unique designations
     */
    getDesignationsCount() {
        const designations = new Set(this.studies
            .map(study => study.designation)
            .filter(designation => designation && designation.trim()));
        return designations.size;
    }

    /**
     * Get journals count
     * @returns {number} Number of unique journals
     */
    getJournalsCount() {
        const journals = new Set(this.studies
            .map(study => study.journal)
            .filter(journal => journal && journal.trim()));
        return journals.size;
    }

    /**
     * Get authors count
     * @returns {number} Number of unique authors
     */
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

    /**
     * Get recent studies (last 5 years)
     * @returns {number} Count of recent studies
     */
    getRecentStudies() {
        const currentYear = new Date().getFullYear();
        return this.studies.filter(study => 
            study.year && study.year >= currentYear - 5
        ).length;
    }

    /**
     * Get top topics by frequency
     * @param {number} limit - Number of top topics to return
     * @returns {Array} Array of top topics with counts
     */
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

    /**
     * Get top countries by frequency
     * @param {number} limit - Number of top countries to return
     * @returns {Array} Array of top countries with counts
     */
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

    /**
     * Get top journals by frequency
     * @param {number} limit - Number of top journals to return
     * @returns {Array} Array of top journals with counts
     */
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

    /**
     * Get top authors by frequency
     * @param {number} limit - Number of top authors to return
     * @returns {Array} Array of top authors with counts
     */
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

    /**
     * Get growth trends by year
     * @returns {Array} Array of year data with study counts
     */
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

    /**
     * Search studies by query
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Array} Array of matching studies
     */
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

    /**
     * Get universal search suggestions based on query
     * @param {string} query - Search query
     * @returns {Array} Array of search suggestions
     */
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
        
        return Array.from(suggestions).slice(0, 15); // Limit to 15 suggestions
    }

    /**
     * Get topic suggestions based on search query (legacy method)
     * @param {string} query - Search query
     * @returns {Array} Array of topic suggestions
     */
    getTopicSuggestions(query) {
        if (!query || query.trim().length < 2) return [];
        
        const searchTerm = query.toLowerCase().trim();
        const topics = this.getTopics();
        
        return topics
            .filter(topic => topic.toLowerCase().includes(searchTerm))
            .slice(0, 10); // Limit to 10 suggestions
    }

    /**
     * Get all unique topics
     * @returns {Array} Array of all topics
     */
    getTopics() {
        const topicSet = new Set();
        this.studies.forEach(study => {
            if (study.topic && study.topic.trim()) {
                topicSet.add(study.topic.trim());
            }
        });
        return Array.from(topicSet).sort();
    }

    /**
     * Get all unique countries
     * @returns {Array} Array of all countries
     */
    getCountries() {
        const countrySet = new Set();
        this.studies.forEach(study => {
            if (study.country && study.country.trim()) {
                countrySet.add(study.country.trim());
            }
        });
        return Array.from(countrySet).sort();
    }

    /**
     * Get all unique designations
     * @returns {Array} Array of all designations
     */
    getDesignations() {
        const designationSet = new Set();
        this.studies.forEach(study => {
            if (study.designation && study.designation.trim()) {
                designationSet.add(study.designation.trim());
            }
        });
        return Array.from(designationSet).sort();
    }

    /**
     * Get all unique journals
     * @returns {Array} Array of all journals
     */
    getJournals() {
        const journalSet = new Set();
        this.studies.forEach(study => {
            if (study.journal && study.journal.trim()) {
                journalSet.add(study.journal.trim());
            }
        });
        return Array.from(journalSet).sort();
    }

    /**
     * Get all unique authors
     * @returns {Array} Array of all authors
     */
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

    /**
     * Export statistics for external use
     * @returns {Object} Complete statistics object
     */
    exportStatistics() {
        return this.statistics;
    }

    /**
     * Render timeline chart
     * @param {string} containerId - Chart container ID
     * @param {Object} options - Chart options
     */
    renderTimelineChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const trends = this.getGrowthTrends();
        const ctx = container.getContext('2d');

        const config = {
            type: options.type || 'line',
            data: {
                labels: trends.map(d => d.year),
                datasets: [{
                    label: 'Studies Published',
                    data: trends.map(d => d.count),
                    borderColor: options.borderColor || '#0066cc',
                    backgroundColor: options.backgroundColor || 'rgba(0, 102, 204, 0.1)',
                    pointBackgroundColor: options.pointColor || '#0066cc',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: options.fill !== false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: options.showLegend !== false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 102, 204, 0.95)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return `Year ${context[0].label}`;
                            },
                            label: function(context) {
                                const value = context.parsed.y;
                                return `${value} ${value === 1 ? 'study' : 'studies'} published`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6c757d',
                            maxTicksLimit: 15
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * Render topic distribution chart
     * @param {string} containerId - Chart container ID
     * @param {Object} options - Chart options
     */
    renderTopicChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const topTopics = this.getTopTopics(options.limit || 10);
        const ctx = container.getContext('2d');

        const colors = [
            '#0066cc', '#4da6ff', '#00b8cc', '#28a745', '#ffc107',
            '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'
        ];

        const config = {
            type: options.type || 'doughnut',
            data: {
                labels: topTopics.map(d => d.topic),
                datasets: [{
                    data: topTopics.map(d => d.count),
                    backgroundColor: colors.slice(0, topTopics.length),
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: options.legendPosition || 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 102, 204, 0.95)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} studies (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * Render country distribution chart
     * @param {string} containerId - Chart container ID
     * @param {Object} options - Chart options
     */
    renderCountryChart(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        const topCountries = this.getTopCountries(options.limit || 10);
        const ctx = container.getContext('2d');

        const config = {
            type: options.type || 'bar',
            data: {
                labels: topCountries.map(d => d.country),
                datasets: [{
                    label: 'Studies',
                    data: topCountries.map(d => d.count),
                    backgroundColor: 'rgba(0, 102, 204, 0.7)',
                    borderColor: '#0066cc',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: options.horizontal ? 'y' : 'x',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 102, 204, 0.95)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        };

        return new Chart(ctx, config);
    }

    /**
     * Export data as JSON
     * @returns {string} JSON string
     */
    exportAsJSON() {
        return JSON.stringify({
            studies: this.studies,
            statistics: this.statistics,
            metadata: {
                exportDate: new Date().toISOString(),
                totalStudies: this.studies.length,
                version: '1.0'
            }
        }, null, 2);
    }

    /**
     * Get studies by topic
     * @param {string} topic - Topic to filter by
     * @returns {Array} Array of studies
     */
    getStudiesByTopic(topic) {
        return this.studies.filter(study => 
            study.topic && study.topic.toLowerCase() === topic.toLowerCase()
        );
    }

    /**
     * Get studies by country
     * @param {string} country - Country to filter by
     * @returns {Array} Array of studies
     */
    getStudiesByCountry(country) {
        return this.studies.filter(study => 
            study.country && study.country.toLowerCase() === country.toLowerCase()
        );
    }

    /**
     * Get studies by year range
     * @param {number} startYear - Start year
     * @param {number} endYear - End year
     * @returns {Array} Array of studies
     */
    getStudiesByYearRange(startYear, endYear) {
        return this.studies.filter(study => 
            study.year && study.year >= startYear && study.year <= endYear
        );
    }

    /**
     * Get unique titles count
     * @returns {number} Number of unique titles
     */
    getUniqueTitlesCount() {
        const titles = new Set(this.studies
            .map(study => study.title)
            .filter(title => title && title.trim())
            .map(title => title.toLowerCase().trim()));
        return titles.size;
    }

    /**
     * Get studies with hyperlinks count
     * @returns {number} Number of studies with hyperlinks
     */
    getStudiesWithHyperlinksCount() {
        return this.studies.filter(study => {
            const doi = study.doi || '';
            // Check for various DOI/PMID/Link formats
            return doi.includes('http') || 
                   doi.includes('www') || 
                   doi.includes('doi.org') || 
                   doi.includes('pubmed') || 
                   doi.includes('arxiv') ||
                   doi.includes('10.') || // DOI format like 10.3390/nu13020459
                   doi.includes('PMID') ||
                   doi.includes('pmid') ||
                   doi.length > 5; // Any substantial link/identifier
        }).length;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HydrogenDataProcessor;
}
