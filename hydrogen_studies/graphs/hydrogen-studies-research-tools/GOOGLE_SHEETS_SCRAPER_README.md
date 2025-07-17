# Google Sheets Topics Scraper

A comprehensive web scraper designed to extract data for 199+ health topics from Google Sheets and Hydrogen Studies website.

## 🎯 Overview

This scraper extracts comprehensive data for all the health topics you specified, including:
- **199+ Health Topics** from A-Z (Acne to Vitiligo)
- **Google Sheets Integration** for structured data
- **Website Scraping** from hydrogenstudies.com
- **Multiple Output Formats** (CSV, JSON, HTML)

## 📋 Topics Covered

The scraper processes all these health topics:

### A
- Acne, Acute Kidney Injury, Acute Respiratory Distress Syndrome, Acute Tubuluar Necrosis
- Addiction, Aflatoxicosis, Aging, Alcohol Toxicity, Alcoholic Liver Disease, Alkali Burn
- Alzheimer's Disease, Amyloid Beta Toxicity, Amyotrophic Laterial Sclerosis, Anxiety
- Aplastic Anemia, Asphyxial Encephalopathy, Asthma, Atherosclerosis, Atrophy
- Auditory Neuropathy, Autism Spectrum Disorder

### B
- Bacterial Infection, Bile Duct Injury, Bladder Outlet Obstruction, Blunt Chest Trauma
- Brain Injury, Bronchopulmonary Dysplasia

### C
- Cancer, Candida Yeast Infection, Cardiac Arrest, Cardiac Degeneration, Cardiac Hypertrophy
- Cardiomyopathy, Cardiovascular Disease, Cataract, Cavities, Chagas Disease
- Chronic Fatigue Syndrome, Chronic Heart Failure, Chronic Kidney Disease
- Chronic Obstructive Pulmonary Disease, Cognitive Impairment, Colitis, Coma, Concussion
- Congenital Obstructive Nephropathy, Constipation, Corneal Injury, Cosmetic Skin Issues

### D
- Dehydration, Dementia, Dentin Integrity, Depression, Dermatitis
- Dermatophagoides farinae exposure, Diabetes (Type I), Diabetes (Type II), Diabetic Nephropathy
- Diabetic Peripheral Neuropathy, Diabetic Retinopathy, Diarrhea, Diffuse Axonal Injury
- Disuse Atrophy, Dry Eye, Dyslipidemia, Dyspnea

### E
- Edema, Encapsulating Peritoneal Sclerosis, Encephalopathy, Endometriosis
- Endothelial Dysfunction, Endotoxemia, Enteropathy, Epithelial Dysfunction
- Erectile Dysfunction, Erythema, Excercise, Excitotoxicity

### F
- Fatigue, Fatty Liver Disease (Alcoholic), Fatty Liver Disease (Nonalcoholic), Fibrosis
- Fluke Infection, Food Poisoning, Foot Ulcer, Fracture

### G
- Gastric Mucosal Injury, Gastric Ulcer, Gastritis, Gastroenteritis
- Gastroesophageal Reflux Disease, Gingivitis, Glaucoma, Glomerulosclerosis
- Graft-Versus-Host-Disease

### H
- Hangover, Hearing Loss, Heart Attack, Heart Failure, Heat Stress
- Helicobacter pylori Infection, Hemolytic Anemia, Hemorrhagic Shock, Hepatitis B
- Hidden Blood Loss, High Blood Pressure, Hypoxia-Ischemia

### I
- Immune Dysfunction, Indigestion, Infertility, Inflammation
- Inflammatory Bowel Disease, Interstitial Cystitis, Interstitial Lung Disease
- Intervertebral Disc Degeneration, Intestinal Injury, Intestinal Volvulus
- Intracranial Hemorrhage, Intraocular Pressure, Iron Overload, Irritable Bowel Syndrome
- Ischemia-Reperfusion Injury

