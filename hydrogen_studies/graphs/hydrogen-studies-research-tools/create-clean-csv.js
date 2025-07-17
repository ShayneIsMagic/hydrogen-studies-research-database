/**
 * Create Clean CSV - Remove Duplicates
 * Combines all three databases and removes duplicates based on title, year, and study info
 */

const fs = require('fs');

class CleanCSVGenerator {
    constructor() {
        this.allStudies = [];
        this.uniqueStudies = [];
        this.duplicates = [];
        this.stats = {
            totalLoaded: 0,
            duplicatesFound: 0,
            uniqueStudies: 0,
            sourceBreakdown: {}
        };
    }

    /**
     * Load and parse CSV file
     */
    loadCSVFile(filePath, sourceName) {
        console.log(`Loading ${sourceName}...`);
        
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${filePath}`);
            return [];
        }

        const csvData = fs.readFileSync(filePath, 'utf8');
        const studies = this.parseCSV(csvData, sourceName);
        
        this.stats.sourceBreakdown[sourceName] = studies.length;
        console.log(`Loaded ${studies.length} studies from ${sourceName}`);
        
        return studies;
    }

    /**
     * Parse CSV data
     */
    parseCSV(csvText, sourceName) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const studies = [];
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            if (values.length < headers.length) continue;
            
            const study = {
                source: sourceName,
                originalIndex: i
            };
            
            headers.forEach((header, index) => {
                study[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
            });
            
            // Normalize key fields
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
            study.designation = study.designation || study.Designation || study.Rank || '';
            
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
     * Create unique key for study
     */
    createStudyKey(study) {
        const title = (study.title || '').toLowerCase().trim();
        const year = study.year || '';
        const firstAuthor = (study.authors || '').toLowerCase().trim().split(',')[0];
        
        return `${title}_${year}_${firstAuthor}`;
    }

    /**
     * Remove duplicates and track them
     */
    removeDuplicates() {
        console.log('Removing duplicates...');
        
        const seen = new Map();
        const uniqueStudies = [];
        const duplicates = [];
        
        this.allStudies.forEach(study => {
            const key = this.createStudyKey(study);
            
            if (seen.has(key)) {
                // This is a duplicate
                const original = seen.get(key);
                duplicates.push({
                    duplicate: study,
                    original: original,
                    key: key
                });
                this.stats.duplicatesFound++;
            } else {
                // This is unique
                seen.set(key, study);
                uniqueStudies.push(study);
            }
        });
        
        this.uniqueStudies = uniqueStudies;
        this.duplicates = duplicates;
        this.stats.uniqueStudies = uniqueStudies.length;
        
        console.log(`Found ${this.stats.duplicatesFound} duplicates`);
        console.log(`Kept ${this.stats.uniqueStudies} unique studies`);
        
        return {
            unique: uniqueStudies,
            duplicates: duplicates
        };
    }

    /**
     * Generate clean CSV content
     */
    generateCleanCSV() {
        console.log('Generating clean CSV...');
        
        if (this.uniqueStudies.length === 0) {
            throw new Error('No unique studies to export');
        }
        
        // Get all unique headers from all studies
        const allHeaders = new Set();
        this.uniqueStudies.forEach(study => {
            Object.keys(study).forEach(key => {
                if (key !== 'source' && key !== 'originalIndex') {
                    allHeaders.add(key);
                }
            });
        });
        
        // Sort headers for consistency
        const sortedHeaders = Array.from(allHeaders).sort();
        
        // Add source column at the end
        const finalHeaders = [...sortedHeaders, 'Source'];
        
        // Generate CSV content
        let csvContent = finalHeaders.map(header => `"${header}"`).join(',') + '\n';
        
        this.uniqueStudies.forEach(study => {
            const row = finalHeaders.map(header => {
                if (header === 'Source') {
                    return `"${study.source}"`;
                }
                const value = study[header] || '';
                // Escape quotes in the value
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }

    /**
     * Generate duplicate report
     */
    generateDuplicateReport() {
        let report = '# Duplicate Studies Report\n\n';
        report += `**Generated:** ${new Date().toISOString()}\n\n`;
        report += `**Total Studies Loaded:** ${this.stats.totalLoaded}\n`;
        report += `**Duplicates Found:** ${this.stats.duplicatesFound}\n`;
        report += `**Unique Studies:** ${this.stats.uniqueStudies}\n\n`;
        
        report += '## Source Breakdown\n\n';
        Object.entries(this.stats.sourceBreakdown).forEach(([source, count]) => {
            report += `- **${source}:** ${count} studies\n`;
        });
        
        report += '\n## Duplicate Details\n\n';
        
        this.duplicates.forEach((dup, index) => {
            report += `### Duplicate ${index + 1}\n\n`;
            report += `**Key:** ${dup.key}\n\n`;
            report += `**Original (${dup.original.source}):**\n`;
            report += `- Title: ${dup.original.title}\n`;
            report += `- Year: ${dup.original.year}\n`;
            report += `- Authors: ${dup.original.authors}\n\n`;
            report += `**Duplicate (${dup.duplicate.source}):**\n`;
            report += `- Title: ${dup.duplicate.title}\n`;
            report += `- Year: ${dup.duplicate.year}\n`;
            report += `- Authors: ${dup.duplicate.authors}\n\n`;
            report += '---\n\n';
        });
        
        return report;
    }

    /**
     * Generate statistics report
     */
    generateStatsReport() {
        const stats = {
            totalLoaded: this.stats.totalLoaded,
            duplicatesFound: this.stats.duplicatesFound,
            uniqueStudies: this.stats.uniqueStudies,
            sourceBreakdown: this.stats.sourceBreakdown,
            yearRange: this.getYearRange(),
            countries: this.getCountryStats(),
            topics: this.getTopicStats()
        };
        
        return JSON.stringify(stats, null, 2);
    }

    /**
     * Get year range statistics
     */
    getYearRange() {
        const years = this.uniqueStudies
            .map(study => study.year)
            .filter(year => year !== null)
            .sort((a, b) => a - b);
        
        if (years.length === 0) {
            return { earliest: null, latest: null, span: 0 };
        }
        
        return {
            earliest: years[0],
            latest: years[years.length - 1],
            span: years[years.length - 1] - years[0] + 1
        };
    }

    /**
     * Get country statistics
     */
    getCountryStats() {
        const countries = {};
        this.uniqueStudies.forEach(study => {
            if (study.country) {
                countries[study.country] = (countries[study.country] || 0) + 1;
            }
        });
        return countries;
    }

    /**
     * Get topic statistics
     */
    getTopicStats() {
        const topics = {};
        this.uniqueStudies.forEach(study => {
            if (study.topic) {
                topics[study.topic] = (topics[study.topic] || 0) + 1;
            }
        });
        return topics;
    }

    /**
     * Run the complete process
     */
    async run() {
        console.log('Starting clean CSV generation...');
        
        try {
            // Load all three CSV files
            const csvFiles = [
                { path: '../Hydrogen Research Database - Primary.csv', name: 'Primary' },
                { path: '../Hydrogen Research Database - Engineering.csv', name: 'Engineering' },
                { path: '../Hydrogen Research Database - Secondary, Tertiary.csv', name: 'Secondary_Tertiary' }
            ];
            
            // Load all studies
            csvFiles.forEach(file => {
                const studies = this.loadCSVFile(file.path, file.name);
                this.allStudies = this.allStudies.concat(studies);
            });
            
            this.stats.totalLoaded = this.allStudies.length;
            console.log(`Total studies loaded: ${this.stats.totalLoaded}`);
            
            // Remove duplicates
            this.removeDuplicates();
            
            // Generate clean CSV
            const cleanCSV = this.generateCleanCSV();
            
            // Save files
            fs.writeFileSync('Hydrogen_Research_Database_Clean.csv', cleanCSV);
            console.log('Clean CSV saved: Hydrogen_Research_Database_Clean.csv');
            
            // Generate reports
            const duplicateReport = this.generateDuplicateReport();
            fs.writeFileSync('duplicate-report.md', duplicateReport);
            console.log('Duplicate report saved: duplicate-report.md');
            
            const statsReport = this.generateStatsReport();
            fs.writeFileSync('clean-csv-stats.json', statsReport);
            console.log('Statistics saved: clean-csv-stats.json');
            
            // Display summary
            this.displaySummary();
            
            return {
                cleanCSV: cleanCSV,
                stats: this.stats,
                duplicates: this.duplicates
            };
            
        } catch (error) {
            console.error('Error generating clean CSV:', error.message);
            throw error;
        }
    }

    /**
     * Display summary
     */
    displaySummary() {
        console.log('\n=== CLEAN CSV GENERATION SUMMARY ===');
        console.log(`Total Studies Loaded: ${this.stats.totalLoaded}`);
        console.log(`Duplicates Found: ${this.stats.duplicatesFound}`);
        console.log(`Unique Studies: ${this.stats.uniqueStudies}`);
        console.log(`Deduplication Rate: ${Math.round((this.stats.duplicatesFound / this.stats.totalLoaded) * 100)}%`);
        
        console.log('\n=== SOURCE BREAKDOWN ===');
        Object.entries(this.stats.sourceBreakdown).forEach(([source, count]) => {
            console.log(`${source}: ${count} studies`);
        });
        
        const yearRange = this.getYearRange();
        console.log('\n=== YEAR RANGE ===');
        console.log(`Earliest: ${yearRange.earliest}`);
        console.log(`Latest: ${yearRange.latest}`);
        console.log(`Span: ${yearRange.span} years`);
        
        console.log('\n=== FILES GENERATED ===');
        console.log('• Hydrogen_Research_Database_Clean.csv (Clean, deduplicated data)');
        console.log('• duplicate-report.md (Detailed duplicate analysis)');
        console.log('• clean-csv-stats.json (Statistics and metadata)');
    }
}

// Run the generator
async function main() {
    const generator = new CleanCSVGenerator();
    await generator.run();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = CleanCSVGenerator; 