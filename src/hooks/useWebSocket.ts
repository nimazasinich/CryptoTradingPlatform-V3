
import { useEffect, useRef, useCallback } from 'react';
import { websocketService, WebSocketEvent } from '../services/websocketService';

interface UseWebSocketOptions {
  events: WebSocketEvent[];
  enabled?: boolean;
  autoConnect?: boolean;
}

interface UseWebSocketReturn {
  subscribe: (event: WebSocketEvent, callback: (data: any) => void) => () => void;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

/**
 * React Hook for WebSocket Subscriptions
 * Manages WebSocket connections and subscriptions with automatic cleanup
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { events, enabled = true, autoConnect = true } = options;
  const subscriptionsRef = useRef<(() => void)[]>([]);
  const isConnectedRef = useRef(false);

  // Connect on mount if autoConnect is enabled
  useEffect(() => {
    if (enabled && autoConnect && !isConnectedRef.current) {
      websocketService.connect();
      isConnectedRef.current = true;
    }

    // Cleanup on unmount
    return () => {
      // Unsubscribe from all events
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [enabled, autoConnect]);

  // Subscribe to specific event
  const subscribe = useCallback((event: WebSocketEvent, callback: (data: any) => void) => {
    if (!enabled) {
      return () => {}; // No-op unsubscribe
    }

    const unsubscribe = websocketService.subscribe(event, callback);
    subscriptionsRef.current.push(unsubscribe);
    
    return () => {
      unsubscribe();
      subscriptionsRef.current = subscriptionsRef.current.filter(unsub => unsub !== unsubscribe);
    };
  }, [enabled]);

  // Manual connect/disconnect functions
  const connect = useCallback(() => {
    if (!isConnectedRef.current) {
      websocketService.connect();
      isConnectedRef.current = true;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (isConnectedRef.current) {
      websocketService.disconnect();
      isConnectedRef.current = false;
    }
  }, []);

  return {
    subscribe,
    isConnected: isConnectedRef.current && websocketService.isActive(),
    connect,
    disconnect
  };
}

/**
 * Hook for Real-Time Price Updates
 */
export function usePriceUpdates(callback: (data: any) => void, enabled: boolean = true) {
  const { subscribe } = useWebSocket({ events: ['price_update'], enabled });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('price_update', callback);
    return () => unsubscribe();
  }, [subscribe, callback, enabled]);
}

/**
 * Hook for Scoring Snapshot Updates
 */
export function useScoringUpdates(callback: (data: any) => void, enabled: boolean = true) {
  const { subscribe } = useWebSocket({ events: ['scoring_snapshot'], enabled });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('scoring_snapshot', callback);
    return () => unsubscribe();
  }, [subscribe, callback, enabled]);
}

/**
 * Hook for Signal Updates
 */
export function useSignalUpdates(callback: (data: any) => void, enabled: boolean = true) {
  const { subscribe } = useWebSocket({ events: ['signal_update'], enabled });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('signal_update', callback);
    return () => unsubscribe();
  }, [subscribe, callback, enabled]);
}

/**
 * Hook for Position Updates
 */
export function usePositionUpdates(callback: (data: any) => void, enabled: boolean = true) {
  const { subscribe } = useWebSocket({ events: ['positions_update'], enabled });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('positions_update', callback);
    return () => unsubscribe();
  }, [subscribe, callback, enabled]);
}

/**
 * Hook for Sentiment Updates
 */
export function useSentimentUpdates(callback: (data: any) => void, enabled: boolean = true) {
  const { subscribe } = useWebSocket({ events: ['sentiment_update'], enabled });

  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscribe('sentiment_update', callback);
    return () => unsubscribe();
  }, [subscribe, callback, enabled]);
}
