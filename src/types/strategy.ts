// ============= CORE TYPES =============

export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type TrendDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type StrategyMode = 'FIXED' | 'ATR' | 'STRUCT';
export type Timeframe = '15m' | '1h' | '4h';

// ============= CANDLE DATA =============

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============= SIGNAL STRUCTURES =============

export interface Signal {
  id: string;
  symbol: string;
  type: SignalType;
  entry_price: number;
  stop_loss: number;
  target_price: number;
  confidence: number;
  reasoning: string;
  timestamp: string;
}

export interface AdvancedSignal extends Signal {
  score: {
    layer1_priceAction: number;      // 0-30
    layer2_indicators: number;        // 0-25
    layer3_timeframes: number;        // 0-20
    layer4_volume: number;            // 0-15
    layer5_riskManagement: number;    // 0-10
    totalScore: number;               // 0-100
    isValid: boolean;
  };
  takeProfit1: number;
  takeProfit2: number;
  takeProfit3: number;
  riskRewardRatio: number;
  timeframe: string;
  contributingFactors: string[];
}

// ============= DETECTOR SYSTEM =============

export interface DetectorResult {
  name: string;
  score: number;        // [-1, +1]
  weight: number;
  category: 'CORE' | 'SMC' | 'PATTERNS' | 'SENTIMENT' | 'ML';
  description: string;
}

export interface TimeframeResult {
  timeframe: Timeframe;
  score: number;        // [0, 1]
  direction: TrendDirection;
  detectors: DetectorResult[];
  normalized: number;   // [-1, +1]
}

// ============= STRATEGY OUTPUT =============

export interface StrategyOutput {
  symbol: string;
  results: TimeframeResult[];
  direction: TrendDirection;
  final_score: number;
  action: SignalType;
  rationale: string;
  confluence: ConfluenceScore;
  entryPlan: EntryPlan;
  context: MarketContext;
  timestamp: number;
}

export interface ConfluenceScore {
  enabled: boolean;
  score: number;
  agreement: number;
  ai: number;
  tech: number;
  context: number;
  passed: boolean;
}

export interface EntryPlan {
  mode: StrategyMode;
  sl: number;
  tp: [number, number, number];
  ladder: [number, number, number];
  trailing: TrailingStop;
  leverage: number;
}

export interface TrailingStop {
  enabled: boolean;
  startAt: 'TP1' | 'TP2' | 'ENTRY';
  distance: number;
}

export interface MarketContext {
  sentiment01: number;
  news01: number;
  whales01: number;
}

// ============= TECHNICAL FEATURES =============

export interface TechnicalFeatures {
  // Price action
  trend: TrendDirection;
  higherHighs: boolean;
  higherLows: boolean;
  lowerHighs: boolean;
  lowerLows: boolean;
  
  // Indicators
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  bollingerBands: { upper: number; middle: number; lower: number };
  atr: number;
  adx: number;
  stochastic: { k: number; d: number };
  roc: number;
  
  // Volume
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  
  // Support/Resistance
  support: number;
  resistance: number;
}

// ============= CONFIGURATION =============

export interface StrategyConfig {
  enabled: boolean;
  selectedStrategy: string;
  autoTradeEnabled: boolean;
  
  // Scoring
  buyThreshold: number;
  sellThreshold: number;
  minConfidence: number;
  
  // Risk
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  maxRiskPerTrade: number;
  
  // Leverage
  minLeverage: number;
  maxLeverage: number;
  liquidationBuffer: number;
  
  // Confluence
  confluenceRequired: boolean;
  confluenceThreshold: number;
  
  // Cooldown
  cooldownEnabled: boolean;
  cooldownBars: number;
  consecutiveSLTrigger: number;
}

export interface DetectorWeights {
  // Core (40%)
  rsi: number;
  macd: number;
  maCross: number;
  bollinger: number;
  volume: number;
  adx: number;
  roc: number;
  
  // SMC (25%)
  marketStructure: number;
  supportResistance: number;
  
  // Patterns (20%)
  reversal: number;
  
  // Sentiment (10%)
  sentiment: number;
  news: number;
  whales: number;
  
  // ML (5%)
  mlPrediction: number;
}

export interface RiskConfig {
  spot: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
    maxRiskPerTrade: number;
  };
  futures: {
    maxPositionSize: number;
    maxDailyLoss: number;
    maxOpenPositions: number;
    maxRiskPerTrade: number;
    minLeverage: number;
    maxLeverage: number;
  };
}

// ============= PERFORMANCE TRACKING =============

export interface TradeResult {
  id: string;
  signal: Signal;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  duration: number;
  status: 'WIN' | 'LOSS' | 'BREAKEVEN';
  timestamp: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

// ============= AUTO-TRADE STATE =============

export interface AutoTradeState {
  enabled: boolean;
  activeSignals: Signal[];
  openPositions: Position[];
  performance: PerformanceMetrics;
  lastUpdate: number;
  cooldownUntil: Record<string, number>;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  amount: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number[];
  currentPnl: number;
  openedAt: number;
}
