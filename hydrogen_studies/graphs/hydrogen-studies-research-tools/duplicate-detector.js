/**
 * Hydrogen Studies Database - Duplicate Detection System
 * Handles identification and prevention of duplicate research studies
 */

class DuplicateDetector {
    constructor() {
        this.existingStudies = new Map();
        this.duplicateThresholds = {
            titleSimilarity: 0.85,    // 85% title similarity
            doiExact: true,           // DOI must be exact match
            authorYearMatch: 0.9,     // 90% author + year similarity
            abstractSimilarity: 0.8   // 80% abstract similarity
        };
    }

    /**
     * Load existing studies for comparison
     * @param {Array} studies - Array of existing study objects
     */
    loadExistingStudies(studies) {
        this.existingStudies.clear();
        
        studies.forEach(study => {
            // Create multiple keys for different matching strategies
            const keys = this.generateStudyKeys(study);
            
            keys.forEach(key => {
                if (!this.existingStudies.has(key)) {
                    this.existingStudies.set(key, []);
                }
                this.existingStudies.get(key).push(study);
            });
        });
        
        console.log(`Loaded ${studies.length} existing studies for duplicate detection`);
    }

    /**
     * Generate multiple keys for a study to enable various matching strategies
     * @param {Object} study - Study object
     * @returns {Array} Array of keys
     */
    generateStudyKeys(study) {
        const keys = [];
        
        // DOI-based key (most reliable)
        if (study.doi && study.doi.trim()) {
            keys.push(`doi:${this.normalizeDOI(study.doi)}`);
        }
        
        // Title-based key
        if (study.title && study.title.trim()) {
            keys.push(`title:${this.normalizeTitle(study.title)}`);
        }
        
        // Author + Year + Journal key
        if (study.firstAuthor && study.year && study.journal) {
            const authorKey = `${study.firstAuthor.toLowerCase().trim()}_${study.year}_${study.journal.toLowerCase().trim()}`;
            keys.push(`author_year_journal:${authorKey}`);
        }
        
        // Title + Year key
        if (study.title && study.year) {
            const titleYearKey = `${this.normalizeTitle(study.title)}_${study.year}`;
            keys.push(`title_year:${titleYearKey}`);
        }
        
        return keys;
    }

    /**
     * Normalize DOI for comparison
     * @param {string} doi - DOI string
     * @returns {string} Normalized DOI
     */
    normalizeDOI(doi) {
        return doi.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^doi\.org\//, '');
    }

    /**
     * Normalize title for comparison
     * @param {string} title - Title string
     * @returns {string} Normalized title
     */
    normalizeTitle(title) {
        return title.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')  // Remove special characters
            .replace(/\s+/g, ' ')      // Normalize whitespace
            .substring(0, 100);        // Limit length for comparison
    }

    /**
     * Check for duplicates in new data
     * @param {Array} newStudies - Array of new study objects
     * @returns {Object} Duplicate detection results
     */
    detectDuplicates(newStudies) {
        const results = {
            totalNew: newStudies.length,
            duplicates: [],
            potentialDuplicates: [],
            unique: [],
            summary: {}
        };

        newStudies.forEach((newStudy, index) => {
            const duplicateCheck = this.checkStudyDuplicates(newStudy);
            
            if (duplicateCheck.isDuplicate) {
                results.duplicates.push({
                    newStudy,
                    existingStudy: duplicateCheck.existingStudy,
                    matchType: duplicateCheck.matchType,
                    confidence: duplicateCheck.confidence,
                    newIndex: index
                });
            } else if (duplicateCheck.isPotentialDuplicate) {
                results.potentialDuplicates.push({
                    newStudy,
                    existingStudy: duplicateCheck.existingStudy,
                    matchType: duplicateCheck.matchType,
                    confidence: duplicateCheck.confidence,
                    newIndex: index
                });
            } else {
                results.unique.push({
                    study: newStudy,
                    index: index
                });
            }
        });

        // Generate summary
        results.summary = {
            totalNew: results.totalNew,
            duplicates: results.duplicates.length,
            potentialDuplicates: results.potentialDuplicates.length,
            unique: results.unique.length,
            duplicateRate: ((results.duplicates.length / results.totalNew) * 100).toFixed(2) + '%'
        };

        return results;
    }