### K
- Kawasaki Disease, Keratin Plugs, Kidney Failure, Kidney Stones

### L
- Liver Disease, Liver Failure, Liver Injury, Lung Contusion, Lung Injury

### M
- Macular Degeneration, Mastitis, Maternal Immune Activation, Metabolic Acidosis
- Metabolic Syndrome, Motor Deficit, Multiple Organ Dysfunction Syndrome, Multiple Sclerosis
- Muscular Dystrophy, Mycotoxicosis, Myocardial Necrosis

### N
- Necrotizing Enterocolitis, Necrotizing Pancreatitis, Neurodegeneration, Neuropathic Pain
- No-Reflow Syndrome, Non-Alcoholic Steatohepatitis, Norovirus Infection

### O
- Obesity, Obliterative Airway Disease, Obstructive Jaundice, Optic Nerve Crush
- Osteoarthritis, Osteonecrosis, Osteoporosis, Ovarian Injury, Oxalate Injury

### P
- Painful Bladder Syndrome, Pancreatitis, Panic Disorder, Paraplegia, Parkinson's Disease
- Pemphigus, Periodontitis, Peripheral Arterial Disease, Placental Stress
- Polycystic Kidney Disease, Polycystic Ovary Syndrome, Poor Hair Quality
- Postoperative Cognitive Impairment, Postoperative Delirium, Postoperative Ileus
- Postoperative Liver Failure, Postoperative Pain, Postsurgical Peritoneal Adhesions
- Preeclampsia, Pregnancy, Premature Ovarian Failure, Pressure Ulcer, Preterm Birth
- Psoriasis, Psoriasis-Associated Arthritis

### R
- Retinal Injury, Retinal Vein Occlusion, Retinitis Pigmentosa, Rhabdomyolysis
- Rheumatoid Arthritis, Rhinitis, Rhinosinusitis

### S
- Seizure, Sensorineural Hearing Loss, Sepsis, Shingles, Shock, Sleep Apnea
- Sleep Deprivation, Spinal Cord Injury, Sprain, Status Epilepticus, Stress Ulcer, Stroke

### T
- Testicular Injury, Tracheal Stenosis, Transplantation/Graft Injury, Traumatic Brain Injury

### U
- Ulcer, Ulcerative Colitis, Unstable Angina, Upper Respiratory Tract Infection
- Ureteral Obstruction, Uveal Injury

### V
- Vascular Dysfunction, Vasculitis, Ventilator-Induced Lung Injury, Vitiligo

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 14 or higher)
- **Internet connection** for web scraping
- **Access** to the Google Sheets document

### Installation

1. **Clone or download** the project files
2. **Navigate** to the tools directory:
   ```bash
   cd hydrogen_studies/graphs/hydrogen-studies-research-tools
   ```

3. **Make the script executable**:
   ```bash
   chmod +x run-google-sheets-scraper.sh
   ```

### Running the Scraper

#### Option 1: Using the Shell Script (Recommended)
```bash
./run-google-sheets-scraper.sh
```

#### Option 2: Using Node.js directly
```bash
node run-google-sheets-scraper.js
```

#### Option 3: Using the HTML Interface
1. Open `google-sheets-interface.html` in your web browser
2. Click "Start Extraction"
3. Monitor progress and download results

## 📊 Data Sources

### 1. Google Sheets
- **URL**: https://docs.google.com/spreadsheets/d/1UVcZ3kWcvmf88Q5ZLj6DT_aW6jLSSpoZo4QrVGC4Lrk/edit?gid=529478384#gid=529478384
- **Purpose**: Structured data extraction
- **Format**: Table data with topic information

### 2. Hydrogen Studies Website
- **URL**: https://hydrogenstudies.com
- **Purpose**: Research data and study information
- **Format**: Web pages with study details

## 📁 Output Files

The scraper generates several output files:

