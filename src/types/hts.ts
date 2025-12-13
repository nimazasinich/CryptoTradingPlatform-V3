// ============================================================================
// HTS (Hybrid Trading System) - Type Definitions
// ============================================================================

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
}

export interface OrderBlock {
  type: 'bullish' | 'bearish';
  high: number;
  low: number;
  timestamp: number;
  strength: number;
}

export interface LiquidityZone {
  type: 'support' | 'resistance';
  price: number;
  timestamp: number;
  touches: number;
}

export interface FVG {
  type: 'bullish' | 'bearish';
  top: number;
  bottom: number;
  timestamp: number;
  filled: boolean;
}

export interface SMCData {
  orderBlocks: OrderBlock[];
  liquidityZones: LiquidityZone[];
  fvgs: FVG[];
  smartMoneyScore: number;
}

export interface HTSResult {
  symbol: string;
  final_score: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  breakdown: {
    core: number;
    smc: number;
    patterns: number;
    sentiment: number;
    ml: number;
  };
  reasoning: string[];
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  take_profit_2: number;
  take_profit_3: number;
  current_price: number;
  risk_percent: number;
  reward_percent: number;
}

export interface TimeframePrediction {
  timeframe: '1m' | '5m' | '15m' | '1h';
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  score: number;
}

export interface ConfluenceResult {
  score: number;
  agreement_percent: number;
  dominant_action: 'BUY' | 'SELL' | 'HOLD';
  avg_confidence: number;
  timeframes: TimeframePrediction[];
}

export interface HTSWeights {
  core: { total: number; components: Record<string, number> };
  smc: { total: number; components: Record<string, number> };
  patterns: { total: number; components: Record<string, number> };
  sentiment: { total: number; components: Record<string, number> };
  ml: { total: number; components: Record<string, number> };
}
