/**
 * Dashboard EchoWater Integration
 * Connects Hydrogen Research Dashboard with EchoWater data extraction
 * Admin: shayne@devpipeline.com
 */

class DashboardEchoWaterIntegration {
    constructor() {
        this.dashboard = null;
        this.echoWaterScraper = null;
        this.csvConverter = null;
        this.isUpdating = false;
        this.updateProgress = null;
        this.updateLog = null;
    }

    /**
     * Initialize integration with dashboard
     */
    initialize(dashboardInstance, progressCallback = null, logCallback = null) {
        this.dashboard = dashboardInstance;
        this.updateProgress = progressCallback;
        this.updateLog = logCallback;
        
        this.log('Dashboard EchoWater Integration initialized');
        this.log('Admin: shayne@devpipeline.com');
        this.log('Ready to update dashboard with EchoWater data');
    }

    /**
     * Update dashboard with fresh data from EchoWater extraction
     */
    async updateDashboardWithEchoWaterData() {
        if (this.isUpdating) {
            this.log('Update already in progress', 'warning');
            return;
        }

        this.isUpdating = true;
        this.log('Starting dashboard update with EchoWater data...');

        try {
            // Step 1: Extract data using EchoWater scraper
            this.log('Step 1: Extracting data from Hydrogen Studies website...');
            this.updateProgress(10, 'Extracting data from website...');
            
            const extractedData = await this.extractFreshData();
            
            if (!extractedData || extractedData.length === 0) {
                throw new Error('No data extracted from website');
            }

            this.log(`Successfully extracted ${extractedData.length} studies`);
            this.updateProgress(50, 'Processing extracted data...');

            // Step 2: Convert to dashboard format
            this.log('Step 2: Converting data to dashboard format...');
            const dashboardData = this.convertToDashboardFormat(extractedData);
            
            this.log(`Converted ${dashboardData.length} studies to dashboard format`);
            this.updateProgress(75, 'Updating dashboard...');

            // Step 3: Update dashboard
            this.log('Step 3: Updating dashboard with new data...');
            await this.updateDashboardData(dashboardData);
            
            this.log('Dashboard updated successfully!');
            this.updateProgress(100, 'Dashboard updated successfully!');

            // Step 4: Export updated data
            this.log('Step 4: Exporting updated data...');
            await this.exportUpdatedData(dashboardData);

            this.log('Dashboard update completed successfully!');
            return {
                success: true,
                studiesCount: dashboardData.length,
                message: 'Dashboard updated with fresh EchoWater data'
            };

        } catch (error) {
            this.log(`Dashboard update failed: ${error.message}`, 'error');
            this.updateProgress(0, 'Update failed');
            return {
                success: false,
                error: error.message
            };
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Extract fresh data using EchoWater scraper
     */
    async extractFreshData() {
        try {
            // Initialize EchoWater scraper
            if (!window.EchoWaterScraper) {
                throw new Error('EchoWater scraper not available');
            }

            this.echoWaterScraper = new EchoWaterScraper();
            
            // Set up progress tracking
            this.echoWaterScraper.setProgressCallback((current, total, percentage) => {
                const progress = 10 + (percentage * 0.4); // 10% to 50%
                this.updateProgress(progress, `Extracting study ${current}/${total}...`);
            });

            this.echoWaterScraper.setLogCallback((message, type) => {
                this.log(`Scraper: ${message}`, type);
            });

            // Extract all studies
            const extractedData = await this.echoWaterScraper.extractAllStudies();
            
            return extractedData;

        } catch (error) {
            this.log(`Data extraction failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Convert EchoWater data to dashboard format
     */
    convertToDashboardFormat(echoWaterData) {
        this.log('Converting EchoWater data to dashboard format...');
        
        return echoWaterData.map((study, index) => {
            return {
                id: index + 1,
                title: study.title || 'Untitled Study',
                year: this.parseYear(study.year),
                journal: study.journal || 'Unknown Journal',
                doi: study.doi || '',
                abstract: study.abstract || 'No abstract available',
                designation: study.designation || 'Research Study',
                topic: study.topic || 'General',
                country: study.country || 'Not specified',
                firstAuthor: this.extractFirstAuthor(study.authors),
                otherAuthors: this.parseAuthors(study.authors),
                lastAuthor: this.extractLastAuthor(study.authors),
                allAuthors: this.parseAllAuthors(study.authors),
                url: study.url || ''
            };
        });
    }

    /**
     * Parse year from various formats
     */
    parseYear(yearInput) {
        if (!yearInput) return null;
        
        const year = parseInt(yearInput);
        if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
            return null;
        }
        
        return year;
    }

    /**
     * Extract first author from authors string
     */
    extractFirstAuthor(authorsStr) {
        if (!authorsStr) return '';
        
        const authors = this.parseAuthors(authorsStr);
        return authors.length > 0 ? authors[0] : '';
    }

    /**
     * Extract last author from authors string
     */
    extractLastAuthor(authorsStr) {
        if (!authorsStr) return '';
        
        const authors = this.parseAuthors(authorsStr);
        return authors.length > 1 ? authors[authors.length - 1] : '';
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
     * Parse all authors for dashboard
     */
    parseAllAuthors(authorsStr) {
        const authors = this.parseAuthors(authorsStr);
        return authors.filter(author => author && author.trim());
    }

    /**
     * Update dashboard with new data
     */
    async updateDashboardData(dashboardData) {
        try {
            if (!this.dashboard) {
                throw new Error('Dashboard instance not available');
            }

            // Clear existing data
            this.dashboard.studies = [];
            
            // Load new data
            this.dashboard.studies = dashboardData;
            
            // Regenerate statistics
            this.dashboard.generateStatistics();
            
            // Refresh dashboard display
            this.refreshDashboardDisplay();
            
            this.log(`Dashboard updated with ${dashboardData.length} studies`);

        } catch (error) {
            this.log(`Dashboard update failed: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Refresh dashboard display
     */
    refreshDashboardDisplay() {
        try {
            // Update statistics display
            this.updateStatisticsDisplay();
            
            // Refresh charts
            this.refreshCharts();
            
            // Update search functionality
            this.updateSearchFunctionality();
            
            this.log('Dashboard display refreshed');

        } catch (error) {
            this.log(`Display refresh failed: ${error.message}`, 'error');
        }
    }

    /**
     * Update statistics display
     */
    updateStatisticsDisplay() {
        const stats = this.dashboard.statistics;
        
        // Update stat cards
        const statElements = {
            'totalStudies': stats.totalStudies,
            'yearRange': `${stats.yearRange.earliest || 'N/A'} - ${stats.yearRange.latest || 'N/A'}`,
            'topicsCount': stats.topicsCount,
            'countriesCount': stats.countriesCount
        };

        Object.entries(statElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    /**
     * Refresh dashboard charts
     */
    refreshCharts() {
        try {
            // Refresh timeline chart
            if (this.dashboard.renderTimelineChart) {
                this.dashboard.renderTimelineChart('timelineChart');
            }
            
            // Refresh topic chart
            if (this.dashboard.renderTopicChart) {
                this.dashboard.renderTopicChart('topicChart');
            }
            
            // Refresh country chart
            if (this.dashboard.renderCountryChart) {
                this.dashboard.renderCountryChart('countryChart');
            }
            
            this.log('Charts refreshed successfully');

        } catch (error) {
            this.log(`Chart refresh failed: ${error.message}`, 'error');
        }
    }

    /**
     * Update search functionality
     */
    updateSearchFunctionality() {
        try {
            // Update search suggestions
            if (this.dashboard.getSearchSuggestions) {
                // Re-initialize search functionality
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        const suggestions = this.dashboard.getSearchSuggestions(e.target.value);
                        this.updateSearchSuggestions(suggestions);
                    });
                }
            }
            
            this.log('Search functionality updated');

        } catch (error) {
            this.log(`Search update failed: ${error.message}`, 'error');
        }
    }

    /**
     * Update search suggestions
     */
    updateSearchSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('topicSuggestions');
        if (!suggestionsContainer) return;

        if (suggestions.length > 0) {
            suggestionsContainer.innerHTML = suggestions.map(suggestion => {
                const [prefix, ...rest] = suggestion.split(': ');
                const value = rest.join(': ');
                return `<div class="suggestion-item" onclick="selectSearchSuggestion('${suggestion}')">
                    <span class="suggestion-prefix">${prefix}</span>
                    <span>${value}</span>
                </div>`;
            }).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }

    /**
     * Export updated data
     */
    async exportUpdatedData(dashboardData) {
        try {
            // Initialize CSV converter
            if (!window.EchoWaterCSVConverter) {
                this.log('CSV converter not available, skipping export', 'warning');
                return;
            }

            this.csvConverter = new EchoWaterCSVConverter();
            
            // Export as CSV
            const csvFilename = this.csvConverter.exportCSV(dashboardData);
            this.log(`Data exported as CSV: ${csvFilename}`);
            
            // Export as JSON
            const jsonData = JSON.stringify(dashboardData, null, 2);
            const jsonBlob = new Blob([jsonData], { type: 'application/json' });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            
            const jsonLink = document.createElement('a');
            jsonLink.href = jsonUrl;
            jsonLink.download = `hydrogen-studies-dashboard-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(jsonLink);
            jsonLink.click();
            document.body.removeChild(jsonLink);
            URL.revokeObjectURL(jsonUrl);
            
            this.log('Data exported as JSON successfully');

        } catch (error) {
            this.log(`Data export failed: ${error.message}`, 'error');
        }
    }

    /**
     * Get update status
     */
    getUpdateStatus() {
        return {
            isUpdating: this.isUpdating,
            lastUpdate: new Date().toISOString(),
            studiesCount: this.dashboard ? this.dashboard.studies.length : 0
        };
    }

    /**
     * Log message
     */
    log(message, type = 'info') {
        if (this.updateLog) {
            this.updateLog(message, type);
        }
        console.log(`[DashboardEchoWater] ${message}`);
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.DashboardEchoWaterIntegration = DashboardEchoWaterIntegration;
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardEchoWaterIntegration;
} 