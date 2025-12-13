import { useState, useEffect, useCallback } from 'react';
import { htsService } from '../services/hts/HTSService';
import { HTSResult } from '../types/hts';

/**
 * React hook for HTS analysis
 * Manages fetching, caching, and auto-refresh of HTS signals
 * 
 * @param symbols Array of symbols to analyze
 * @param autoRefresh Enable/disable auto-refresh
 * @param refreshInterval Refresh interval in milliseconds (default: 30000ms = 30s)
 */
export function useHTSAnalysis(
  symbols: string[],
  autoRefresh: boolean = true,
  refreshInterval: number = 30000
) {
  const [signals, setSignals] = useState<HTSResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Fetch HTS signals for all symbols
   */
  const fetchSignals = useCallback(async () => {
    if (!symbols || symbols.length === 0) {
      setSignals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching HTS analysis for ${symbols.length} symbols`);
      
      // Use HTSService to analyze all symbols
      const results = await htsService.analyzeMultipleSymbols(symbols, '15m');
      
      setSignals(results);
      setLastUpdate(new Date());
      
      console.log(`✅ Successfully fetched ${results.length} HTS signals`);
      
    } catch (err) {
      console.error('❌ Error fetching HTS signals:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    fetchSignals();
  }, [fetchSignals]);

  /**
   * Initial fetch on mount or when symbols change
   */
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    console.log(`⏰ Setting up HTS auto-refresh every ${refreshInterval / 1000}s`);
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing HTS signals...');
      fetchSignals();
    }, refreshInterval);

    return () => {
      console.log('🛑 Clearing HTS auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchSignals]);

  return {
    signals,
    loading,
    error,
    refresh,
    lastUpdate
  };
}

/**
 * Hook for multi-timeframe confluence analysis
 * Analyzes a single symbol across multiple timeframes
 */
export function useHTSConfluence(
  symbol: string,
  timeframes: Array<'1m' | '5m' | '15m' | '1h'> = ['1m', '5m', '15m', '1h']
) {
  const [confluence, setConfluence] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfluence = useCallback(async () => {
    if (!symbol) {
      setConfluence(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Fetching HTS confluence for ${symbol}`);
      
      const result = await htsService.analyzeMultiTimeframe(symbol, timeframes);
      
      setConfluence(result);
      console.log(`✅ Confluence analysis complete for ${symbol}`);
      
    } catch (err) {
      console.error('❌ Error fetching confluence:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframes]);

  useEffect(() => {
    fetchConfluence();
  }, [fetchConfluence]);

  return {
    confluence,
    loading,
    error,
    refresh: fetchConfluence
  };
}
