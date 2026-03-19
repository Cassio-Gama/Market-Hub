/**
 * Market Hub Lite - Dashboard Logic (Brapi API Integrated)
 */

// --- CONFIGURATION & API SETTINGS ---

// Substitua 'SUA_CHAVE_AQUI' pela sua chave gratuita obtida em brapi.dev
const BRAPI_TOKEN = 'pY7wgXLqgH18uu8fF5SeDD';
const BASE_URL = 'https://brapi.dev/api';

const ASSETS_CONFIG = [
    { id: '^BVSP', symbol: 'IBOV', name: 'Ibovespa', price: 0, change: 0 },
    { id: 'USD-BRL', symbol: 'USD/BRL', name: 'Dólar Comercial', price: 0, change: 0 },
    { id: 'PETR4', symbol: 'PETR4', name: 'Petrobras PN', price: 0, change: 0 },
    { id: 'VALE3', symbol: 'VALE3', name: 'Vale ON', price: 0, change: 0 },
    { id: 'ITUB4', symbol: 'ITUB4', name: 'Itaú Unibanco', price: 0, change: 0 },
];

let chartData = [];
let chartLabels = [];
let mainChart;
let selectedTicker = '^BVSP'; // Inicializa com IBOV

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    initChart();
    renderAssetList();
    renderTicker();

    // Carregamento inicial
    await refreshAllData();

    // Loop de atualização (cada 2 minutos para respeitar limites da API gratuita)
    setInterval(refreshAllData, 120000);
});

// --- API SERVICES ---

async function fetchMarketData() {
    // Na camada gratuita, a Brapi frequentemente exige busca de um ativo por vez
    const stocks = ASSETS_CONFIG.filter(a => a.id !== 'USD-BRL');
    
    for (const asset of stocks) {
        try {
            console.log(`Market Hub: Buscando cotação de ${asset.id}...`);
            // Usar encodeURIComponent para lidar com o caractere '^' do IBOV
            const ticker = encodeURIComponent(asset.id);
            const response = await fetch(`${BASE_URL}/quote/${ticker}?token=${BRAPI_TOKEN}`);
            const data = await response.json();
            
            if (data.results && data.results[0]) {
                const result = data.results[0];
                asset.price = result.regularMarketPrice;
                asset.change = result.regularMarketChangePercent;
                asset.name = result.longName || asset.name;
                console.log(`Market Hub: ${asset.id} carregado: ${asset.price}`);
            } else {
                console.error(`Market Hub: Erro ao carregar ${asset.id}.`, data);
            }
        } catch (error) {
            checkCorsError(error, asset.id);
        }
    }
}

async function fetchCurrencyData() {
    try {
        console.log("Market Hub: Buscando câmbio...");
        const response = await fetch(`${BASE_URL}/v2/currency?currency=USD-BRL&token=${BRAPI_TOKEN}`);
        const data = await response.json();
        
        if (data.currency && data.currency.length > 0) {
            const usd = data.currency[0];
            const asset = ASSETS_CONFIG.find(a => a.id === 'USD-BRL');
            if (asset) {
                asset.price = usd.bidPrice;
                asset.change = usd.variationPercent || 0;
            }
        } else if (data.error) {
            console.warn("Market Hub: Brapi negou o câmbio. Usando fallback...");
            throw new Error("Feature not available");
        }
    } catch (error) {
        console.warn('Market Hub: Usando ExchangeRate-API como fallback para o Dólar.');
        try {
            // Fallback gratuito e sem token para o Dólar
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await response.json();
            const brlPrice = data.rates.BRL;
            const asset = ASSETS_CONFIG.find(a => a.id === 'USD-BRL');
            if (asset) {
                asset.price = brlPrice;
                asset.change = 0; // Fallback simples não tem variação 24h fácil
            }
        } catch (fallbackError) {
            console.error('Market Hub: Falha total ao buscar câmbio:', fallbackError);
        }
    }
}

