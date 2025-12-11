
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, RefreshCcw, Info } from 'lucide-react';
import { useSentiment } from '../../hooks/useSentiment';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const SentimentGauge = () => {
  const { data, loading } = useSentiment();

  // Normalize score (0-100)
  const score = data?.fear_greed_index || 50;
  
  // Calculate rotation (-90 to 90 degrees)
  const rotation = (score / 100) * 180 - 90;

  // Determine State
  let status = 'Neutral';
  let colorClass = 'text-yellow-400';
  let strokeColor = '#eab308';
  let glowColor = 'rgba(234, 179, 8, 0.5)';

  if (score < 25) {
    status = 'Extreme Fear';
    colorClass = 'text-red-600';
    strokeColor = '#dc2626';
    glowColor = 'rgba(220, 38, 38, 0.5)';
  } else if (score < 45) {
    status = 'Fear';
    colorClass = 'text-orange-500';
    strokeColor = '#f97316';
    glowColor = 'rgba(249, 115, 22, 0.5)';
  } else if (score < 55) {
    status = 'Neutral';
    colorClass = 'text-yellow-400';
    strokeColor = '#eab308';
    glowColor = 'rgba(234, 179, 8, 0.5)';
  } else if (score < 75) {
    status = 'Greed';
    colorClass = 'text-green-400';
    strokeColor = '#4ade80';
    glowColor = 'rgba(74, 222, 128, 0.5)';
  } else {
    status = 'Extreme Greed';
    colorClass = 'text-emerald-500';
    strokeColor = '#10b981';
    glowColor = 'rgba(16, 185, 129, 0.5)';
  }

  return (
    <div className="glass-card p-5 h-full flex flex-col relative overflow-hidden group">
      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" fill="currentColor" />
            Market Sentiment
          </h3>
          <p className="text-xs text-slate-300 mt-1">Fear & Greed Index</p>
        </div>
        <div className="flex gap-1">
           <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white">
             <Info size={14} />
           </button>
           <button 
             disabled={loading}
             className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white"
           >
             <RefreshCcw size={14} className={cn(loading && "animate-spin")} />
           </button>
        </div>
      </div>

      {/* Main Gauge Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-4">
        <div className="relative w-full max-w-[220px] aspect-[2/1]">
          <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Track Background */}
            <path 
              d="M 20 100 A 80 80 0 0 1 180 100" 
              fill="none" 
              stroke="rgba(255,255,255,0.05)" 
              strokeWidth="16" 
              strokeLinecap="round"
            />
            
            {/* Colored Arc */}
            <path 
              d="M 20 100 A 80 80 0 0 1 180 100" 
              fill="none" 
              stroke="url(#gaugeGradient)" 
              strokeWidth="16" 
              strokeLinecap="round"
              strokeDasharray="251.2"
              strokeDashoffset="0"
              filter="url(#glow)"
              opacity="0.9"
            />

            {/* Ticks */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const tickRot = (tick / 100) * 180 - 90;
              return (
                <g key={tick} transform={`translate(100, 100) rotate(${tickRot}) translate(0, -70)`}>
                   <rect x="-1" y="0" width="2" height="6" fill="rgba(255,255,255,0.3)" />
                </g>
              );
            })}

            {/* Needle */}
            <motion.g 
              initial={{ rotate: -90 }}
              animate={{ rotate: rotation }}
              transition={{ type: "spring", stiffness: 40, damping: 12, mass: 1 }}
              style={{ originX: "100px", originY: "100px" }}
            >
              <path d="M 100 100 L 100 25" stroke="white" strokeWidth="2.5" />
              <circle cx="100" cy="100" r="5" fill="white" stroke={strokeColor} strokeWidth="2" />
              <circle cx="100" cy="25" r="4" fill="white" />
              {/* Needle Glow */}
              <circle cx="100" cy="25" r="8" fill={strokeColor} opacity="0.5" filter="url(#glow)" />
            </motion.g>
          </svg>
          
          {/* Central Score - Fixed positioning */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center transform translate-y-2">
             <motion.div 
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               key={score}
               className={cn("text-5xl font-black tracking-tighter drop-shadow-2xl", colorClass)}
               style={{ textShadow: `0 0 30px ${strokeColor}` }}
             >
               {Math.round(score)}
             </motion.div>
          </div>
        </div>

        {/* Status Text - Better positioning and sizing */}
        <div className="text-center mt-8 space-y-1.5">
          <div className={cn("text-xl font-black uppercase tracking-[0.2em] drop-shadow-md", colorClass)}>
            {status}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Updated: <span className="text-slate-300">Just now</span>
          </div>
        </div>
      </div>

      {/* Ambient Glow Background */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none transition-colors duration-1000"
        style={{ backgroundColor: strokeColor }}
      />
    </div>
  );
};
