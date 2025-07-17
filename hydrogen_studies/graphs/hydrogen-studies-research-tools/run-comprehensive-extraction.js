#!/usr/bin/env node
/**
 * Comprehensive Topics Extraction Runner
 * Extracts data for all 199+ topics following exact spreadsheet format
 * Admin: shayne@devpipeline.com
 */

const DirectGoogleSheetsScraper = require('./google-sheets-direct-scraper.js');
const fs = require('fs');
const path = require('path');

// Complete list of topics from the user's request
const TOPICS_LIST = [
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

async function main() {
    console.log('🔬 Comprehensive Topics Extraction');
    console.log('==================================');
    console.log(`📋 Processing ${TOPICS_LIST.length} topics`);
    console.log('📊 Google Sheets URL: https://docs.google.com/spreadsheets/d/1UVcZ3kWcvmf88Q5ZLj6DT_aW6jLSSpoZo4QrVGC4Lrk/edit?gid=529478384#gid=529478384');
    console.log('🌐 Base URL: https://hydrogenstudies.com');
    console.log('📋 Following exact spreadsheet format for thorough data extraction');
    console.log('');

    // Create scraper instance
    const scraper = new DirectGoogleSheetsScraper();
    
    // Override the topics list with our custom list
    scraper.topicsList = TOPICS_LIST;
    
    // Set up logging with colors
    scraper.onLog = (message, type) => {
        const timestamp = new Date().toLocaleTimeString();
        const color = {
            'info': '\x1b[36m',    // Cyan
            'success': '\x1b[32m', // Green
            'warning': '\x1b[33m', // Yellow
            'error': '\x1b[31m'    // Red
        }[type] || '\x1b[0m';
        
        console.log(`${color}[${type.toUpperCase()}]\x1b[0m ${message}`);
    };
    
    // Set up progress tracking with visual progress bar
    scraper.onProgress = (current, total, topic) => {
        const percentage = Math.round((current / total) * 100);
        const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
        console.log(`\r📈 Progress: [${progressBar}] ${percentage}% (${current}/${total}) - ${topic}`);
    };

    try {
        // Start the extraction
        await scraper.startExtraction();
        
        // Get final status
        const status = scraper.getStatus();
        
        console.log('');
        console.log('✅ Comprehensive extraction completed!');
        console.log('📊 Final Statistics:');
        console.log(`   • Total Topics: ${status.totalTopics}`);
        console.log(`   • Processed: ${status.processedTopics}`);
        console.log(`   • Data Extracted: ${status.extractedData.length}`);
        
        // Show sample results
        if (status.extractedData.length > 0) {
            console.log('');
            console.log('📋 Sample Results:');
            status.extractedData.slice(0, 5).forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.topic}`);
                if (item.study_title) console.log(`      Study: ${item.study_title.substring(0, 60)}...`);
                if (item.authors) console.log(`      Authors: ${item.authors.substring(0, 40)}...`);
                if (item.year) console.log(`      Year: ${item.year}`);
                console.log('');
            });
            
            if (status.extractedData.length > 5) {
                console.log(`   ... and ${status.extractedData.length - 5} more topics`);
            }
        }
        
        // Show data quality metrics
        console.log('');
        console.log('📊 Data Quality Metrics:');
        const withStudyTitle = status.extractedData.filter(item => item.study_title).length;
        const withAuthors = status.extractedData.filter(item => item.authors).length;
        const withYear = status.extractedData.filter(item => item.year).length;
        const withDOI = status.extractedData.filter(item => item.doi).length;
        
        console.log(`   • Topics with Study Titles: ${withStudyTitle}/${status.extractedData.length} (${Math.round(withStudyTitle/status.extractedData.length*100)}%)`);
        console.log(`   • Topics with Authors: ${withAuthors}/${status.extractedData.length} (${Math.round(withAuthors/status.extractedData.length*100)}%)`);
        console.log(`   • Topics with Year: ${withYear}/${status.extractedData.length} (${Math.round(withYear/status.extractedData.length*100)}%)`);
        console.log(`   • Topics with DOI: ${withDOI}/${status.extractedData.length} (${Math.round(withDOI/status.extractedData.length*100)}%)`);
        
    } catch (error) {
        console.error('❌ Extraction failed:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Run the main function
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { TOPICS_LIST, main }; 