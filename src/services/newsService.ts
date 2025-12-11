
import { HttpClient } from './httpClient';
import { API_ENDPOINTS } from '../config/api';
import { NewsArticle } from '../types';

export const newsService = {
  // GET /api/news?limit=50
  getLatestNews: async (limit: number = 50): Promise<NewsArticle[]> => {
    const response = await HttpClient.get<any>(API_ENDPOINTS.NEWS, { limit });
    
    // Documentation says response: {"articles": [...], "total": 50, ...}
    if (response && Array.isArray(response.articles)) {
      return response.articles;
    }
    // Fallback if it returns direct array
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }
};
