
import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { CoinIcon } from '../Common/CoinIcon';
import { formatPrice } from '../../utils/format';
import { riskService, Holding } from '../../services/riskService';
import { exportTable } from '../../utils/exportTable';

export const HoldingsTable = () => {
  const [holdings, setHoldings] = useState<Holding[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await riskService.getHoldings();
      setHoldings(data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const exportData = holdings.map(h => ({
      Asset: h.name,
      Symbol: h.symbol,
      Balance: h.amount,
      Price: h.price,
      Value: h.value,
      Allocation: `${h.allocation.toFixed(2)}%`
    }));
    exportTable(exportData, { filename: `holdings_${new Date().toISOString().split('T')[0]}` });
  };

  return (
    <div className="glass-card flex flex-col">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-white text-lg">Current Holdings</h3>
        <button
          onClick={handleExport}
          disabled={holdings.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          title="Export to CSV"
        >
          <Download size={16} />
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5 text-left">
              <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Asset</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Balance</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Current Price</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Value</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase">Allocation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {holdings.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-500">No holdings found</td></tr>
            ) : (
              holdings.map(asset => (
                <tr key={asset.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <CoinIcon symbol={asset.symbol} size="sm" />
                      <div>
                        <div className="font-bold text-white">{asset.name}</div>
                        <div className="text-xs text-slate-500">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-slate-300">
                    {asset.amount.toLocaleString()} {asset.symbol}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-white">
                    {formatPrice(asset.price)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-white font-bold">
                    {formatPrice(asset.value)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs text-slate-400 w-8 text-right">{asset.allocation.toFixed(1)}%</span>
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${asset.allocation}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
