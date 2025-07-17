# Comprehensive Manual Extraction Guide for Hydrogen Studies

This guide provides step-by-step instructions to manually extract comprehensive data from the Hydrogen Studies website, including topics, page content, and detailed study information.

## Target Requirements

**Source**: https://hydrogenstudies.com/topics/

**Output**: `hydrogen_studies_by_topic.csv` with columns:
- Topic
- Page Content
- Study Title
- Authors
- Year
- DOI or Study Link

## Step-by-Step Extraction Process

### Step 1: Access the Main Topics Page

1. **Open your web browser**
2. **Navigate to**: `https://hydrogenstudies.com/topics/`
3. **Wait for the page to fully load** (may take a few seconds due to Cloudflare)
4. **Verify you can see the topics page** with various topic categories

### Step 2: Identify and List All Topics

Look for topic categories on the main page. Common topic areas include:

#### Health Categories:
- Cardiovascular Health
- Neurological Benefits
- Athletic Performance
- Anti-inflammatory Effects
- Antioxidant Properties
- Metabolic Health
- Skin Health
- Eye Health
- Respiratory Health
- Digestive Health
- Immune System
- Bone Health
- Mental Health
- Sleep Quality

#### Research Areas:
- Molecular Hydrogen Studies
- Hydrogen Water Research
- Clinical Trials
- Animal Studies
- Cell Culture Studies
- Human Studies

#### Medical Conditions:
- Diabetes
- Cancer
- Alzheimer's Disease
- Parkinson's Disease
- Heart Disease
- Stroke
- Arthritis
- Inflammatory Bowel Disease

### Step 3: Extract Topic Links

For each topic you find:

1. **Right-click on the topic link**
2. **Select "Copy Link Address"** or "Copy Link Location"
3. **Note the topic name** as it appears on the page
4. **Record both the topic name and URL** in a spreadsheet

### Step 4: Visit Each Topic Page

For each topic URL you collected:

1. **Open the topic page** in a new tab
2. **Wait for the page to load completely**
3. **Extract the page content** (introductory paragraphs)
4. **Find all studies listed on that page**

### Step 5: Extract Page Content

On each topic page, look for:

- **Main content area** (usually in `<main>` or content div)
- **Introductory paragraphs** explaining the topic
- **Descriptive text** about the research area
- **Overview sections**

**Copy the descriptive content** and save it for that topic.

### Step 6: Extract Study Information

For each study on the topic page, collect:

#### Study Title
- Look for study titles in headings (H1, H2, H3, etc.)
- Check for linked study titles
- Look for article titles

#### Authors
- Search for "by [Author Name]"
- Look for "Authors:" or "Author:"
- Check for author information in study descriptions
- Look for author names in parentheses

#### Year
- Search for 4-digit years (2020, 2021, 2022, 2023, 2024)
- Look for publication dates
- Check for year information in study titles or descriptions

#### DOI or Study Link
- Look for DOI numbers (format: 10.xxxx/xxxxx)
- Check for "DOI:" followed by the number
- Look for study links that lead to full papers
- Check for "Read More" or "Full Study" links

### Step 7: Organize Data in CSV Format

Create a CSV file with the following structure:

```csv
Topic,Page Content,Study Title,Authors,Year,DOI or Study Link
"Cardiovascular Health","Research on hydrogen water and cardiovascular benefits including heart health, blood pressure, and circulation. Studies show promising results for heart disease prevention and treatment.","Hydrogen Water and Heart Health Study","Dr. John Smith, Dr. Jane Doe","2023","10.1234/hydrogen-heart-2023"
"Cardiovascular Health","Research on hydrogen water and cardiovascular benefits including heart health, blood pressure, and circulation. Studies show promising results for heart disease prevention and treatment.","Molecular Hydrogen Therapy for Heart Disease","Dr. Robert Johnson","2022","https://hydrogenstudies.com/study/heart-disease-2022"
```

## Data Extraction Tips

### Finding Study Information

1. **Use Browser Search (Ctrl+F)** to find:
   - "study" - to locate study titles
   - "author" - to find author information
   - "202" - to find years (2020, 2021, 2022, 2023, 2024)
   - "DOI" - to find DOI numbers
   - "10." - to find DOI numbers (they start with 10.)

2. **Use Developer Tools (F12)** to:
   - Inspect page structure
   - Find hidden content
   - Locate study links
   - Extract text from specific elements

3. **Look for Patterns**:
   - Study titles are often in headings
   - Authors are usually mentioned after "by" or "authors:"
   - Years are typically 4-digit numbers
   - DOIs follow the pattern 10.xxxx/xxxxx

### Handling Missing Information

- **If authors are not listed**: Leave the field blank
- **If year is not available**: Leave the field blank
- **If DOI is not provided**: Use the study link URL instead
- **If page content is minimal**: Extract what's available or note "Limited content"

### Quality Control

Before finalizing your CSV:

- [ ] All topics are properly categorized
- [ ] Page content is descriptive and relevant
- [ ] Study titles are accurate and complete
- [ ] Authors are correctly identified (when available)
- [ ] Years are accurate (when available)
- [ ] DOIs or links are valid
- [ ] No duplicate entries
- [ ] HTML tags are removed from content
- [ ] CSV format is correct (commas, quotes)
- [ ] File is saved as `hydrogen_studies_by_topic.csv`

## Expected Data Structure

Your final CSV should contain:

### Example Entry 1:
- **Topic**: Cardiovascular Health
- **Page Content**: Research on hydrogen water and cardiovascular benefits including heart health, blood pressure, and circulation. Studies show promising results for heart disease prevention and treatment.
- **Study Title**: Hydrogen Water and Heart Health Study
- **Authors**: Dr. John Smith, Dr. Jane Doe
- **Year**: 2023
- **DOI or Study Link**: 10.1234/hydrogen-heart-2023

### Example Entry 2:
- **Topic**: Neurological Benefits
- **Page Content**: Studies on hydrogen water's effects on brain function, cognitive performance, and neurological disorders. Research indicates potential benefits for memory and cognitive health.
- **Study Title**: Molecular Hydrogen and Brain Function
- **Authors**: Dr. Sarah Wilson
- **Year**: 2022
- **DOI or Study Link**: https://hydrogenstudies.com/study/brain-function-2022

## File Naming and Saving

1. **Save your CSV file as**: `hydrogen_studies_by_topic.csv`
2. **Use UTF-8 encoding** to handle special characters
3. **Back up your work** regularly during the extraction process
4. **Verify the file opens correctly** in a spreadsheet application

## Troubleshooting

### Common Issues:

1. **Page doesn't load**: Try refreshing or wait longer for Cloudflare
2. **Can't find study information**: Use browser search or developer tools
3. **Missing data**: Note it as blank rather than guessing
4. **Duplicate studies**: Check carefully and remove duplicates
5. **Format issues**: Ensure proper CSV formatting with quotes around text

### When to Stop:

- You've processed all visible topics
- You've extracted all available study information
- The data quality is consistent and complete
- You've reached a reasonable stopping point

## Final Steps

1. **Review your data** for completeness and accuracy
2. **Test the CSV file** by opening it in a spreadsheet application
3. **Verify all columns** are properly formatted
4. **Save the final version** as `hydrogen_studies_by_topic.csv`
5. **Back up your work** to prevent data loss

---

**Note**: This manual approach ensures you get accurate, complete data while respecting the website's terms of service and technical limitations. The process may take several hours depending on the number of topics and studies available. 