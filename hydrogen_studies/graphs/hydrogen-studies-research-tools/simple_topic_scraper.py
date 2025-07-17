#!/usr/bin/env python3
"""
Simple Topic Content Scraper
Extracts Topic, Content, and Studies for each health topic

Creates TWO CSV files:
1. topics_content.csv - Topic, Content (with hyperlinks to research database)
2. topics_studies.csv - Topic, Studies (ordered by date)

Requirements:
pip install requests beautifulsoup4 pandas

Usage:
python simple_topic_scraper.py
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import time
import logging
from urllib.parse import urljoin
from datetime import datetime
import re
import os # Added for file existence check

# Configure logging
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(message)s',
    handlers=[
        logging.FileHandler('scraper.log'),
        logging.StreamHandler()
    ]
)

class SimpleTopicScraper:
    def __init__(self, delay=2):
        self.base_url = "https://hydrogenstudies.com"
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # All 216 health topics from the website
        self.all_topics = [
            'Acne', 'Acute Kidney Injury', 'Acute Respiratory Distress Syndrome', 'Acute Tubuluar Necrosis',
            'Addiction', 'Aflatoxicosis', 'Aging', 'Alcohol Toxicity', 'Alcoholic Liver Disease',
            'Alkali Burn', 'Alzheimer\'s Disease', 'Amyloid Beta Toxicity', 'Amyotrophic Laterial Sclerosis',
            'Anxiety', 'Aplastic Anemia', 'Asphyxial Encephalopathy', 'Asthma', 'Atherosclerosis',
            'Atrophy', 'Auditory Neuropathy', 'Autism Spectrum Disorder', 'Bacterial Infection',
            'Bile Duct Injury', 'Bladder Outlet Obstruction', 'Blunt Chest Trauma', 'Brain Injury',
            'Bronchopulmonary Dysplasia', 'Cancer', 'Candida Yeast Infection', 'Cardiac Arrest',
            'Cardiac Degeneration', 'Cardiac Hypertrophy', 'Cardiomyopathy', 'Cardiovascular Disease',
            'Cataract', 'Cavities', 'Chagas Disease', 'Chronic Fatigue Syndrome', 'Chronic Heart Failure',
            'Chronic Kidney Disease', 'Chronic Obstructive Pulmonary Disease', 'Cognitive Impairment',
            'Colitis', 'Coma', 'Concussion', 'Congenital Obstructive Nephropathy', 'Constipation',
            'Corneal Injury', 'Cosmetic Skin Issues', 'Dehydration', 'Dementia', 'Dentin Integrity',
            'Depression', 'Dermatitis', 'Dermatophagoides farinae exposure', 'Diabetes (Type I)',
            'Diabetes (Type II)', 'Diabetic Nephropathy', 'Diabetic Peripheral Neuropathy',
            'Diabetic Retinopathy', 'Diarrhea', 'Diffuse Axonal Injury', 'Disuse Atrophy',
            'Dry Eye', 'Dyslipidemia', 'Dyspnea', 'Edema', 'Encapsulating Peritoneal Sclerosis',
            'Encephalopathy', 'Endometriosis', 'Endothelial Dysfunction', 'Endotoxemia',
            'Enteropathy', 'Epithelial Dysfunction', 'Erectile Dysfunction', 'Erythema',
            'Excercise', 'Excitotoxicity', 'Fatigue', 'Fatty Liver Disease (Alcoholic)',
            'Fatty Liver Disease (Nonalcoholic)', 'Fibrosis', 'Fluke Infection', 'Food Poisoning',
            'Foot Ulcer', 'Fracture', 'Gastric Mucosal Injury', 'Gastric Ulcer', 'Gastritis',
            'Gastroenteritis', 'Gastroesophageal Reflux Disease', 'Gingivitis', 'Glaucoma',
            'Glomerulosclerosis', 'Graft-Versus-Host-Disease', 'Hangover', 'Hearing Loss',
            'Heart Attack', 'Heart Failure', 'Heat Stress', 'Helicobacter pylori Infection',
            'Hemolytic Anemia', 'Hemorrhagic Shock', 'Hepatitis B', 'Hidden Blood Loss',
            'High Blood Pressure', 'Hypoxia-Ischemia', 'Immune Dysfunction', 'Indigestion',
            'Infertility', 'Inflammation', 'Inflammatory Bowel Disease', 'Interstitial Cystitis',
            'Interstitial Lung Disease', 'Intervertebral Disc Degeneration', 'Intestinal Injury',
            'Intestinal Volvulus', 'Intracranial Hemorrhage', 'Intraocular Pressure',
            'Iron Overload', 'Irritable Bowel Syndrome', 'Ischemia-Reperfusion Injury',
            'Kawasaki Disease', 'Keratin Plugs', 'Kidney Failure', 'Kidney Stones',
            'Liver Disease', 'Liver Failure', 'Liver Injury', 'Lung Contusion', 'Lung Injury',
            'Macular Degeneration', 'Mastitis', 'Maternal Immune Activation', 'Metabolic Acidosis',
            'Metabolic Syndrome', 'Motor Deficit', 'Multiple Organ Dysfunction Syndrome',
            'Multiple Sclerosis', 'Muscular Dystrophy', 'Mycotoxicosis', 'Myocardial Necrosis',
            'Necrotizing Enterocolitis', 'Necrotizing Pancreatitis', 'Neurodegeneration',
            'Neuropathic Pain', 'No-Reflow Syndrome', 'Non-Alcoholic Steatohepatitis',
            'Norovirus Infection', 'Obesity', 'Obliterative Airway Disease', 'Obstructive Jaundice',
            'Optic Nerve Crush', 'Osteoarthritis', 'Osteonecrosis', 'Osteoporosis',
            'Ovarian Injury', 'Oxalate Injury', 'Painful Bladder Syndrome', 'Pancreatitis',
            'Panic Disorder', 'Paraplegia', 'Parkinson\'s Disease', 'Pemphigus', 'Periodontitis',
            'Peripheral Arterial Disease', 'Placental Stress', 'Polycystic Kidney Disease',
            'Polycystic Ovary Syndrome', 'Poor Hair Quality', 'Postoperative Cognitive Impairment',
            'Postoperative Delirium', 'Postoperative Ileus', 'Postoperative Liver Failure',
            'Postoperative Pain', 'Postsurgical Peritoneal Adhesions', 'Preeclampsia',
            'Pregnancy', 'Premature Ovarian Failure', 'Pressure Ulcer', 'Preterm Birth',
            'Psoriasis', 'Psoriasis-Associated Arthritis', 'Retinal Injury', 'Retinal Vein Occlusion',
            'Retinitis Pigmentosa', 'Rhabdomyolysis', 'Rheumatoid Arthritis', 'Rhinitis',
            'Rhinosinusitis', 'Seizure', 'Sensorineural Hearing Loss', 'Sepsis', 'Shingles',
            'Shock', 'Sleep Apnea', 'Sleep Deprivation', 'Spinal Cord Injury', 'Sprain',
            'Status Epilepticus', 'Stress Ulcer', 'Stroke', 'Testicular Injury', 'Tracheal Stenosis',
            'Transplantation/Graft Injury', 'Traumatic Brain Injury', 'Ulcer', 'Ulcerative Colitis',
            'Unstable Angina', 'Upper Respiratory Tract Infection', 'Ureteral Obstruction',
            'Uveal Injury', 'Vascular Dysfunction', 'Vasculitis', 'Ventilator-Induced Lung Injury',
            'Vitiligo'
        ]
        
        self.content_data = []
        self.studies_data = []
        
        # Load research database for cross-referencing
        self.research_db = self.load_research_database()
    
    def load_research_database(self):
        """Load the research database to cross-reference studies"""
        logging.info("📚 Loading research database...")
        
        research_db = {
            'primary': {},
            'secondary': {},
            'tertiary': {}
        }
        
        try:
            # Check for research database files
            db_files = [
                'Hydrogen_Research_Database_Primary_Studies.csv',
                'Hydrogen_Research_Database_Secondary_Tertiary.csv',
                'Hydrogen_Research_Database_Clean.csv'
            ]
            
            for db_file in db_files:
                if os.path.exists(db_file):
                    logging.info(f"📖 Loading {db_file}")
                    df = pd.read_csv(db_file)
                    
                    # Look for topic column
                    topic_col = None
                    for col in df.columns:
                        if 'topic' in col.lower():
                            topic_col = col
                            break
                    
                    if topic_col:
                        for _, row in df.iterrows():
                            topic = str(row[topic_col]).strip()
                            if topic and topic != 'nan':
                                # Determine database type
                                if 'primary' in db_file.lower():
                                    research_db['primary'][topic] = research_db['primary'].get(topic, []) + [row.to_dict()]
                                elif 'secondary' in db_file.lower() or 'tertiary' in db_file.lower():
                                    research_db['secondary'][topic] = research_db['secondary'].get(topic, []) + [row.to_dict()]
                                else:
                                    # Clean database - try to determine type
                                    research_db['primary'][topic] = research_db['primary'].get(topic, []) + [row.to_dict()]
            
            logging.info(f"✅ Loaded research database: {len(research_db['primary'])} primary topics, {len(research_db['secondary'])} secondary topics")
            return research_db
            
        except Exception as e:
            logging.error(f"❌ Error loading research database: {e}")
            return {'primary': {}, 'secondary': {}, 'tertiary': {}}
    
    def get_research_database_links(self, topic_name):
        """Get research database links for a topic"""
        links = []
        
        # Check primary studies
        if topic_name in self.research_db['primary']:
            studies = self.research_db['primary'][topic_name]
            for study in studies:
                # Create link to research database
                study_id = study.get('Study ID', study.get('ID', ''))
                if study_id:
                    link_text = f"Primary Study: {study.get('Study Title', 'Study')}"
                    link_url = f"{self.base_url}/study/{study_id}"
                    links.append(f'<a href="{link_url}" target="_blank">{link_text}</a>')
        
        # Check secondary studies
        if topic_name in self.research_db['secondary']:
            studies = self.research_db['secondary'][topic_name]
            for study in studies:
                study_id = study.get('Study ID', study.get('ID', ''))
                if study_id:
                    link_text = f"Secondary Study: {study.get('Study Title', 'Study')}"
                    link_url = f"{self.base_url}/study/{study_id}"
                    links.append(f'<a href="{link_url}" target="_blank">{link_text}</a>')
        
        return links
    
    def discover_topic_urls(self):
        """Get all topic URLs from the main topics page"""
        logging.info("🔍 Discovering topic URLs...")
        
        try:
            response = self.session.get(f"{self.base_url}/topics/")
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            topic_urls = {}
            
            # Find all links that match our topics
            for link in soup.find_all('a', href=True):
                href = link.get('href')
                text = link.get_text(strip=True)
                
                if ('/secondary-topic/' in href or '/tertiary-topic/' in href) and text in self.all_topics:
                    full_url = urljoin(self.base_url, href)
                    topic_urls[text] = full_url
            
            logging.info(f"✅ Found URLs for {len(topic_urls)} topics")
            return topic_urls
            
        except Exception as e:
            logging.error(f"❌ Error discovering URLs: {e}")
            return {}
    
    def extract_content_with_links(self, soup, topic_name):
        """Extract content while preserving hyperlinks and adding research database links"""
        main_content = (soup.find('main') or 
                       soup.find('div', class_='content') or 
                       soup.find('article') or 
                       soup.find('body'))
        
        if not main_content:
            return ""
        
        # Get all content elements including links
        content_elements = main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'div'])
        content_parts = []
        
        for element in content_elements:
            # Skip if it's a navigation or footer element
            if element.get('class') and any(cls in str(element.get('class')).lower() for cls in ['nav', 'footer', 'header', 'menu']):
                continue
                
            # If it's a link, preserve the link format
            if element.name == 'a':
                href = element.get('href', '')
                text = element.get_text(strip=True)
                if text and len(text) > 5:  # Filter out very short links
                    if href.startswith('http'):
                        content_parts.append(f'<a href="{href}" target="_blank">{text}</a>')
                    else:
                        full_url = urljoin(self.base_url, href)
                        content_parts.append(f'<a href="{full_url}" target="_blank">{text}</a>')
            else:
                # For other elements, get text but preserve any links within them
                text = element.get_text(strip=True)
                if text and len(text) > 10:  # Filter out very short text
                    # Check if this element contains links
                    links = element.find_all('a')
                    if links:
                        # Replace link text with link format
                        modified_text = text
                        for link in links:
                            href = link.get('href', '')
                            link_text = link.get_text(strip=True)
                            if href.startswith('http'):
                                modified_text = modified_text.replace(link_text, f'<a href="{href}" target="_blank">{link_text}</a>')
                            else:
                                full_url = urljoin(self.base_url, href)
                                modified_text = modified_text.replace(link_text, f'<a href="{full_url}" target="_blank">{link_text}</a>')
                        content_parts.append(modified_text)
                    else:
                        content_parts.append(text)
        
        # Add research database links
        research_links = self.get_research_database_links(topic_name)
        if research_links:
            content_parts.append("\n\n<h3>Related Research Studies:</h3>")
            content_parts.extend(research_links)
        
        return '\n\n'.join(content_parts)
    
    def extract_studies_by_date(self, soup):
        """Extract studies and order them by date"""
        studies = []
        
        # Method 1: Look for "Studies" heading and extract following content
        for heading in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            if 'studies' in heading.get_text(strip=True).lower():
                # Found studies section, extract everything after it until next heading
                current_element = heading.find_next_sibling()
                study_content = []
                
                while current_element and current_element.name not in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                    if current_element.name in ['p', 'div']:
                        text = current_element.get_text(strip=True)
                        if text and len(text) > 20:
                            study_content.append(text)
                    current_element = current_element.find_next_sibling()
                
                if study_content:
                    studies.extend(study_content)
                break
        
        # Method 2: If no studies section found, look for study links
        if not studies:
            study_links = soup.find_all('a', href=lambda href: href and '/study/' in href)
            for link in study_links:
                study_title = link.get_text(strip=True)
                if study_title and len(study_title) > 10:
                    # Try to get context around the study link
                    parent = link.parent
                    if parent:
                        context = parent.get_text(strip=True)
                        studies.append(context)
        
        # Parse and sort studies by date
        parsed_studies = []
        for study in studies:
            # Look for year pattern in the study text
            year_match = re.search(r'(\d{4})', study)
            if year_match:
                year = int(year_match.group(1))
                parsed_studies.append((year, study))
            else:
                # If no year found, assume current year
                parsed_studies.append((2024, study))
        
        # Sort by year (newest first)
        parsed_studies.sort(key=lambda x: x[0], reverse=True)
        
        # Return sorted studies
        return '\n\n'.join([study[1] for study in parsed_studies])
    
    def extract_topic_data(self, topic_name, url):
        """Extract Topic, Content, and Studies for a single topic"""
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract Content with hyperlinks preserved and research database links added
            content = self.extract_content_with_links(soup, topic_name)
            
            # Extract Studies ordered by date
            studies = self.extract_studies_by_date(soup)
            
            # Store data for both CSV files
            self.content_data.append({
                'Topic': topic_name,
                'Content': content
            })
            
            self.studies_data.append({
                'Topic': topic_name,
                'Studies': studies
            })
            
            time.sleep(self.delay)  # Be respectful
            return True
            
        except Exception as e:
            logging.error(f"❌ Error extracting {topic_name}: {e}")
            # Still add empty entries to maintain consistency
            self.content_data.append({
                'Topic': topic_name,
                'Content': f"Error extracting content: {e}"
            })
            self.studies_data.append({
                'Topic': topic_name,
                'Studies': ""
            })
            return False
    
    def scrape_all_topics(self, limit=None):
        """Scrape all topics and return simple data"""
        # Discover URLs
        topic_urls = self.discover_topic_urls()
        
        if not topic_urls:
            logging.error("❌ No topic URLs found")
            return []
        
        # Limit if specified
        if limit:
            items = list(topic_urls.items())[:limit]
            topic_urls = dict(items)
            logging.info(f"🔧 Limiting to {limit} topics")
        
        # Extract data for each topic
        total_topics = len(topic_urls)
        logging.info(f"📊 Processing {total_topics} topics")
        
        for i, (topic_name, url) in enumerate(topic_urls.items(), 1):
            logging.info(f"📖 [{i}/{total_topics}] {topic_name}")
            
            success = self.extract_topic_data(topic_name, url)
            
            # Progress update every 10 topics
            if i % 10 == 0:
                logging.info(f"✅ Completed {i}/{total_topics} topics")
        
        return len(self.content_data)
    
    def save_to_csv_files(self):
        """Save to TWO separate CSV files"""
        if not self.content_data:
            logging.warning("⚠️ No data to save")
            return None, None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save Content CSV
        content_filename = f"topics_content_{timestamp}.csv"
        content_df = pd.DataFrame(self.content_data)
        content_df.to_csv(content_filename, index=False, encoding='utf-8')
        logging.info(f"💾 Saved {len(self.content_data)} topics to {content_filename}")
        
        # Save Studies CSV
        studies_filename = f"topics_studies_{timestamp}.csv"
        studies_df = pd.DataFrame(self.studies_data)
        studies_df.to_csv(studies_filename, index=False, encoding='utf-8')
        logging.info(f"💾 Saved {len(self.studies_data)} topics to {studies_filename}")
        
        return content_filename, studies_filename

def main():
    """Main execution"""
    print("🔬 Simple Hydrogen Studies Topic Scraper")
    print("=" * 50)
    print("📊 Creates TWO CSV files:")
    print("   1. topics_content.csv - Topic, Content (with research database links)")
    print("   2. topics_studies.csv - Topic, Studies (ordered by date)")
    print("📁 Output: Two separate CSV files")
    print("=" * 50)
    print()
    
    # Configuration
    try:
        limit_input = input("📋 Number of topics (Enter for ALL 216, or number): ").strip()
        limit = None if not limit_input else int(limit_input)
        
        delay_input = input("⏱️  Delay between requests (default 2 seconds): ").strip()
        delay = 2 if not delay_input else float(delay_input)
        
    except ValueError:
        print("❌ Invalid input, using defaults")
        limit = None
        delay = 2
    
    print(f"\n🎯 Will scrape: {'ALL topics' if not limit else f'{limit} topics'}")
    print(f"⏱️  Delay: {delay} seconds")
    
    if input("\n▶️  Start scraping? [Y/n]: ").strip().lower() not in ['', 'y', 'yes']:
        print("❌ Cancelled")
        return
    
    # Run scraper
    scraper = SimpleTopicScraper(delay=delay)
    
    try:
        start_time = datetime.now()
        
        count = scraper.scrape_all_topics(limit=limit)
        content_file, studies_file = scraper.save_to_csv_files()
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print(f"\n🎉 SUCCESS!")
        print(f"⏱️  Time: {duration}")
        print(f"📊 Topics: {count}")
        print(f"📁 Content file: {content_file}")
        print(f"📁 Studies file: {studies_file}")
        print("\n✅ Ready to use in Excel, Google Sheets, or any CSV reader!")
        
    except KeyboardInterrupt:
        print("\n⛔ Interrupted by user")
        if scraper.content_data:
            content_file, studies_file = scraper.save_to_csv_files()
            print(f"💾 Saved partial data: {content_file}, {studies_file}")
    
    except Exception as e:
        print(f"\n💥 Error: {e}")

if __name__ == "__main__":
    main() 