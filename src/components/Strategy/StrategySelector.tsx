import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const strategies: Strategy[] = [
  {
    id: 'dreammaker',
    name: 'DreamMaker Multi-Engine',
    description: '3 parallel engines with 14 detectors (Recommended)',
    icon: '🎯'
  },
  {
    id: 'advanced',
    name: 'Advanced 5-Layer',
    description: 'Extreme selectivity with mathematical scoring',
    icon: '⭐'
  },
  {
    id: 'confluence',
    name: 'Multi-Timeframe Confluence',
    description: '15m/1h/4h analysis with convergence',
    icon: '📊'
  }
];

export function StrategySelector() {
  const [selectedId, setSelectedId] = useState('dreammaker');
  const [isOpen, setIsOpen] = useState(false);
  
  const selected = strategies.find(s => s.id === selectedId)!;
  
  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between hover:scale-[1.02] transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{selected.icon}</span>
          <div className="text-left">
            <div className="text-white font-semibold">{selected.name}</div>
            <div className="text-slate-300 text-sm">{selected.description}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card p-2 z-50 animate-fadeIn">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => {
                setSelectedId(strategy.id);
                setIsOpen(false);
              }}
              className="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-200 flex items-center gap-3"
            >
              <span className="text-2xl">{strategy.icon}</span>
              <div className="flex-1 text-left">
                <div className="text-white font-medium">{strategy.name}</div>
                <div className="text-slate-400 text-xs">{strategy.description}</div>
              </div>
              {strategy.id === selectedId && (
                <Check className="w-5 h-5 text-green-500" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
