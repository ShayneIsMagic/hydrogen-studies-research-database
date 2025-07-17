const fs = require('fs');

class DatabaseRestructurer {
    constructor() {
        this.primaryStudies = [];
        this.additionalResources = [];
        this.stats = {
            primaryStudies: 0,
            additionalResources: 0,
            totalRecords: 0
        };
    }

    loadCSVFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return [];
            
            // Parse headers
            const headers = this.parseCSVLine(lines[0]);
            const records = [];
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= headers.length) {
                    const record = {};
                    headers.forEach((header, index) => {
                        record[header] = values[index] || '';
                    });
                    records.push(record);
                }
            }
            
            return records;
        } catch (error) {
            console.error(`Error loading ${filePath}:`, error.message);
            return [];
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
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

    generatePrimaryStudiesCSV() {
        console.log('Generating Primary Studies CSV...');
        
        if (this.primaryStudies.length === 0) {
            throw new Error('No primary studies to export');
        }
        
        // Get all unique headers from primary studies
        const allHeaders = new Set();
        this.primaryStudies.forEach(study => {
            Object.keys(study).forEach(key => {
                allHeaders.add(key);
            });
        });
        
        // Sort headers for consistency
        const sortedHeaders = Array.from(allHeaders).sort();
        
        // Generate CSV content
        let csvContent = sortedHeaders.map(header => `"${header}"`).join(',') + '\n';
        
        this.primaryStudies.forEach(study => {
            const row = sortedHeaders.map(header => {
                const value = study[header] || '';
                // Escape quotes in the value
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }

    generateAdditionalResourcesCSV() {
        console.log('Generating Additional Resources CSV...');
        
        if (this.additionalResources.length === 0) {
            throw new Error('No additional resources to export');
        }
        
        // Get all unique headers from additional resources
        const allHeaders = new Set();
        this.additionalResources.forEach(resource => {
            Object.keys(resource).forEach(key => {
                allHeaders.add(key);
            });
        });
        
        // Sort headers for consistency
        const sortedHeaders = Array.from(allHeaders).sort();
        
        // Add Resource Type column
        const finalHeaders = [...sortedHeaders, 'Resource Type'];
        
        // Generate CSV content
        let csvContent = finalHeaders.map(header => `"${header}"`).join(',') + '\n';
        
        this.additionalResources.forEach(resource => {
            const row = finalHeaders.map(header => {
                if (header === 'Resource Type') {
                    return `"Additional Resource"`;
                }
                const value = resource[header] || '';
                // Escape quotes in the value
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });
        
        return csvContent;
    }

    generateStatistics() {
        const stats = {
            primaryStudies: this.primaryStudies.length,
            additionalResources: this.additionalResources.length,
            totalRecords: this.primaryStudies.length + this.additionalResources.length,
            yearRange: this.getYearRange(),
            countries: this.getCountryStats(),
            topics: this.getTopicStats(),
            resourcesWithLinks: this.getLinkStats()
        };
        
        return stats;
    }

    getYearRange() {
        const years = this.primaryStudies
            .map(study => study.year || study['Publish Year'])
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
        this.primaryStudies.forEach(study => {
            const country = study.country || study.Country;
            if (country && country.trim() !== '') {
                countries[country] = (countries[country] || 0) + 1;
            }
        });
        return countries;
    }

    getTopicStats() {
        const topics = {};
        this.primaryStudies.forEach(study => {
            const topic = study.topic || study.Topic || study['Primary Topic'];
            if (topic && topic.trim() !== '') {
                topics[topic] = (topics[topic] || 0) + 1;
            }
        });
        return topics;
    }

    getLinkStats() {
        const primaryWithLinks = this.primaryStudies.filter(study => {
            const link = study.doi || study['DOI/PMID/Link'] || study.DOI || '';
            return link.trim() !== '' && link.trim() !== 'N/A' && link.trim() !== 'n/a';
        }).length;
        
        const resourcesWithLinks = this.additionalResources.filter(resource => {
            const link = resource.doi || resource['DOI/PMID/Link'] || resource.DOI || '';
            return link.trim() !== '' && link.trim() !== 'N/A' && link.trim() !== 'n/a';
        }).length;
        
        return {
            primaryStudies: primaryWithLinks,
            additionalResources: resourcesWithLinks
        };
    }

    generateReport() {
        const stats = this.generateStatistics();
        
        let report = '# Hydrogen Research Database Restructure Report\n\n';
        report += `**Generated:** ${new Date().toISOString()}\n\n`;
        
        report += '## Database Structure\n\n';
        report += `- **Primary Studies:** ${stats.primaryStudies} studies (main research database)\n`;
        report += `- **Additional Resources:** ${stats.additionalResources} resources (secondary/tertiary materials)\n`;
        report += `- **Total Records:** ${stats.totalRecords}\n\n`;
        
        report += '## Primary Studies Statistics\n\n';
        report += `- **Year Range:** ${stats.yearRange.earliest} - ${stats.yearRange.latest} (${stats.yearRange.span} years)\n`;
        report += `- **Studies with Links:** ${stats.resourcesWithLinks.primaryStudies}\n`;
        report += `- **Countries Represented:** ${Object.keys(stats.countries).length}\n`;
        report += `- **Research Topics:** ${Object.keys(stats.topics).length}\n\n`;
        
        report += '## Top Countries (Primary Studies)\n\n';
        const topCountries = Object.entries(stats.countries)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        topCountries.forEach(([country, count]) => {
            report += `- **${country}:** ${count} studies\n`;
        });
        
        report += '\n## Top Topics (Primary Studies)\n\n';
        const topTopics = Object.entries(stats.topics)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        topTopics.forEach(([topic, count]) => {
            report += `- **${topic}:** ${count} studies\n`;
        });
        
        report += '\n## Additional Resources\n\n';
        report += `- **Total Resources:** ${stats.additionalResources}\n`;
        report += `- **Resources with Links:** ${stats.resourcesWithLinks.additionalResources}\n`;
        
        return report;
    }

    async restructure() {
        console.log('🔄 Restructuring Hydrogen Research Database...\n');
        
        try {
            // Load Primary Studies (main database)
            console.log('📁 Loading Primary Studies...');
            this.primaryStudies = this.loadCSVFile('../Hydrogen Research Database - Primary.csv');
            console.log(`✅ Loaded ${this.primaryStudies.length} primary studies\n`);
            
            // Load Additional Resources (Secondary/Tertiary)
            console.log('📁 Loading Additional Resources...');
            this.additionalResources = this.loadCSVFile('../Hydrogen Research Database - Secondary, Tertiary.csv');
            console.log(`✅ Loaded ${this.additionalResources.length} additional resources\n`);
            
            // Note: Engineering data is excluded as requested
            
            // Generate restructured files
            const primaryCSV = this.generatePrimaryStudiesCSV();
            const additionalResourcesCSV = this.generateAdditionalResourcesCSV();
            
            // Save files
            fs.writeFileSync('Hydrogen_Research_Database_Primary_Studies.csv', primaryCSV);
            console.log('💾 Saved: Hydrogen_Research_Database_Primary_Studies.csv');
            
            fs.writeFileSync('Hydrogen_Research_Database_Additional_Resources.csv', additionalResourcesCSV);
            console.log('💾 Saved: Hydrogen_Research_Database_Additional_Resources.csv');
            
            // Generate statistics
            const stats = this.generateStatistics();
            fs.writeFileSync('restructured-database-stats.json', JSON.stringify(stats, null, 2));
            console.log('💾 Saved: restructured-database-stats.json');
            
            // Generate report
            const report = this.generateReport();
            fs.writeFileSync('restructure-report.md', report);
            console.log('💾 Saved: restructure-report.md');
            
            // Display summary
            this.displaySummary(stats);
            
            return {
                primaryStudies: this.primaryStudies,
                additionalResources: this.additionalResources,
                stats: stats
            };
            
        } catch (error) {
            console.error('❌ Error restructuring database:', error.message);
            throw error;
        }
    }

    displaySummary(stats) {
        console.log('\n📊 RESTRUCTURED DATABASE SUMMARY');
        console.log('================================');
        console.log(`Primary Studies: ${stats.primaryStudies}`);
        console.log(`Additional Resources: ${stats.additionalResources}`);
        console.log(`Total Records: ${stats.totalRecords}`);
        console.log(`Year Range: ${stats.yearRange.earliest} - ${stats.yearRange.latest}`);
        console.log(`Countries: ${Object.keys(stats.countries).length}`);
        console.log(`Topics: ${Object.keys(stats.topics).length}`);
        console.log(`Primary Studies with Links: ${stats.resourcesWithLinks.primaryStudies}`);
        console.log(`Additional Resources with Links: ${stats.resourcesWithLinks.additionalResources}`);
    }
}

// Run restructure
const restructurer = new DatabaseRestructurer();
restructurer.restructure().then(() => {
    console.log('\n✅ Database restructuring completed successfully!');
}).catch(error => {
    console.error('\n❌ Database restructuring failed:', error.message);
}); 