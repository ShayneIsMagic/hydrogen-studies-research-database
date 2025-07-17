#!/usr/bin/env node
/**
 * Direct Google Sheets Scraper
 * Extracts data following the exact spreadsheet format
 * Admin: shayne@devpipeline.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class DirectGoogleSheetsScraper {
    constructor() {
        // Convert Google Sheets URL to CSV export format
        this.sheetsId = '1UVcZ3kWcvmf88Q5ZLj6DT_aW6jLSSpoZo4QrVGC4Lrk';
        this.gid = '529478384';
        this.csvUrl = `https://docs.google.com/spreadsheets/d/${this.sheetsId}/export?format=csv&gid=${this.gid}`;
        
        this.baseUrl = 'https://hydrogenstudies.com';
        this.delayMs = 1000;
        this.maxRetries = 3;
        this.extractedData = [];
        this.isRunning = false;
        this.onProgress = null;
        this.onLog = null;
        
        // Complete list of topics from the user's request
        this.topicsList = [
            // A
            "Acne", "Acute Kidney Injury", "Acute Respiratory Distress Syndrome", "Acute Tubuluar Necrosis",
            "Addiction", "Aflatoxicosis", "Aging", "Alcohol Toxicity", "Alcoholic Liver Disease", "Alkali Burn",
            "Alzheimer's Disease", "Amyloid Beta Toxicity", "Amyotrophic Laterial Sclerosis", "Anxiety",
            "Aplastic Anemia", "Asphyxial Encephalopathy", "Asthma", "Atherosclerosis", "Atrophy",
            "Auditory Neuropathy", "Autism Spectrum Disorder",
            
            // B
            "Bacterial Infection", "Bile Duct Injury", "Bladder Outlet Obstruction", "Blunt Chest Trauma",
            "Brain Injury", "Bronchopulmonary Dysplasia",
            
            // C
            "Cancer", "Candida Yeast Infection", "Cardiac Arrest", "Cardiac Degeneration", "Cardiac Hypertrophy",
            "Cardiomyopathy", "Cardiovascular Disease", "Cataract", "Cavities", "Chagas Disease",
            "Chronic Fatigue Syndrome", "Chronic Heart Failure", "Chronic Kidney Disease",
            "Chronic Obstructive Pulmonary Disease", "Cognitive Impairment", "Colitis", "Coma", "Concussion",
            "Congenital Obstructive Nephropathy", "Constipation", "Corneal Injury", "Cosmetic Skin Issues",
            
            // D
            "Dehydration", "Dementia", "Dentin Integrity", "Depression", "Dermatitis",
            "Dermatophagoides farinae exposure", "Diabetes (Type I)", "Diabetes (Type II)", "Diabetic Nephropathy",
            "Diabetic Peripheral Neuropathy", "Diabetic Retinopathy", "Diarrhea", "Diffuse Axonal Injury",
            "Disuse Atrophy", "Dry Eye", "Dyslipidemia", "Dyspnea",
            
            // E
            "Edema", "Encapsulating Peritoneal Sclerosis", "Encephalopathy", "Endometriosis",
            "Endothelial Dysfunction", "Endotoxemia", "Enteropathy", "Epithelial Dysfunction",
            "Erectile Dysfunction", "Erythema", "Excercise", "Excitotoxicity",
            
            // F
            "Fatigue", "Fatty Liver Disease (Alcoholic)", "Fatty Liver Disease (Nonalcoholic)", "Fibrosis",
            "Fluke Infection", "Food Poisoning", "Foot Ulcer", "Fracture",
            
            // G
            "Gastric Mucosal Injury", "Gastric Ulcer", "Gastritis", "Gastroenteritis",
            "Gastroesophageal Reflux Disease", "Gingivitis", "Glaucoma", "Glomerulosclerosis",
            "Graft-Versus-Host-Disease",
            
            // H
            "Hangover", "Hearing Loss", "Heart Attack", "Heart Failure", "Heat Stress",
            "Helicobacter pylori Infection", "Hemolytic Anemia", "Hemorrhagic Shock", "Hepatitis B",
            "Hidden Blood Loss", "High Blood Pressure", "Hypoxia-Ischemia",
            
            // I
            "Immune Dysfunction", "Indigestion", "Infertility", "Inflammation",
            "Inflammatory Bowel Disease", "Interstitial Cystitis", "Interstitial Lung Disease",
            "Intervertebral Disc Degeneration", "Intestinal Injury", "Intestinal Volvulus",
            "Intracranial Hemorrhage", "Intraocular Pressure", "Iron Overload", "Irritable Bowel Syndrome",
            "Ischemia-Reperfusion Injury",
            
            // K
            "Kawasaki Disease", "Keratin Plugs", "Kidney Failure", "Kidney Stones",
            
            // L
            "Liver Disease", "Liver Failure", "Liver Injury", "Lung Contusion", "Lung Injury",
            
            // M
            "Macular Degeneration", "Mastitis", "Maternal Immune Activation", "Metabolic Acidosis",
            "Metabolic Syndrome", "Motor Deficit", "Multiple Organ Dysfunction Syndrome", "Multiple Sclerosis",
            "Muscular Dystrophy", "Mycotoxicosis", "Myocardial Necrosis",
            
            // N
            "Necrotizing Enterocolitis", "Necrotizing Pancreatitis", "Neurodegeneration", "Neuropathic Pain",
            "No-Reflow Syndrome", "Non-Alcoholic Steatohepatitis", "Norovirus Infection",
            
            // O
            "Obesity", "Obliterative Airway Disease", "Obstructive Jaundice", "Optic Nerve Crush",
            "Osteoarthritis", "Osteonecrosis", "Osteoporosis", "Ovarian Injury", "Oxalate Injury",
            
            // P
            "Painful Bladder Syndrome", "Pancreatitis", "Panic Disorder", "Paraplegia", "Parkinson's Disease",
            "Pemphigus", "Periodontitis", "Peripheral Arterial Disease", "Placental Stress",
            "Polycystic Kidney Disease", "Polycystic Ovary Syndrome", "Poor Hair Quality",
            "Postoperative Cognitive Impairment", "Postoperative Delirium", "Postoperative Ileus",
            "Postoperative Liver Failure", "Postoperative Pain", "Postsurgical Peritoneal Adhesions",
            "Preeclampsia", "Pregnancy", "Premature Ovarian Failure", "Pressure Ulcer", "Preterm Birth",
            "Psoriasis", "Psoriasis-Associated Arthritis",
            
            // R
            "Retinal Injury", "Retinal Vein Occlusion", "Retinitis Pigmentosa", "Rhabdomyolysis",
            "Rheumatoid Arthritis", "Rhinitis", "Rhinosinusitis",
            
            // S
            "Seizure", "Sensorineural Hearing Loss", "Sepsis", "Shingles", "Shock", "Sleep Apnea",
            "Sleep Deprivation", "Spinal Cord Injury", "Sprain", "Status Epilepticus", "Stress Ulcer", "Stroke",
            
            // T
            "Testicular Injury", "Tracheal Stenosis", "Transplantation/Graft Injury", "Traumatic Brain Injury",
            
            // U
            "Ulcer", "Ulcerative Colitis", "Unstable Angina", "Upper Respiratory Tract Infection",
            "Ureteral Obstruction", "Uveal Injury",
            
            // V
            "Vascular Dysfunction", "Vasculitis", "Ventilator-Induced Lung Injury", "Vitiligo"
        ];
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        if (this.onLog) {
            this.onLog(logMessage, type);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch CSV data directly from Google Sheets
     */
    async fetchGoogleSheetsCSV() {
        try {
            this.log('Fetching Google Sheets CSV data...');
            
            const csvData = await this.fetchUrl(this.csvUrl);
            
            // Save raw CSV for debugging
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const csvFilename = `google-sheets-raw-${timestamp}.csv`;
            const csvPath = path.join(__dirname, csvFilename);
            fs.writeFileSync(csvPath, csvData, 'utf8');
            this.log(`Raw CSV saved to: ${csvFilename}`);
            
            return this.parseCSVData(csvData);
            
        } catch (error) {
            this.log(`Error fetching Google Sheets CSV: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Parse CSV data into structured format
     */
    parseCSVData(csvData) {
        const lines = csvData.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];
        
        this.log(`CSV Headers: ${headers.join(', ')}`);
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Handle CSV parsing with proper quote handling
            const values = this.parseCSVLine(line);
            
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
                });
                data.push(row);
            }
        }
        
        this.log(`Parsed ${data.length} rows from CSV`);
        return data;
    }

    /**
     * Parse CSV line with proper quote handling
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
     * Fetch URL using Node.js http/https modules
     */
    fetchUrl(url) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/csv,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            };

            const req = client.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    /**
     * Search for topic data on hydrogenstudies.com
     */
    async searchTopicData(topicName) {
        try {
            // Create search URL for the topic
            const searchUrl = `${this.baseUrl}/?s=${encodeURIComponent(topicName)}`;
            this.log(`Searching for topic: ${topicName}`);
            
            const html = await this.fetchUrl(searchUrl);
            
            // Extract relevant data from search results
            const pageContent = this.extractPageContent(html);
            const studies = this.extractStudiesFromPage(html, topicName);
            
            return {
                topic: topicName,
                page_content: pageContent,
                studies: studies,
                search_url: searchUrl
            };
            
        } catch (error) {
            this.log(`Error searching for topic ${topicName}: ${error.message}`, 'error');
            return {
                topic: topicName,
                page_content: '',
                studies: [],
                search_url: '',
                error: error.message
            };
        }
    }

    /**
     * Extract page content from HTML
     */
    extractPageContent(html) {
        // Remove script and style tags
        let content = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        content = content.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Extract text from body
        const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            content = bodyMatch[1];
        }
        
        // Remove HTML tags and clean up
        content = this.stripHtmlTags(content);
        content = content.replace(/\s+/g, ' ').trim();
        
        return content.substring(0, 1000); // Limit to first 1000 characters
    }

    /**
     * Extract studies from page HTML
     */
    extractStudiesFromPage(html, topicName) {
        const studies = [];
        
        // Look for study patterns
        const studyPatterns = [
            /<h[1-6][^>]*>([^<]*hydrogen[^<]*[^<]*)<\/h[1-6]>/gi,
            /<h[1-6][^>]*>([^<]*study[^<]*[^<]*)<\/h[1-6]>/gi,
            /<h[1-6][^>]*>([^<]*research[^<]*[^<]*)<\/h[1-6]>/gi,
            /<p[^>]*>([^<]*hydrogen[^<]*[^<]*)<\/p>/gi
        ];
        
        for (const pattern of studyPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const title = this.stripHtmlTags(match[1]).trim();
                if (title && title.length > 10) {
                    studies.push({
                        title: title,
                        topic: topicName
                    });
                }
            }
        }
        
        return studies.slice(0, 5); // Limit to 5 studies
    }

    /**
     * Strip HTML tags from text
     */
    stripHtmlTags(text) {
        return text.replace(/<[^>]*>/g, '');
    }

    /**
     * Convert data to CSV format following spreadsheet structure
     */
    convertToCSV(data) {
        // Define headers based on spreadsheet format
        const headers = [
            'Topic',
            'Study Title',
            'Authors',
            'Year',
            'Journal/Publication',
            'DOI/PMID',
            'Study Type',
            'Sample Size',
            'Intervention',
            'Control',
            'Duration',
            'Outcome Measures',
            'Key Findings',
            'Statistical Significance',
            'Limitations',
            'Funding Source',
            'Conflicts of Interest',
            'Notes',
            'Source URL',
            'Extracted Date'
        ];
        
        const rows = [headers.join(',')];
        
        for (const item of data) {
            const row = [
                `"${item.topic || ''}"`,
                `"${item.study_title || ''}"`,
                `"${item.authors || ''}"`,
                `"${item.year || ''}"`,
                `"${item.journal || ''}"`,
                `"${item.doi || ''}"`,
                `"${item.study_type || ''}"`,
                `"${item.sample_size || ''}"`,
                `"${item.intervention || ''}"`,
                `"${item.control || ''}"`,
                `"${item.duration || ''}"`,
                `"${item.outcome_measures || ''}"`,
                `"${item.key_findings || ''}"`,
                `"${item.statistical_significance || ''}"`,
                `"${item.limitations || ''}"`,
                `"${item.funding_source || ''}"`,
                `"${item.conflicts_of_interest || ''}"`,
                `"${item.notes || ''}"`,
                `"${item.source_url || ''}"`,
                `"${item.extracted_date || new Date().toISOString()}"`
            ];
            rows.push(row.join(','));
        }
        
        return rows.join('\n');
    }

    /**
     * Save CSV to file
     */
    saveCSVToFile(csvContent, filename) {
        const filepath = path.join(__dirname, filename);
        fs.writeFileSync(filepath, csvContent, 'utf8');
        this.log(`CSV saved to: ${filename}`);
        return filepath;
    }

    /**
     * Start the extraction process
     */
    async startExtraction() {
        if (this.isRunning) {
            this.log('Extraction already running', 'warning');
            return;
        }

        this.isRunning = true;
        this.extractedData = [];
        
        try {
            this.log('🚀 Starting Direct Google Sheets Extraction...');
            this.log(`📋 Processing ${this.topicsList.length} topics`);
            
            // First, extract data from Google Sheets
            this.log('📊 Extracting data from Google Sheets...');
            const sheetsData = await this.fetchGoogleSheetsCSV();
            
            // Process each topic
            this.log('🔍 Processing topics and searching for additional data...');
            
            for (let i = 0; i < this.topicsList.length; i++) {
                if (!this.isRunning) break;
                
                const topic = this.topicsList[i];
                this.log(`Processing topic ${i + 1}/${this.topicsList.length}: ${topic}`);
                
                // Find matching data from Google Sheets
                const sheetsMatch = sheetsData.find(row => 
                    row.Topic && row.Topic.toLowerCase().includes(topic.toLowerCase()) ||
                    topic.toLowerCase().includes(row.Topic.toLowerCase())
                );
                
                // Search for additional data on website
                const websiteData = await this.searchTopicData(topic);
                
                // Combine data
                const combinedData = {
                    topic: topic,
                    study_title: sheetsMatch?.Study_Title || sheetsMatch?.['Study Title'] || '',
                    authors: sheetsMatch?.Authors || '',
                    year: sheetsMatch?.Year || '',
                    journal: sheetsMatch?.Journal || sheetsMatch?.['Journal/Publication'] || '',
                    doi: sheetsMatch?.DOI || sheetsMatch?.['DOI/PMID'] || '',
                    study_type: sheetsMatch?.Study_Type || sheetsMatch?.['Study Type'] || '',
                    sample_size: sheetsMatch?.Sample_Size || sheetsMatch?.['Sample Size'] || '',
                    intervention: sheetsMatch?.Intervention || '',
                    control: sheetsMatch?.Control || '',
                    duration: sheetsMatch?.Duration || '',
                    outcome_measures: sheetsMatch?.Outcome_Measures || sheetsMatch?.['Outcome Measures'] || '',
                    key_findings: sheetsMatch?.Key_Findings || sheetsMatch?.['Key Findings'] || '',
                    statistical_significance: sheetsMatch?.Statistical_Significance || sheetsMatch?.['Statistical Significance'] || '',
                    limitations: sheetsMatch?.Limitations || '',
                    funding_source: sheetsMatch?.Funding_Source || sheetsMatch?.['Funding Source'] || '',
                    conflicts_of_interest: sheetsMatch?.Conflicts_of_Interest || sheetsMatch?.['Conflicts of Interest'] || '',
                    notes: sheetsMatch?.Notes || '',
                    source_url: websiteData.search_url || '',
                    extracted_date: new Date().toISOString(),
                    page_content: websiteData.page_content || '',
                    studies_found: websiteData.studies?.length || 0
                };
                
                this.extractedData.push(combinedData);
                
                // Progress callback
                if (this.onProgress) {
                    this.onProgress(i + 1, this.topicsList.length, topic);
                }
                
                // Delay between requests
                await this.delay(this.delayMs);
            }
            
            // Save results
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const csvFilename = `comprehensive-topics-data-${timestamp}.csv`;
            const csvContent = this.convertToCSV(this.extractedData);
            const filepath = this.saveCSVToFile(csvContent, csvFilename);
            
            // Save JSON data as well
            const jsonFilename = `comprehensive-topics-data-${timestamp}.json`;
            const jsonPath = path.join(__dirname, jsonFilename);
            fs.writeFileSync(jsonPath, JSON.stringify(this.extractedData, null, 2), 'utf8');
            
            this.log('✅ Extraction completed successfully!');
            this.log(`📊 Processed ${this.extractedData.length} topics`);
            this.log(`📁 CSV file: ${csvFilename}`);
            this.log(`📁 JSON file: ${jsonFilename}`);
            
        } catch (error) {
            this.log(`❌ Extraction failed: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop the extraction process
     */
    stopExtraction() {
        this.isRunning = false;
        this.log('🛑 Extraction stopped by user');
    }

    /**
     * Get current status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            totalTopics: this.topicsList.length,
            processedTopics: this.extractedData.length,
            extractedData: this.extractedData
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectGoogleSheetsScraper;
}

// Run if called directly
if (require.main === module) {
    const scraper = new DirectGoogleSheetsScraper();
    
    scraper.onLog = (message, type) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    };
    
    scraper.onProgress = (current, total, topic) => {
        const percentage = Math.round((current / total) * 100);
        console.log(`Progress: ${current}/${total} (${percentage}%) - ${topic}`);
    };
    
    scraper.startExtraction().catch(console.error);
} 