const fs = require('fs');

class PrimaryStudiesFixer {
    constructor() {
        this.studies = [];
        this.stats = {
            totalLines: 0,
            validStudies: 0,
            invalidLines: 0,
            issues: []
        };
    }

    parseCSVContent(content) {
        const lines = [];
        let currentLine = '';
        let inQuotes = false;
        
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const nextChar = content[i + 1];
            
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    currentLine += '""';
                    i++; // Skip next quote
                } else {
                    // Regular quote
                    inQuotes = !inQuotes;
                    currentLine += char;
                }
            } else if (char === '\n' && !inQuotes) {
                // End of line (not in quotes)
                if (currentLine.trim()) {
                    lines.push(currentLine.trim());
                }
                currentLine = '';
            } else {
                currentLine += char;
            }
        }
        
        // Add the last line if it exists
        if (currentLine.trim()) {
            lines.push(currentLine.trim());
        }
        
        return lines;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '""';
                    i++; // Skip next quote
                } else {
                    // Regular quote
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    loadPrimaryCSV(filePath) {
        console.log('🔍 Loading Primary CSV with multi-line parser...');
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Parse the entire content to handle multi-line fields
            const lines = this.parseCSVContent(content);
            
            this.stats.totalLines = lines.length;
            console.log(`📁 Total lines in file: ${lines.length}`);
            
            if (lines.length === 0) {
                throw new Error('Empty CSV file');
            }
            
            // Parse headers
            const headers = this.parseCSVLine(lines[0]);
            console.log(`📋 Headers found: ${headers.length}`);
            console.log('Headers:', headers);
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                try {
                    const values = this.parseCSVLine(lines[i]);
                    
                    if (values.length >= headers.length) {
                        const study = {};
                        headers.forEach((header, index) => {
                            study[header] = values[index] || '';
                        });
                        
                        // Validate that this is a real study (has title or ID)
                        if (study.Title && study.Title.trim() !== '' || study.ID && study.ID.trim() !== '') {
                            this.studies.push(study);
                        } else {
                            this.stats.invalidLines++;
                            this.stats.issues.push(`Line ${i + 1}: Missing title or ID`);
                        }
                    } else {
                        this.stats.invalidLines++;
                        this.stats.issues.push(`Line ${i + 1}: Insufficient columns (${values.length} vs ${headers.length})`);
                    }
                } catch (error) {
                    this.stats.invalidLines++;
                    this.stats.issues.push(`Line ${i + 1}: Parse error - ${error.message}`);
                }
            }
            
            this.stats.validStudies = this.studies.length;
            
            console.log(`✅ Successfully parsed ${this.stats.validStudies} studies`);
            console.log(`❌ Invalid lines: ${this.stats.invalidLines}`);
            
            if (this.stats.issues.length > 0) {
                console.log('\n⚠️  Issues found:');
                this.stats.issues.slice(0, 10).forEach(issue => console.log(`  - ${issue}`));
                if (this.stats.issues.length > 10) {
                    console.log(`  ... and ${this.stats.issues.length - 10} more issues`);
                }
            }
            
            return this.studies;
            
        } catch (error) {
            console.error(`❌ Error loading ${filePath}:`, error.message);
            throw error;
        }
    }

    generateFixedCSV() {
        console.log('Generating fixed Primary Studies CSV...');
        
        if (this.studies.length === 0) {
            throw new Error('No studies to export');
        }
        
        // Get all unique headers from studies
        const allHeaders = new Set();
        this.studies.forEach(study => {
            Object.keys(study).forEach(key => {
                allHeaders.add(key);
            });
        });
        
        // Sort headers for consistency
        const sortedHeaders = Array.from(allHeaders).sort();
        
        // Generate CSV content
        let csvContent = sortedHeaders.map(header => `"${header}"`).join(',') + '\n';
        
        this.studies.forEach(study => {
            const row = sortedHeaders.map(header => {
                const value = study[header] || '';
                // Escape quotes in the value
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }

    generateStatistics() {
        const stats = {
            totalLines: this.stats.totalLines,
            validStudies: this.stats.validStudies,
            invalidLines: this.stats.invalidLines,
            yearRange: this.getYearRange(),
            countries: this.getCountryStats(),
            topics: this.getTopicStats(),
            studiesWithLinks: this.getLinkStats()
        };
        
        return stats;
    }

    getYearRange() {
        const years = this.studies
            .map(study => study['Publish Year'])
            .filter(year => year && year !== '' && !isNaN(year))
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

    getCountryStats() {
        const countries = {};
        this.studies.forEach(study => {
            const country = study.Country;
            if (country && country.trim() !== '') {
                countries[country] = (countries[country] || 0) + 1;
            }
        });
        return countries;
    }

    getTopicStats() {
        const topics = {};
        this.studies.forEach(study => {
            const topic = study['Primary Topic'];
            if (topic && topic.trim() !== '') {
                topics[topic] = (topics[topic] || 0) + 1;
            }
        });
        return topics;
    }

    getLinkStats() {
        const studiesWithLinks = this.studies.filter(study => {
            const link = study['DOI/PMID/Link'] || '';
            return link.trim() !== '' && link.trim() !== 'N/A' && link.trim() !== 'n/a';
        }).length;
        
        return studiesWithLinks;
    }

    async fixPrimaryStudies() {
        console.log('🔧 Fixing Primary Studies Count...\n');
        
        try {
            // Load primary studies with robust parser
            this.loadPrimaryCSV('../Hydrogen Research Database - Primary.csv');
            
            // Generate fixed CSV
            const fixedCSV = this.generateFixedCSV();
            
            // Save fixed file
            fs.writeFileSync('Hydrogen_Research_Database_Primary_Studies_Fixed.csv', fixedCSV);
            console.log('💾 Saved: Hydrogen_Research_Database_Primary_Studies_Fixed.csv');
            
            // Generate statistics
            const stats = this.generateStatistics();
            fs.writeFileSync('primary-studies-fix-stats.json', JSON.stringify(stats, null, 2));
            console.log('💾 Saved: primary-studies-fix-stats.json');
            
            // Display summary
            this.displaySummary(stats);
            
            return {
                studies: this.studies,
                stats: stats
            };
            
        } catch (error) {
            console.error('❌ Error fixing primary studies:', error.message);
            throw error;
        }
    }

    displaySummary(stats) {
        console.log('\n📊 PRIMARY STUDIES FIX SUMMARY');
        console.log('==============================');
        console.log(`Total lines in file: ${stats.totalLines}`);
        console.log(`Valid studies: ${stats.validStudies}`);
        console.log(`Invalid lines: ${stats.invalidLines}`);
        console.log(`Year Range: ${stats.yearRange.earliest} - ${stats.yearRange.latest}`);
        console.log(`Countries: ${Object.keys(stats.countries).length}`);
        console.log(`Topics: ${Object.keys(stats.topics).length}`);
        console.log(`Studies with Links: ${stats.studiesWithLinks}`);
        
        if (stats.validStudies >= 1500) {
            console.log('\n✅ SUCCESS: Found expected number of studies!');
        } else {
            console.log('\n⚠️  WARNING: Study count is lower than expected');
        }
    }
}

// Run fix
const fixer = new PrimaryStudiesFixer();
fixer.fixPrimaryStudies().then(() => {
    console.log('\n✅ Primary studies count fix completed!');
}).catch(error => {
    console.error('\n❌ Primary studies count fix failed:', error.message);
}); 