### CSV Files
- `google-sheets-topics-data-[timestamp].csv`
- Contains structured data for all topics
- Columns: Topic, Study Info, Page Content, Studies Found, Source, Search URL

### JSON Files
- `google-sheets-topics-data-[timestamp].json`
- Raw data in JSON format
- Includes all extracted information

### HTML Files
- `google-sheets-data-[timestamp].html`
- Raw HTML from Google Sheets for debugging
- `main-topics-page-[timestamp].html`
- Raw HTML from website for debugging

## ⚙️ Configuration

### Scraper Settings
- **Delay between requests**: 1000ms (configurable)
- **Max retries**: 3 (configurable)
- **User Agent**: Modern browser headers
- **Proxy support**: Multiple CORS proxies for reliability

### Customization
Edit `run-google-sheets-scraper.js` to modify:
- Topics list
- Delay settings
- Output format
- Logging preferences

## 🔧 Advanced Usage

### Custom Topics List
```javascript
const customTopics = [
    "Your Topic 1",
    "Your Topic 2",
    // ... more topics
];

scraper.topicsList = customTopics;
```

### Custom Configuration
```javascript
const scraper = new GoogleSheetsTopicsScraper();
scraper.delayMs = 2000; // 2 second delay
scraper.maxRetries = 5; // 5 retries
```

### Progress Monitoring
```javascript
scraper.onProgress = (current, total, topic) => {
    console.log(`Processing ${current}/${total}: ${topic}`);
};
```

## 📈 Progress Tracking

The scraper provides real-time progress updates:

```
🔬 Google Sheets Topics Scraper
================================
📋 Processing 199 topics
📊 Google Sheets URL: https://docs.google.com/spreadsheets/d/...
🌐 Base URL: https://hydrogenstudies.com

📈 Progress: [████████████████████] 100% (199/199) - Vitiligo
✅ Extraction completed!
📊 Final Statistics:
   • Total Topics: 199
   • Processed: 199
   • Data Extracted: 199
```

## 🛠️ Troubleshooting

### Common Issues

1. **Node.js not found**
   ```bash
   # Install Node.js from https://nodejs.org/
   node --version  # Should show v14 or higher
   ```

2. **Permission denied**
   ```bash
   chmod +x run-google-sheets-scraper.sh
   ```

3. **Network errors**
   - Check internet connection
   - Try running again (automatic retry)
   - Check if Google Sheets is accessible

4. **CORS issues**
   - The scraper uses multiple proxy services
   - Automatic fallback if one proxy fails

### Debug Mode
Enable detailed logging by modifying the scraper:
```javascript
scraper.onLog = (message, type) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
};
```

## 📊 Data Structure

### Extracted Data Format
```json
{
  "topic": "Acne",
  "study_info": "Research data from Google Sheets",
  "page_content": "Extracted content from website",
  "studies": [
    {
      "title": "Hydrogen Water and Acne Treatment",
      "topic": "Acne"
    }
  ],
  "source": "Google Sheets + Website",
  "search_url": "https://hydrogenstudies.com/?s=Acne"
}
```

### CSV Output Format
```csv
Topic,Study Info,Page Content,Studies Found,Source,Search URL
"Acne","Research data","Extracted content","Study 1; Study 2","Google Sheets + Website","https://hydrogenstudies.com/?s=Acne"
```

## 🔒 Privacy & Ethics

- **Respectful scraping**: Built-in delays between requests
- **No personal data**: Only extracts public research information
- **Educational purpose**: For research and analysis only
- **Rate limiting**: Prevents server overload

## 📞 Support

For issues or questions:
- **Admin**: shayne@devpipeline.com
- **Repository**: Check the main project documentation
- **Issues**: Review troubleshooting section above

## 📝 License

This tool is part of the Hydrogen Studies research project.
Use responsibly and in accordance with website terms of service.

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Compatibility**: Node.js 14+, Modern browsers 