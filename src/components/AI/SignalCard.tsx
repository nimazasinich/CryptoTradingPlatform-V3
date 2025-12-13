
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Target, Shield, Zap, TrendingUp, TrendingDown, Info, X, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import { AISignal } from '../../types';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice } from '../../utils/format';

// Feature 2.4: Score Breakdown Modal Component
const ScoreBreakdownModal = ({ signal, onClose }: { signal: AISignal; onClose: () => void }) => {
  const score = (signal as any).score;
  
  // If signal doesn't have score breakdown, show generic message
  if (!score) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
          className="glass-card p-6 max-w-lg w-full"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Signal Analysis</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X size={20} className="text-slate-300" />
            </button>
          </div>
          <p className="text-slate-300">Detailed score breakdown not available for this signal.</p>
        </motion.div>
      </div>
    );
  }

  const layers = [
    { 
      name: 'Price Action', 
      score: score.layer1_priceAction || 0, 
      max: 30,
      icon: TrendingUp,
      description: 'Trend structure, candlestick patterns, support/resistance'
    },
    { 
      name: 'Technical Indicators', 
      score: score.layer2_indicators || 0, 
      max: 25,
      icon: BarChart3,
      description: 'RSI, MACD, Moving Averages, Bollinger Bands'
    },
    { 
      name: 'Multi-Timeframe', 
      score: score.layer3_timeframes || 0, 
      max: 20,
      icon: Target,
      description: '15m, 1h, 4h timeframe alignment'
    },
    { 
      name: 'Volume Analysis', 
      score: score.layer4_volume || 0, 
      max: 15,
      icon: Zap,
      description: 'Volume trends, breakouts, accumulation'
    },
    { 
      name: 'Risk Assessment', 
      score: score.layer5_riskManagement || 0, 
      max: 10,
      icon: Shield,
      description: 'Volatility, drawdown risk, position sizing'
    }
  ];

  const totalScore = score.totalScore || 0;
  const isBuy = signal.type === 'BUY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CoinIcon symbol={signal.symbol} size="lg" />
            <div>
              <h3 className="text-2xl font-bold text-white">{signal.symbol} Signal Analysis</h3>
              <p className="text-sm text-slate-400">5-Layer AI Scoring Breakdown</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={24} className="text-slate-300" />
          </button>
        </div>

        {/* Overall Score */}
        <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 font-medium">Overall Confidence Score</span>
            <span className="text-4xl font-bold text-white">{signal.confidence}%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-black/30 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${signal.confidence}%` }}
              />
            </div>
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
              isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {signal.type}
            </span>
          </div>
        </div>

        {/* Layer Breakdown */}
        <div className="space-y-4 mb-6">
          <h4 className="text-white font-bold text-lg flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            Layer Scores
          </h4>
          
          {layers.map((layer, idx) => {
            const percentage = (layer.score / layer.max) * 100;
            const isStrong = percentage >= 70;
            const isWeak = percentage < 40;
            
            return (
              <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <layer.icon size={18} className={isStrong ? 'text-green-400' : isWeak ? 'text-yellow-400' : 'text-slate-400'} />
                    <span className="text-white font-bold">Layer {idx + 1}: {layer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-mono ${isStrong ? 'text-green-400' : isWeak ? 'text-yellow-400' : 'text-white'}`}>
                      {layer.score}/{layer.max}
                    </span>
                    {isStrong ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : isWeak ? (
                      <AlertCircle size={16} className="text-yellow-400" />
                    ) : null}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isStrong ? 'bg-green-500' : isWeak ? 'bg-yellow-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <p className="text-xs text-slate-400">{layer.description}</p>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-cyan-400 mt-0.5" />
            <div>
              <h5 className="text-cyan-300 font-bold mb-1">Analysis Summary</h5>
              <p className="text-sm text-slate-300">{signal.reasoning}</p>
              {(signal as any).contributingFactors && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(signal as any).contributingFactors.map((factor: string, idx: number) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                      {factor}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Risk/Reward Details */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/5 p-3 rounded-lg text-center">
            <div className="text-xs text-slate-400 mb-1">Entry Price</div>
            <div className="text-white font-mono font-bold">{formatPrice(signal.entry_price)}</div>
          </div>
          <div className="bg-green-500/10 p-3 rounded-lg text-center border border-green-500/20">
            <div className="text-xs text-slate-400 mb-1">Target</div>
            <div className="text-green-400 font-mono font-bold">{formatPrice(signal.target_price)}</div>
          </div>
          <div className="bg-red-500/10 p-3 rounded-lg text-center border border-red-500/20">
            <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
            <div className="text-red-400 font-mono font-bold">{formatPrice(signal.stop_loss)}</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const SignalCard = ({ signal }: { signal: AISignal }) => {
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const isBuy = signal.type === 'BUY';
  const colorClass = isBuy ? 'text-green-400' : 'text-red-400';
  const bgClass = isBuy ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card p-6 border ${bgClass} relative overflow-hidden group`}
      >
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <CoinIcon symbol={signal.symbol} size="md" />
            <div>
              <h3 className="font-bold text-lg text-white">{signal.symbol}/USDT</h3>
              <span className="text-xs text-slate-300">{new Date(signal.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {signal.type}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 relative z-10">
          <div className="bg-slate-900/50 p-2 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <Zap size={12} /> Entry
            </div>
            <div className="font-mono text-white">{formatPrice(signal.entry_price)}</div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <Target size={12} /> Target
            </div>
            <div className="font-mono text-green-400">{formatPrice(signal.target_price)}</div>
          </div>
          <div className="bg-slate-900/50 p-2 rounded-lg">
            <div className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <Shield size={12} /> Stop
            </div>
            <div className="font-mono text-red-400">{formatPrice(signal.stop_loss)}</div>
          </div>
        </div>

        <div className="mb-4 relative z-10">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">Confidence Score</span>
            <span className="text-white font-bold">{signal.confidence}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${signal.confidence}%` }}
              className={`h-full rounded-full ${isBuy ? 'bg-green-500' : 'bg-red-500'}`}
            />
          </div>
        </div>

        <div className="relative z-10 pt-4 border-t border-white/5">
          <p className="text-sm text-slate-300 italic mb-3">"{signal.reasoning}"</p>
          
          {/* Feature 2.4.1: View Details Button */}
          <button
            onClick={() => setShowScoreBreakdown(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-sm font-medium"
          >
            <Info size={14} />
            View Detailed Analysis
          </button>
        </div>
        
        {/* Background decoration */}
        <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
      </motion.div>

      {/* Feature 2.4.2: Score Breakdown Modal */}
      <AnimatePresence>
        {showScoreBreakdown && (
          <ScoreBreakdownModal 
            signal={signal} 
            onClose={() => setShowScoreBreakdown(false)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};
