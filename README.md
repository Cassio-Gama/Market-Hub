# 📈 Market Hub Lite - Dashboard de Terminal Financeiro

Um dashboard financeiro minimalista e poderoso que traz cotações em tempo real da B3 e do mercado de moedas global directly para o seu navegador. Com uma estética inspirada em terminais de trading modernos e foco em performance.

![Market Hub Preview](https://via.placeholder.com/1200x600/0d1117/e6edf3?text=MARKET+HUB+LITE+DASHBOARD)

## 🚀 Funcionalidades

- **Cotações em Tempo Real**: Integração robusta com a [Brapi API](https://brapi.dev) para ações (PETR4, VALE3, ITUB4) e índices (^BVSP).
- **Gráficos Dinâmicos**: Visualização histórica de 1 mês para qualquer ativo selecionado usando [Chart.js](https://www.chartjs.org/).
- **Câmbio Inteligente**: Monitoramento do Dólar (USD/BRL) com fallback automático via Frankfurter API para máxima disponibilidade.
- **Interface Terminal (Foda)**: Tema Dark Premium com animações de ticker e efeitos visuais estilo trading floor.
- **Interatividade Total**: Clique em qualquer ativo na lateral para carregar instantaneamente o gráfico e detalhes correspondentes.

## 🛠️ Tecnologias

- **HTML5 & CSS3**: Estrutura e estilização Vanilla (sem frameworks pesados).
- **JavaScript (ES6+)**: Lógica assíncrona para consumo de APIs e manipulação dinâmica do DOM.
- **Chart.js**: Renderização de gráficos de alta performance com gradientes personalizados.
- **Brapi API**: Fonte principal de dados para o mercado brasileiro.
- **Frankfurter API**: Fonte de contingência para dados de câmbio.

## 📦 Como Instalar e Rodar

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/market-hub-lite.git
   ```

2. **Configure sua API Key:**
   - Obtenha um token gratuito em [brapi.dev](https://brapi.dev).
   - No arquivo `script.js`, altere a linha 8:
     ```javascript
     const BRAPI_TOKEN = 'SEU_TOKEN_AQUI';
     ```

3. **Inicie o Servidor Local (Crítico):**
   Para evitar erros de segurança (CORS) do navegador, você **deve** rodar o projeto em um servidor local:
   - No **VS Code**: Instale a extensão **Live Server**, clique com o botão direito no `index.html` e selecione **"Open with Live Server"**.
   - Via Terminal: `npx serve .`

## 📊 Estrutura do Projeto

```text
/Market Hub
├── index.html     # Estrutura principal e dashboard grid
├── style.css      # Design Terminal Dark e responsividade
├── script.js      # Lógica de API e atualização dos gráficos
└── README.md      # Este guia incrível
```

---
Desenvolvido com ☕ e foco em dados reais. Sinta-se à vontade para contribuir!
