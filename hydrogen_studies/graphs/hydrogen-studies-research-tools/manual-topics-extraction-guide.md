# Manual Topics Extraction Guide

Since the Hydrogen Studies website is protected by Cloudflare, automated extraction is challenging. Here's how to manually extract the topics and study links.

## Why Manual Extraction?

The website at `https://hydrogenstudies.com/topics/` is protected by Cloudflare, which:
- Blocks automated requests
- Requires JavaScript execution
- Shows a "Just a moment..." challenge page
- Prevents direct scraping

## Manual Extraction Steps

### Step 1: Access the Topics Page
1. Open your web browser
2. Navigate to: `https://hydrogenstudies.com/topics/`
3. Wait for the page to fully load (may take a few seconds due to Cloudflare)

### Step 2: Identify Topic Sections
Look for:
- **Topic headings** (H1, H2, H3, etc.)
- **Category sections** 
- **Study lists** under each topic
- **Navigation menus** that might list topics

### Step 3: Extract Data
For each topic you find:

1. **Copy the topic name**
2. **Find all study links** associated with that topic
3. **Record the study title** (link text)
4. **Copy the study URL** (link href)

### Step 4: Use the CSV Template
Use the provided CSV template to organize your data:

```csv
Topic,Study Title,Study URL
"Cardiovascular Health","Study on hydrogen water and heart health","https://hydrogenstudies.com/study/cardiovascular-health-2023"
"Cardiovascular Health","Research on hydrogen therapy for heart disease","https://hydrogenstudies.com/study/heart-disease-hydrogen-2022"
"Neurological Benefits","Hydrogen water and brain function","https://hydrogenstudies.com/study/brain-function-hydrogen-2023"
```

## CSV Template File

A template CSV file has been created: `topics-extraction-template.csv`

## Tips for Manual Extraction

### Browser Tools
- **Developer Tools** (F12): Use to inspect page structure
- **Find in Page** (Ctrl+F): Search for "study", "research", "topic"
- **Copy Link Address**: Right-click links to copy URLs

### Common Topic Categories
Look for these potential topic areas:
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

### Study Link Patterns
Study links often contain:
- `/study/` in the URL
- `/research/` in the URL
- `/article/` in the URL
- Year numbers (2020, 2021, 2022, 2023, 2024)

## Alternative Approaches

### 1. Use Browser Extensions
Consider using browser extensions that can:
- Export page links
- Save page structure
- Extract data from specific elements

### 2. Manual Copy-Paste
1. Select all content on the page (Ctrl+A)
2. Copy to a text editor
3. Search for topic patterns and study links
4. Organize manually

### 3. Screenshot and OCR
1. Take screenshots of topic sections
2. Use OCR tools to extract text
3. Manually verify and organize

## Expected Output Format

Your final CSV should have this structure:

```csv
Topic,Study Title,Study URL
"Topic Name 1","Study Title 1","https://hydrogenstudies.com/study/url-1"
"Topic Name 1","Study Title 2","https://hydrogenstudies.com/study/url-2"
"Topic Name 2","Study Title 3","https://hydrogenstudies.com/study/url-3"
```

## File Naming Convention

Save your completed CSV as:
```
hydrogen-studies-topics-manual-[DATE].csv
```

Example: `hydrogen-studies-topics-manual-2025-07-16.csv`

## Quality Checklist

Before finalizing your CSV:
- [ ] All topics are properly categorized
- [ ] Study titles are accurate and complete
- [ ] URLs are valid and accessible
- [ ] No duplicate entries
- [ ] CSV format is correct (commas, quotes)
- [ ] File is saved with UTF-8 encoding

## Support

If you encounter issues:
1. Check that the website is accessible in your browser
2. Ensure you're on the correct page (`/topics/`)
3. Try refreshing the page if it doesn't load properly
4. Contact the website administrators if the page structure has changed

## Next Steps

Once you have your CSV file:
1. Review the data for accuracy
2. Back up your work
3. Use the data for your research or analysis
4. Consider sharing the organized data with the community

---

**Note**: This manual approach ensures you get accurate, complete data while respecting the website's terms of service and technical limitations. 