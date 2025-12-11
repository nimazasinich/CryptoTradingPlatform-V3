
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, BrainCircuit, ArrowRight, Play, FolderOpen, Trash, CheckCircle } from 'lucide-react';
import { databaseService } from '../../services/database';

interface Condition {
  id: number;
  indicator: string;
  operator: string;
  value: string;
  logic?: 'AND' | 'OR';
}

interface Strategy {
  id: string;
  name: string;
  conditions: Condition[];
  action: 'BUY' | 'SELL';
  orderType: string;
  takeProfit: number;
  stopLoss: number;
  positionSize: number;
  positionType: 'FIXED' | 'PERCENT';
  created_at: number;
}

export const StrategyBuilder = () => {
  const [conditions, setConditions] = useState<Condition[]>([
    { id: 1, indicator: 'RSI', operator: '<', value: '30', logic: 'AND' }
  ]);
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState('Market Order');
  const [takeProfit, setTakeProfit] = useState(10);
  const [stopLoss, setStopLoss] = useState(5);
  const [positionSize, setPositionSize] = useState(100);
  const [positionType, setPositionType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [strategyName, setStrategyName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedStrategies, setSavedStrategies] = useState<Strategy[]>([]);
  const [showLoadModal, setShowLoadModal] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = () => {
    const strategies = localStorage.getItem('ai_strategies');
    if (strategies) {
      setSavedStrategies(JSON.parse(strategies));
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Date.now(), 
      indicator: 'Price', 
      operator: '>', 
      value: '0',
      logic: 'AND' 
    }]);
  };

  const removeCondition = (id: number) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: number, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const saveStrategy = () => {
    if (!strategyName.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    const strategy: Strategy = {
      id: Date.now().toString(),
      name: strategyName,
      conditions,
      action,
      orderType,
      takeProfit,
      stopLoss,
      positionSize,
      positionType,
      created_at: Date.now()
    };

    const existing = localStorage.getItem('ai_strategies');
    const strategies = existing ? JSON.parse(existing) : [];
    strategies.push(strategy);
    localStorage.setItem('ai_strategies', JSON.stringify(strategies));
    
    setShowSaveModal(false);
    setStrategyName('');
    loadStrategies();
    alert('Strategy saved successfully!');
  };

  const loadStrategy = (strategy: Strategy) => {
    setConditions(strategy.conditions);
    setAction(strategy.action);
    setOrderType(strategy.orderType);
    setTakeProfit(strategy.takeProfit);
    setStopLoss(strategy.stopLoss);
    setPositionSize(strategy.positionSize);
    setPositionType(strategy.positionType);
    setShowLoadModal(false);
  };

  const deleteStrategy = (id: string) => {
    if (confirm('Are you sure you want to delete this strategy?')) {
      const filtered = savedStrategies.filter(s => s.id !== id);
      localStorage.setItem('ai_strategies', JSON.stringify(filtered));
      loadStrategies();
    }
  };

  return (
    <div className="glass-card p-8 h-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="text-purple-400" />
            Strategy Builder
          </h2>
          <p className="text-slate-300 text-sm mt-1">Design custom trading strategies with visual conditions</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowLoadModal(true)}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg font-bold transition-colors border border-white/10"
          >
            <FolderOpen size={18} /> Load
          </button>
          <button 
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-purple-900/20"
          >
            <Save size={18} /> Save Strategy
          </button>
        </div>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Conditions Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            Entry Conditions
          </h3>
          
          {conditions.map((cond, index) => (
            <div key={cond.id} className="space-y-2 animate-fade-in">
              {index > 0 && (
                <div className="flex gap-2 pl-4">
                  <button
                    onClick={() => updateCondition(cond.id, 'logic', 'AND')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      cond.logic === 'AND' 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    AND
                  </button>
                  <button
                    onClick={() => updateCondition(cond.id, 'logic', 'OR')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      cond.logic === 'OR' 
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                        : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    OR
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-wrap items-center gap-4">
                  <select 
                    value={cond.indicator}
                    onChange={(e) => updateCondition(cond.id, 'indicator', e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option>RSI (14)</option>
                    <option>MACD</option>
                    <option>Price</option>
                    <option>Volume</option>
                    <option>SMA (20)</option>
                    <option>SMA (50)</option>
                    <option>SMA (200)</option>
                    <option>EMA (12)</option>
                    <option>EMA (26)</option>
                  </select>
                  
                  <select 
                    value={cond.operator}
                    onChange={(e) => updateCondition(cond.id, 'operator', e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value=">">Greater Than (&gt;)</option>
                    <option value="<">Less Than (&lt;)</option>
                    <option value="=">Equal To (=)</option>
                    <option value="crosses_up">Crosses Above ↗</option>
                    <option value="crosses_down">Crosses Below ↘</option>
                  </select>
                  
                  <input 
                    type="text" 
                    value={cond.value}
                    onChange={(e) => updateCondition(cond.id, 'value', e.target.value)}
                    placeholder="Value"
                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white w-32 text-sm focus:outline-none focus:border-purple-500" 
                  />
                  
                  <button 
                    onClick={() => removeCondition(cond.id)}
                    disabled={conditions.length === 1}
                    className="ml-auto p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={addCondition}
            className="flex items-center gap-2 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-1 hover:bg-cyan-500/10 rounded-lg"
          >
            <Plus size={16} /> Add Condition
          </button>
        </div>

        {/* Action Arrow */}
        <div className="flex justify-center py-4">
          <div className="bg-white/5 p-3 rounded-full border border-white/10 shadow-lg">
            <ArrowRight className="text-slate-300" size={24} />
          </div>
        </div>

        {/* Action Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Action to Execute</h3>
          <div className={`p-6 rounded-xl border transition-all ${action === 'BUY' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div>
                   <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Action Type</label>
                   <div className="flex bg-slate-900 rounded-lg p-1">
                     <button 
                       onClick={() => setAction('BUY')}
                       className={`flex-1 px-6 py-2 rounded-md font-bold transition-all ${action === 'BUY' ? 'bg-green-600 text-white' : 'text-slate-300 hover:text-white'}`}
                     >
                       BUY
                     </button>
                     <button 
                       onClick={() => setAction('SELL')}
                       className={`flex-1 px-6 py-2 rounded-md font-bold transition-all ${action === 'SELL' ? 'bg-red-600 text-white' : 'text-slate-300 hover:text-white'}`}
                     >
                       SELL
                     </button>
                   </div>
                 </div>

                 <div>
                   <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Order Type</label>
                   <select 
                     value={orderType}
                     onChange={(e) => setOrderType(e.target.value)}
                     className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                   >
                     <option>Market Order</option>
                     <option>Limit Order</option>
                     <option>Stop Order</option>
                   </select>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Take Profit %</label>
                     <input 
                       type="number"
                       value={takeProfit}
                       onChange={(e) => setTakeProfit(Number(e.target.value))}
                       className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                     />
                   </div>
                   <div>
                     <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Stop Loss %</label>
                     <input 
                       type="number"
                       value={stopLoss}
                       onChange={(e) => setStopLoss(Number(e.target.value))}
                       className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500"
                     />
                   </div>
                 </div>

                 <div>
                   <label className="text-xs text-slate-300 uppercase font-bold mb-2 block">Position Size</label>
                   <div className="flex gap-2">
                     <input 
                       type="number"
                       value={positionSize}
                       onChange={(e) => setPositionSize(Number(e.target.value))}
                       className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                     />
                     <select 
                       value={positionType}
                       onChange={(e) => setPositionType(e.target.value as 'FIXED' | 'PERCENT')}
                       className="bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                     >
                       <option value="FIXED">$ Fixed</option>
                       <option value="PERCENT">% of Capital</option>
                     </select>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Test Strategy Button */}
        <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]">
          <Play size={20} fill="currentColor" />
          Test Strategy (Run Backtest)
        </button>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSaveModal(false)}>
          <div className="glass-card p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white">Save Strategy</h3>
            <input 
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              placeholder="Enter strategy name..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveStrategy}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowLoadModal(false)}>
          <div className="glass-card p-6 max-w-2xl w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">Load Strategy</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {savedStrategies.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FolderOpen className="mx-auto mb-3 text-slate-600" size={48} />
                  <p>No saved strategies yet</p>
                </div>
              ) : (
                savedStrategies.map(strategy => (
                  <div key={strategy.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors">
                    <div className="flex-1">
                      <div className="font-bold text-white">{strategy.name}</div>
                      <div className="text-xs text-slate-300 mt-1">
                        {strategy.conditions.length} conditions · {strategy.action} · 
                        Created {new Date(strategy.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => loadStrategy(strategy)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <CheckCircle size={16} className="inline mr-1" />
                        Load
                      </button>
                      <button 
                        onClick={() => deleteStrategy(strategy.id)}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button 
              onClick={() => setShowLoadModal(false)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
