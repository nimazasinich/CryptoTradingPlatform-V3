
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { riskService } from '../../services/riskService';

export const RiskAssessment = () => {
  const [score, setScore] = useState(50);

  useEffect(() => {
    const fetchRisk = async () => {
      const stats = await riskService.getPortfolioStats();
      setScore(stats.riskScore);
    };
    fetchRisk();
  }, []);

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <h3 className="font-bold text-white text-lg mb-6">Risk Assessment</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div className="relative w-48 h-24 mb-4">
          <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible">
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="15" strokeLinecap="round" />
            <path d="M 20 100 A 80 80 0 0 1 60 45" fill="none" stroke="#22c55e" strokeWidth="15" strokeLinecap="round" />
            <path d="M 60 45 A 80 80 0 0 1 100 20" fill="none" stroke="#eab308" strokeWidth="15" strokeLinecap="round" />
            <path d="M 100 20 A 80 80 0 0 1 140 45" fill="none" stroke="#f97316" strokeWidth="15" strokeLinecap="round" />
            <path d="M 140 45 A 80 80 0 0 1 180 100" fill="none" stroke="#ef4444" strokeWidth="15" strokeLinecap="round" />

            <motion.g 
              initial={{ rotate: -90 }}
              animate={{ rotate: (score / 100) * 180 - 90 }}
              transition={{ duration: 1, type: 'spring' }}
              style={{ originX: "100px", originY: "100px" }}
            >
              <line x1="100" y1="100" x2="100" y2="30" stroke="white" strokeWidth="4" />
              <circle cx="100" cy="100" r="6" fill="white" />
            </motion.g>
          </svg>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-8 text-center">
            <div className="text-3xl font-bold text-white">{score}</div>
            <div className="text-xs text-slate-400">
              {score < 30 ? 'Low Risk' : score < 60 ? 'Moderate Risk' : 'High Risk'}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div className={`p-3 rounded-lg border text-xs ${score < 50 ? 'bg-green-500/10 border-green-500/20 text-green-300' : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'}`}>
           {score < 50 ? '✅ Portfolio is well balanced.' : '⚠️ High concentration in single assets.'}
        </div>
      </div>
    </div>
  );
};
