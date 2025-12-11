
import React, { useState } from 'react';
import { CheckCircle, Link as LinkIcon } from 'lucide-react';
import { settingsService, ExchangeConnection } from '../../services/settingsService';
import { useApp } from '../../context/AppContext';

interface Props {
  exchanges: ExchangeConnection[];
  onUpdate: (exchanges: ExchangeConnection[]) => void;
}

export const ExchangeConnectionsManager = ({ exchanges, onUpdate }: Props) => {
  const { addToast } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [exchangeForm, setExchangeForm] = useState({ 
    exchange: 'binance', 
    apiKey: '', 
    apiSecret: '', 
    passphrase: '',
    permissions: ['read', 'trade'] as ('read' | 'trade' | 'withdraw')[]
  });

  const handleConnectExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const conn = await settingsService.connectExchange(
        exchangeForm.exchange, 
        exchangeForm.apiKey, 
        exchangeForm.apiSecret,
        exchangeForm.passphrase || undefined,
        exchangeForm.permissions
      );
      const updatedList = exchanges.some(ex => ex.id === conn.id) 
        ? exchanges.map(ex => ex.id === conn.id ? conn : ex)
        : [...exchanges, conn];
      
      onUpdate(updatedList);
      setExchangeForm({ exchange: 'binance', apiKey: '', apiSecret: '', passphrase: '', permissions: ['read', 'trade'] });
      addToast("Exchange connected successfully", "success");
    } catch (err: any) { 
      addToast(err.message || "Failed to connect exchange", "error"); 
    } finally {
      setIsSaving(false);
    }
  };

  const togglePermission = (permission: 'read' | 'trade' | 'withdraw') => {
    setExchangeForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleDisconnect = async (id: string) => {
    try {
      await settingsService.disconnectExchange(id);
      onUpdate(exchanges.filter(e => e.id !== id));
      addToast("Exchange disconnected", "info");
    } catch (err: any) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exchanges.map(ex => (
          <div key={ex.id} className="glass-card p-6 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-white capitalize">{ex.exchange}</h3>
                <div className="flex gap-2 mt-1">
                  {ex.permissions.map(p => <span key={p} className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 uppercase">{p}</span>)}
                </div>
              </div>
              <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-bold uppercase flex items-center gap-1">
                <CheckCircle size={12} /> Connected
              </div>
            </div>
            <button onClick={() => handleDisconnect(ex.id)} className="w-full py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm">
              Disconnect
            </button>
          </div>
        ))}
        {exchanges.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-8 border border-white/5 rounded-xl bg-white/[0.02] text-center text-slate-500">
            No exchanges connected. Add one below to start trading.
          </div>
        )}
      </div>

      <div className="glass-card p-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <LinkIcon size={20} className="text-purple-400" /> Connect Exchange
        </h3>
        <form onSubmit={handleConnectExchange} className="space-y-4 max-w-2xl">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Exchange</label>
            <select 
              value={exchangeForm.exchange}
              onChange={e => setExchangeForm({...exchangeForm, exchange: e.target.value})}
              className="input-glass w-full"
            >
              <option value="binance">Binance</option>
              <option value="coinbase">Coinbase Pro</option>
              <option value="kraken">Kraken</option>
              <option value="kucoin">KuCoin</option>
              <option value="bybit">Bybit</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">API Key</label>
            <input 
              value={exchangeForm.apiKey}
              onChange={e => setExchangeForm({...exchangeForm, apiKey: e.target.value})}
              className="input-glass w-full" 
              placeholder="Enter your API Key"
              required 
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">API Secret</label>
            <input 
              type="password"
              value={exchangeForm.apiSecret}
              onChange={e => setExchangeForm({...exchangeForm, apiSecret: e.target.value})}
              className="input-glass w-full" 
              placeholder="Enter your API Secret"
              required 
            />
          </div>
          {['kucoin', 'okx'].includes(exchangeForm.exchange) && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase">
                Passphrase {exchangeForm.exchange === 'kucoin' ? '(Required)' : '(Optional)'}
              </label>
              <input 
                type="password"
                value={exchangeForm.passphrase}
                onChange={e => setExchangeForm({...exchangeForm, passphrase: e.target.value})}
                className="input-glass w-full" 
                placeholder="Enter passphrase"
                required={exchangeForm.exchange === 'kucoin'}
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase block">Permissions</label>
            <div className="flex gap-3">
              {[
                { id: 'read', label: 'Read', desc: 'View account data' },
                { id: 'trade', label: 'Trade', desc: 'Execute trades' },
                { id: 'withdraw', label: 'Withdraw', desc: 'Withdraw funds' }
              ].map(perm => (
                <label key={perm.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={exchangeForm.permissions.includes(perm.id as any)}
                    onChange={() => togglePermission(perm.id as any)}
                    className="w-4 h-4 accent-purple-500 rounded border-gray-600 bg-gray-700"
                  />
                  <div>
                    <div className="text-sm text-white font-medium group-hover:text-purple-400 transition-colors">{perm.label}</div>
                    <div className="text-xs text-slate-500">{perm.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="pt-4">
            <button type="submit" disabled={isSaving} className="btn-primary w-full">
              {isSaving ? 'Connecting...' : 'Connect Exchange'}
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Your keys are encrypted using AES-256 before being stored locally.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