    /**
     * Check if a single study is a duplicate
     * @param {Object} newStudy - New study object
     * @returns {Object} Duplicate check results
     */
    checkStudyDuplicates(newStudy) {
        const result = {
            isDuplicate: false,
            isPotentialDuplicate: false,
            existingStudy: null,
            matchType: null,
            confidence: 0
        };

        // Check DOI match first (most reliable)
        if (newStudy.doi && newStudy.doi.trim()) {
            const doiKey = `doi:${this.normalizeDOI(newStudy.doi)}`;
            const doiMatches = this.existingStudies.get(doiKey);
            
            if (doiMatches && doiMatches.length > 0) {
                result.isDuplicate = true;
                result.existingStudy = doiMatches[0];
                result.matchType = 'DOI';
                result.confidence = 1.0;
                return result;
            }
        }

        // Check title + year + author combination
        if (newStudy.title && newStudy.year && newStudy.firstAuthor) {
            const authorKey = `${newStudy.firstAuthor.toLowerCase().trim()}_${newStudy.year}_${(newStudy.journal || '').toLowerCase().trim()}`;
            const authorMatches = this.existingStudies.get(`author_year_journal:${authorKey}`);
            
            if (authorMatches && authorMatches.length > 0) {
                result.isDuplicate = true;
                result.existingStudy = authorMatches[0];
                result.matchType = 'Author_Year_Journal';
                result.confidence = 0.95;
                return result;
            }
        }

        // Check title similarity
        if (newStudy.title && newStudy.title.trim()) {
            const titleSimilarity = this.findTitleSimilarity(newStudy);
            if (titleSimilarity.bestMatch && titleSimilarity.similarity >= this.duplicateThresholds.titleSimilarity) {
                result.isDuplicate = true;
                result.existingStudy = titleSimilarity.bestMatch;
                result.matchType = 'Title_Similarity';
                result.confidence = titleSimilarity.similarity;
                return result;
            } else if (titleSimilarity.bestMatch && titleSimilarity.similarity >= 0.7) {
                result.isPotentialDuplicate = true;
                result.existingStudy = titleSimilarity.bestMatch;
                result.matchType = 'Title_Similarity';
                result.confidence = titleSimilarity.similarity;
            }
        }

        // Check abstract similarity for potential duplicates
        if (newStudy.abstract && newStudy.abstract.trim()) {
            const abstractSimilarity = this.findAbstractSimilarity(newStudy);
            if (abstractSimilarity.bestMatch && abstractSimilarity.similarity >= this.duplicateThresholds.abstractSimilarity) {
                if (!result.isPotentialDuplicate) {
                    result.isPotentialDuplicate = true;
                    result.existingStudy = abstractSimilarity.bestMatch;
                    result.matchType = 'Abstract_Similarity';
                    result.confidence = abstractSimilarity.similarity;
                }
            }
        }

        return result;
    }

    /**
     * Find similar titles in existing studies
     * @param {Object} newStudy - New study object
     * @returns {Object} Similarity results
     */
    findTitleSimilarity(newStudy) {
        const normalizedNewTitle = this.normalizeTitle(newStudy.title);
        let bestMatch = null;
        let bestSimilarity = 0;

        // Get all existing studies
        const allExistingStudies = new Set();
        this.existingStudies.forEach(studies => {
            studies.forEach(study => allExistingStudies.add(study));
        });

        allExistingStudies.forEach(existingStudy => {
            if (existingStudy.title) {
                const normalizedExistingTitle = this.normalizeTitle(existingStudy.title);
                const similarity = this.calculateSimilarity(normalizedNewTitle, normalizedExistingTitle);
                
                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = existingStudy;
                }
            }
        });

