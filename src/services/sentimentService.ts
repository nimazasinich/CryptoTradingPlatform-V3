
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';
import { GlobalSentiment } from '../types';

export const sentimentService = {
  // GET /api/sentiment/global?timeframe=1D
  getGlobalSentiment: async (timeframe: string = '1D'): Promise<GlobalSentiment> => {
    return HttpClient.get<GlobalSentiment>(API_ENDPOINTS.SENTIMENT_GLOBAL, { timeframe });
  },

  // GET /api/sentiment/asset/{symbol}
  getAssetSentiment: async (symbol: string) => {
    const endpoint = typeof API_ENDPOINTS.SENTIMENT_ASSET === 'function' 
      ? API_ENDPOINTS.SENTIMENT_ASSET(symbol) 
      : API_ENDPOINTS.SENTIMENT_ASSET;
    return HttpClient.get<any>(endpoint as string);
  },

  // POST /api/service/sentiment
  analyzeText: async (text: string, mode: string = 'crypto') => {
    return HttpClient.post<any>(API_ENDPOINTS.SENTIMENT_ANALYZE, { text, mode });
  }
};
