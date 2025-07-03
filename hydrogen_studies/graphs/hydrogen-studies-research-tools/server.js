const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static(__dirname));

// Serve the CSV file
app.get('/data/csv', (req, res) => {
    const csvPath = path.join(__dirname, '..', 'Hydrogen Research Database - Secondary, Tertiary.csv');
    
    if (fs.existsSync(csvPath)) {
        res.setHeader('Content-Type', 'text/csv');
        res.sendFile(csvPath);
    } else {
        res.status(404).send('CSV file not found');
    }
});

// Serve the main dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'hydrogen-research-dashboard.html'));
});

app.listen(PORT, () => {
    console.log(`Hydrogen Research Dashboard server running at http://localhost:${PORT}`);
    console.log(`CSV data available at http://localhost:${PORT}/data/csv`);
}); 