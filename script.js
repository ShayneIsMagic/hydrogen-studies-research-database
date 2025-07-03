// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// Header Scroll Effect
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Search Functionality
const searchInput = document.querySelector('.search-input');
const searchResults = document.createElement('div');
searchResults.className = 'search-results';
document.querySelector('.search-container').appendChild(searchResults);

searchInput.addEventListener('input', debounce(handleSearch, 300));

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    if (query.length < 2) {
        searchResults.style.display = 'none';
        return;
    }

    // Simulate search results (replace with actual API call)
    const results = [
        { title: 'Molecular Hydrogen and Brain Health', category: 'Brain' },
        { title: 'Hydrogen Water Benefits', category: 'General' },
        { title: 'Hydrogen Therapy for Inflammation', category: 'Inflammation' }
    ].filter(result => 
        result.title.toLowerCase().includes(query) || 
        result.category.toLowerCase().includes(query)
    );

    displaySearchResults(results);
}

function displaySearchResults(results) {
    if (results.length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    searchResults.innerHTML = results.map(result => `
        <div class="search-result-item">
            <h4>${result.title}</h4>
            <span>${result.category}</span>
        </div>
    `).join('');
    
    searchResults.style.display = 'block';
}

// A-Z Topics Filter
function filterTopics(letter) {
    const topics = document.querySelectorAll('.topic-item');
    const buttons = document.querySelectorAll('.alphabet-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === letter) {
            btn.classList.add('active');
        }
    });

    topics.forEach(topic => {
        if (topic.dataset.letter === letter) {
            topic.style.display = 'block';
        } else {
            topic.style.display = 'none';
        }
    });
}

