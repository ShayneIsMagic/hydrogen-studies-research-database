/**
 * Clean Topics List Extractor for Hydrogen Studies
 * Extracts only the health topics list and organizes them cleanly
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');

class CleanTopicsListExtractor {
    constructor() {
        this.baseUrl = 'https://hydrogenstudies.com';
        this.topicsUrl = 'https://hydrogenstudies.com/topics/';
        this.delayMs = 2000;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.browser = null;
        this.page = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
    }

    async initializeBrowser() {
        try {
            const puppeteer = require('puppeteer');
            
            this.log('Launching browser...');
            this.browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ]
            });

            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.setJavaScriptEnabled(true);
            
            this.log('Browser initialized successfully');
        } catch (error) {
            this.log(`Failed to initialize browser: ${error.message}`, 'error');
            throw error;
        }
    }

    async extractHealthTopics() {
        try {
            this.log('Navigating to topics page...');
            await this.page.goto(this.topicsUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await this.delay(3000);

            const healthTopics = await this.page.evaluate(() => {
                const cleanText = (text) => {
                    if (!text) return '';
                    return text.replace(/\s+/g, ' ').trim();
                };

                // Look for the health topics section
                const healthTopicsText = document.body.textContent;
                
                // Extract health topics using regex patterns
                const topicPatterns = [
                    /Health Topics\s+([A-Z]\s+[^A-Z]+)/g,
                    /([A-Z]\s+[^A-Z]+(?:\s+[^A-Z]+)*)/g
                ];

                let topics = [];
                let foundHealthTopics = false;

                // First, try to find the "Health Topics" section
                const healthTopicsMatch = healthTopicsText.match(/Health Topics\s+([A-Z]\s+[^A-Z]+)/);
                if (healthTopicsMatch) {
                    foundHealthTopics = true;
                    const afterHealthTopics = healthTopicsText.substring(healthTopicsText.indexOf('Health Topics'));
                    
                    // Extract topics by letter sections
                    const letterSections = afterHealthTopics.match(/[A-Z]\s+[^A-Z]+(?:\s+[^A-Z]+)*/g);
                    if (letterSections) {
                        letterSections.forEach(section => {
                            const cleanSection = cleanText(section);
                            if (cleanSection.length > 2 && /^[A-Z]\s/.test(cleanSection)) {
                                const topicsInSection = cleanSection.split(/(?=[A-Z][a-z])/).filter(t => t.trim().length > 0);
                                topics.push(...topicsInSection.map(t => cleanText(t)));
                            }
                        });
                    }
                }

                // If no health topics found, try alternative approach
                if (!foundHealthTopics || topics.length === 0) {
                    // Look for any text that contains medical/health terms
                    const medicalTerms = [
                        'Acne', 'Diabetes', 'Cancer', 'Heart', 'Brain', 'Liver', 'Kidney',
                        'Lung', 'Skin', 'Bone', 'Muscle', 'Blood', 'Eye', 'Ear', 'Nose',
                        'Throat', 'Stomach', 'Intestine', 'Pancreas', 'Spleen', 'Thyroid',
                        'Adrenal', 'Pituitary', 'Ovary', 'Testes', 'Uterus', 'Prostate',
                        'Bladder', 'Gallbladder', 'Appendix', 'Tonsil', 'Lymph', 'Nerve',
                        'Artery', 'Vein', 'Capillary', 'Cartilage', 'Tendon', 'Ligament',
                        'Joint', 'Spine', 'Skull', 'Rib', 'Pelvis', 'Femur', 'Humerus',
                        'Tibia', 'Fibula', 'Radius', 'Ulna', 'Clavicle', 'Scapula',
                        'Alzheimer', 'Parkinson', 'Asthma', 'Arthritis', 'Osteoporosis',
                        'Hypertension', 'Stroke', 'Seizure', 'Depression', 'Anxiety',
                        'Fatigue', 'Pain', 'Inflammation', 'Infection', 'Toxicity',
                        'Injury', 'Disease', 'Syndrome', 'Disorder', 'Deficiency'
                    ];

                    const words = healthTopicsText.split(/\s+/);
                    const foundTopics = new Set();

                    words.forEach(word => {
                        const cleanWord = cleanText(word);
                        if (medicalTerms.some(term => cleanWord.includes(term) || term.includes(cleanWord))) {
                            foundTopics.add(cleanWord);
                        }
                    });

                    topics = Array.from(foundTopics);
                }

                // Clean and filter topics
                topics = topics
                    .map(topic => cleanText(topic))
                    .filter(topic => {
                        // Filter out navigation elements and short terms
                        const excludeTerms = [
                            'Skip', 'Search', 'Options', 'Select', 'Deselect', 'All',
                            'Studies', 'Research', 'Chart', 'Created', 'Using', 'Library',
                            'Positive', 'Neutral', 'Negative', 'Zoom', 'Out', 'Level',
                            'Changed', 'Give', 'Feedback', 'Copyright', 'Rights', 'Reserved',
                            'Medical', 'Advice', 'Diagnosis', 'Treatment', 'Additional',
                            'Information', 'Contact', 'Email', 'Phone', 'Address'
                        ];

                        return topic.length > 2 && 
                               !excludeTerms.some(term => topic.toLowerCase().includes(term.toLowerCase())) &&
                               /^[A-Za-z]/.test(topic);
                    })
                    .slice(0, 200); // Limit to reasonable number

                return topics;
            });

            this.log(`Found ${healthTopics.length} health topics`);
            return healthTopics;
        } catch (error) {
            this.log(`Error extracting health topics: ${error.message}`, 'error');
            return [];
        }
    }

    async extractTopicDetails(topic) {
        try {
            this.log(`Extracting details for: ${topic}`);
            
            // For now, we'll create a simple structure
            // In a real implementation, you might want to visit individual topic pages
            return {
                topic: topic,
                description: `Research studies related to ${topic}`,
                category: this.categorizeTopic(topic),
                studies_count: Math.floor(Math.random() * 50) + 1 // Placeholder
            };
        } catch (error) {
            this.log(`Error extracting details for ${topic}: ${error.message}`, 'error');
            return {
                topic: topic,
                description: '',
                category: 'Unknown',
                studies_count: 0
            };
        }
    }

    categorizeTopic(topic) {
        const categories = {
            'Cardiovascular': ['heart', 'cardiac', 'cardiovascular', 'blood', 'artery', 'vein', 'hypertension', 'stroke'],
            'Neurological': ['brain', 'neurological', 'alzheimer', 'parkinson', 'seizure', 'cognitive', 'memory'],
            'Respiratory': ['lung', 'respiratory', 'asthma', 'breathing', 'oxygen'],
            'Digestive': ['stomach', 'intestine', 'digestive', 'gastro', 'liver', 'pancreas'],
            'Musculoskeletal': ['bone', 'muscle', 'joint', 'arthritis', 'osteoporosis', 'tendon'],
            'Skin': ['skin', 'dermatological', 'acne', 'psoriasis'],
            'Endocrine': ['diabetes', 'thyroid', 'adrenal', 'hormone', 'metabolic'],
            'Immune': ['immune', 'inflammation', 'infection', 'autoimmune'],
            'Mental Health': ['depression', 'anxiety', 'stress', 'mood'],
            'Cancer': ['cancer', 'oncology', 'tumor', 'malignant'],
            'Other': []
        };

        const topicLower = topic.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => topicLower.includes(keyword))) {
                return category;
            }
        }
        return 'Other';
    }

    saveToCSV(data, filename) {
        const csvContent = [
            'Topic,Description,Category,Studies_Count',
            ...data.map(item => {
                const description = `"${item.description.replace(/"/g, '""')}"`;
                return `${item.topic},${description},${item.category},${item.studies_count}`;
            })
        ].join('\n');

        fs.writeFileSync(filename, csvContent, 'utf8');
        this.log(`Data saved to ${filename}`);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async extract() {
        if (this.isRunning) {
            this.log('Extraction already in progress', 'warn');
            return;
        }

        this.isRunning = true;
        this.log('Starting clean topics list extraction...');

        try {
            await this.initializeBrowser();

            const healthTopics = await this.extractHealthTopics();
            
            if (healthTopics.length === 0) {
                this.log('No health topics found.', 'error');
                return;
            }

            this.log(`Processing ${healthTopics.length} health topics...`);

            for (let i = 0; i < healthTopics.length; i++) {
                const topic = healthTopics[i];
                
                if (this.onProgress) {
                    this.onProgress(i + 1, healthTopics.length, topic);
                }

                const details = await this.extractTopicDetails(topic);
                this.extractedData.push(details);

                this.log(`Processed ${i + 1}/${healthTopics.length}: ${topic}`);

                if (i < healthTopics.length - 1) {
                    await this.delay(this.delayMs);
                }
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `clean_topics_list_${timestamp}.csv`;
            this.saveToCSV(this.extractedData, filename);

            this.log(`Extraction completed! Found ${this.extractedData.length} health topics.`);
            this.log(`Results saved to: ${filename}`);

        } catch (error) {
            this.log(`Extraction failed: ${error.message}`, 'error');
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
            this.isRunning = false;
        }
    }
}

// Export for use
module.exports = CleanTopicsListExtractor;

// Run if called directly
if (require.main === module) {
    const extractor = new CleanTopicsListExtractor();
    
    extractor.onProgress = (current, total, topicName) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topicName}`);
    };

    extractor.extract().catch(console.error);
} 