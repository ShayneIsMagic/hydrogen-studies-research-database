# Simple Hydrogen Studies Topic Scraper

A Python scraper that extracts **Topic**, **Content**, and **Studies** for each health topic from [hydrogenstudies.com](https://hydrogenstudies.com/topics/).

## 🎯 What it does

- Scrapes all 216 health topics from hydrogenstudies.com
- Extracts educational content for each topic
- Captures referenced studies and research
- Outputs a single CSV file with columns: `Topic`, `Content`, `Studies`

## 📊 Output Format

The scraper creates one CSV file with this structure:

| Topic | Content | Studies |
|-------|---------|---------|
| Acne | What is acne? Acne is a common skin condition... | Efficacy of Hydrogen Purification and Cosmetic Acids... |
| Aging | Aging is a natural process... | Multiple studies on hydrogen and aging... |

## 🚀 Quick Start

### Option 1: Use the shell script (Recommended)
```bash
./run-simple-scraper.sh
```

### Option 2: Run Python directly
```bash
# Install dependencies
pip3 install -r requirements.txt

# Run the scraper
python3 simple_topic_scraper.py
```

## ⚙️ Configuration

When you run the scraper, you'll be prompted for:

1. **Number of topics**: 
   - Press Enter for ALL 216 topics
   - Enter a number (e.g., `5`) for testing

2. **Delay between requests**:
   - Default: 2 seconds (respectful to the server)
   - Increase if you get rate limited

## 📁 Files Created

- `hydrogen_topics_YYYYMMDD_HHMMSS.csv` - Main output file
- `scraper.log` - Detailed logging
- `partial_hydrogen_topics.csv` - If interrupted (partial data)

## 🔧 Requirements

- Python 3.7+
- Required packages (auto-installed):
  - `requests` - HTTP requests
  - `beautifulsoup4` - HTML parsing
  - `pandas` - CSV handling
  - `lxml` - XML/HTML parser

## 📋 All 216 Health Topics

The scraper covers all topics from A-Z:

**A**: Acne, Acute Kidney Injury, Acute Respiratory Distress Syndrome, Acute Tubuluar Necrosis, Addiction, Aflatoxicosis, Aging, Alcohol Toxicity, Alcoholic Liver Disease, Alkali Burn, Alzheimer's Disease, Amyloid Beta Toxicity, Amyotrophic Laterial Sclerosis, Anxiety, Aplastic Anemia, Asphyxial Encephalopathy, Asthma, Atherosclerosis, Atrophy, Auditory Neuropathy, Autism Spectrum Disorder

**B**: Bacterial Infection, Bile Duct Injury, Bladder Outlet Obstruction, Blunt Chest Trauma, Brain Injury, Bronchopulmonary Dysplasia

**C**: Cancer, Candida Yeast Infection, Cardiac Arrest, Cardiac Degeneration, Cardiac Hypertrophy, Cardiomyopathy, Cardiovascular Disease, Cataract, Cavities, Chagas Disease, Chronic Fatigue Syndrome, Chronic Heart Failure, Chronic Kidney Disease, Chronic Obstructive Pulmonary Disease, Cognitive Impairment, Colitis, Coma, Concussion, Congenital Obstructive Nephropathy, Constipation, Corneal Injury, Cosmetic Skin Issues

**D**: Dehydration, Dementia, Dentin Integrity, Depression, Dermatitis, Dermatophagoides farinae exposure, Diabetes (Type I), Diabetes (Type II), Diabetic Nephropathy, Diabetic Peripheral Neuropathy, Diabetic Retinopathy, Diarrhea, Diffuse Axonal Injury, Disuse Atrophy, Dry Eye, Dyslipidemia, Dyspnea

**E**: Edema, Encapsulating Peritoneal Sclerosis, Encephalopathy, Endometriosis, Endothelial Dysfunction, Endotoxemia, Enteropathy, Epithelial Dysfunction, Erectile Dysfunction, Erythema, Excercise, Excitotoxicity

**F**: Fatigue, Fatty Liver Disease (Alcoholic), Fatty Liver Disease (Nonalcoholic), Fibrosis, Fluke Infection, Food Poisoning, Foot Ulcer, Fracture

**G**: Gastric Mucosal Injury, Gastric Ulcer, Gastritis, Gastroenteritis, Gastroesophageal Reflux Disease, Gingivitis, Glaucoma, Glomerulosclerosis, Graft-Versus-Host-Disease

**H**: Hangover, Hearing Loss, Heart Attack, Heart Failure, Heat Stress, Helicobacter pylori Infection, Hemolytic Anemia, Hemorrhagic Shock, Hepatitis B, Hidden Blood Loss, High Blood Pressure, Hypoxia-Ischemia

**I**: Immune Dysfunction, Indigestion, Infertility, Inflammation, Inflammatory Bowel Disease, Interstitial Cystitis, Interstitial Lung Disease, Intervertebral Disc Degeneration, Intestinal Injury, Intestinal Volvulus, Intracranial Hemorrhage, Intraocular Pressure, Iron Overload, Irritable Bowel Syndrome, Ischemia-Reperfusion Injury

**K**: Kawasaki Disease, Keratin Plugs, Kidney Failure, Kidney Stones

**L**: Liver Disease, Liver Failure, Liver Injury, Lung Contusion, Lung Injury

**M**: Macular Degeneration, Mastitis, Maternal Immune Activation, Metabolic Acidosis, Metabolic Syndrome, Motor Deficit, Multiple Organ Dysfunction Syndrome, Multiple Sclerosis, Muscular Dystrophy, Mycotoxicosis, Myocardial Necrosis

**N**: Necrotizing Enterocolitis, Necrotizing Pancreatitis, Neurodegeneration, Neuropathic Pain, No-Reflow Syndrome, Non-Alcoholic Steatohepatitis, Norovirus Infection

**O**: Obesity, Obliterative Airway Disease, Obstructive Jaundice, Optic Nerve Crush, Osteoarthritis, Osteonecrosis, Osteoporosis, Ovarian Injury, Oxalate Injury

**P**: Painful Bladder Syndrome, Pancreatitis, Panic Disorder, Paraplegia, Parkinson's Disease, Pemphigus, Periodontitis, Peripheral Arterial Disease, Placental Stress, Polycystic Kidney Disease, Polycystic Ovary Syndrome, Poor Hair Quality, Postoperative Cognitive Impairment, Postoperative Delirium, Postoperative Ileus, Postoperative Liver Failure, Postoperative Pain, Postsurgical Peritoneal Adhesions, Preeclampsia, Pregnancy, Premature Ovarian Failure, Pressure Ulcer, Preterm Birth, Psoriasis, Psoriasis-Associated Arthritis

**R**: Retinal Injury, Retinal Vein Occlusion, Retinitis Pigmentosa, Rhabdomyolysis, Rheumatoid Arthritis, Rhinitis, Rhinosinusitis

**S**: Seizure, Sensorineural Hearing Loss, Sepsis, Shingles, Shock, Sleep Apnea, Sleep Deprivation, Spinal Cord Injury, Sprain, Status Epilepticus, Stress Ulcer, Stroke

**T**: Testicular Injury, Tracheal Stenosis, Transplantation/Graft Injury, Traumatic Brain Injury

**U**: Ulcer, Ulcerative Colitis, Unstable Angina, Upper Respiratory Tract Infection, Ureteral Obstruction, Uveal Injury

**V**: Vascular Dysfunction, Vasculitis, Ventilator-Induced Lung Injury, Vitiligo

## 🛠️ Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   pip3 install -r requirements.txt
   ```

2. **Rate limiting**
   - Increase delay between requests (e.g., 5 seconds)
   - Wait and try again later

3. **Interrupted scraping**
   - Partial data is saved as `partial_hydrogen_topics.csv`
   - Restart the scraper to continue

4. **No topics found**
   - Check internet connection
   - Verify the website is accessible

### Logs

Check `scraper.log` for detailed information about:
- URLs discovered
- Topics processed
- Errors encountered
- Progress updates

## 📈 Example Output

```csv
Topic,Content,Studies
Acne,"What is acne? Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells. It typically appears on the face, neck, chest, back, and shoulders. Here's how it happens: Overproduction of Oil (Sebum): Your skin has tiny glands called sebaceous glands that produce an oily substance called sebum...","Efficacy of Hydrogen Purification and Cosmetic Acids in the Treatment of Acne Vulgaris: A ... 2022 - Skin - Cosmetic Skin Issues Acne and skin lesions that appear in its course deteriorate the quality of life of patients, cause depression and the emergence of suicidal thoughts. Cosmetic treatments can have a positive effect on improving skin condition by cleaning up skin..."
```

## ✅ Ready to Use

The CSV output is ready for:
- Excel/Google Sheets
- Database import
- Further analysis
- Content management systems

---

**Happy Scraping! 🎉** 