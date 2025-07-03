# Hydrogen Studies Research Dashboard

A comprehensive dashboard for analyzing the Hydrogen Research Database - Secondary, Tertiary studies.

## 🚀 Quick Start

### Option 1: Using the Startup Script (Recommended)
```bash
cd hydrogen_studies/graphs/hydrogen-studies-research-tools
./start-dashboard.sh
```

### Option 2: Python Server
```bash
cd hydrogen_studies/graphs/hydrogen-studies-research-tools
python3 -m http.server 8000
```
Then visit: http://localhost:8000/hydrogen-research-dashboard.html

### Option 3: Node.js Server
```bash
cd hydrogen_studies/graphs/hydrogen-studies-research-tools
npm install
npm start
```
Then visit: http://localhost:3000

## 📊 Features

- **Interactive Timeline Charts**: View research publication trends over time
- **Topic Analysis**: Explore research topics and their distribution
- **Geographic Analysis**: See research distribution by country
- **Advanced Search**: Search and filter studies by various criteria
- **Statistics Dashboard**: Key metrics and insights about the research database

## 🔧 Technical Details

### Files Structure
```
hydrogen-studies-research-tools/
├── hydrogen-research-dashboard.html    # Main dashboard interface
├── hydrogen-data-processor.js          # Data processing and chart generation
├── server.js                           # Node.js server (optional)
├── package.json                        # Node.js dependencies
├── start-dashboard.sh                  # Startup script
└── README.md                           # This file
```

### Data Source
The dashboard loads data from: `../Hydrogen Research Database - Secondary, Tertiary.csv`

### Dependencies
- **Frontend**: Chart.js, Papa Parse (loaded via CDN)
- **Backend**: Express.js, CORS (for Node.js server)

## 🛠️ Troubleshooting

### CORS Error
If you see a CORS error, it means you're trying to open the HTML file directly in the browser. **Always use a web server** (see Quick Start options above).

### CSV Not Found
Make sure the CSV file exists at: `hydrogen_studies/graphs/Hydrogen Research Database - Secondary, Tertiary.csv`

### Port Already in Use
If port 8000 or 3000 is already in use, you can:
- Kill the existing process, or
- Use a different port: `python3 -m http.server 8080`

## 📈 Chart Types

- **Timeline**: Line, bar, area, and logarithmic views
- **Topics**: Doughnut, pie, and bar charts
- **Countries**: Vertical and horizontal bar charts

## 🔍 Search Features

- Text search across titles, abstracts, authors, and topics
- Filter by year range
- Filter by research topic
- Filter by country
- Filter by study designation (Review, Hypothesis, etc.)

## 📱 Responsive Design

The dashboard is fully responsive and works on desktop, tablet, and mobile devices.

## 🎨 Customization

You can customize the dashboard by modifying:
- Colors and styling in the CSS section
- Chart configurations in `hydrogen-data-processor.js`
- Data processing logic for different CSV formats

## 📄 License

This dashboard is part of the Hydrogen Studies research project. 