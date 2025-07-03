# Hydrogen Studies Research Database

A comprehensive research database and analysis platform for hydrogen-related studies, featuring advanced data processing, visualization, and web scraping tools.

## 🚀 Features

### 📊 **Research Dashboard**
- **Interactive Statistics**: Total studies, unique titles, authors, and hyperlinks
- **Advanced Search**: Filter by year, topic, country, and study type
- **Data Visualization**: Timeline charts, topic distribution, and country analysis
- **PDF Access**: Direct links to study PDFs via DOI/PMID/Link data

### 🔧 **Data Processing Tools**
- **CSV Analyzer**: Comprehensive analysis of research data
- **Duplicate Detector**: Identify and remove duplicate studies
- **Data Exporter**: Export combined data with preserved hyperlinks
- **Combined Data Loader**: Load and merge all three CSV files

### 🌐 **Web Scraping Tools**
- **Echo Water Scraper**: Extract data from Echo Water website
- **Advanced Web Scraper**: Generic scraping with pagination support
- **Dashboard Integration**: Seamless integration with research database

### 📈 **Data Sources**
- **Primary Research**: 1,532 studies with detailed metadata
- **Engineering Studies**: 75 technical and engineering studies
- **Secondary/Tertiary**: 469 review and analysis studies
- **Total**: 2,071 unique research studies

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.9+ (for HTTP server)
- Node.js (optional, for advanced features)
- Modern web browser

### Quick Start
1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd HydrogenStudies.com
   ```

2. **Start the server**:
   ```bash
   python3 -m http.server 9000
   ```

3. **Access the dashboard**:
   ```
   http://localhost:9000/hydrogen_studies/graphs/hydrogen-studies-research-tools/hydrogen-research-dashboard.html
   ```

## 📁 Project Structure

```
HydrogenStudies.com/
├── hydrogen_studies/
│   └── graphs/
│       ├── hydrogen-studies-research-tools/     # Main tools directory
│       │   ├── hydrogen-research-dashboard.html # Main dashboard
│       │   ├── hydrogen-data-processor.js       # Data processing engine
│       │   ├── csv-analyzer.html               # CSV analysis tool
│       │   ├── duplicate-detector.js           # Duplicate detection
│       │   ├── web-scraper-interface.html      # Web scraping interface
│       │   ├── echo-water-interface.html       # Echo Water scraper
│       │   └── ...                             # Additional tools
│       ├── Hydrogen Research Database - Primary.csv
│       ├── Hydrogen Research Database - Engineering.csv
│       └── Hydrogen Research Database - Secondary, Tertiary.csv
└── README.md
```

## 🎯 Key Tools

### **Main Dashboard**
- **URL**: `/hydrogen-research-dashboard.html`
- **Features**: Statistics, search, charts, and study details
- **Data**: Loads all three CSV files automatically

### **CSV Analyzer**
- **URL**: `/csv-analyzer.html`
- **Features**: Analyze individual CSV files with statistics
- **Export**: Generate reports and filtered data

### **Data Export Tool**
- **URL**: `/csv-export-tool.html`
- **Features**: Combine all CSV files, remove duplicates
- **Output**: Single CSV with all studies and preserved hyperlinks

### **Web Scraping Tools**
- **Echo Water**: `/echo-water-interface.html`
- **Generic Scraper**: `/web-scraper-interface.html`
- **Features**: Extract data from websites with filtering

## 📊 Data Fields

### **Study Information**
- Title, Authors, Year, Journal
- DOI/PMID/Link (for PDF access)
- Abstract, Country, Topic
- Designation (Review, Research, etc.)

### **Additional Fields** (Primary CSV)
- Rank, Model (Human/Animal)
- Vehicle (Water, Gas, etc.)
- pH, Application, Comparison
- Primary/Secondary/Tertiary Topics

## 🔍 Search Capabilities

### **Advanced Filters**
- **Text Search**: Search titles, abstracts, authors
- **Year Range**: Filter by publication year
- **Topic Filter**: Filter by research topic
- **Country Filter**: Filter by study location
- **Type Filter**: Filter by study designation

### **Smart Suggestions**
- Auto-complete for topics, countries, authors
- Search suggestions based on available data
- Keyboard shortcuts (Ctrl+K for search)

## 📈 Statistics & Analytics

### **Dashboard Statistics**
- **Total Studies**: 2,071 (combined from all sources)
- **Unique Titles**: Count of distinct study titles
- **Unique Authors**: Count of distinct researchers
- **With Hyperlinks**: Studies with PDF access
- **Topics**: 46 unique research topics
- **Countries**: 50 countries represented

### **Visualizations**
- **Timeline Charts**: Research trends over time
- **Topic Distribution**: Most researched areas
- **Country Analysis**: Geographic distribution
- **Growth Trends**: Publication patterns

## 🚀 Advanced Features

### **Data Integration**
- Automatic loading of all three CSV files
- Duplicate detection and removal
- Data normalization and cleaning
- Hyperlink preservation and generation

### **Export Options**
- Combined CSV export
- JSON data export
- Filtered data export
- Statistics reports

### **Web Scraping**
- CORS proxy support
- Pagination handling
- Data extraction and conversion
- Integration with dashboard

## 🔧 Technical Details

### **Technologies Used**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for data visualization
- **CSV Processing**: Papa Parse library
- **Server**: Python HTTP server (development)

### **Browser Compatibility**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 Usage Examples

### **Search for Studies**
1. Open the dashboard
2. Use the search bar or filters
3. View study details with PDF links
4. Export filtered results

### **Analyze Data**
1. Use CSV Analyzer for detailed statistics
2. Export specific data subsets
3. Generate reports for research

### **Scrape New Data**
1. Use web scraping tools
2. Extract data from websites
3. Convert to CSV format
4. Integrate with dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues or questions:
1. Check the documentation
2. Review existing issues
3. Create a new issue with details

## 🔄 Version History

- **v1.0.0**: Initial release with comprehensive dashboard and tools
- **Features**: Data processing, visualization, web scraping, export tools
- **Data**: 2,071 studies from three CSV sources
- **Tools**: 15+ specialized tools for research analysis

---

**Note**: This is a research tool designed for academic and scientific use. Always verify data accuracy and cite original sources appropriately. 