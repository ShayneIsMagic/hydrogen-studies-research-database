/**
 * Comprehensive Comparison Script
 * Compares hydrogenstudies.com data with local CSV databases
 */

const fs = require('fs');
const https = require('https');

class ComprehensiveComparison {
    constructor() {
        this.websiteData = {
            totalStudies: 1335,
            yearData: [],
            testSubjects: [],
            countries: []
        };
        this.localData = [];
        this.comparisonResults = {};
    }

    /**
     * Extract data from the website HTML
     */
    extractWebsiteData(html) {
        console.log('Extracting data from website HTML...');
        
        // Extract year data from the chart
        const yearDataMatch = html.match(/let data = (\[.*?\]);/s);
        if (yearDataMatch) {
            try {
                this.websiteData.yearData = JSON.parse(yearDataMatch[1]);
                console.log(`Extracted year data for ${this.websiteData.yearData.length} years`);
            } catch (e) {
                console.log('Failed to parse year data:', e.message);
            }
        }

        // Extract test subjects data
        const testSubjectsMatch = html.match(/let data = \[.*?\];\s*chart\.data = data;\s*\/\/ Add and configure Series.*?let data = (\[.*?\]);/s);
        if (testSubjectsMatch) {
            try {
                this.websiteData.testSubjects = JSON.parse(testSubjectsMatch[1]);
                console.log(`Extracted test subjects data for ${this.websiteData.testSubjects.length} subjects`);
            } catch (e) {
                console.log('Failed to parse test subjects data:', e.message);
            }
        }

        // Extract countries data
        const countriesMatch = html.match(/Countries By total Study Amount.*?let data = (\[.*?\]);/s);
        if (countriesMatch) {
            try {
                this.websiteData.countries = JSON.parse(countriesMatch[1]);
                console.log(`Extracted countries data for ${this.websiteData.countries.length} countries`);
            } catch (e) {
                console.log('Failed to parse countries data:', e.message);
            }
        }

        return this.websiteData;
    }

    /**
     * Load and parse local CSV data
     */
    loadLocalData() {
        console.log('Loading local CSV data...');
        
        const csvFiles = [
            '../Hydrogen Research Database - Primary.csv',
            '../Hydrogen Research Database - Engineering.csv',
            '../Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        
        let allStudies = [];
        
        csvFiles.forEach(csvFile => {
            try {
                if (fs.existsSync(csvFile)) {
                    const csvData = fs.readFileSync(csvFile, 'utf8');
                    const studies = this.parseCSV(csvData);
                    allStudies = allStudies.concat(studies);
                    console.log(`Loaded ${studies.length} studies from ${csvFile}`);
                } else {
                    console.log(`File not found: ${csvFile}`);
                }
            } catch (error) {
                console.log(`Error loading ${csvFile}:`, error.message);
            }
        });
        
        // Remove duplicates
        this.localData = this.removeDuplicates(allStudies);
        console.log(`Total local studies after deduplication: ${this.localData.length}`);
        
        return this.localData;
    }

    /**
     * Parse CSV data
     */
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const studies = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length < headers.length) continue;
            
