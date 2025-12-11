
import React, { useEffect, useState } from 'react';
import { DollarSign, PieChart, AlertTriangle, Layers } from 'lucide-react';
import { formatPrice } from '../../utils/format';
import { riskService, PortfolioStats } from '../../services/riskService';

const StatCard = ({ title, value, subValue, icon: Icon, color }: any) => (
  <div className="glass-card p-6 relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div className="relative z-10">
      <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {subValue && <div className="text-sm mt-1">{subValue}</div>}
    </div>
  </div>
);

export const PortfolioSummary = () => {
  const [stats, setStats] = useState<PortfolioStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const data = await riskService.getPortfolioStats();
      setStats(data);
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div className="h-32 skeleton rounded-xl" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard 
        title="Total Portfolio Value"
        value={formatPrice(stats.totalValue)}
        subValue={<span className="text-green-400 font-bold">+{stats.pnlPercent24h.toFixed(2)}% (24h)</span>}
        icon={DollarSign}
        color="from-blue-500 to-indigo-600"
      />
      <StatCard 
        title="Risk Score"
        value={`${stats.riskScore}/100`}
        subValue={<span className={stats.riskScore > 50 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{stats.riskScore > 50 ? "High Risk" : "Low Risk"}</span>}
        icon={AlertTriangle}
        color="from-orange-500 to-red-500"
      />
      <StatCard 
        title="Asset Allocation"
        value="Dynamic"
        subValue={<span className="text-slate-400">Real-time weighting</span>}
        icon={PieChart}
        color="from-purple-500 to-pink-500"
      />
      <StatCard 
        title="Open Positions"
        value={`${stats.activePositionsCount} Active`}
        subValue={<span className="text-slate-400">Tracking market</span>}
        icon={Layers}
        color="from-emerald-500 to-teal-600"
      />
    </div>
  );
};