async function fetchHistoryData(ticker = selectedTicker) {
    if (ticker === 'USD-BRL') {
        // Fallback para histórico do Dólar via Frankfurter (Totalmente Gratuito)
        try {
            console.log("Market Hub: Buscando histórico do Dólar via Frankfurter...");
            const now = new Date();
            const endDate = now.toISOString().split('T')[0];
            const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            
            const response = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=BRL`);
            const data = await response.json();
            
            if (data.rates) {
                chartLabels = Object.keys(data.rates).map(d => {
                    const parts = d.split('-');
                    return `${parts[2]}/${parts[1]}`;
                });
                chartData = Object.values(data.rates).map(r => r.BRL);
                updateChartContent(ticker);
            }
        } catch (e) {
            console.error("Market Hub: Erro no histórico do Dólar:", e);
        }
        return;
    }

    try {
        console.log(`Market Hub: Buscando histórico de ${ticker}...`);
        const encodedTicker = encodeURIComponent(ticker);
        // Ajustado para range=1mo e interval=1d para compatibilidade com plano gratuito da Brapi
        const response = await fetch(`${BASE_URL}/quote/${encodedTicker}?range=1mo&interval=1d&token=${BRAPI_TOKEN}`);
        const data = await response.json();
        
        if (data.results && data.results[0].historicalDataPrice) {
            const history = data.results[0].historicalDataPrice;
            chartData = history.map(h => h.close);
            chartLabels = history.map(h => {
                const date = new Date(h.date * 1000);
                return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
            });
            
            updateChartContent(ticker);
        }
    } catch (error) {
        checkCorsError(error, `Histórico de ${ticker}`);
    }
}

function checkCorsError(error, context) {
    console.error(`Market Hub: Erro em ${context}:`, error);
    if (window.location.protocol === 'file:') {
        console.error("🚨 ERRO DE CORS DETECTADO! Você está abrindo o arquivo localmente (file://). O navegador bloqueia requisições de API por segurança. ");
        console.error("👉 SOLUÇÃO: Use a extensão 'Live Server' do VS Code ou rode um servidor local (ex: npx serve .)");
        document.getElementById('last-update').innerHTML = '<span style="color:#f85149">CORS ERROR - USE LOCAL SERVER</span>';
    }
}

async function refreshAllData() {
    document.getElementById('last-update').textContent = 'SYNCING...';

    // Na camada gratuita, às vezes é melhor não disparar tudo em paralelo real
    // para evitar que o servidor Brapi negue as requisições simultâneas.
    try {
        await fetchMarketData();
        await fetchCurrencyData();
        await fetchHistoryData();
    } catch (e) {
        console.error("Market Hub: Erro na sincronização geral:", e);
    }

    updateUI();
    updateTimestamp();
}

// --- CHART LOGIC ---

function initChart() {
    const ctx = document.getElementById('mainChart').getContext('2d');
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
                tension: 0.4,
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
}

function updateChartContent(ticker = selectedTicker) {
    mainChart.data.labels = chartLabels;
    mainChart.data.datasets[0].data = chartData;
    mainChart.data.datasets[0].label = ticker;

    // Set color based on performance
    if (chartData.length > 0) {
        const first = chartData[0];
        const last = chartData[chartData.length - 1];
        const isUp = last >= first;
        mainChart.data.datasets[0].borderColor = isUp ? '#3fb950' : '#f85149';
    } else {
        mainChart.data.datasets[0].borderColor = '#30363d';
    }

    mainChart.update();

    // Atualiza o título do gráfico
    const asset = ASSETS_CONFIG.find(a => a.id === ticker);
    if (asset) {
        document.querySelector('.center-panel .panel-title').innerHTML = 
            `${asset.symbol} <span class="chart-subtitle">${asset.name.toUpperCase()}</span>`;
    }
}

// --- RENDERING LOGIC ---

function renderAssetList() {
    const list = document.getElementById('asset-list');
    list.innerHTML = '';

    ASSETS_CONFIG.forEach(asset => {
        const item = document.createElement('div');
        item.className = `asset-item ${asset.id === selectedTicker ? 'active' : ''}`;
        item.dataset.id = asset.id;

        item.onclick = async () => {
            selectedTicker = asset.id;
            
            // UI Feedback
            document.querySelectorAll('.asset-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            
            // Update chart price display instantly
            const chartPriceEl = document.getElementById('chart-price');
            if (asset.price > 0) {
                chartPriceEl.textContent = formatPrice(asset.price);
                chartPriceEl.className = `current-price ${asset.change >= 0 ? 'up' : 'down'}`;
            } else {
                chartPriceEl.textContent = '---';
                chartPriceEl.className = 'current-price';
            }
            
            await fetchHistoryData(asset.id);
        };

        item.innerHTML = `
            <div class="asset-info">
                <span class="asset-name">${asset.symbol}</span>
                <span class="asset-desc">${asset.name}</span>
            </div>
            <div class="asset-values">
                <div class="asset-price" id="price-${asset.id}">---</div>
                <div class="asset-change" id="change-${asset.id}">0.00%</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderTicker() {
    const wrapper = document.getElementById('ticker-wrapper');
    wrapper.innerHTML = '';

    ASSETS_CONFIG.forEach(asset => {
        const span = document.createElement('div');
        span.className = 'ticker-item';
        span.dataset.symbol = asset.id; // Usar data-symbol em vez de ID para evitar duplicatas no clone
        span.innerHTML = `${asset.symbol}: <span class="t-price">---</span> (<span class="t-change">0.00%</span>)`;
        wrapper.appendChild(span);
    });

    const clone = wrapper.cloneNode(true);
    clone.id = '';
    wrapper.parentNode.appendChild(clone);
}

// --- UPDATE UI ---

function updateUI() {
    ASSETS_CONFIG.forEach(asset => {
        const priceEl = document.getElementById(`price-${asset.id}`);
        const changeEl = document.getElementById(`change-${asset.id}`);
        const tickerEl = document.getElementById(`ticker-${asset.id}`);

        const changeClass = asset.change >= 0 ? 'up' : 'down';
        const sign = asset.change >= 0 ? '+' : '';
        const fPrice = formatPrice(asset.price);
        const fChange = `${sign}${asset.change.toFixed(2)}%`;

        if (priceEl && asset.price > 0) {
            priceEl.textContent = fPrice;
            priceEl.classList.remove('blink');
            void priceEl.offsetWidth;
            priceEl.classList.add('blink');
        }

        if (changeEl) {
            changeEl.textContent = fChange;
            changeEl.className = `asset-change ${changeClass}`;
        }

        // Atualiza todos os itens do ticker (incluindo o clone)
        const tickerItems = document.querySelectorAll(`.ticker-item[data-symbol="${asset.id}"]`);
        tickerItems.forEach(item => {
            item.querySelector('.t-price').textContent = fPrice;
            const tChange = item.querySelector('.t-change');
            tChange.textContent = fChange;
            tChange.className = `t-change ${changeClass}`;
        });
    });

    // Update main display (Selected Asset)
    const selected = ASSETS_CONFIG.find(a => a.id === selectedTicker);
    const chartPriceEl = document.getElementById('chart-price');
    if (selected && selected.price > 0) {
        chartPriceEl.textContent = formatPrice(selected.price);
        chartPriceEl.className = `current-price ${selected.change >= 0 ? 'up' : 'down'}`;
    }
}

function formatPrice(val) {
    if (!val || val === 0) return '---';
    if (val > 1000) return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function updateTimestamp() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString();
    document.getElementById('last-update').textContent = `LAST SYNC: ${timeStr}`;
}
