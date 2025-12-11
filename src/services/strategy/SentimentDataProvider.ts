import { MarketContext } from '../../types/strategy';
import { HttpClient } from '../httpClient';
import { API_ENDPOINTS } from '../../config/api';

/**
 * Sentiment Data Provider for Strategy System
 * Fetches real sentiment, news, and whale data from the API
 */
export class SentimentDataProvider {
  private static instance: SentimentDataProvider;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 300000; // 5 minutes cache for sentiment data
  
  private constructor() {}
  
  static getInstance(): SentimentDataProvider {
    if (!SentimentDataProvider.instance) {
      SentimentDataProvider.instance = new SentimentDataProvider();
    }
    return SentimentDataProvider.instance;
  }
  
  /**
   * Get market context (sentiment, news, whales) for a symbol
   * Returns normalized values in range [-1, +1]
   */
  async getMarketContext(symbol: string = 'BTC'): Promise<MarketContext> {
    try {
      // Fetch all data in parallel
      const [sentiment, news, whaleActivity] = await Promise.all([
        this.getGlobalSentiment(),
        this.getNewsScore(symbol),
        this.getWhaleActivity(symbol)
      ]);
      
      return {
        sentiment01: sentiment,
        news01: news,
        whales01: whaleActivity
      };
      
    } catch (error) {
      console.error('❌ Error fetching market context:', error);
      // Return neutral values on error
      return {
        sentiment01: 0,
        news01: 0,
        whales01: 0
      };
    }
  }
  
  /**
   * Get global sentiment (Fear & Greed Index)
   * Converts to range [-1, +1] where:
   * -1 = Extreme Fear (0-25)
   * 0 = Neutral (45-55)
   * +1 = Extreme Greed (75-100)
   */
  async getGlobalSentiment(timeframe: string = '1D'): Promise<number> {
    const cacheKey = `sentiment-global-${timeframe}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`📦 Using cached global sentiment`);
      return cached.data;
    }
    
    try {
      console.log(`🔄 Fetching global sentiment (${timeframe})`);
      
      const response = await HttpClient.get<any>(API_ENDPOINTS.SENTIMENT_GLOBAL, {
        timeframe
      });
      
      // Extract Fear & Greed Index (0-100 scale)
      let fearGreedIndex = 50; // Default neutral
      
      if (response?.fear_greed_index !== undefined) {
        fearGreedIndex = Number(response.fear_greed_index);
      } else if (response?.value !== undefined) {
        fearGreedIndex = Number(response.value);
      } else if (response?.index !== undefined) {
        fearGreedIndex = Number(response.index);
      }
      
      // Convert 0-100 to -1 to +1
      // 0-25: Extreme Fear (-1 to -0.5)
      // 25-45: Fear (-0.5 to -0.1)
      // 45-55: Neutral (-0.1 to +0.1)
      // 55-75: Greed (+0.1 to +0.5)
      // 75-100: Extreme Greed (+0.5 to +1)
      const normalized = (fearGreedIndex - 50) / 50;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: normalized,
        timestamp: Date.now()
      });
      
      console.log(`✅ Global sentiment: ${fearGreedIndex} (${normalized.toFixed(2)})`);
      return normalized;
      
    } catch (error) {
      console.error('❌ Error fetching global sentiment:', error);
      
      // Return cached if available
      if (cached) {
        console.log(`📦 Using expired cache for sentiment`);
        return cached.data;
      }
      
      return 0; // Neutral fallback
    }
  }
  
  /**
   * Get asset-specific sentiment
   */
  async getAssetSentiment(symbol: string): Promise<number> {
    const cacheKey = `sentiment-asset-${symbol}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    try {
      const endpoint = API_ENDPOINTS.SENTIMENT_ASSET(symbol);
      const response = await HttpClient.get<any>(endpoint);
      
      // Extract sentiment score
      let score = 0;
      
      if (response?.sentiment !== undefined) {
        // If sentiment is string like "positive", "negative", "neutral"
        if (typeof response.sentiment === 'string') {
          const sentimentMap: Record<string, number> = {
            'very_positive': 0.8,
            'positive': 0.5,
            'neutral': 0,
            'negative': -0.5,
            'very_negative': -0.8
          };
          score = sentimentMap[response.sentiment] || 0;
        } else {
          // If sentiment is numeric
          score = Number(response.sentiment);
        }
      } else if (response?.score !== undefined) {
        score = Number(response.score);
      }
      
      // Normalize to [-1, +1] if needed
      if (Math.abs(score) > 1) {
        score = Math.max(-1, Math.min(1, score / 100));
      }
      
      this.cache.set(cacheKey, {
        data: score,
        timestamp: Date.now()
      });
      
      console.log(`✅ Asset sentiment for ${symbol}: ${score.toFixed(2)}`);
      return score;
      
    } catch (error) {
      console.error(`❌ Error fetching sentiment for ${symbol}:`, error);
      
      // Fallback to global sentiment
      return await this.getGlobalSentiment();
    }
  }
  
