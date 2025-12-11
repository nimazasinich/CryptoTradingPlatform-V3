
export const API_CONFIG = {
  BASE_URL: 'https://really-amin-datasourceforcryptocurrency-2.hf.space',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export const API_ENDPOINTS = {
  // System
  HEALTH: '/api/health',
  STATUS: '/api/status',

  // Market Data
  MARKET_OVERVIEW: '/api/market',
  MARKET_TRENDING: '/api/trending', // Corrected from /api/market/trending
  COINS_TOP: '/api/coins/top', // params: limit
  
  // Services
  RATE: '/api/service/rate', // params: pair
  BATCH_RATE: '/api/service/rate/batch', // params: pairs
  HISTORY: '/api/service/history', // params: symbol, interval, limit
  
  // Resources
  RESOURCES_SUMMARY: '/api/resources/summary',
  PROVIDERS: '/api/providers',
  
  // Sentiment
  SENTIMENT_GLOBAL: '/api/sentiment/global', // params: timeframe
  SENTIMENT_ASSET: (symbol: string) => `/api/sentiment/asset/${symbol}`,
  SENTIMENT_ANALYZE: '/api/service/sentiment', // POST: text, mode

  // News
  NEWS: '/api/news', // params: limit
  
  // AI
  AI_SIGNALS: '/api/ai/signals', // params: symbol
  AI_DECISION: '/api/ai/decision', // POST: symbol, horizon, risk_tolerance
};

// Utility functions required by components
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) return endpoint;
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${path}`;
};

export const fetchWithRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let lastError: any;
  for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok && (response.status >= 500 || response.status === 429)) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (i < API_CONFIG.RETRY_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

export const parseApiResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};
