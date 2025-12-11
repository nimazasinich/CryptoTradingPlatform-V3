
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Target, Shield, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { AISignal } from '../../types';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice } from '../../utils/format';

export const SignalCard = ({ signal }: { signal: AISignal }) => {
  const isBuy = signal.type === 'BUY';
  const colorClass = isBuy ? 'text-green-400' : 'text-red-400';
  const bgClass = isBuy ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
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
            <span className="text-xs text-slate-400">{new Date(signal.timestamp).toLocaleString()}</span>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isBuy ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {signal.type}
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
          <span className="text-slate-400">Confidence Score</span>
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
        <p className="text-sm text-slate-300 italic">"{signal.reasoning}"</p>
      </div>
      
      {/* Background decoration */}
      <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-3xl opacity-10 ${isBuy ? 'bg-green-500' : 'bg-red-500'}`} />
    </motion.div>
  );
};
