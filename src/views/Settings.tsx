
import React, { useState, useEffect } from 'react';
import { 
  User, Key, Bell, Monitor, Database, Send,
  Trash2, Lock, Volume2, Moon, Clock, Server, Download, Upload, CheckCircle, Link as LinkIcon
} from 'lucide-react';
import { settingsService, UserProfile, ApiKey, ExchangeConnection, TelegramConfig, UserPreferences } from '../services/settingsService';
import { useApp } from '../context/AppContext';
import { databaseService, DBStats } from '../services/database';
import { ApiKeysManager } from '../components/Settings/ApiKeysManager'; // Assuming this exists or using previous code
import { ExchangeConnectionsManager } from '../components/Settings/ExchangeConnectionsManager';
import { TelegramBotManager } from '../components/Settings/TelegramBotManager';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'api', label: 'API Keys', icon: Key },
  { id: 'exchanges', label: 'Exchanges', icon: LinkIcon },
  { id: 'telegram', label: 'Telegram Bot', icon: Send },
  { id: 'personalization', label: 'Personalization', icon: Monitor },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data Sources', icon: Database },
];

export default function Settings({ defaultTab }: { defaultTab?: string }) {
  const { addToast, setTheme } = useApp();
  const [activeTab, setActiveTab] = useState(defaultTab || 'profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeConnection[]>([]);
  const [telegram, setTelegram] = useState<TelegramConfig | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [dbStats, setDbStats] = useState<DBStats>({ size: 0, tables: [] });

  // Form State
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [keyForm, setKeyForm] = useState({ name: '', key: '', show: false });

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      const [p, k, e, t, pr, d] = await Promise.all([
        settingsService.getProfile(),
        settingsService.getApiKeys(),
        settingsService.getExchanges(),
        settingsService.getTelegramConfig(),
        settingsService.getPreferences(),
        Promise.resolve(databaseService.getStats())
      ]);
      setProfile(p);
      setApiKeys(k);
      setExchanges(e);
      setTelegram(t);
      setPrefs(pr);
      setDbStats(d);
    } catch (err) {
      addToast("Failed to load settings", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllSettings();
  }, []);

  // --- Handlers ---

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSaving(true);
    try {
      await settingsService.saveProfile(profile);
      addToast("Profile updated", "success");
    } catch (error) { addToast("Update failed", "error"); }
    setIsSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const base64 = await settingsService.uploadAvatar(e.target.files[0]);
        setProfile(prev => prev ? ({ ...prev, avatarUrl: base64 }) : null);
        await settingsService.saveProfile({ avatarUrl: base64 });
        addToast("Avatar updated", "success");
      } catch (err: any) { addToast(err.message, "error"); }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) return addToast("New passwords do not match", "error");
    try {
      await settingsService.changePassword(passwordForm.current, passwordForm.new);
      addToast("Password changed successfully", "success");
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) { addToast(err.message, "error"); }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newKey = await settingsService.saveApiKey(keyForm.name, keyForm.key);
      setApiKeys(prev => [...prev, newKey]);
      setKeyForm({ name: '', key: '', show: false });
      addToast("API Key added", "success");
    } catch (err) { addToast("Failed to add key", "error"); }
  };

  const handleSavePrefs = async () => {
    if (!prefs) return;
    try {
      await settingsService.savePreferences(prefs);
      setTheme(prefs.theme);
      addToast("Preferences updated", "success");
    } catch (err) { addToast("Update failed", "error"); }
  };

  if (isLoading || !profile) return <div className="flex h-screen items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-purple-500 rounded-full border-t-transparent" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account, security, and integration preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="glass-card p-2 sticky top-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 last:mb-0",
                  activeTab === tab.id 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* --- PROFILE TAB --- */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass-card p-8">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl overflow-hidden">
                      {profile.avatarUrl ? <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                    </div>
                    <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                      <span className="text-xs text-white font-bold"><Upload size={16} /></span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                    <div className="text-slate-400">@{profile.username}</div>
                  </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                      <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="input-glass w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
                      <input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="input-glass w-full mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                    <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="input-glass w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Bio</label>
                    <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="input-glass w-full h-24 resize-none mt-1" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={profile.twoFactorEnabled} onChange={e => setProfile({...profile, twoFactorEnabled: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      <span className="text-sm font-medium text-slate-300">Enable 2FA</span>
                    </label>
                    <button type="submit" disabled={isSaving} className="btn-primary">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                  </div>
                </form>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Lock size={18} className="text-purple-400" /> Security</h3>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Current Password</label>
                    <input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className="input-glass w-full mt-1" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">New Password</label>
                      <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className="input-glass w-full mt-1" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase">Confirm Password</label>
                      <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} className="input-glass w-full mt-1" required />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-lg text-white transition-colors">Update Password</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- API KEYS TAB --- */}
          {activeTab === 'api' && prefs && (
            <div className="space-y-6 animate-fade-in">
              {/* Main Provider Key */}
              <div className="glass-card p-8 border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Primary Data Source</h3>
                    <p className="text-sm text-slate-400">HuggingFace Inference Token</p>
                  </div>
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Server size={24} /></div>
                </div>
                <div className="flex gap-4">
                  <input 
                    type="password" 
                    placeholder="hf_..." 
                    value={prefs.dataSource.hfToken || ''} 
                    onChange={e => setPrefs({...prefs, dataSource: {...prefs.dataSource, hfToken: e.target.value}})}
                    className="input-glass flex-1" 
                  />
                  <button onClick={handleSavePrefs} className="btn-primary">Save Token</button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle size={12} /> System Operational
                </div>
              </div>

              {/* Custom Keys */}
              <div className="glass-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Custom API Keys</h3>
                  <button onClick={() => setKeyForm({...keyForm, show: !keyForm.show})} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white transition-colors">
                    {keyForm.show ? 'Cancel' : '+ New Key'}
                  </button>
                </div>

                {keyForm.show && (
                  <form onSubmit={handleAddKey} className="bg-slate-900/50 p-4 rounded-xl border border-white/5 mb-6 animate-fade-in">
                    <div className="flex gap-4">
                      <input 
                        placeholder="Key Name (e.g. Trading Bot)" 
                        value={keyForm.name}
                        onChange={e => setKeyForm({...keyForm, name: e.target.value})}
                        className="input-glass flex-1" 
                        required 
                      />
                      <input 
                        placeholder="Secret Key" 
                        value={keyForm.key}
                        onChange={e => setKeyForm({...keyForm, key: e.target.value})}
                        className="input-glass flex-1" 
                        required 
                      />
                      <button type="submit" className="btn-primary">Save</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {apiKeys.map(key => (
                    <div key={key.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Key size={20} /></div>
                        <div>
                          <div className="font-bold text-white">{key.name}</div>
                          <div className="text-xs text-slate-500 font-mono">ID: {key.id} • Created: {new Date(key.created).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <button onClick={async () => {
                        await settingsService.deleteApiKey(key.id);
                        setApiKeys(prev => prev.filter(k => k.id !== key.id));
                        addToast("Key deleted", "success");
                      }} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {apiKeys.length === 0 && <div className="text-center text-slate-500 py-4 italic">No custom keys generated</div>}
                </div>
              </div>
            </div>
          )}

          {/* --- EXCHANGES TAB --- */}
          {activeTab === 'exchanges' && (
            <ExchangeConnectionsManager exchanges={exchanges} onUpdate={setExchanges} />
          )}

          {/* --- TELEGRAM TAB --- */}
          {activeTab === 'telegram' && telegram && (
            <TelegramBotManager config={telegram} onUpdate={setTelegram} />
          )}

          {/* --- PERSONALIZATION TAB --- */}
          {activeTab === 'personalization' && prefs && (
            <div className="glass-card p-8 animate-fade-in">
              <h2 className="text-xl font-bold text-white mb-8">Interface Personalization</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Theme Accent</label>
                  <div className="flex gap-4">
                    {['dark', 'light'].map(t => (
                      <button 
                        key={t}
                        onClick={() => setPrefs({...prefs, theme: t as any})}
                        className={`px-6 py-3 rounded-xl border transition-all ${prefs.theme === t ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)} Mode
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Base Currency</label>
                  <select 
                    value={prefs.currency} 
                    onChange={e => setPrefs({...prefs, currency: e.target.value})}
                    className="input-glass w-full"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 uppercase">Date Format</label>
                  <select 
                    value={prefs.dateFormat} 
                    onChange={e => setPrefs({...prefs, dateFormat: e.target.value})}
                    className="input-glass w-full"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-8">
                <button onClick={handleSavePrefs} className="btn-primary">Apply Changes</button>
              </div>
            </div>
          )}

          {/* --- NOTIFICATIONS TAB --- */}
          {activeTab === 'notifications' && prefs && (
            <div className="glass-card p-8 animate-fade-in space-y-8">
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
              
              <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-white">
                    <Moon size={20} className="text-purple-400" /> Quiet Hours
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={prefs.quietHours.enabled} onChange={e => setPrefs({...prefs, quietHours: {...prefs.quietHours, enabled: e.target.checked}})} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                {prefs.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="time" value={prefs.quietHours.start} onChange={e => setPrefs({...prefs, quietHours: {...prefs.quietHours, start: e.target.value}})} className="input-glass w-full pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="time" value={prefs.quietHours.end} onChange={e => setPrefs({...prefs, quietHours: {...prefs.quietHours, end: e.target.value}})} className="input-glass w-full pl-10" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Volume2 className="text-purple-400" size={20} />
                  <span className="font-bold text-white">Sound Effects</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={prefs.soundEnabled} onChange={e => setPrefs({...prefs, soundEnabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Event Notifications</h3>
                {Object.entries(prefs.notifications).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setPrefs({...prefs, notifications: {...prefs.notifications, [key]: e.target.checked}})} />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end pt-4 border-t border-white/5">
                <button onClick={handleSavePrefs} className="btn-primary">Save Settings</button>
              </div>
            </div>
          )}

          {/* --- DATA SOURCES TAB --- */}
          {activeTab === 'data' && prefs && (
            <div className="glass-card p-8 animate-fade-in space-y-8">
              <div className="text-center pb-8 border-b border-white/5">
                <Database size={48} className="mx-auto text-purple-500 mb-4" />
                <h2 className="text-xl font-bold text-white">Data Connection Status</h2>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-bold">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Systems Operational
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Market Data', key: 'refreshRateMarket', val: prefs.dataSource.refreshRateMarket },
                  { label: 'News Feed', key: 'refreshRateNews', val: prefs.dataSource.refreshRateNews },
                  { label: 'Sentiment', key: 'refreshRateSentiment', val: prefs.dataSource.refreshRateSentiment },
                ].map((item) => (
                  <div key={item.key} className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-3">{item.label} Refresh</label>
                    <select 
                      value={item.val} 
                      onChange={e => setPrefs({...prefs, dataSource: {...prefs.dataSource, [item.key]: parseInt(e.target.value)}})}
                      className="input-glass w-full text-sm"
                    >
                      <option value={10}>10 Seconds</option>
                      <option value={30}>30 Seconds</option>
                      <option value={60}>1 Minute</option>
                      <option value={300}>5 Minutes</option>
                      <option value={3600}>1 Hour</option>
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex justify-end"><button onClick={handleSavePrefs} className="btn-primary">Update Intervals</button></div>

              <div className="pt-6">
                <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <Server size={18} className="text-cyan-400" /> Local Database (SQLite)
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-slate-400 text-xs uppercase mb-1">Storage Size</div>
                    <div className="text-2xl font-mono text-white">{(dbStats.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl">
                    <div className="text-slate-400 text-xs uppercase mb-1">Tables</div>
                    <div className="text-2xl font-mono text-white">{dbStats.tables.length}</div>
                  </div>
                </div>

                <div className="bg-black/20 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar border border-white/5">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase border-b border-white/5">
                        <th className="text-left py-2">Table Name</th>
                        <th className="text-right py-2">Records</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbStats.tables.map(t => (
                        <tr key={t.name} className="border-b border-white/5 last:border-0">
                          <td className="py-2 text-slate-300 font-mono">{t.name}</td>
                          <td className="py-2 text-right text-purple-400 font-bold">{t.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-4 justify-end">
                  <button onClick={() => {
                    const data = localStorage.getItem('crypto_platform.db');
                    if (data) {
                      const blob = new Blob([data], {type: "text/plain"});
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = "backup.db";
                      a.click();
                    }
                  }} className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 text-sm transition-colors">
                    <Download size={16} /> Backup
                  </button>
                  <button onClick={() => {
                    if (confirm("Clear all local data? This cannot be undone.")) {
                      databaseService.clearAllData();
                      setDbStats({ size: 0, tables: [] });
                      addToast("Database cleared", "success");
                    }
                  }} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm transition-colors">
                    <Trash2 size={16} /> Clear Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
