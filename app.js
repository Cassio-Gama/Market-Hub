/**
 * MarketHub - Brapi Management (Premium Polish) - News Integration
 * Token: pY7wgXLqgH18uu8fF5SeDD
 */

const CONFIG = {
    TOKEN: 'pY7wgXLqgH18uu8fF5SeDD',
    BASE_URL: 'https://brapi.dev/api/quote/',
    AWESOME_API: 'https://economia.awesomeapi.com.br/json/',
    CHART_COLOR: '#0071e3', // Azul Apple
    CHART_BG: 'rgba(0, 113, 227, 0.1)',
    CACHE_EXPIRY: 5 * 60 * 1000,
};

// Mapeamento de nomes amigáveis (Padrão simples de ver)
const ASSET_NAMES = {
    '^BVSP': 'Ibovespa',
    'PETR4': 'Petrobras',
    'VALE3': 'Vale',
    'ITUB4': 'Itaú Unibanco',
    'BBDC4': 'Bradesco',
    'BBAS3': 'Banco do Brasil',
    'MGLU3': 'Magazine Luiza',
    'ABEV3': 'Ambev',
    'WEGE3': 'Weg',
    'USD-BRL': 'Dólar Comercial'
};

let mainChart = null;

// --- Initialization ---

async function init() {
    updateTime();
    setInterval(updateTime, 1000);
    setupEventListeners();
    await loadInitialData();
    loadTicker('^BVSP');
}

async function loadInitialData() {
    try {
        // Cache busting para evitar dados antigos no GitHub Pages
        const response = await fetch('data.json?v=' + Date.now());
        if (!response.ok) return;
        const data = await response.json();
        console.log('MarketHub Data Loaded:', data);
        
        // 1. Slider (Ticker Tape)
        if (data.slider) {
            const slider = document.getElementById('ticker-slider');
            if (slider) {
                slider.innerHTML = '';
                const items = [...data.slider, ...data.slider];
                items.forEach(item => {
                    const colorClass = item.change >= 0 ? 'positive' : 'negative';
                    const formattedPrice = formatPrice(item.price, item.symbol);
                    const displayName = ASSET_NAMES[item.symbol] || item.symbol;

                    const el = document.createElement('div');
                    el.className = 'ticker-item-tape';
                    el.innerHTML = `
                        <span class="symbol">${displayName}</span>
                        <span class="price">${formattedPrice}</span>
                        <span class="${colorClass}">(${item.changeStr})</span>
                    `;
                    slider.appendChild(el);
                });
            }
        }

        // 2. News (Central de Notícias)
        if (data.news) {
            const newsContainer = document.getElementById('news-container');
            if (newsContainer) {
                newsContainer.innerHTML = '';
                data.news.forEach(n => {
                    const el = document.createElement('article');
                    el.className = 'news-item';
                    el.innerHTML = `
                        <a href="${n.url}" target="_blank" rel="noopener">
                            <div class="news-content">
                                <span class="news-source">${n.source}</span>
                                <h4 class="news-title">${n.title}</h4>
                            </div>
                        </a>
                    `;
                    newsContainer.appendChild(el);
                });
            }
        }
    } catch (e) { console.warn('Erro data.json'); }
}

function setupEventListeners() {
    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const ticker = chip.getAttribute('data-ticker');
            setActiveChip(chip);
            loadTicker(ticker);
        });
    });
}

// --- Utils (Padrao Brasileiro & Simplicidade) ---

function formatPrice(value, symbol) {
    if (value === undefined || value === null || isNaN(value)) return "--";
    
    // Indices usam pontos, ações usam R$
    const isIndex = symbol.startsWith('^') || symbol.length < 5 && !symbol.match(/\d/); 
    if (isIndex) {
        return new Intl.NumberFormat('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }).format(value);
    }
    return new Intl.NumberFormat('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
    }).format(value);
}

function formatNumber(value, decimals = 2) {
    if (value === undefined || value === null || isNaN(value)) return "0,00";
    return new Intl.NumberFormat('pt-BR', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    }).format(value);
}

// --- Market Status (B3) ---

function checkMarketStatus() {
    const now = new Date();
    const brTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const day = brTime.getDay();
    const hours = brTime.getHours();
    const isWeekday = day >= 1 && day <= 5;
    const isOpenHours = (hours >= 10 && hours < 18);

    const statusText = document.getElementById('status-text');
    const statusContainer = document.getElementById('market-status-container');

    const isOpen = isWeekday && isOpenHours;
    if (statusText) statusText.innerText = isOpen ? 'Mercado Aberto' : 'Mercado Fechado';
    if (statusContainer) statusContainer.className = `market-status ${isOpen ? 'open' : ''}`;
}

function updateTime() {
    const timeEl = document.getElementById('current-time');
    if (timeEl) timeEl.innerText = new Date().toLocaleTimeString('pt-BR');
    checkMarketStatus();
}

