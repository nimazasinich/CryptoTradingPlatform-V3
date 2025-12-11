
# CryptoOne - Professional Crypto Trading Platform

A high-performance, glassmorphic cryptocurrency trading dashboard built with React 18, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

*   **Real-time Dashboard**: Live price ticker, market overview, and global sentiment analysis.
*   **Trading Hub**: Professional spot trading interface with order book, charts, and order management.
*   **AI Lab**: Machine learning powered trading signals, market scanner, and strategy backtester.
*   **Risk Management**: Portfolio health monitoring, risk scoring, and automated alerts.
*   **Admin Console**: System health monitoring and log management.
*   **Responsive Design**: Fully responsive layout optimized for mobile, tablet, and desktop.
*   **Glassmorphism UI**: Modern, aesthetic design system with smooth animations.

## 🛠 Tech Stack

*   **Frontend**: React 18 (Suspense, Lazy Loading)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, clsx, tailwind-merge
*   **Animations**: Framer Motion
*   **Icons**: Lucide React
*   **State Management**: React Context API
*   **Data Fetching**: Custom HTTP Client with Retry Logic

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── AI/           # AI Lab components (SignalCard, Scanner)
│   ├── Admin/        # Admin dashboard components
│   ├── Common/       # Generic components (CoinIcon)
│   ├── Dashboard/    # Dashboard widgets (Ticker, Sentiment)
│   ├── Risk/         # Risk management tools
│   ├── Sidebar/      # Navigation
│   └── Trading/      # Trading interface (Chart, OrderBook)
├── config/           # API configuration
├── context/          # Global state (AppContext)
├── hooks/            # Custom React hooks (useMarketData, etc.)
├── services/         # API Service Layer
├── styles/           # Global CSS
├── types/            # TypeScript definitions
├── utils/            # Helper functions (formatting)
└── views/            # Main page views (Lazy loaded)
```

## 🔧 Installation & Setup

1.  **Clone the repository**
2.  **Install dependencies** (if using a local Node environment):
    ```bash
    npm install
    ```
3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🌐 API Integration

The platform connects to the `really-amin-datasourceforcryptocurrency-2.hf.space` API.
Configuration is located in `src/config/api.ts`.

**Key Endpoints:**
*   `/api/market`: Global market data
*   `/api/coins/top`: Top cryptocurrencies
*   `/api/sentiment/global`: Fear & Greed index
*   `/api/ai/signals`: AI Trading signals

## ⚡ Performance Optimizations

*   **Code Splitting**: Routes are lazy-loaded to minimize initial bundle size.
*   **Service Layer**: Centralized HTTP client handles caching (browser-level), retries, and error normalizing.
*   **Efficient Rendering**: Components use local state where possible and specialized hooks for data fetching.

## 🎨 Design System

*   **Colors**: Slate-950 (Background), Purple/Cyan (Accents).
*   **Effects**: Backdrop Blur (Glassmorphism), Shimmer Loading States.
*   **Typography**: Sans-serif, Mono for financial data.

## 📚 Documentation Archive

Historical documentation, implementation reports, testing guides, and audit summaries have been organized in the `/archive` directory:

*   **Implementation Docs**: `/archive/docs/` - Feature implementation reports and guides
*   **QA Reports**: `/archive/QA_REPORT/` - Testing checklists and quality assurance reports
*   **Development Logs**: `/archive/logs/` - Historical error logs and debugging information
*   **Dev Artifacts**: `/archive/dev/` - Development metadata and configuration references

For a complete overview of the reorganization, see [`/archive/REORGANIZATION_SUMMARY.md`](archive/REORGANIZATION_SUMMARY.md).

---
Built for the Future of Decentralized Finance.
