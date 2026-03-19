# 📈 Market Hub Lite

> **Dashboard Financeiro Real-Time** sob uma estética de terminal hacker/premium. 

O **Market Hub Lite** é uma interface de monitoramento de mercado financeiro desenvolvida com **HTML5, CSS3 vanilla e JavaScript Puro**. O projeto integra APIs de dados reais para fornecer cotações atualizadas da B3 (Ações e Índices) e câmbio global.

![Market Hub Preview](https://img.shields.io/badge/Status-Live-3fb950?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Made%20with-JS%20|%20HTML%20|%20CSS-2f81f7?style=for-the-badge)

## ✨ Principais Funcionalidades

- **📡 Conexão Real-Time**: Integração via **Brapi API** para cotações de ativos da B3 (Ações e IBOVESPA).
- **📊 Gráficos Dinâmicos**: Visualização interativa usando **Chart.js** com suporte a seleção de ativos.
- **🛡️ Fallback Inteligente**: Sistema de redundância para câmbio (USD/BRL) usando a **Frankfurter API** caso a Brapi atinja limites.
- **🖥️ Estética Terminal High-End**: Design dark inspirado em terminais de trading profissionais com animações fluidas e efeitos de "blinking" em atualizações de preço.
- **📱 Ticker Infinito**: Barra de rolagem superior com os principais ativos, sincronizada em tempo real.

## 🚀 Tecnologias Utilizadas

- **HTML5 Semantic Markup**
- **Vanilla CSS3** (Custom Properties, Flexbox, Grid)
- **JavaScript (ES6+)** (Async/Await, Fetch API)
- **Chart.js** (Visualização de dados)
- **APIs**:
  - [Brapi API](https://brapi.dev) (Stocks & Indices)
  - [Frankfurter API](https://www.frankfurter.app) (Currency Fallback)

## 🛠️ Como Executar o Projeto

Como o navegador bloqueia requisições de API a partir de arquivos locais (`file://`), você deve rodar o projeto através de um servidor local:

1. Clone o repositório.
2. No VS Code, instale a extensão **Live Server**.
3. Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.
4. Configure seu token da Brapi no topo do arquivo `script.js`:
   ```javascript
   const BRAPI_TOKEN = 'SEU_TOKEN_AQUI';
   ```

## 📈 Próximos Passos (Roadmap)
- [ ] Implementar busca de ativos por nome.
- [ ] Adicionar suporte a Cryptomoedas.
- [ ] Criar alertas sonoros configuráveis para variações de preço.
- [ ] Implementar persistência de ativos selecionados via LocalStorage.

---

Desenvolvido com ☕ e ⚡ por [Seu Nome/GitHub](https://github.com/SeuUsuario)
