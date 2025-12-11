
import React from 'react';
import { Key, Trash2, Eye, Copy, Plus } from 'lucide-react';

const MOCK_KEYS = [
  { id: 1, name: 'Binance API', key: 'xk39...92ks', permission: 'Read Only', created: '2023-10-15' },
  { id: 2, name: 'Trading Bot V1', key: 'mp22...19la', permission: 'Trade', created: '2023-11-02' },
];

export const ApiKeysManager = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">API Keys</h3>
          <p className="text-sm text-slate-400">Manage access keys for third-party integrations.</p>
        </div>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold">
          <Plus size={16} /> Create New Key
        </button>
      </div>

      <div className="space-y-3">
        {MOCK_KEYS.map(key => (
          <div key={key.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                 <Key size={20} />
               </div>
               <div>
                 <div className="font-bold text-white">{key.name}</div>
                 <div className="text-xs text-slate-500">Created: {key.created} • {key.permission}</div>
               </div>
             </div>
             
             <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-white/5 flex-1 max-w-md">
                <code className="text-sm font-mono text-slate-300 flex-1">{key.key}</code>
                <button className="text-slate-500 hover:text-white"><Eye size={16} /></button>
                <button className="text-slate-500 hover:text-white"><Copy size={16} /></button>
             </div>

             <button className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
               <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};
