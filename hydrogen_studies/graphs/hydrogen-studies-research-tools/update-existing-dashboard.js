/**
 * Update Existing Dashboard Script
 * Updates the existing hydrogen research dashboard with all CSV files
 */

class DashboardUpdater {
    constructor() {
        this.csvFiles = [
            '../Hydrogen Research Database - Primary.csv',
            '../Hydrogen Research Database - Engineering.csv',
            '../Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        this.allStudies = [];
        this.processor = null;
    }

    /**
     * Initialize the updater
     */
    async initialize() {
        console.log('Initializing Dashboard Updater...');
        
        // Check if the original processor exists
        if (typeof HydrogenDataProcessor !== 'undefined') {
            this.processor = new HydrogenDataProcessor();
            console.log('Original HydrogenDataProcessor found and initialized');
        } else {
            console.error('HydrogenDataProcessor not found');
            return false;
        }

        return true;
    }

    /**
     * Load and merge all CSV files
     */
    async loadAllCSVFiles() {
        console.log('Loading all CSV files...');
        
        let totalStudies = 0;
        let duplicatesRemoved = 0;

        for (let i = 0; i < this.csvFiles.length; i++) {
            const csvFile = this.csvFiles[i];
            console.log(`Loading ${csvFile}...`);
            
            try {
                const response = await fetch(csvFile);
                if (!response.ok) {
                    console.warn(`Failed to load ${csvFile}: ${response.statusText}`);
                    continue;
                }
                
                const csvData = await response.text();
                const result = await this.processor.loadDataFromCSV(csvData);
                
                if (result.success) {
                    const newStudies = this.processor.studies;
                    console.log(`${csvFile}: ${newStudies.length} studies loaded`);
                    
                    // Check for duplicates if not the first file
                    if (this.allStudies.length > 0) {
                        const duplicates = this.findDuplicates(newStudies, this.allStudies);
                        const uniqueStudies = newStudies.filter(study => 
                            !duplicates.some(dup => dup.newStudy === study)
                        );
                        
                        duplicatesRemoved += duplicates.length;
                        console.log(`Removed ${duplicates.length} duplicates from ${csvFile}`);
                        
                        this.allStudies = [...this.allStudies, ...uniqueStudies];
                    } else {
                        this.allStudies = [...newStudies];
                    }
                    
                    totalStudies += newStudies.length;
                } else {
                    console.error(`Failed to process ${csvFile}: ${result.error}`);
                }
                
            } catch (error) {
                console.error(`Error loading ${csvFile}:`, error);
            }
        }

        console.log(`Total studies loaded: ${totalStudies}`);
        console.log(`Duplicates removed: ${duplicatesRemoved}`);
        console.log(`Final unique studies: ${this.allStudies.length}`);

        // Update the processor with all studies
        this.processor.studies = this.allStudies;
        this.processor.generateStatistics();

        return {
            success: true,
            totalStudies: totalStudies,
            uniqueStudies: this.allStudies.length,
            duplicatesRemoved: duplicatesRemoved
        };
    }

    /**
     * Find duplicates between new and existing studies
     */
    findDuplicates(newStudies, existingStudies) {
        const duplicates = [];
        
        newStudies.forEach(newStudy => {
            // Check for exact DOI match
            if (newStudy.doi && newStudy.doi.trim()) {
                const doiMatch = existingStudies.find(existing => 
                    existing.doi && existing.doi.trim() === newStudy.doi.trim()
                );
                if (doiMatch) {
                    duplicates.push({ newStudy, existingStudy: doiMatch, matchType: 'DOI' });
                    return;
                }
            }
            
            // Check for title + year + author match
            if (newStudy.title && newStudy.year && newStudy.firstAuthor) {
                const titleAuthorMatch = existingStudies.find(existing => 
                    existing.title && existing.year && existing.firstAuthor &&
                    existing.title.toLowerCase().trim() === newStudy.title.toLowerCase().trim() &&
                    existing.year === newStudy.year &&
                    existing.firstAuthor.toLowerCase().trim() === newStudy.firstAuthor.toLowerCase().trim()
                );
                if (titleAuthorMatch) {
                    duplicates.push({ newStudy, existingStudy: titleAuthorMatch, matchType: 'Title+Author+Year' });
                    return;
                }
            }
            
            // Check for similar titles (simple approach)
            if (newStudy.title) {
                const normalizedNewTitle = this.normalizeTitle(newStudy.title);
                const similarTitle = existingStudies.find(existing => 
                    existing.title && this.normalizeTitle(existing.title) === normalizedNewTitle
                );
                if (similarTitle) {
                    duplicates.push({ newStudy, existingStudy: similarTitle, matchType: 'Similar Title' });
                }
            }
        });
        
        return duplicates;
    }

    /**
     * Normalize title for comparison
     */
    normalizeTitle(title) {
        return title.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 100);
    }