// --- Asset Loading (Unified) ---

async function loadTicker(ticker) {
    const cached = getCache(ticker);
    if (cached) {
        renderAsset(cached, ticker);
        return;
    }

    showLoading();
    try {
        let assetInfo;
        
        if (ticker === 'USD-BRL') {
            assetInfo = await fetchAwesomeDollar();
        } else {
            assetInfo = await fetchBrapiStock(ticker);
        }

        if (assetInfo) {
            setCache(ticker, assetInfo);
            renderAsset(assetInfo, ticker);
        }
    } catch (error) {
        console.error('Erro ao carregar ativo:', error);
    } finally {
        hideLoading();
    }
}

async function fetchBrapiStock(ticker) {
    const url = `${CONFIG.BASE_URL}${ticker}?range=1mo&interval=1d&token=${CONFIG.TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.results) return null;
    const stock = data.results[0];
    
    let changeAbs = stock.regularMarketChange;
    const changePct = stock.regularMarketChangePercent || 0;
    
    if (changeAbs === undefined || changeAbs === null || (changeAbs === 0 && changePct !== 0)) {
        const prevPrice = stock.regularMarketPrice / (1 + (changePct / 100));
        changeAbs = stock.regularMarketPrice - prevPrice;
    }

    return {
        symbol: stock.symbol,
        price: stock.regularMarketPrice,
        change: stock.regularMarketChangePercent,
        changeAbs: changeAbs,
        history: stock.historicalDataPrice,
        currency: stock.currency
    };
}

async function fetchAwesomeDollar() {
    try {
        const lastRes = await fetch(`${CONFIG.AWESOME_API}last/USD-BRL`);
        const lastData = await lastRes.json();
        const usd = lastData.USDBRL;

        const histRes = await fetch(`${CONFIG.AWESOME_API}daily/USD-BRL/30`);
        const histData = await histRes.json();
        
        const history = histData.reverse().map(h => ({
            date: parseInt(h.timestamp),
            close: parseFloat(h.bid)
        }));

        return {
            symbol: 'USD',
            price: parseFloat(usd.bid),
            change: parseFloat(usd.pctChange),
            changeAbs: parseFloat(usd.varBid),
            history: history,
            currency: 'BRL'
        };
    } catch { return null; }
}

function renderAsset(asset, ticker) {
    const titleEl = document.getElementById('chart-title');
    const priceEl = document.getElementById('chart-price');
    const changeEl = document.getElementById('chart-change');

    const name = ASSET_NAMES[ticker] || ticker;
    if (titleEl) titleEl.innerText = `${name} (${ticker})`;
    
    if (priceEl) priceEl.innerText = formatPrice(asset.price, asset.symbol);
    
    if (changeEl) {
        const sign = asset.changeAbs >= 0 ? '+' : '';
        const absStr = formatNumber(asset.changeAbs, 2);
        const pctStr = formatNumber(asset.change, 3);
        
        changeEl.innerText = `${sign}${absStr} (${pctStr}%)`;
        changeEl.className = `change ${asset.change >= 0 ? 'positive' : 'negative'}`;
    }

    if (asset.history) renderChart(asset.history, asset.symbol);
}

// --- Cache Helpers ---

function setCache(key, data) {
    const entry = { timestamp: Date.now(), data: data };
    sessionStorage.setItem(`market_cache_${key}`, JSON.stringify(entry));
}

function getCache(key) {
    const entry = JSON.parse(sessionStorage.getItem(`market_cache_${key}`));
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CONFIG.CACHE_EXPIRY) {
        sessionStorage.removeItem(`market_cache_${key}`);
        return null;
    }
    return entry.data;
}

// --- UI Rendering ---

function setActiveChip(selectedChip) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    selectedChip.classList.add('active');
}

function renderChart(history, symbol) {
    const canvas = document.getElementById('mainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const labels = history.map(h => {
        const date = new Date(h.date * 1000);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });
    const prices = history.map(h => h.close);

    if (mainChart) mainChart.destroy();

    mainChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: symbol,
                data: prices,
                borderColor: CONFIG.CHART_COLOR,
                backgroundColor: CONFIG.CHART_BG,
                borderWidth: 2,
                fill: true,
                tension: 0.2,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: CONFIG.CHART_COLOR,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(10, 10, 12, 0.95)',
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (ctx) => {
                            return formatPrice(ctx.parsed.y, symbol);
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#86868b' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#86868b' } }
            }
        }
    });
}

function showLoading() { 
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) wrapper.style.opacity = '0.4'; 
}
function hideLoading() { 
    const wrapper = document.querySelector('.canvas-wrapper');
    if (wrapper) wrapper.style.opacity = '1'; 
}

document.addEventListener('DOMContentLoaded', init);
