#!/usr/bin/env python3
"""
Clean CSV Data Script
Cleans and organizes the extracted topic data for better formatting

Usage:
python clean_csv_data.py
"""

import pandas as pd
import re
import os
from datetime import datetime

def clean_content_text(text):
    """Clean and format content text - preserve hyperlinks"""
    if pd.isna(text) or text == "":
        return ""
    
    # Remove study references that got mixed into content
    # Look for patterns like "2022 - Skin - Cosmetic Skin Issues" and everything after
    text = re.sub(r'\d{4}\s*-\s*[^-]+\s*-\s*[^\n]+.*$', '', text, flags=re.DOTALL)
    
    # Remove any remaining study-like patterns
    text = re.sub(r'Background:.*$', '', text, flags=re.DOTALL)
    text = re.sub(r'Purpose:.*$', '', text, flags=re.DOTALL)
    text = re.sub(r'Objectives:.*$', '', text, flags=re.DOTALL)
    
    # Clean up whitespace and formatting but preserve HTML links
    text = re.sub(r'\n+', '\n', text)
    text = re.sub(r' +', ' ', text)
    text = text.strip()
    
    # Remove any trailing study fragments
    text = re.sub(r'\n[^a-zA-Z<]*$', '', text)
    
    return text

def clean_studies_text(text):
    """Clean and format studies text - order by date"""
    if pd.isna(text) or text == "":
        return ""
    
    studies = []
    
    # Split by double newlines to separate individual studies
    study_blocks = text.split('\n\n')
    
    for block in study_blocks:
        block = block.strip()
        if not block:
            continue
            
        # Look for study title patterns
        # Pattern: "Title... (Year) - Body Part - Category"
        study_match = re.search(r'([^(]+?)\s*\((\d{4})\)\s*-\s*([^-]+)\s*-\s*(.+)', block)
        
        if study_match:
            title = study_match.group(1).strip()
            year = study_match.group(2)
            body_part = study_match.group(3).strip()
            category = study_match.group(4).strip()
            
            # Get the description part (after the metadata)
            description_start = block.find(category) + len(category)
            description = block[description_start:].strip()
            
            # Format the study entry
            study_entry = f"{title} ({year}) - {body_part} - {category}"
            if description:
                study_entry += f"\n{description}"
            
            studies.append((int(year), study_entry))
        else:
            # If no clear pattern, try to extract what looks like a study
            if any(keyword in block.lower() for keyword in ['study', 'research', 'investigation', 'trial', 'analysis']):
                # Try to find a year
                year_match = re.search(r'(\d{4})', block)
                year = int(year_match.group(1)) if year_match else 2024
                studies.append((year, block))
    
    # Sort by year (newest first)
    studies.sort(key=lambda x: x[0], reverse=True)
    
    return '\n\n'.join([study[1] for study in studies])

def organize_csv_files():
    """Organize and clean the CSV files"""
    print("🧹 Cleaning and organizing CSV data...")
    
    # Find the most recent CSV files
    content_files = [f for f in os.listdir('.') if f.startswith('topics_content_') and f.endswith('.csv')]
    studies_files = [f for f in os.listdir('.') if f.startswith('topics_studies_') and f.endswith('.csv')]
    
    if not content_files or not studies_files:
        print("❌ No CSV files found to clean")
        return
    
    # Get the most recent files
    content_file = sorted(content_files)[-1]
    studies_file = sorted(studies_files)[-1]
    
    print(f"📁 Processing: {content_file}")
    print(f"📁 Processing: {studies_file}")
    
    # Read the CSV files
    try:
        content_df = pd.read_csv(content_file)
        studies_df = pd.read_csv(studies_file)
    except Exception as e:
        print(f"❌ Error reading CSV files: {e}")
        return
    
    print(f"📊 Found {len(content_df)} topics in content file")
    print(f"📊 Found {len(studies_df)} topics in studies file")
    
    # Clean the content data
    print("🧹 Cleaning content data...")
    content_df['Content'] = content_df['Content'].apply(clean_content_text)
    
    # Clean the studies data
    print("🧹 Cleaning studies data...")
    studies_df['Studies'] = studies_df['Studies'].apply(clean_studies_text)
    
    # Create organized output files
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save cleaned content file
    content_output = f"final_topics_content_{timestamp}.csv"
    content_df.to_csv(content_output, index=False, encoding='utf-8')
    print(f"💾 Saved cleaned content: {content_output}")
    
    # Save cleaned studies file
    studies_output = f"final_topics_studies_{timestamp}.csv"
    studies_df.to_csv(studies_output, index=False, encoding='utf-8')
    print(f"💾 Saved cleaned studies: {studies_output}")
    
    # Create a summary file
    summary_output = f"extraction_summary_{timestamp}.txt"
    with open(summary_output, 'w') as f:
        f.write("Hydrogen Studies Topic Extraction Summary\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"Extraction Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Total Topics: {len(content_df)}\n\n")
        
        f.write("Topics with Content:\n")
        f.write("-" * 20 + "\n")
        for _, row in content_df.iterrows():
            content_length = len(str(row['Content'])) if pd.notna(row['Content']) else 0
            f.write(f"{row['Topic']}: {content_length} characters\n")
        
        f.write("\nTopics with Studies:\n")
        f.write("-" * 20 + "\n")
        for _, row in studies_df.iterrows():
            studies_text = str(row['Studies']) if pd.notna(row['Studies']) else ""
            studies_count = len(studies_text.split('\n\n')) if studies_text else 0
            f.write(f"{row['Topic']}: {studies_count} studies\n")
    
    print(f"📋 Created summary: {summary_output}")
    
    # Show sample of cleaned data
    print("\n📖 Sample of cleaned content (Acne):")
    acne_row = content_df[content_df['Topic'] == 'Acne']
    if not acne_row.empty:
        acne_content = str(acne_row['Content'].iloc[0])
        print(acne_content[:300] + "..." if len(acne_content) > 300 else acne_content)
    
    print("\n📖 Sample of cleaned studies (Acne):")
    acne_row = studies_df[studies_df['Topic'] == 'Acne']
    if not acne_row.empty:
        acne_studies = str(acne_row['Studies'].iloc[0])
        print(acne_studies[:300] + "..." if len(acne_studies) > 300 else acne_studies)
    
    print(f"\n✅ Cleaning complete!")
    print(f"📁 Files created:")
    print(f"   - {content_output}")
    print(f"   - {studies_output}")
    print(f"   - {summary_output}")

if __name__ == "__main__":
    organize_csv_files() 