    /**
     * Update the dashboard with new data
     */
    async updateDashboard() {
        console.log('Starting dashboard update...');
        
        if (!this.processor) {
            await this.initialize();
        }

        const result = await this.loadAllCSVFiles();
        
        if (result.success) {
            console.log('Dashboard updated successfully!');
            console.log(`Total studies: ${result.totalStudies}`);
            console.log(`Unique studies: ${result.uniqueStudies}`);
            console.log(`Duplicates removed: ${result.duplicatesRemoved}`);
            
            // Trigger dashboard refresh if possible
            this.refreshDashboard();
            
            return result;
        } else {
            console.error('Failed to update dashboard');
            return result;
        }
    }

    /**
     * Refresh the dashboard display
     */
    refreshDashboard() {
        // Try to trigger dashboard refresh
        if (typeof window !== 'undefined' && window.location) {
            // If we're on the dashboard page, trigger a refresh
            if (window.location.href.includes('hydrogen-research-dashboard.html')) {
                console.log('Refreshing dashboard display...');
                
                // Dispatch a custom event to notify the dashboard
                const event = new CustomEvent('dashboardDataUpdated', {
                    detail: {
                        studies: this.processor.studies,
                        statistics: this.processor.statistics
                    }
                });
                window.dispatchEvent(event);
                
                // Also try to reload the page if needed
                setTimeout(() => {
                    if (confirm('Dashboard data has been updated! Would you like to refresh the page to see the new data?')) {
                        window.location.reload();
                    }
                }, 1000);
            }
        }
    }

    /**
     * Get current statistics
     */
    getStatistics() {
        if (this.processor) {
            return this.processor.statistics;
        }
        return null;
    }

    /**
     * Get all studies
     */
    getAllStudies() {
        return this.allStudies;
    }

    /**
     * Search studies
     */
    searchStudies(query, filters = {}) {
        if (this.processor) {
            return this.processor.searchStudies(query, filters);
        }
        return [];
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.DashboardUpdater = DashboardUpdater;
    
    // Auto-initialize when script is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        console.log('Dashboard Updater loaded');
        
        // Create global instance
        window.dashboardUpdater = new DashboardUpdater();
        
        // Add to window for easy access
        window.updateDashboardData = async () => {
            return await window.dashboardUpdater.updateDashboard();
        };
        
        window.getDashboardStatistics = () => {
            return window.dashboardUpdater.getStatistics();
        };
        
        window.searchDashboardStudies = (query, filters) => {
            return window.dashboardUpdater.searchStudies(query, filters);
        };
    });
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardUpdater;
}

// Usage example:
/*
// Update dashboard with all CSV files
const updater = new DashboardUpdater();
const result = await updater.updateDashboard();

if (result.success) {
    console.log(`Dashboard updated: ${result.uniqueStudies} unique studies`);
    console.log(`Duplicates removed: ${result.duplicatesRemoved}`);
}
*/ 