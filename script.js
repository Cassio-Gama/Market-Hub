/**
 * Market Hub Lite - Dashboard Logic
 */

// --- CONFIGURATION & MOCK DATA ---

const ASSETS_CONFIG = [
    { id: 'ibov', symbol: 'IBOV', name: 'Ibovespa', price: 180475.00, change: 0.4 },
    { id: 'usdbrl', symbol: 'USD/BRL', name: 'US Dollar', price: 5.23, change: -0.2 },
    { id: 'petr4', symbol: 'PETR4', name: 'Petrobras PN', price: 38.42, change: 1.2 },
    { id: 'vale3', symbol: 'VALE3', name: 'Vale ON', price: 65.10, change: -0.8 },
    { id: 'itub4', symbol: 'ITUB4', name: 'Itaú Unibanco', price: 34.20, change: 0.5 },
];

// Historical data for IBOV chart (last 20 points)
let chartData = Array.from({ length: 20 }, (_, i) => 179000 + Math.random() * 2000);
let chartLabels = Array.from({ length: 20 }, (_, i) => `${10 + i}:00`);

let mainChart;

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    renderAssetList();
    renderTicker();
    updateTimestamp();

    // Start simulation loop (every 5 seconds)
    setInterval(updateMarketData, 5000);
});

// --- CHART LOGIC ---

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
    
    // Custom gradient for the area chart
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(63, 185, 80, 0.3)');
    gradient.addColorStop(1, 'rgba(63, 185, 80, 0)');

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'IBOVESPA',
                data: chartData,
                borderColor: '#3fb950',
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4, // Smooth curve
                pointRadius: 0,
                pointHoverRadius: 5,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#161b22',
                    titleColor: '#8b949e',
                    bodyColor: '#e6edf3',
                    borderColor: '#30363d',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: '#30363d', drawBorder: false },
                    ticks: { color: '#8b949e', font: { family: 'monospace', size: 10 } }
                },
                y: {
                    grid: { color: '#30363d', drawBorder: false },
                    ticks: { color: '#8b949e', font: { family: 'monospace', size: 10 } }
                }
            }
        }
    });

    // Update the center price display
    document.getElementById('chart-price').textContent = ASSETS_CONFIG[0].price.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// --- RENDERING LOGIC ---

function renderAssetList() {
    const list = document.getElementById('asset-list');
    list.innerHTML = '';

    ASSETS_CONFIG.forEach(asset => {
        const changeClass = asset.change >= 0 ? 'up' : 'down';
        const sign = asset.change >= 0 ? '+' : '';
        
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.innerHTML = `
            <div class="asset-info">
                <span class="asset-name">${asset.symbol}</span>
                <span class="asset-desc">${asset.name}</span>
            </div>
            <div class="asset-values">
                <div class="asset-price" id="price-${asset.id}">${formatPrice(asset.price)}</div>
                <div class="asset-change ${changeClass}" id="change-${asset.id}">${sign}${asset.change.toFixed(2)}%</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderTicker() {
    const wrapper = document.getElementById('ticker-wrapper');
    wrapper.innerHTML = '';
    
    // Create ticker items
    ASSETS_CONFIG.forEach(asset => {
        const changeClass = asset.change >= 0 ? 'up' : 'down';
        const sign = asset.change >= 0 ? '+' : '';
        
        const span = document.createElement('div');
        span.className = 'ticker-item';
        span.innerHTML = `${asset.symbol}: <span>${formatPrice(asset.price)}</span> (<span class="${changeClass}">${sign}${asset.change.toFixed(2)}%</span>)`;
        wrapper.appendChild(span);
    });

    // Duplicate content for seamless scrolling
    const clone = wrapper.cloneNode(true);
    clone.id = ''; // Remove id to avoid duplicates
    wrapper.parentNode.appendChild(clone);
}

// --- UPDATE LOGIC ---

function updateMarketData() {
    ASSETS_CONFIG.forEach(asset => {
        // Random fluctuation between -0.3% and +0.3%
        const fluctuation = (Math.random() * 0.6 - 0.3) / 100;
        const oldPrice = asset.price;
        asset.price = asset.price * (1 + fluctuation);
        
        // Simulating a small change in percentage as well
        asset.change += (Math.random() * 0.1 - 0.05);

        // Update UI
        const priceEl = document.getElementById(`price-${asset.id}`);
        const changeEl = document.getElementById(`change-${asset.id}`);

        if (priceEl) {
            priceEl.textContent = formatPrice(asset.price);
            // Add blink effect if price changed
            priceEl.classList.remove('blink');
            void priceEl.offsetWidth; // Trigger reflow
            priceEl.classList.add('blink');
        }

        if (changeEl) {
            const sign = asset.change >= 0 ? '+' : '';
            changeEl.textContent = `${sign}${asset.change.toFixed(2)}%`;
            changeEl.className = `asset-change ${asset.change >= 0 ? 'up' : 'down'}`;
        }
    });

    // Update IBOV Chart
    const ibov = ASSETS_CONFIG[0];
    chartData.shift();
    chartData.push(ibov.price);
    mainChart.update('none'); // Update without animation for performance

    // Update center display price
    const chartPriceEl = document.getElementById('chart-price');
    chartPriceEl.textContent = formatPrice(ibov.price);
    chartPriceEl.className = `current-price ${ibov.change >= 0 ? 'up' : 'down'}`;

    updateTimestamp();
    
    // Update ticker colors (re-rendering is simpler for this mock)
    // In a real app we would target specific spans
}

function formatPrice(val) {
    if (val > 1000) return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function updateTimestamp() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    document.getElementById('last-update').textContent = `LAST SYNC: ${timeStr}`;
}
