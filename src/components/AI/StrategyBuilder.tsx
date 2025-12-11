
import React, { useState } from 'react';
import { Plus, Trash2, Save, BrainCircuit, ArrowRight } from 'lucide-react';

export const StrategyBuilder = () => {
  const [conditions, setConditions] = useState([
    { id: 1, indicator: 'RSI', operator: '<', value: '30' }
  ]);
  const [action, setAction] = useState('BUY');

  const addCondition = () => {
    setConditions([...conditions, { id: Date.now(), indicator: 'SMA', operator: '>', value: 'Price' }]);
  };

  const removeCondition = (id: number) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  return (
    <div className="glass-card p-8 h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <BrainCircuit className="text-purple-400" />
          Strategy Builder
        </h2>
        <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors">
          <Save size={18} /> Save Strategy
        </button>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Conditions Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">IF Conditions Met:</h3>
          
          {conditions.map((cond, index) => (
            <div key={cond.id} className="flex items-center gap-4 animate-fade-in">
              {index > 0 && <span className="font-bold text-purple-400">AND</span>}
              
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                <select className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white">
                  <option>RSI (14)</option>
                  <option>MACD</option>
                  <option>Price</option>
                  <option>Volume</option>
                </select>
                
                <select className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white">
                  <option>Greater Than (&gt;)</option>
                  <option>Less Than (&lt;)</option>
                  <option>Crosses Up</option>
                  <option>Crosses Down</option>
                </select>
                
                <input 
                  type="text" 
                  defaultValue={cond.value} 
                  className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white w-32" 
                />
                
                <button 
                  onClick={() => removeCondition(cond.id)}
                  className="ml-auto p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={addCondition}
            className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2"
          >
            <Plus size={16} /> Add Condition
          </button>
        </div>

        {/* Action Arrow */}
        <div className="flex justify-center py-4">
          <div className="bg-white/5 p-2 rounded-full border border-white/10">
            <ArrowRight className="text-slate-400" size={24} />
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">THEN Execute:</h3>
          <div className={`p-6 rounded-xl border flex items-center justify-between ${action === 'BUY' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
             <div className="flex items-center gap-4">
               <span className="text-slate-300 font-medium">Action:</span>
               <div className="flex bg-slate-900 rounded-lg p-1">
                 <button 
                   onClick={() => setAction('BUY')}
                   className={`px-6 py-2 rounded-md font-bold transition-all ${action === 'BUY' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                   BUY
                 </button>
                 <button 
                   onClick={() => setAction('SELL')}
                   className={`px-6 py-2 rounded-md font-bold transition-all ${action === 'SELL' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                   SELL
                 </button>
               </div>
             </div>
             
             <div className="flex items-center gap-4">
               <span className="text-slate-300 font-medium">Order Type:</span>
               <select className="bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white">
                 <option>Market Order</option>
                 <option>Limit Order</option>
               </select>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
