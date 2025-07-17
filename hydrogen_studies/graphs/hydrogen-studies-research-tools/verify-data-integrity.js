const fs = require('fs');

class DataIntegrityVerifier {
    constructor() {
        this.originalData = [];
        this.cleanData = [];
        this.stats = {
            originalTotal: 0,
            cleanTotal: 0,
            duplicatesFound: 0,
            dataLoss: false,
            issues: []
        };
    }

    loadCSVFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) return [];
            
            // Parse headers
            const headers = this.parseCSVLine(lines[0]);
            const studies = [];
            
            // Parse data rows
            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length >= headers.length) {
                    const study = {};
                    headers.forEach((header, index) => {
                        study[header] = values[index] || '';
                    });
                    studies.push(study);
                }
            }
            
            return studies;
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

    createStudyKey(study) {
        const title = (study.title || study.Title || '').toLowerCase().trim();
        const year = study.year || study['Publish Year'] || '';
        const firstAuthor = (study.firstAuthor || study['First Author'] || '').toLowerCase().trim();
        
        return `${title}_${year}_${firstAuthor}`;
    }

    verifyDataIntegrity() {
        console.log('🔍 Verifying data integrity...\n');
        
        // Load original data from all three files
        const originalFiles = [
            '../Hydrogen Research Database - Primary.csv',
            '../Hydrogen Research Database - Engineering.csv',
            '../Hydrogen Research Database - Secondary, Tertiary.csv'
        ];
        
        originalFiles.forEach(file => {
            const studies = this.loadCSVFile(file);
            this.originalData = this.originalData.concat(studies);
            console.log(`📁 Loaded ${studies.length} studies from ${file}`);
        });
        
        // Load clean data
        this.cleanData = this.loadCSVFile('Hydrogen_Research_Database_Clean.csv');
        console.log(`📁 Loaded ${this.cleanData.length} studies from clean CSV\n`);
        
        this.stats.originalTotal = this.originalData.length;
        this.stats.cleanTotal = this.cleanData.length;
        
        // Check for data loss
        const originalKeys = new Set();
        const cleanKeys = new Set();
        
        this.originalData.forEach(study => {
            originalKeys.add(this.createStudyKey(study));
        });
        
        this.cleanData.forEach(study => {
            cleanKeys.add(this.createStudyKey(study));
        });
        
        // Find missing studies
        const missingStudies = [];
        originalKeys.forEach(key => {
            if (!cleanKeys.has(key)) {
                missingStudies.push(key);
            }
        });
        
        // Find extra studies in clean data
        const extraStudies = [];
        cleanKeys.forEach(key => {
            if (!originalKeys.has(key)) {
                extraStudies.push(key);
            }
        });
        
        // Calculate duplicates
        const originalKeyArray = Array.from(originalKeys);
        const duplicateKeys = originalKeyArray.filter((key, index) => 
            originalKeyArray.indexOf(key) !== index
        );
        
        this.stats.duplicatesFound = duplicateKeys.length;
        
        // Report results
        console.log('📊 DATA INTEGRITY REPORT');
        console.log('========================');
        console.log(`Original studies: ${this.stats.originalTotal}`);
        console.log(`Clean studies: ${this.stats.cleanTotal}`);
        console.log(`Duplicates removed: ${this.stats.duplicatesFound}`);
        console.log(`Expected clean count: ${this.stats.originalTotal - this.stats.duplicatesFound}`);
        console.log(`Actual clean count: ${this.stats.cleanTotal}`);
        
        if (missingStudies.length > 0) {
            console.log(`\n❌ MISSING STUDIES (${missingStudies.length}):`);
            missingStudies.slice(0, 5).forEach(key => console.log(`  - ${key}`));
            if (missingStudies.length > 5) {
                console.log(`  ... and ${missingStudies.length - 5} more`);
            }
            this.stats.dataLoss = true;
            this.stats.issues.push(`Missing ${missingStudies.length} studies`);
        }
        
        if (extraStudies.length > 0) {
            console.log(`\n⚠️  EXTRA STUDIES (${extraStudies.length}):`);
            extraStudies.slice(0, 5).forEach(key => console.log(`  - ${key}`));
            if (extraStudies.length > 5) {
                console.log(`  ... and ${extraStudies.length - 5} more`);
            }
            this.stats.issues.push(`Extra ${extraStudies.length} studies`);
        }
        
        if (missingStudies.length === 0 && extraStudies.length === 0) {
            console.log('\n✅ NO DATA LOSS DETECTED');
            console.log('All original studies are present in the clean data');
        }
        
        // Verify link preservation
        const originalWithLinks = this.originalData.filter(study => {
            const link = study.doi || study['DOI/PMID/Link'] || study.DOI || '';
            return link.trim() !== '' && link.trim() !== 'N/A' && link.trim() !== 'n/a';
        }).length;
        
        const cleanWithLinks = this.cleanData.filter(study => {
            const link = study.doi || study['DOI/PMID/Link'] || study.DOI || '';
            return link.trim() !== '' && link.trim() !== 'N/A' && link.trim() !== 'n/a';
        }).length;
        
        console.log(`\n🔗 LINK PRESERVATION:`);
        console.log(`Original studies with links: ${originalWithLinks}`);
        console.log(`Clean studies with links: ${cleanWithLinks}`);
        
        if (originalWithLinks === cleanWithLinks) {
            console.log('✅ All links preserved');
        } else {
            console.log('❌ Some links may have been lost');
            this.stats.issues.push(`Link count mismatch: ${originalWithLinks} vs ${cleanWithLinks}`);
        }
        
        return this.stats;
    }
}

// Run verification
const verifier = new DataIntegrityVerifier();
const results = verifier.verifyDataIntegrity();

// Save results
fs.writeFileSync('data-integrity-report.json', JSON.stringify(results, null, 2));
console.log('\n📄 Report saved to data-integrity-report.json'); 