
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PortfolioSummary } from '../components/Risk/PortfolioSummary';
import { HoldingsTable } from '../components/Risk/HoldingsTable';
import { RiskAssessment } from '../components/Risk/RiskAssessment';
import { AlertsManager } from '../components/Risk/AlertsManager';

export default function RiskManagement() {
  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldCheck className="text-purple-400" size={32} />
          Risk Management
        </h1>
        <p className="text-slate-400">Monitor portfolio health, exposure, and set up safety alerts.</p>
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