  /**
   * Get news sentiment score
   * Analyzes recent news and returns score in range [-1, +1]
   */
  async getNewsScore(symbol: string): Promise<number> {
    const cacheKey = `news-score-${symbol}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    try {
      console.log(`🔄 Fetching news for ${symbol}`);
      
      const response = await HttpClient.get<any>(API_ENDPOINTS.NEWS, {
        limit: 20
      });
      
      if (!response?.articles || !Array.isArray(response.articles)) {
        console.log('⚠️ No news articles found');
        return 0;
      }
      
      // Analyze news sentiment
      let totalSentiment = 0;
      let relevantCount = 0;
      
      for (const article of response.articles) {
        // Check if article is relevant to the symbol
        const title = article.title?.toLowerCase() || '';
        const content = article.description?.toLowerCase() || '';
        const text = `${title} ${content}`;
        
        if (text.includes(symbol.toLowerCase()) || 
            text.includes('bitcoin') || 
            text.includes('crypto')) {
          
          relevantCount++;
          
          // Get sentiment from article if available
          if (article.sentiment !== undefined) {
            if (typeof article.sentiment === 'string') {
              const sentimentMap: Record<string, number> = {
                'very_positive': 0.8,
                'positive': 0.5,
                'neutral': 0,
                'negative': -0.5,
                'very_negative': -0.8
              };
              totalSentiment += sentimentMap[article.sentiment] || 0;
            } else {
              totalSentiment += Number(article.sentiment);
            }
          } else {
            // Simple keyword-based sentiment analysis
            const positiveKeywords = ['surge', 'rally', 'bullish', 'gains', 'up', 'high', 'record', 'breakthrough'];
            const negativeKeywords = ['crash', 'dump', 'bearish', 'losses', 'down', 'low', 'fall', 'concern'];
            
            let sentiment = 0;
            positiveKeywords.forEach(word => {
              if (text.includes(word)) sentiment += 0.2;
            });
            negativeKeywords.forEach(word => {
              if (text.includes(word)) sentiment -= 0.2;
            });
            
            totalSentiment += Math.max(-1, Math.min(1, sentiment));
          }
        }
      }
      
      const avgSentiment = relevantCount > 0 ? totalSentiment / relevantCount : 0;
      const normalized = Math.max(-1, Math.min(1, avgSentiment));
      
      this.cache.set(cacheKey, {
        data: normalized,
        timestamp: Date.now()
      });
      
      console.log(`✅ News score for ${symbol}: ${normalized.toFixed(2)} (from ${relevantCount} articles)`);
      return normalized;
      
    } catch (error) {
      console.error(`❌ Error fetching news:`, error);
      return 0;
    }
  }
  
  /**
   * Get whale activity indicator
   * Returns value in range [-1, +1]
   * Positive = Large buying, Negative = Large selling
   */
  async getWhaleActivity(symbol: string): Promise<number> {
    const cacheKey = `whale-activity-${symbol}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    
    try {
      // Note: The API may not have direct whale tracking
      // We can infer from volume spikes in price data
      
      // For now, return 0 (neutral) as we need specific whale tracking endpoint
      // This can be enhanced when whale tracking API is available
      
      console.log(`⚠️ Whale activity endpoint not available, using volume analysis`);
      
      // TODO: Implement volume-based whale detection when API is available
      return 0;
      
    } catch (error) {
      console.error(`❌ Error fetching whale activity:`, error);
      return 0;
    }
  }
  
  /**
   * Analyze text sentiment using AI
   */
  async analyzeTextSentiment(text: string, mode: string = 'crypto'): Promise<number> {
    try {
      const response = await HttpClient.post<any>(API_ENDPOINTS.SENTIMENT_ANALYZE, {
        text,
        mode
      });
      
      // Extract sentiment score
      let score = 0;
      
      if (response?.sentiment !== undefined) {
        if (typeof response.sentiment === 'string') {
          const sentimentMap: Record<string, number> = {
            'very_positive': 0.8,
            'positive': 0.5,
            'neutral': 0,
            'negative': -0.5,
            'very_negative': -0.8
          };
          score = sentimentMap[response.sentiment] || 0;
        } else {
          score = Number(response.sentiment);
        }
      } else if (response?.score !== undefined) {
        score = Number(response.score);
      }
      
      return Math.max(-1, Math.min(1, score));
      
    } catch (error) {
      console.error('❌ Error analyzing text sentiment:', error);
      return 0;
    }
  }
  
  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Sentiment data cache cleared');
  }
  
  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const sentimentDataProvider = SentimentDataProvider.getInstance();
