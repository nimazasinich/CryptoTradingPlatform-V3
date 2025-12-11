
import React, { useState, useEffect } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { settingsService, TelegramConfig } from '../../services/settingsService';
import { useApp } from '../../context/AppContext';

interface Props {
  config: TelegramConfig;
  onUpdate: (config: TelegramConfig) => void;
}

export const TelegramBotManager = ({ config, onUpdate }: Props) => {
  const { addToast } = useApp();
  const [localConfig, setLocalConfig] = useState<TelegramConfig>(config);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.saveTelegramConfig(localConfig);
      onUpdate(localConfig);
      addToast("Telegram configuration saved", "success");
    } catch (err: any) {
      addToast("Failed to save configuration", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await settingsService.sendTestMessage(localConfig.chatId, localConfig.botToken);
      addToast("Test message sent successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to send test message", "error");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="glass-card p-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
          <Send size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Telegram Bot</h2>
          <p className="text-slate-300 text-sm">Receive trading signals and alerts directly on Telegram.</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase">Bot Token</label>
          <input 
            type="password" 
            value={localConfig.botToken} 
            onChange={e => setLocalConfig({...localConfig, botToken: e.target.value})}
            className="input-glass w-full" 
            placeholder="123456789:ABCdef..." 
          />
          <p className="text-[10px] text-slate-500">From @BotFather on Telegram</p>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 uppercase">Chat ID</label>
          <input 
            type="text" 
            value={localConfig.chatId} 
            onChange={e => setLocalConfig({...localConfig, chatId: e.target.value})}
            className="input-glass w-full" 
            placeholder="@channel_name or 12345678" 
          />
          <p className="text-[10px] text-slate-500">Use @userinfobot to find your ID</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Frequency</label>
            <select 
              value={localConfig.frequency} 
              onChange={e => setLocalConfig({...localConfig, frequency: e.target.value as any})}
              className="input-glass w-full"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly Digest</option>
              <option value="daily">Daily Report</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 uppercase">Min Confidence</label>
            <div className="flex items-center gap-3 h-[42px] px-2">
              <input 
                type="range" 
                min="0" max="100" 
                value={localConfig.minConfidence} 
                onChange={e => setLocalConfig({...localConfig, minConfidence: parseInt(e.target.value)})}
                className="flex-1 accent-purple-500" 
              />
              <span className="font-mono text-sm w-10 text-right">{localConfig.minConfidence}%</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-xl space-y-3 border border-white/5">
          <h4 className="text-xs font-bold text-slate-300 uppercase mb-2">Notification Types</h4>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={localConfig.notifications.signals} 
              onChange={e => setLocalConfig({...localConfig, notifications: {...localConfig.notifications, signals: e.target.checked}})} 
              className="accent-purple-500 h-4 w-4 rounded border-gray-600 bg-gray-700" 
            />
            <span className="text-sm text-slate-300">Trading Signals (Buy/Sell)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={localConfig.notifications.alerts} 
              onChange={e => setLocalConfig({...localConfig, notifications: {...localConfig.notifications, alerts: e.target.checked}})} 
              className="accent-purple-500 h-4 w-4 rounded border-gray-600 bg-gray-700" 
            />
            <span className="text-sm text-slate-300">Price Alerts</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={localConfig.notifications.dailyDigest} 
              onChange={e => setLocalConfig({...localConfig, notifications: {...localConfig.notifications, dailyDigest: e.target.checked}})} 
              className="accent-purple-500 h-4 w-4 rounded border-gray-600 bg-gray-700" 
            />
            <span className="text-sm text-slate-300">Daily Portfolio Digest</span>
          </label>
        </div>

        <div className="flex gap-4 pt-4 border-t border-white/5">
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="btn-primary"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button 
            onClick={handleTest} 
            disabled={isTesting || !localConfig.botToken || !localConfig.chatId} 
            className="px-6 py-2.5 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? 'Sending...' : 'Send Test Message'}
          </button>
        </div>
      </div>
    </div>
  );
};
