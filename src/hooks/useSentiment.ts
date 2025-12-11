
import { useState, useEffect } from 'react';
import { sentimentService } from '../services/sentimentService';
import { GlobalSentiment } from '../types';

export const useSentiment = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSentiment = async () => {
      try {
        setLoading(true);
        const result = await sentimentService.getGlobalSentiment();
        setData(result);
      } catch (err) {
        // Fallback if API fails
        setData({
          fear_greed_index: 60,
          sentiment: 'Greed',
          market_mood: 'Bullish'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSentiment();
    const interval = setInterval(fetchSentiment, 60000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading };
};