// Modal Functionality
function openModal(articleId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <h2>${getArticleTitle(articleId)}</h2>
            <p>${getArticleContent(articleId)}</p>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

function getArticleTitle(articleId) {
    const titles = {
        brainObesity: 'Molecular hydrogen modulates brain glutamate/GABA-glutamine cycle in overweight humans',
        brainRadio: 'Comprehensive brain tissue metabolomics and biological network technology',
        brainStroke: 'Hydrogen rich saline promotes neuronal recovery in mice with cerebral ischemia'
    };
    return titles[articleId] || 'Article Title';
}

function getArticleContent(articleId) {
    const contents = {
        brainObesity: 'This study investigated the effects of molecular hydrogen on brain metabolism in overweight individuals. The results showed significant improvements in the glutamate/GABA-glutamine cycle, suggesting potential benefits for brain health and metabolic function.',
        brainRadio: 'Research on the protective effects of hydrogen-rich water against radiation-induced cognitive impairment. The study utilized advanced metabolomics to analyze brain tissue changes and biological network responses.',
        brainStroke: 'A comprehensive study examining how hydrogen-rich saline promotes neuronal recovery in mice with cerebral ischemia. The findings demonstrate significant improvements in neurological function and reduced brain damage.'
    };
    return contents[articleId] || 'Article content not available.';
}

// Newsletter Subscription
function subscribeNewsletter(event) {
    event.preventDefault();
    const email = event.target.querySelector('input[type="email"]').value;
    
    // Simulate API call
    console.log('Subscribing email:', email);
    
    // Show success message
    const form = event.target;
    form.innerHTML = `
        <div style="color: white; text-align: center;">
            <h3>Thank you for subscribing!</h3>
            <p>We'll keep you updated with the latest hydrogen research.</p>
        </div>
    `;
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Research Data
let yearlyChart, subjectsChart, countriesChart;
let researchData = {
    yearly: {
        labels: ['2000','2003','2006','2009','2012','2015','2018','2019','2020','2021','2022','2023'],
        positive: [5, 7, 10, 30, 60, 90, 120, 130, 140, 135, 120, 110],
        neutral: [0, 0, 1, 2, 3, 4, 5, 5, 6, 7, 7, 6],
        negative: [0, 0, 0, 1, 1, 2, 2, 2, 2, 2, 2, 2]
    },
    subjects: {
        labels: ['Rat', 'Mouse', 'Human', 'Cell Culture', 'Pig', 'Rabbit'],
        data: [37.6, 24.1, 18.9, 15.1, 2.7, 1.6]
    },
    countries: {
        labels: ['China', 'Japan', 'South Korea', 'United States', 'Taiwan', 'Serbia'],
        data: [700, 450, 120, 60, 30, 10]
    }
};

// Initialize Charts
function initializeCharts() {
    // Modern Bar Chart (Study Outcome by Year)
    const yearlyCtx = document.getElementById('yearlyChart').getContext('2d');
    yearlyChart = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
            labels: researchData.yearly.labels,
            datasets: [
                {
                    label: 'Positive',
                    data: researchData.yearly.positive,
                    backgroundColor: 'rgba(60, 120, 216, 0.85)',
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7,
                },
                {
                    label: 'Neutral',
                    data: researchData.yearly.neutral,
                    backgroundColor: 'rgba(60, 120, 216, 0.35)',
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7,
                },
                {
                    label: 'Negative',
                    data: researchData.yearly.negative,
                    backgroundColor: 'rgba(60, 120, 216, 0.15)',
                    borderRadius: 8,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#3a4a5d',
                        font: { family: 'inherit', size: 14, weight: 'bold' }
                    }
                },
                datalabels: {
                    display: true,
                    color: '#3a4a5d',
                    anchor: 'end',
                    align: 'end',
                    font: { weight: 'bold', size: 12 },
                    formatter: value => value > 0 ? value : ''
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#3a4a5d',
                    bodyColor: '#3a4a5d',
                    borderColor: '#3a4a5d',
                    borderWidth: 1,
                    padding: 12,
                    caretSize: 6,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { color: '#e5eaf2' },
                    ticks: { color: '#7b8a99', font: { family: 'inherit', size: 13 } }
                },
                y: {
                    stacked: true,
                    grid: { color: '#e5eaf2' },
                    ticks: { color: '#7b8a99', font: { family: 'inherit', size: 13 } },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Studies',
                        color: '#3a4a5d',
                        font: { family: 'inherit', size: 14, weight: 'bold' }
                    }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        },
        plugins: [ChartDataLabels]
    });

    // Modern Donut Chart (Top Study Test Subjects)
    const subjectsCtx = document.getElementById('subjectsChart').getContext('2d');
    subjectsChart = new Chart(subjectsCtx, {
        type: 'doughnut',
        data: {
            labels: researchData.subjects.labels,
            datasets: [{
                data: researchData.subjects.data,
                backgroundColor: [
                    'rgba(60, 120, 216, 0.85)',
                    'rgba(60, 120, 216, 0.65)',
                    'rgba(60, 120, 216, 0.45)',
                    'rgba(60, 120, 216, 0.25)',
                    'rgba(60, 120, 216, 0.15)',
                    'rgba(60, 120, 216, 0.10)'
                ],
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    display: false
                },
                datalabels: {
                    color: '#3a4a5d',
                    font: { weight: 'bold', size: 13 },
                    formatter: (value, ctx) => {
                        const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        const percent = (value / total * 100).toFixed(1);
                        return percent > 2 ? percent + '%' : '';
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#3a4a5d',
                    bodyColor: '#3a4a5d',
                    borderColor: '#3a4a5d',
                    borderWidth: 1,
                    padding: 12,
                    caretSize: 6,
                    displayColors: true
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1200,
                easing: 'easeOutQuart'
            },
            hover: {
                mode: 'nearest',
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // Modern Horizontal Bar Chart (Countries by Total Study Amount)
    const countriesCtx = document.getElementById('countriesChart').getContext('2d');
    countriesChart = new Chart(countriesCtx, {
        type: 'bar',
        data: {
            labels: researchData.countries.labels,
            datasets: [{
                label: 'Studies',
                data: researchData.countries.data,
                backgroundColor: ctx => {
                    const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 400, 0);
                    gradient.addColorStop(0, 'rgba(60, 120, 216, 0.85)');
                    gradient.addColorStop(1, 'rgba(60, 120, 216, 0.25)');
                    return gradient;
                },
                borderRadius: 8,
                barPercentage: 0.6,
                categoryPercentage: 0.6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: {
                    color: '#3a4a5d',
                    anchor: 'end',
                    align: 'end',
                    font: { weight: 'bold', size: 13 },
                    formatter: value => value > 0 ? value : ''
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#fff',
                    titleColor: '#3a4a5d',
                    bodyColor: '#3a4a5d',
                    borderColor: '#3a4a5d',
                    borderWidth: 1,
                    padding: 12,
                    caretSize: 6,
                    displayColors: true
                }
            },
            scales: {
                x: {
                    grid: { color: '#e5eaf2' },
                    ticks: { color: '#7b8a99', font: { family: 'inherit', size: 13 } },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Studies',
                        color: '#3a4a5d',
                        font: { family: 'inherit', size: 14, weight: 'bold' }
                    }
                },
                y: {
                    grid: { color: '#e5eaf2' },
                    ticks: { color: '#7b8a99', font: { family: 'inherit', size: 13 } }
                }
            },
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            }
        },
        plugins: [ChartDataLabels]
    });

    // Initialize legends
    initializeLegends();
}

function initializeLegends() {
    // Yearly chart legend
    const yearlyLegend = document.getElementById('yearlyLegend');
    const yearlyColors = ['#548bc4', '#9ca3af', '#ef4444'];
    const yearlyLabels = ['Positive Outcomes', 'Neutral Outcomes', 'Negative Outcomes'];
    
    yearlyLabels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background: ${yearlyColors[index]}"></span>
            ${label}
        `;
        legendItem.onclick = () => toggleDataset(yearlyChart, index);
        yearlyLegend.appendChild(legendItem);
    });

    // Subjects chart legend
    const subjectsLegend = document.getElementById('subjectsLegend');
    const subjectsColors = ['#548bc4', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
    
    researchData.subjects.labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-color" style="background: ${subjectsColors[index]}"></span>
            ${label}
        `;
        legendItem.onclick = () => toggleDataset(subjectsChart, index);
        subjectsLegend.appendChild(legendItem);
    });
}

function toggleDataset(chart, index) {
    const meta = chart.getDatasetMeta(index);
    meta.hidden = !meta.hidden;
    chart.update();
}

function updateCharts() {
    const timeRange = document.getElementById('timeRange').value;
    const studyType = document.getElementById('studyType').value;

    // Simulate data filtering (replace with actual API call)
    const filteredData = filterData(timeRange, studyType);
    
    // Update charts with filtered data
    updateYearlyChart(filteredData.yearly);
    updateSubjectsChart(filteredData.subjects);
    updateCountriesChart(filteredData.countries);
    
    // Update summary statistics
    updateSummaryStats(filteredData);
}

function filterData(timeRange, studyType) {
    // Simulate data filtering (replace with actual API call)
    return {
        yearly: researchData.yearly,
        subjects: researchData.subjects,
        countries: researchData.countries
    };
}

function updateYearlyChart(data) {
    yearlyChart.data.labels = data.labels;
    yearlyChart.data.datasets[0].data = data.positive;
    yearlyChart.data.datasets[1].data = data.neutral;
    yearlyChart.data.datasets[2].data = data.negative;
    yearlyChart.update();
}

function updateSubjectsChart(data) {
    subjectsChart.data.labels = data.labels;
    subjectsChart.data.datasets[0].data = data.data;
    subjectsChart.update();
}

function updateCountriesChart(data) {
    countriesChart.data.labels = data.labels;
    countriesChart.data.datasets[0].data = data.data;
    countriesChart.update();
}

function updateSummaryStats(data) {
    // Calculate and update summary statistics
    const totalStudies = data.yearly.positive.reduce((a, b) => a + b, 0) +
                        data.yearly.neutral.reduce((a, b) => a + b, 0) +
                        data.yearly.negative.reduce((a, b) => a + b, 0);
    
    document.getElementById('totalStudies').textContent = totalStudies.toLocaleString();
    document.getElementById('avgDuration').textContent = '12 months';
    document.getElementById('successRate').textContent = '78%';
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    filterTopics('A'); // Show topics starting with 'A' by default
}); 