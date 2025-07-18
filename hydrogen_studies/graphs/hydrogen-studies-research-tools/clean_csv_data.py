#!/usr/bin/env python3
"""
Clean CSV Data Script
Cleans and organizes the extracted topic data for better formatting

- For the Content CSV, only include content up to (but not including) the <h2>Studies</h2> heading (or equivalent, case-insensitive, and allow for whitespace).
- For the Studies CSV, include everything from the <h2>Studies</h2> heading and below, but remove all <a> tags/hyperlinks (keep only plain text for studies section).
- Uses BeautifulSoup for robust HTML parsing and tag removal.
- If the <h2>Studies</h2> heading is not found, treats the entire content as 'Content' and leaves 'Studies' empty.

Usage:
python clean_csv_data.py
"""

import pandas as pd
import re
import os
from datetime import datetime
from bs4 import BeautifulSoup, Tag

def split_content_and_studies(html):
    """
    Splits the HTML into content (up to <h2>Studies</h2>) and studies (from <h2>Studies</h2> onward).
    Returns (content_html, studies_html)
    """
    if pd.isna(html) or html == "":
        return ("", "")
    soup = BeautifulSoup(html, "html.parser")
    # Find the <h2>Studies</h2> heading (case-insensitive, allow whitespace)
    studies_h2 = None
    for h2 in soup.find_all("h2"):
        if h2.get_text(strip=True).lower() == "studies":
            studies_h2 = h2
            break
    if not studies_h2:
        # No studies section found
        return (str(soup), "")
    # Everything before studies_h2 is content, everything from studies_h2 onward is studies
    content_parts = []
    for el in studies_h2.previous_siblings:
        if isinstance(el, str):
            content_parts.append(el)
        else:
            content_parts.append(str(el))
    content_html = ''.join(reversed(content_parts)).strip()
    studies_parts = []
    # Ensure studies_h2.parent is not None
    if studies_h2.parent is not None:
        for el in studies_h2.parent.children:
            if el == studies_h2:
                studies_parts.append(str(el))
                # Add everything after studies_h2
                for sib in studies_h2.next_siblings:
                    studies_parts.append(str(sib))
                break
    studies_html = ''.join(studies_parts).strip()
    return (content_html, studies_html)

def clean_content_text(text):
    """Extract and clean content up to <h2>Studies</h2>, preserving HTML links."""
    content_html, _ = split_content_and_studies(text)
    # Optionally, further clean up whitespace
    content_html = re.sub(r'\n+', '\n', content_html)
    content_html = re.sub(r' +', ' ', content_html)
    return content_html.strip()

def clean_studies_text(text):
    """Extract and clean studies section from <h2>Studies</h2> onward, removing all <a> tags/hyperlinks."""
    _, studies_html = split_content_and_studies(text)
    if not studies_html:
        return ""
    soup = BeautifulSoup(studies_html, "html.parser")
    # Remove all <a> tags but keep their text
    for a in soup.find_all('a'):
        if isinstance(a, Tag):
            a.unwrap()  # unwrap removes the tag but keeps the text
    # Optionally, further clean up whitespace
    studies_text = soup.get_text(separator='\n', strip=True)
    studies_text = re.sub(r'\n+', '\n', studies_text)
    studies_text = re.sub(r' +', ' ', studies_text)
    return studies_text.strip()

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
    print("🧹 Cleaning content data (up to <h2>Studies</h2>) ...")
    content_df['Content'] = content_df['Content'].apply(clean_content_text)
    # Clean the studies data
    print("🧹 Cleaning studies data (from <h2>Studies</h2> onward, no links) ...")
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
    acne_row = content_df.loc[content_df['Topic'] == 'Acne']
    # Check if DataFrame has any rows using len()
    if len(acne_row) > 0:
        acne_content = str(acne_row['Content'].iat[0])
        print(acne_content[:300] + "..." if len(acne_content) > 300 else acne_content)
    print("\n📖 Sample of cleaned studies (Acne):")
    acne_row = studies_df.loc[studies_df['Topic'] == 'Acne']
    if len(acne_row) > 0:
        acne_studies = str(acne_row['Studies'].iat[0])
        print(acne_studies[:300] + "..." if len(acne_studies) > 300 else acne_studies)
    print(f"\n✅ Cleaning complete!")
    print(f"📁 Files created:")
    print(f"   - {content_output}")
    print(f"   - {studies_output}")
    print(f"   - {summary_output}")

if __name__ == "__main__":
    organize_csv_files() 