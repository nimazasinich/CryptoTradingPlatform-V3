
import React, { useState, useEffect } from 'react';
import { Bell, Trash2, ToggleRight, Plus } from 'lucide-react';
import { CoinIcon } from '../Common/CoinIcon';
import { riskService } from '../../services/riskService';
import { PriceAlert } from '../../services/database';

export const AlertsManager = () => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [symbol, setSymbol] = useState('BTC');
  const [condition, setCondition] = useState<'above'|'below'>('above');
  const [price, setPrice] = useState('');

  const loadAlerts = () => {
    setAlerts(riskService.getAlerts());
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!price) return;
    riskService.createAlert(symbol, condition, parseFloat(price));
    setShowForm(false);
    setPrice('');
    loadAlerts();
  };

  const handleDelete = (id: string) => {
    riskService.deleteAlert(id);
    loadAlerts();
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white text-lg">Price Alerts</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-xs bg-purple-500 text-white px-3 py-1.5 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
        >
          <Plus size={14} /> New Alert
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 bg-white/5 p-3 rounded-lg space-y-2 border border-white/10">
           <div className="flex gap-2">
             <select value={symbol} onChange={e=>setSymbol(e.target.value)} className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white">
               {['BTC','ETH','SOL','BNB'].map(s=><option key={s} value={s}>{s}</option>)}
             </select>
             <select value={condition} onChange={e=>setCondition(e.target.value as any)} className="bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white">
               <option value="above">Above</option>
               <option value="below">Below</option>
             </select>
           </div>
           <input 
             type="number" 
             placeholder="Price" 
             value={price} 
             onChange={e=>setPrice(e.target.value)} 
             className="w-full bg-slate-900 border border-white/10 rounded px-2 py-1 text-xs text-white"
           />
           <button type="submit" className="w-full bg-green-600 text-white text-xs py-1 rounded">Create Alert</button>
        </form>
      )}
      
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
        {alerts.length === 0 ? <div className="text-center text-slate-500 text-xs py-4">No alerts set</div> : alerts.map(alert => (
          <div key={alert.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
             <div className="flex items-center gap-3">
                <CoinIcon symbol={alert.symbol} size="sm" />
                <div className="text-sm">
                   <div className="font-bold text-white">{alert.symbol}</div>
                   <div className="text-xs text-slate-300 capitalize">{alert.condition} ${alert.price.toLocaleString()}</div>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <ToggleRight className={`w-8 h-8 ${alert.active ? 'text-green-400' : 'text-slate-600'}`} />
                <button onClick={() => handleDelete(alert.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
