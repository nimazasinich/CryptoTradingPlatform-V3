// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Market Data Types
export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface MarketOverview {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h: number;
  volume_change_percentage_24h: number;
}

// Sentiment Types
export interface GlobalSentiment {
  score: number; // 0-100
  classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  next_update: string;
}

// News Types
export interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string;
  thumbnail_url?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

// Technical Analysis Types
export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
}

export interface TechnicalAnalysis {
  symbol: string;
  summary: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  indicators: {
    rsi: TechnicalIndicator;
    macd: TechnicalIndicator;
    sma_50: TechnicalIndicator;
    sma_200: TechnicalIndicator;
  };
}

// AI Signal Types
export interface AISignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  entry_price: number;
  target_price: number;
  stop_loss: number;
  confidence: number; // 0-100
  reasoning: string;
  timestamp: string;
}