            const study = {};
            headers.forEach((header, index) => {
                study[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            // Normalize study data
            study.title = study.title || study.Title || '';
            study.year = this.extractYear(study.year || study['Publish Year'] || study.Year || '');
            study.authors = study.authors || study.Authors || study['First Author'] || '';
            study.journal = study.journal || study.Journal || '';
            study.doi = study.doi || study.DOI || study['DOI/PMID/Link'] || '';
            study.abstract = study.abstract || study.Abstract || '';
            study.topic = study.topic || study.Topic || study['Primary Topic'] || '';
            study.country = study.country || study.Country || '';
            study.model = study.model || study.Model || study['Test Subject'] || '';
            study.outcome = study.outcome || study.Outcome || study['Study Outcome'] || '';
            
            if (study.title) {
                studies.push(study);
            }
        }
        
        return studies;
    }

    /**
     * Parse CSV line handling quoted fields
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values;
    }

    /**
     * Extract year from string
     */
    extractYear(yearStr) {
        if (!yearStr) return null;
        
        const yearMatch = yearStr.toString().match(/\b(19|20)\d{2}\b/);
        if (yearMatch) {
            const year = parseInt(yearMatch[0]);
            if (year >= 1800 && year <= new Date().getFullYear() + 1) {
                return year;
            }
        }
        
        return null;
    }

    /**
     * Remove duplicates from studies
     */
    removeDuplicates(studies) {
        const seen = new Set();
        const uniqueStudies = [];
        
        studies.forEach(study => {
            const key = this.createStudyKey(study);
            if (!seen.has(key)) {
                seen.add(key);
                uniqueStudies.push(study);
            }
        });
        
        return uniqueStudies;
    }

    /**
     * Create unique key for study
     */
    createStudyKey(study) {
        const title = (study.title || '').toLowerCase().trim();
        const year = study.year || '';
        const firstAuthor = (study.authors || '').toLowerCase().trim().split(',')[0];
        
        return `${title}_${year}_${firstAuthor}`;
    }

    /**
     * Generate local data statistics
     */
    generateLocalStatistics() {
        const stats = {
            totalStudies: this.localData.length,
            yearRange: { earliest: null, latest: null },
            years: {},
            countries: {},
            testSubjects: {},
            outcomes: {},
            topics: {}
        };

        // Process each study
        this.localData.forEach(study => {
            // Year statistics
            if (study.year) {
                if (!stats.yearRange.earliest || study.year < stats.yearRange.earliest) {
                    stats.yearRange.earliest = study.year;
                }
                if (!stats.yearRange.latest || study.year > stats.yearRange.latest) {
                    stats.yearRange.latest = study.year;
                }
                
                stats.years[study.year] = (stats.years[study.year] || 0) + 1;
            }

            // Country statistics
            if (study.country) {
                stats.countries[study.country] = (stats.countries[study.country] || 0) + 1;
            }

            // Test subject statistics
            if (study.model) {
                stats.testSubjects[study.model] = (stats.testSubjects[study.model] || 0) + 1;
            }

            // Outcome statistics
            if (study.outcome) {
                stats.outcomes[study.outcome] = (stats.outcomes[study.outcome] || 0) + 1;
            }

            // Topic statistics
            if (study.topic) {
                stats.topics[study.topic] = (stats.topics[study.topic] || 0) + 1;
            }
        });

        return stats;
    }

    /**
     * Compare website and local data
     */
    compareData() {
        console.log('Comparing website and local data...');
        
        const localStats = this.generateLocalStatistics();
        
        this.comparisonResults = {
            summary: {
                websiteTotal: this.websiteData.totalStudies,
                localTotal: localStats.totalStudies,
                difference: Math.abs(this.websiteData.totalStudies - localStats.totalStudies),
                matchPercentage: Math.round((Math.min(this.websiteData.totalStudies, localStats.totalStudies) / Math.max(this.websiteData.totalStudies, localStats.totalStudies)) * 100)
            },
            yearComparison: this.compareYearData(localStats.years),
            testSubjectsComparison: this.compareTestSubjects(localStats.testSubjects),
            countriesComparison: this.compareCountries(localStats.countries),
            localStatistics: localStats
        };

        return this.comparisonResults;
    }

    /**
     * Compare year data
     */
    compareYearData(localYears) {
        const comparison = {
            websiteYears: this.websiteData.yearData.length,
            localYears: Object.keys(localYears).length,
            websiteEarliest: Math.min(...this.websiteData.yearData.map(d => parseInt(d.year))),
            localEarliest: Math.min(...Object.keys(localYears).map(y => parseInt(y))),
            websiteLatest: Math.max(...this.websiteData.yearData.map(d => parseInt(d.year))),
            localLatest: Math.max(...Object.keys(localYears).map(y => parseInt(y))),
            yearDifferences: []
        };

        // Compare individual years
        this.websiteData.yearData.forEach(websiteYear => {
            const year = parseInt(websiteYear.year);
            const websiteTotal = websiteYear.Positive + websiteYear.Neutral + websiteYear.Negative;
            const localTotal = localYears[year] || 0;
            
            if (Math.abs(websiteTotal - localTotal) > 0) {
                comparison.yearDifferences.push({
                    year: year,
                    website: websiteTotal,
                    local: localTotal,
                    difference: websiteTotal - localTotal
                });
            }
        });

        return comparison;
    }

    /**
     * Compare test subjects
     */
    compareTestSubjects(localSubjects) {
        const comparison = {
            websiteSubjects: this.websiteData.testSubjects.length,
            localSubjects: Object.keys(localSubjects).length,
            differences: []
        };

        this.websiteData.testSubjects.forEach(websiteSubject => {
            const localCount = localSubjects[websiteSubject.Model] || 0;
            
            if (Math.abs(websiteSubject.Value - localCount) > 0) {
                comparison.differences.push({
                    subject: websiteSubject.Model,
                    website: websiteSubject.Value,
                    local: localCount,
                    difference: websiteSubject.Value - localCount
                });
            }
        });

        return comparison;
    }

    /**
     * Compare countries
     */
    compareCountries(localCountries) {
        const comparison = {
            websiteCountries: this.websiteData.countries.length,
            localCountries: Object.keys(localCountries).length,
            differences: []
        };

        this.websiteData.countries.forEach(websiteCountry => {
            const localCount = localCountries[websiteCountry.Country] || 0;
            
            if (Math.abs(websiteCountry.Value - localCount) > 0) {
                comparison.differences.push({
                    country: websiteCountry.Country,
                    website: websiteCountry.Value,
                    local: localCount,
                    difference: websiteCountry.Value - localCount
                });
            }
        });

        return comparison;
    }

    /**
     * Generate detailed report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.comparisonResults.summary,
            detailedComparison: this.comparisonResults,
            recommendations: this.generateRecommendations(),
            localDataOverview: {
                totalStudies: this.localData.length,
                yearRange: this.comparisonResults.localStatistics.yearRange,
                uniqueCountries: Object.keys(this.comparisonResults.localStatistics.countries).length,
                uniqueTestSubjects: Object.keys(this.comparisonResults.localStatistics.testSubjects).length,
                uniqueTopics: Object.keys(this.comparisonResults.localStatistics.topics).length
            }
        };

        return report;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const summary = this.comparisonResults.summary;

        if (summary.difference > 0) {
            recommendations.push(`Database difference: ${summary.difference} studies (Website: ${summary.websiteTotal}, Local: ${summary.localTotal})`);
        }

        if (summary.matchPercentage < 90) {
            recommendations.push(`Low match percentage (${summary.matchPercentage}%) suggests significant differences between datasets`);
        }

        const yearComparison = this.comparisonResults.yearComparison;
        if (yearComparison.yearDifferences.length > 0) {
            recommendations.push(`${yearComparison.yearDifferences.length} years have different study counts between website and local data`);
        }

        const testSubjectsComparison = this.comparisonResults.testSubjectsComparison;
        if (testSubjectsComparison.differences.length > 0) {
            recommendations.push(`${testSubjectsComparison.differences.length} test subjects have different counts between website and local data`);
        }

        const countriesComparison = this.comparisonResults.countriesComparison;
        if (countriesComparison.differences.length > 0) {
            recommendations.push(`${countriesComparison.differences.length} countries have different study counts between website and local data`);
        }

        return recommendations;
    }

    /**
     * Run the complete comparison
     */
    async run() {
        console.log('Starting comprehensive comparison...');
        
        try {
            // Load local data
            this.loadLocalData();
            
            // Read the saved website HTML
            const html = fs.readFileSync('hydrogenstudies-main-page.html', 'utf8');
            
            // Extract website data
            this.extractWebsiteData(html);
            
            // Compare data
            this.compareData();
            
            // Generate report
            const report = this.generateReport();
            
            // Save report
            fs.writeFileSync('comparison-report.json', JSON.stringify(report, null, 2));
            console.log('Comparison report saved to comparison-report.json');
            
            // Display summary
            this.displaySummary(report);
            
            return report;
            
        } catch (error) {
            console.error('Comparison failed:', error.message);
            throw error;
        }
    }

    /**
     * Display summary
     */
    displaySummary(report) {
        console.log('\n=== COMPREHENSIVE COMPARISON SUMMARY ===');
        console.log(`Website Studies: ${report.summary.websiteTotal}`);
        console.log(`Local Studies: ${report.summary.localTotal}`);
        console.log(`Difference: ${report.summary.difference}`);
        console.log(`Match Percentage: ${report.summary.matchPercentage}%`);
        
        console.log('\n=== LOCAL DATA OVERVIEW ===');
        console.log(`Year Range: ${report.localDataOverview.yearRange.earliest} - ${report.localDataOverview.yearRange.latest}`);
        console.log(`Unique Countries: ${report.localDataOverview.uniqueCountries}`);
        console.log(`Unique Test Subjects: ${report.localDataOverview.uniqueTestSubjects}`);
        console.log(`Unique Topics: ${report.localDataOverview.uniqueTopics}`);
        
        console.log('\n=== RECOMMENDATIONS ===');
        report.recommendations.forEach(rec => {
            console.log(`• ${rec}`);
        });
        
        console.log('\nDetailed report saved to: comparison-report.json');
    }
}

// Run the comparison
async function main() {
    const comparison = new ComprehensiveComparison();
    await comparison.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ComprehensiveComparison; 