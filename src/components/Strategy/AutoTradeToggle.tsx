import React, { useState, useEffect } from 'react';
import { Power, Activity, AlertCircle } from 'lucide-react';
import { autoTradeService } from '../../services/autoTradeService';

export function AutoTradeToggle() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<'idle' | 'active' | 'error'>('idle');
  
  useEffect(() => {
    const interval = setInterval(() => {
      const state = autoTradeService.getState();
      setEnabled(state.enabled);
      setStatus(state.enabled ? 'active' : 'idle');
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleToggle = async () => {
    try {
      if (enabled) {
        autoTradeService.stop();
      } else {
        await autoTradeService.start();
      }
    } catch (error) {
      console.error('Toggle error:', error);
      setStatus('error');
    }
  };
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Power className="w-5 h-5" />
            Auto-Trade Engine
          </h3>
          <p className="text-slate-300 text-sm mt-1">
            {enabled ? 'Trading actively' : 'Idle - manual mode'}
          </p>
        </div>
        
        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          className={`relative w-16 h-9 rounded-full transition-all duration-300 ${
            enabled 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50' 
              : 'bg-slate-700'
          }`}
        >
          <div
            className={`absolute top-1 left-1 w-7 h-7 bg-white rounded-full transition-transform duration-300 ${
              enabled ? 'translate-x-7' : ''
            }`}
          />
        </button>
      </div>
      
      {/* Status Indicator */}
      <div className="flex items-center gap-2 text-sm">
        {status === 'active' && (
          <>
            <Activity className="w-4 h-4 text-green-500 animate-pulse" />
            <span className="text-green-400">Monitoring markets...</span>
          </>
        )}
        {status === 'idle' && (
          <>
            <div className="w-4 h-4 rounded-full bg-slate-500" />
            <span className="text-slate-400">Standby</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-400">Error - check logs</span>
          </>
        )}
      </div>
    </div>
  );
}
