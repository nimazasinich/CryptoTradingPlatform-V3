
import { useState, useEffect } from 'react';
import { newsService } from '../services/newsService';
import { NewsArticle } from '../types';

export const useNews = () => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const articles = await newsService.getLatestNews(10);
        setNews(articles.slice(0, 5));
      } catch (err) {
        console.error(err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return { news, loading };
};
