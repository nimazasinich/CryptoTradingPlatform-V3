
import React, { useEffect, useState } from 'react';
import { ShieldCheck, Bell } from 'lucide-react';
import { PortfolioSummary } from '../components/Risk/PortfolioSummary';
import { HoldingsTable } from '../components/Risk/HoldingsTable';
import { RiskAssessment } from '../components/Risk/RiskAssessment';
import { AlertsManager } from '../components/Risk/AlertsManager';
import { riskService } from '../services/riskService';
import { useApp } from '../context/AppContext';

export default function RiskManagement() {
  const { addToast } = useApp();
  const [alertMonitoringActive, setAlertMonitoringActive] = useState(true);
  const [lastAlertCheck, setLastAlertCheck] = useState(Date.now());

  // Feature 1.2.1: Enable Alert Monitoring Loop
  useEffect(() => {
    if (!alertMonitoringActive) return;

    // Check alerts every 60 seconds
    const checkAlertsLoop = async () => {
      try {
        await riskService.checkAlerts();
        setLastAlertCheck(Date.now());
      } catch (error) {
        console.error('Alert check error:', error);
      }
    };

    // Initial check
    checkAlertsLoop();

    // Set up interval
    const interval = setInterval(checkAlertsLoop, 60000);

    return () => clearInterval(interval);
  }, [alertMonitoringActive]);

  // Listen for price alert events
  useEffect(() => {
    const handlePriceAlert = (event: any) => {
      const { symbol, message, condition, price, targetPrice } = event.detail;
      
      // Show notification toast
      addToast(
        `🔔 Price Alert: ${message}`,
        'warning',
        10000
      );

      // Optional: Play sound (if enabled in settings)
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OmfTRALT6ff8LZkHAU7k9fyz3ksBSp2yPDdi0ILElyw6OumUhQKRp/e8r9uIgUsgs/y2Yk2CBlktO3qoE0QC06n3vC2ZB0FO5PY8c56LAUpd8rwvkE');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {}
    };

    window.addEventListener('priceAlert', handlePriceAlert);
    return () => window.removeEventListener('priceAlert', handlePriceAlert);
  }, [addToast]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="text-purple-400" size={32} />
            Risk Management
          </h1>
          <p className="text-slate-300">Monitor portfolio health, exposure, and set up safety alerts.</p>
        </div>
        
        {/* Alert Monitor Status */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
          <Bell className={`w-4 h-4 ${alertMonitoringActive ? 'text-green-400 animate-pulse' : 'text-slate-400'}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">
              Alert Monitor: {alertMonitoringActive ? 'Active' : 'Paused'}
            </span>
            <span className="text-[10px] text-slate-500">
              Checked: {Math.floor((Date.now() - lastAlertCheck) / 1000)}s ago
            </span>
          </div>
          <button
            onClick={() => setAlertMonitoringActive(!alertMonitoringActive)}
            className="ml-2 px-2 py-1 text-xs rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
          >
            {alertMonitoringActive ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <PortfolioSummary />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            <HoldingsTable />
         </div>
         <div className="space-y-6">
            <RiskAssessment />
            <AlertsManager />
         </div>
      </div>
    </div>
  );
}
