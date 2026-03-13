document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    fetchDashboardData();
    initEduBubbleChart();
    initLifestyleRadarChart();
});

/**
 * Initialize Tab Navigation
 */
function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add to clicked
            item.classList.add('active');
            
            // Note: In a real app we'd switch tab content here based on data-tab attribute.
            // For MVP, we only have the main dashboard built out.
            const targetTab = item.getAttribute('data-tab');
            console.log(`Switched to tab: ${targetTab}`);
        });
    });
}

/**
 * Fetch data from FastAPI Backend
 */
async function fetchDashboardData() {
    try {
        // Fetch Summary KPI Data
        const summaryRes = await fetch('http://127.0.0.1:8000/api/realestate/summary');
        const summaryData = await summaryRes.json();
        
        if (summaryData.status === 'success') {
            updateKPIs(summaryData.summary);
        }

        // Fetch Transaction Data for Chart
        const txRes = await fetch('http://127.0.0.1:8000/api/realestate/transactions');
        const txData = await txRes.json();
        
        if (txData.status === 'success') {
            initMainChart(txData.data);
        }
    } catch (error) {
        console.error('Error fetching data from API:', error);
        // Fallback to empty chart if API is down
        initMainChart([]);
    }
}

/**
 * Update Dashboard KPIs
 */
function updateKPIs(summary) {
    const kpiValues = document.querySelectorAll('.kpi-value');
    if (kpiValues.length >= 3) {
        // Update Avg Price
        kpiValues[0].innerHTML = `${(summary.avg_price_krw/10000).toFixed(1)}억 <span class="badge-positive">+1.2%</span>`;
        // Update Total Transactions (mocked as population for now)
        kpiValues[1].innerHTML = `${summary.total_transactions}건 <span class="badge-positive">활발</span>`;
    }
}

/**
 * Initialize Main Dashboard Chart (Chart.js)
 */
function initMainChart(transactions) {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;
    
    // Check if chart instance exists and destroy it
    if (window.mainChartInstance) {
        window.mainChartInstance.destroy();
    }

    // Process API data for the chart
    const labels = [];
    const prices = [];
    
    // Simple grouping by date for demonstration
    if (transactions && transactions.length > 0) {
        transactions.forEach(tx => {
            labels.push(tx['거래일자']);
            prices.push(tx['거래금액(만원)']);
        });
    } else {
        // Fallback hardcoded labels if API fails
        labels.push('1월 1일', '1월 5일', '1월 10일');
        prices.push(100000, 120000, 110000);
    }

    // Gradient for the line chart fill
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(49, 130, 246, 0.2)'); // toss-blue
    gradient.addColorStop(1, 'rgba(49, 130, 246, 0.0)');

    const data = {
        labels: labels,
        datasets: [
            {
                label: '실거래가 (만원)',
                data: prices,
                borderColor: '#3182f6', // toss-blue
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#ffffff', // bg-surface
                pointBorderColor: '#3182f6',
                pointHoverBackgroundColor: '#3182f6',
                pointHoverBorderColor: '#ffffff',
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4 // smooth curves
            }
        ]
    };

    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        color: '#4e5968', // text-secondary
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(25, 31, 40, 0.9)', // almost black
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.03)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8b95a1' // text-tertiary
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.03)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#8b95a1'
                    },
                    beginAtZero: false
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    };

    window.mainChartInstance = new Chart(ctx, config);
}

/* === Edu Labs: Academy Distribution Bubble Chart === */
function initEduBubbleChart() {
    const ctx = document.getElementById('eduBubbleChart');
    if (!ctx) return;
    
    // Toss colors
    const tossBlue = '#3182f6';
    const tossRed = '#f04452';

    const data = {
        datasets: [{
            label: '북동탄 (카림상권)',
            data: [
                { x: 1, y: 85, r: 25 }, // 영수입시학원 많음 (x: 상권인덱스, y: 학원비/규모, r: 밀집도)
                { x: 1, y: 40, r: 15 }, // 예체능
                { x: 1, y: 60, r: 10 }  // 단과학원
            ],
            backgroundColor: 'rgba(49, 130, 246, 0.6)', // tossBlue
            borderColor: tossBlue,
        }, {
            label: '남동탄 (호수공원 주변)',
            data: [
                { x: 2, y: 70, r: 35 }, // 대형 입시학원 밀집
                { x: 2, y: 55, r: 20 },
                { x: 2, y: 30, r: 25 }  // 어학원
            ],
            backgroundColor: 'rgba(240, 68, 82, 0.6)', // tossRed
            borderColor: tossRed,
        }]
    };

    new Chart(ctx, {
        type: 'bubble',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#4e5968', usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    backgroundColor: 'rgba(25, 31, 40, 0.9)',
                    titleColor: '#ffffff', bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: 밀집도 지수 ${context.raw.r}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: '상권 구역', color: '#8b95a1' },
                    ticks: { 
                        color: '#8b95a1',
                        callback: function(value) { return value === 1 ? '북동탄' : (value === 2 ? '남동탄' : ''); }
                    },
                    grid: { color: 'rgba(0,0,0,0.03)' }
                },
                y: { 
                    title: { display: true, text: '평균 수강 단가 (규모)', color: '#8b95a1' },
                    ticks: { color: '#8b95a1' },
                    grid: { color: 'rgba(0,0,0,0.03)' }
                }
            }
        }
    });
}

/* === Lifestyle: Hotplace Congestion Radar Chart === */
function initLifestyleRadarChart() {
    const ctx = document.getElementById('lifestyleRadarChart');
    if (!ctx) return;

    const data = {
        labels: ['오전 10시', '낮 12시', '오후 3시', '오후 6시', '오후 9시', '심야'],
        datasets: [{
            label: '롯데백화점 동탄점',
            data: [40, 85, 95, 80, 40, 0],
            backgroundColor: 'rgba(49, 130, 246, 0.2)', // tossBlue
            borderColor: '#3182f6',
            pointBackgroundColor: '#3182f6',
        }, {
            label: '동탄호수공원',
            data: [20, 50, 70, 95, 85, 40],
            backgroundColor: 'rgba(3, 199, 90, 0.2)', // tossGreen
            borderColor: '#03c75a',
            pointBackgroundColor: '#03c75a',
        }]
    };

    new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#4e5968', usePointStyle: true, boxWidth: 8 } },
                tooltip: {
                    backgroundColor: 'rgba(25, 31, 40, 0.9)',
                    titleColor: '#ffffff', bodyColor: '#ffffff'
                }
            },
            elements: { line: { borderWidth: 3 } },
            scales: {
                r: {
                    angleLines: { color: 'rgba(0,0,0,0.05)' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    pointLabels: { color: '#4e5968', font: { family: 'Pretendard', size: 12 } },
                    ticks: { display: false, min: 0, max: 100 } // Hide tick numbers for clean UI
                }
            }
        }
    });
}
