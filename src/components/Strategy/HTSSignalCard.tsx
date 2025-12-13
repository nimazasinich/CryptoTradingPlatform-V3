import React, { useState } from 'react';
import { HTSResult } from '../../types/hts';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface HTSSignalCardProps {
  signal: HTSResult;
}

/**
 * HTS Signal Card Component
 * Displays individual HTS analysis result with score breakdown
 */
export function HTSSignalCard({ signal }: HTSSignalCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Determine colors based on action
  const actionColors = {
    BUY: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      badge: 'bg-green-500/20'
    },
    SELL: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20'
    },
    HOLD: {
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/30',
      text: 'text-gray-400',
      badge: 'bg-gray-500/20'
    }
  };

  const colors = actionColors[signal.action];

  // Get action icon
  const ActionIcon = signal.action === 'BUY' ? TrendingUp : 
                     signal.action === 'SELL' ? TrendingDown : Minus;

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`glass-card p-5 border ${colors.border} ${colors.bg} hover:scale-[1.02] transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-white">
            {signal.symbol}
          </div>
          <div className={`px-3 py-1 rounded-full ${colors.badge} flex items-center gap-1.5`}>
            <ActionIcon size={16} className={colors.text} />
            <span className={`text-sm font-bold ${colors.text}`}>
              {signal.action}
            </span>
          </div>
        </div>
        
        {/* Score */}
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(signal.final_score)}`}>
            {signal.final_score.toFixed(0)}
          </div>
          <div className="text-xs text-slate-400">Score</div>
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-4">
        <div className="text-slate-400 text-xs mb-1">Current Price</div>
        <div className="text-white text-xl font-mono">
          ${signal.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Confidence</span>
          <span className="font-bold">{(signal.confidence * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colors.text.replace('text-', 'bg-')} transition-all duration-500`}
            style={{ width: `${signal.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="text-xs text-slate-400 mb-2">Score Breakdown</div>
        
        <ScoreBar label="Core Indicators" score={signal.breakdown.core} color="blue" />
        <ScoreBar label="Smart Money" score={signal.breakdown.smc} color="purple" />
        <ScoreBar label="Patterns" score={signal.breakdown.patterns} color="cyan" />
        <ScoreBar label="Sentiment" score={signal.breakdown.sentiment} color="yellow" />
        <ScoreBar label="ML Prediction" score={signal.breakdown.ml} color="pink" />
      </div>

      {/* Entry/Exit Levels */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">Entry</div>
          <div className="text-white font-mono text-sm">
            ${signal.entry_price.toFixed(2)}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">Stop Loss</div>
          <div className="text-red-400 font-mono text-sm">
            ${signal.stop_loss.toFixed(2)}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">TP1</div>
          <div className="text-green-400 font-mono text-sm">
            ${signal.take_profit_1.toFixed(2)}
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <div className="text-xs text-slate-400">R:R</div>
          <div className="text-white font-mono text-sm">
            1:{(signal.reward_percent / signal.risk_percent).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Expandable Reasoning */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-white transition-colors"
      >
        <span>Analysis Details</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
          {signal.reasoning.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <span className={`mt-1 ${colors.text}`}>•</span>
              <span>{reason}</span>
            </div>
          ))}
          
          {/* Additional Take Profits */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-white/5 rounded p-2">
              <div className="text-xs text-slate-400">TP2</div>
              <div className="text-green-400 font-mono text-xs">
                ${signal.take_profit_2.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 rounded p-2">
              <div className="text-xs text-slate-400">TP3</div>
              <div className="text-green-400 font-mono text-xs">
                ${signal.take_profit_3.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Score Bar Component
 */
interface ScoreBarProps {
  label: string;
  score: number;
  color: string;
}

function ScoreBar({ label, score, color }: ScoreBarProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{score.toFixed(0)}</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorMap[color]} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