        return { bestMatch, similarity: bestSimilarity };
    }

    /**
     * Find similar abstracts in existing studies
     * @param {Object} newStudy - New study object
     * @returns {Object} Similarity results
     */
    findAbstractSimilarity(newStudy) {
        const normalizedNewAbstract = this.normalizeAbstract(newStudy.abstract);
        let bestMatch = null;
        let bestSimilarity = 0;

        // Get all existing studies
        const allExistingStudies = new Set();
        this.existingStudies.forEach(studies => {
            studies.forEach(study => allExistingStudies.add(study));
        });

        allExistingStudies.forEach(existingStudy => {
            if (existingStudy.abstract) {
                const normalizedExistingAbstract = this.normalizeAbstract(existingStudy.abstract);
                const similarity = this.calculateSimilarity(normalizedNewAbstract, normalizedExistingAbstract);
                
                if (similarity > bestSimilarity) {
                    bestSimilarity = similarity;
                    bestMatch = existingStudy;
                }
            }
        });

        return { bestMatch, similarity: bestSimilarity };
    }

    /**
     * Normalize abstract for comparison
     * @param {string} abstract - Abstract string
     * @returns {string} Normalized abstract
     */
    normalizeAbstract(abstract) {
        return abstract.toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 200); // Limit length for comparison
    }

    /**
     * Calculate similarity between two strings using Levenshtein distance
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Similarity score (0-1)
     */
    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length === 0) return 0.0;
        if (str2.length === 0) return 0.0;

        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Calculate Levenshtein distance between two strings
     * @param {string} str1 - First string
     * @param {string} str2 - Second string
     * @returns {number} Levenshtein distance
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Generate a report of duplicate detection results
     * @param {Object} results - Duplicate detection results
     * @returns {string} Formatted report
     */
    generateReport(results) {
        let report = `=== DUPLICATE DETECTION REPORT ===\n\n`;
        report += `Summary:\n`;
        report += `- Total new studies: ${results.summary.totalNew}\n`;
        report += `- Duplicates found: ${results.summary.duplicates}\n`;
        report += `- Potential duplicates: ${results.summary.potentialDuplicates}\n`;
        report += `- Unique studies: ${results.summary.unique}\n`;
        report += `- Duplicate rate: ${results.summary.duplicateRate}\n\n`;

        if (results.duplicates.length > 0) {
            report += `=== CONFIRMED DUPLICATES ===\n`;
            results.duplicates.forEach((dup, index) => {
                report += `${index + 1}. ${dup.matchType} (${(dup.confidence * 100).toFixed(1)}% confidence)\n`;
                report += `   New: "${dup.newStudy.title}"\n`;
                report += `   Existing: "${dup.existingStudy.title}"\n`;
                if (dup.newStudy.doi) report += `   DOI: ${dup.newStudy.doi}\n`;
                report += `\n`;
            });
        }

        if (results.potentialDuplicates.length > 0) {
            report += `=== POTENTIAL DUPLICATES (REVIEW NEEDED) ===\n`;
            results.potentialDuplicates.forEach((dup, index) => {
                report += `${index + 1}. ${dup.matchType} (${(dup.confidence * 100).toFixed(1)}% confidence)\n`;
                report += `   New: "${dup.newStudy.title}"\n`;
                report += `   Existing: "${dup.existingStudy.title}"\n`;
                report += `\n`;
            });
        }

        return report;
    }

    /**
     * Filter out duplicates from new studies
     * @param {Array} newStudies - Array of new study objects
     * @param {boolean} includePotentialDuplicates - Whether to include potential duplicates
     * @returns {Array} Filtered array of unique studies
     */
    filterDuplicates(newStudies, includePotentialDuplicates = false) {
        const results = this.detectDuplicates(newStudies);
        
        if (includePotentialDuplicates) {
            // Return only unique studies (exclude confirmed duplicates)
            return results.unique.map(item => item.study);
        } else {
            // Return unique studies plus potential duplicates for manual review
            const uniqueStudies = results.unique.map(item => item.study);
            const potentialStudies = results.potentialDuplicates.map(item => item.newStudy);
            return [...uniqueStudies, ...potentialStudies];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuplicateDetector;
}
