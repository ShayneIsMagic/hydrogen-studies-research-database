/**
 * CSV Converter for EchoWater
 * Converts extracted Hydrogen Studies data into proper CSV format
 * Matches existing CSV structure and preserves hyperlinks
 */

class EchoWaterCSVConverter {
    constructor() {
        this.csvHeaders = [
            'Title',
            'Authors',
            'Year',
            'Journal',
            'Abstract',
            'DOI',
            'URL',
            'Topic',
            'Organism',
            'Body System',
            'Country',
            'Outcome',
            'Designation'
        ];
    }

    /**
     * Convert raw extracted data to CSV format
     */
    convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('No data to convert');
            return '';
        }

        // Start with headers
        const csvRows = [this.csvHeaders.join(',')];

        // Process each study
        data.forEach(study => {
            const row = this.formatStudyRow(study);
            csvRows.push(row);
        });

        return csvRows.join('\n');
    }

    /**
     * Format a single study row
     */
    formatStudyRow(study) {
        const values = this.csvHeaders.map(header => {
            const fieldName = this.getFieldName(header);
            let value = study[fieldName] || '';
            
            // Clean and format the value
            value = this.cleanValue(value);
            
            // Escape quotes and wrap in quotes
            const escaped = value.toString().replace(/"/g, '""');
            return `"${escaped}"`;
        });

        return values.join(',');
    }

    /**
     * Get the field name from header
     */
    getFieldName(header) {
        const fieldMap = {
            'Title': 'title',
            'Authors': 'authors',
            'Year': 'year',
            'Journal': 'journal',
            'Abstract': 'abstract',
            'DOI': 'doi',
            'URL': 'url',
            'Topic': 'topic',
            'Organism': 'organism',
            'Body System': 'bodySystem',
            'Country': 'country',
            'Outcome': 'outcome',
            'Designation': 'designation'
        };
        return fieldMap[header] || header.toLowerCase().replace(/\s+/g, '');
    }

    /**
     * Clean and format a value
     */
    cleanValue(value) {
        if (!value) return '';
        
        // Convert to string
        let cleaned = value.toString();
        
        // Remove extra whitespace
        cleaned = cleaned.trim();
        
        // Remove HTML tags if present
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        
        // Decode HTML entities
        cleaned = this.decodeHtmlEntities(cleaned);
        
        // Limit abstract length if too long
        if (cleaned.length > 1000) {
            cleaned = cleaned.substring(0, 1000) + '...';
        }
        
        return cleaned;
    }

    /**
     * Decode common HTML entities
     */
    decodeHtmlEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' ',
            '&ndash;': '–',
            '&mdash;': '—',
            '&hellip;': '...'
        };
        
        return text.replace(/&[^;]+;/g, entity => entities[entity] || entity);
    }

    /**
     * Export CSV file
     */
    exportCSV(data, filename = null) {
        const csv = this.convertToCSV(data);
        
        if (!filename) {
            filename = `hydrogen-studies-echowater-${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`CSV exported: ${filename}`);
        return filename;
    }

    /**
     * Validate CSV data
     */
    validateData(data) {
        const issues = [];
        
        if (!Array.isArray(data)) {
            issues.push('Data is not an array');
            return issues;
        }
        
        data.forEach((study, index) => {
            if (!study.title) {
                issues.push(`Study ${index + 1}: Missing title`);
            }
            
            if (!study.year) {
                issues.push(`Study ${index + 1}: Missing year`);
            }
            
            if (!study.authors) {
                issues.push(`Study ${index + 1}: Missing authors`);
            }
        });
        
        return issues;
    }

    /**
     * Get CSV statistics
     */
    getCSVStats(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { totalStudies: 0 };
        }

        const stats = {
            totalStudies: data.length,
            fieldsWithData: {},
            yearRange: {
                earliest: Math.min(...data.map(s => s.year).filter(Boolean)),
                latest: Math.max(...data.map(s => s.year).filter(Boolean))
            }
        };

        // Count studies with data in each field
        this.csvHeaders.forEach(header => {
            const fieldName = this.getFieldName(header);
            const count = data.filter(study => study[fieldName] && study[fieldName].toString().trim()).length;
            stats.fieldsWithData[header] = count;
        });

        return stats;
    }

    /**
     * Create sample CSV for testing
     */
    createSampleCSV() {
        const sampleData = [
            {
                title: 'Hydrogen-rich water improves acne vulgaris in clinical patients',
                authors: 'Zhang Y, Liu B, Chen X',
                year: 2023,
                journal: 'Journal of Dermatology',
                abstract: 'This study investigated the effects of hydrogen-rich water on acne vulgaris...',
                doi: '10.1000/sample-doi',
                url: 'https://hydrogenstudies.com/study/123',
                topic: 'Acne',
                organism: 'Human',
                bodySystem: 'Skin',
                country: 'China',
                outcome: 'Positive',
                designation: 'Clinical Trial'
            },
            {
                title: 'Molecular hydrogen reduces oxidative stress in rat models',
                authors: 'Smith A, Johnson B, Williams C',
                year: 2022,
                journal: 'Free Radical Research',
                abstract: 'This study examined the antioxidant effects of molecular hydrogen...',
                doi: '10.1000/sample-doi-2',
                url: 'https://hydrogenstudies.com/study/456',
                topic: 'Oxidative Stress',
                organism: 'Rat',
                bodySystem: 'Whole Body',
                country: 'United States',
                outcome: 'Positive',
                designation: 'Laboratory Study'
            }
        ];

        return this.convertToCSV(sampleData);
    }
}

// Browser-compatible usage
if (typeof window !== 'undefined') {
    window.EchoWaterCSVConverter = EchoWaterCSVConverter;
}

// Node.js-compatible usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EchoWaterCSVConverter;
} 