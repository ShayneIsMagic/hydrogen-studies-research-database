/**
 * Data Cleanup Processor for Hydrogen Studies
 * Takes existing CSV and properly separates content from studies
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class DataCleanupProcessor {
    constructor() {
        this.inputFile = 'final_topics_content_20250717_143938.csv';
        this.outputFile = 'cleaned_topics_content.csv';
        this.processedData = [];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
    }

    /**
     * Read and parse the existing CSV file
     */
    readCSVFile(filename) {
        try {
            const filePath = path.join(__dirname, filename);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Parse CSV (simple parsing for this case)
            const data = [];
            for (let i = 1; i < lines.length; i++) { // Skip header
                const line = lines[i].trim();
                if (!line) continue;
                
                // Simple CSV parsing (handles quoted fields)
                const fields = this.parseCSVLine(line);
                if (fields.length >= 2) {
                    data.push({
                        topic: fields[0],
                        content: fields[1]
                    });
                }
            }
            
            this.log(`Read ${data.length} records from ${filename}`);
            return data;
        } catch (error) {
            this.log(`Error reading CSV file: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Simple CSV line parser
     */
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    // Escaped quote
                    current += '"';
                    i++; // Skip next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last field
        fields.push(current.trim());
        
        return fields;
    }

    /**
     * Process each record to separate content from studies
     */
    processRecord(record) {
        const topic = record.topic;
        const rawContent = record.content;
        
        // Extract clean content and studies
        const { content, studies } = this.separateContentFromStudies(rawContent);
        
        return {
            topic: topic,
            content: content,
            studies: studies
        };
    }

    /**
     * Separate content from studies in the raw text
     */
    separateContentFromStudies(rawText) {
        let content = '';
        let studies = [];
        
        // Split by "Studies" keyword to separate content from studies
        const parts = rawText.split(/Studies/i);
        
        if (parts.length >= 2) {
            // First part is content
            content = this.cleanContent(parts[0]);
            
            // Second part contains studies
            const studiesText = parts[1];
            studies = this.extractStudies(studiesText);
        } else {
            // No "Studies" keyword found, try to separate by HTML patterns
            const { cleanContent, extractedStudies } = this.separateByHTMLPatterns(rawText);
            content = cleanContent;
            studies = extractedStudies;
        }
        
        return { content, studies };
    }

    /**
     * Clean content by removing HTML tags and normalizing text
     */
    cleanContent(text) {
        if (!text) return '';
        
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Extract studies from text that contains HTML links
     */
    extractStudies(text) {
        if (!text) return [];
        
        const studies = [];
        
        // Look for study links
        const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        
        while ((match = linkPattern.exec(text)) !== null) {
            const href = match[1];
            const linkText = match[2].trim();
            
            // Filter for likely study links
            if (linkText && 
                (href.includes('study') || 
                 href.includes('research') || 
                 href.includes('article') ||
                 href.includes('/202') || // Year patterns
                 href.includes('/201') ||
                 href.includes('/200'))) {
                
                const study = {
                    title: this.cleanText(linkText),
                    url: href,
                    authors: this.extractAuthors(linkText),
                    year: this.extractYear(linkText),
                    doi: this.extractDOI(linkText)
                };
                
                // Avoid duplicates
                const existingStudy = studies.find(s => s.title === study.title);
                if (!existingStudy) {
                    studies.push(study);
                }
            }
        }
        
        return studies;
    }

    /**
     * Separate content and studies using HTML patterns
     */
    separateByHTMLPatterns(text) {
        let content = text;
        const studies = [];
        
        // Remove study links from content and add them to studies
        const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        
        while ((match = linkPattern.exec(text)) !== null) {
            const href = match[1];
            const linkText = match[2].trim();
            
            // If it looks like a study link, extract it
            if (linkText && 
                (href.includes('study') || 
                 href.includes('research') || 
                 href.includes('article') ||
                 href.includes('/202') || 
                 href.includes('/201') || 
                 href.includes('/200'))) {
                
                const study = {
                    title: this.cleanText(linkText),
                    url: href,
                    authors: this.extractAuthors(linkText),
                    year: this.extractYear(linkText),
                    doi: this.extractDOI(linkText)
                };
                
                // Avoid duplicates
                const existingStudy = studies.find(s => s.title === study.title);
                if (!existingStudy) {
                    studies.push(study);
                }
            }
        }
        
        // Clean the content by removing all HTML tags
        content = this.cleanContent(content);
        
        return { cleanContent: content, extractedStudies: studies };
    }

    /**
     * Clean text by removing HTML tags and normalizing whitespace
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Extract authors from study title
     */
    extractAuthors(text) {
        const authorPatterns = [
            /by\s+([^,]+)/i,
            /authors?:\s*([^,]+)/i,
            /author:\s*([^,]+)/i
        ];
        
        for (const pattern of authorPatterns) {
            const match = text.match(pattern);
            if (match) {
                return this.cleanText(match[1]);
            }
        }
        
        return '';
    }

    /**
     * Extract year from study title
     */
    extractYear(text) {
        const yearMatch = text.match(/(19|20)\d{2}/);
        return yearMatch ? yearMatch[0] : '';
    }

    /**
     * Extract DOI from study title
     */
    extractDOI(text) {
        const doiPatterns = [
            /doi[^:]*:\s*([^\s<]+)/i,
            /10\.\d{4,}\/[^\s<]+/i
        ];
        
        for (const pattern of doiPatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1] || match[0];
            }
        }
        
        return '';
    }

    /**
     * Convert processed data to CSV format
     */
    convertToCSV(data) {
        const csvRows = [];
        
        // Add header
        csvRows.push('Topic,Content,Studies');
        
        // Add data rows
        for (const item of data) {
            const topic = item.topic.replace(/"/g, '""'); // Escape quotes
            const content = item.content.replace(/"/g, '""'); // Escape quotes
            
            // Format studies as a clean list
            const studiesList = item.studies.map(study => {
                let studyText = study.title;
                if (study.authors) studyText += ` (${study.authors})`;
                if (study.year) studyText += ` - ${study.year}`;
                return studyText;
            }).join('; ');
            
            const studies = studiesList.replace(/"/g, '""'); // Escape quotes
            
            csvRows.push(`"${topic}","${content}","${studies}"`);
        }
        
        return csvRows.join('\n');
    }

    /**
     * Save CSV to file
     */
    saveCSVToFile(csvContent, filename) {
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, csvContent, 'utf8');
        this.log(`CSV file saved: ${filePath}`);
        return filePath;
    }

    /**
     * Main processing function
     */
    process() {
        this.log('Starting data cleanup process...');
        
        // Step 1: Read the existing CSV file
        this.log('Step 1: Reading existing CSV file...');
        const rawData = this.readCSVFile(this.inputFile);
        
        if (rawData.length === 0) {
            this.log('No data found in input file', 'error');
            return false;
        }
        
        // Step 2: Process each record
        this.log('Step 2: Processing records...');
        let totalStudies = 0;
        
        for (let i = 0; i < rawData.length; i++) {
            const record = rawData[i];
            this.log(`Processing record ${i + 1}/${rawData.length}: ${record.topic}`);
            
            const processedRecord = this.processRecord(record);
            this.processedData.push(processedRecord);
            
            totalStudies += processedRecord.studies.length;
            this.log(`Found ${processedRecord.studies.length} studies for ${record.topic}`);
        }
        
        // Step 3: Generate output CSV
        this.log('Step 3: Generating cleaned CSV...');
        const csvContent = this.convertToCSV(this.processedData);
        
        // Step 4: Save the cleaned CSV file
        this.log('Step 4: Saving cleaned CSV file...');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputFilename = `cleaned_topics_content_${timestamp}.csv`;
        this.saveCSVToFile(csvContent, outputFilename);
        
        this.log(`Cleanup complete! Processed ${rawData.length} topics with ${totalStudies} total studies`);
        
        return {
            success: true,
            topicsCount: rawData.length,
            totalStudies: totalStudies,
            filename: outputFilename,
            data: this.processedData
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataCleanupProcessor;
}

// Run if called directly
if (require.main === module) {
    const processor = new DataCleanupProcessor();
    
    const result = processor.process();
    
    if (result && result.success) {
        console.log('\n✅ Data cleanup completed successfully!');
        console.log(`📊 Topics processed: ${result.topicsCount}`);
        console.log(`📚 Total studies found: ${result.totalStudies}`);
        console.log(`📁 Output file: ${result.filename}`);
        console.log('\n📋 The cleaned CSV now contains:');
        console.log('   - Topic: Clean topic names');
        console.log('   - Content: Clean descriptions without HTML tags or links');
        console.log('   - Studies: List of study titles with authors and years');
    } else {
        console.log('\n❌ Data cleanup failed!');
    }
} 