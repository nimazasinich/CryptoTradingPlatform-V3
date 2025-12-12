
import React, { useState, useEffect } from 'react';
import { 
  User, Key, Bell, Monitor, Database, Send,
  Trash2, Lock, Volume2, Moon, Clock, Server, Download, Upload, CheckCircle, Link as LinkIcon,
  Shield, Mail, Globe, TrendingUp, BarChart3, Activity
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

  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  const loadAllSettings = async () => {
    try {
      setIsLoading(true);
      
      // Initialize database if needed
      await databaseService.initDatabase();
      
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
    } catch (err: any) {
      console.error("Failed to load settings:", err);
      addToast(err.message || "Failed to load settings", "error");
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
    
    // Validation
    if (!profile.name || profile.name.trim().length < 2) {
      addToast("Name must be at least 2 characters", "error");
      return;
    }
    if (!profile.username || profile.username.trim().length < 3) {
      addToast("Username must be at least 3 characters", "error");
      return;
    }
    if (!profile.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      await settingsService.saveProfile(profile);
      addToast("Profile updated successfully", "success");
    } catch (error: any) { 
      addToast(error.message || "Failed to update profile", "error"); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast("Please select an image file", "error");
      return;
    }
    
    try {
      const base64 = await settingsService.uploadAvatar(file);
      setProfile(prev => prev ? ({ ...prev, avatarUrl: base64 }) : null);
      await settingsService.saveProfile({ avatarUrl: base64 });
      addToast("Avatar updated successfully", "success");
    } catch (err: any) { 
      addToast(err.message || "Failed to upload avatar", "error"); 
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.current) {
      addToast("Current password is required", "error");
      return;
    }
    if (!passwordForm.new || passwordForm.new.length < 8) {
      addToast("New password must be at least 8 characters", "error");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      addToast("New passwords do not match", "error");
      return;
    }
    if (passwordForm.new === passwordForm.current) {
      addToast("New password must be different from current password", "error");
      return;
    }
    
    try {
      await settingsService.changePassword(passwordForm.current, passwordForm.new);
      addToast("Password changed successfully", "success");
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err: any) { 
      addToast(err.message || "Failed to change password", "error"); 
    }
  };

  const handleSavePrefs = async () => {
    if (!prefs) return;
    
    // Validate refresh rates
    if (prefs.dataSource.refreshRateMarket < 10) {
      addToast("Market refresh rate must be at least 10 seconds", "error");
      return;
    }
    if (prefs.dataSource.refreshRateNews < 10) {
      addToast("News refresh rate must be at least 10 seconds", "error");
      return;
    }
    if (prefs.dataSource.refreshRateSentiment < 10) {
      addToast("Sentiment refresh rate must be at least 10 seconds", "error");
      return;
    }
    
    // Validate quiet hours if enabled
    if (prefs.quietHours.enabled) {
      if (!prefs.quietHours.start || !prefs.quietHours.end) {
        addToast("Please set both start and end times for quiet hours", "error");
        return;
      }
    }
    
    try {
      await settingsService.savePreferences(prefs);
      setTheme(prefs.theme);
      addToast("Preferences saved successfully", "success");
    } catch (err: any) { 
      addToast(err.message || "Failed to save preferences", "error"); 
    }
  };

  if (isLoading || !profile) return <div className="flex h-screen items-center justify-center"><div className="motion-safe:animate-spin w-8 h-8 border-4 border-purple-500 rounded-full border-t-transparent" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-300">Manage your account, security, and integration preferences.</p>
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
                    : "text-slate-300 hover:text-white hover:bg-white/5"
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
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      {profile.name}
                      {profile.emailVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-semibold text-green-400">
                          <CheckCircle size={12} /> Verified
                        </span>
                      )}
                    </h2>
                    <div className="text-slate-300">@{profile.username}</div>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <Mail size={14} />
                      {profile.email}
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">Full Name</label>
                      <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="input-glass w-full mt-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">Username</label>
                      <input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="input-glass w-full mt-1" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Email</label>
                    <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="input-glass w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase">Bio</label>
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
                    <label className="text-xs font-bold text-slate-300 uppercase">Current Password</label>
                    <input type="password" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} className="input-glass w-full mt-1" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">New Password</label>
                      <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} className="input-glass w-full mt-1" required />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase">Confirm Password</label>
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
                    <p className="text-sm text-slate-300">HuggingFace Inference Token (Optional)</p>
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

              {/* Custom Keys Manager */}
              <ApiKeysManager apiKeys={apiKeys} onUpdate={setApiKeys} />
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
            <div className="space-y-6 animate-fade-in">
              {/* Theme Selection */}
              <div className="glass-card p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Monitor size={20} className="text-purple-400" /> Theme & Appearance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    { value: 'purple', label: 'Purple Dream', gradient: 'from-purple-500 to-pink-500' },
                    { value: 'cyan', label: 'Cyber Blue', gradient: 'from-cyan-500 to-blue-500' },
                    { value: 'green', label: 'Matrix Green', gradient: 'from-green-500 to-emerald-500' }
                  ].map(theme => (
                    <button
                      key={theme.value}
                      onClick={() => setPrefs({...prefs, theme: theme.value as any})}
                      className={cn(
                        "p-6 rounded-xl border-2 transition-all group relative overflow-hidden",
                        prefs.theme === theme.value 
                          ? 'border-white/20 bg-white/5' 
                          : 'border-white/5 hover:border-white/10'
                      )}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${theme.gradient} mb-3 mx-auto`} />
                        <div className="text-white font-bold mb-1">{theme.label}</div>
                        {prefs.theme === theme.value && (
                          <div className="text-xs text-purple-400 font-semibold">✓ Active</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Localization */}
              <div className="glass-card p-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Globe size={18} className="text-cyan-400" /> Localization
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Language</label>
                    <select 
                      value={prefs.language} 
                      onChange={e => setPrefs({...prefs, language: e.target.value})}
                      className="input-glass w-full"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                      <option value="zh">中文</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Base Currency</label>
                    <select 
                      value={prefs.currency} 
                      onChange={e => setPrefs({...prefs, currency: e.target.value})}
                      className="input-glass w-full"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="JPY">JPY (¥)</option>
                      <option value="BTC">BTC (₿)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Date Format</label>
                    <select 
                      value={prefs.dateFormat} 
                      onChange={e => setPrefs({...prefs, dateFormat: e.target.value})}
                      className="input-glass w-full"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Time Format</label>
                    <select 
                      value={prefs.timeFormat} 
                      onChange={e => setPrefs({...prefs, timeFormat: e.target.value as any})}
                      className="input-glass w-full"
                    >
                      <option value="12h">12 Hour (AM/PM)</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Decimal Places</label>
                    <select 
                      value={prefs.decimalPlaces} 
                      onChange={e => setPrefs({...prefs, decimalPlaces: parseInt(e.target.value)})}
                      className="input-glass w-full"
                    >
                      <option value={2}>2 decimals</option>
                      <option value={4}>4 decimals</option>
                      <option value={6}>6 decimals</option>
                      <option value={8}>8 decimals</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chart Preferences */}
              <div className="glass-card p-8">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" /> Chart Preferences
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Default Timeframe</label>
                    <select 
                      value={prefs.chartPreferences.defaultTimeframe} 
                      onChange={e => setPrefs({...prefs, chartPreferences: {...prefs.chartPreferences, defaultTimeframe: e.target.value}})}
                      className="input-glass w-full"
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="1d">1 Day</option>
                      <option value="1w">1 Week</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase">Chart Type</label>
                    <select 
                      value={prefs.chartPreferences.chartType} 
                      onChange={e => setPrefs({...prefs, chartPreferences: {...prefs.chartPreferences, chartType: e.target.value as any}})}
                      className="input-glass w-full"
                    >
                      <option value="candlestick">Candlestick</option>
                      <option value="line">Line</option>
                      <option value="area">Area</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase flex items-center justify-between">
                      Show Volume Bars
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={prefs.chartPreferences.showVolume} 
                          onChange={e => setPrefs({...prefs, chartPreferences: {...prefs.chartPreferences, showVolume: e.target.checked}})} 
                        />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                      </label>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSavePrefs} className="btn-primary">Save All Preferences</button>
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
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">Start Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="time" value={prefs.quietHours.start} onChange={e => setPrefs({...prefs, quietHours: {...prefs.quietHours, start: e.target.value}})} className="input-glass w-full pl-10" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-1">End Time</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input type="time" value={prefs.quietHours.end} onChange={e => setPrefs({...prefs, quietHours: {...prefs.quietHours, end: e.target.value}})} className="input-glass w-full pl-10" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 p-6 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="text-purple-400" size={20} />
                    <span className="font-bold text-white">Sound Effects</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={prefs.soundEnabled} onChange={e => setPrefs({...prefs, soundEnabled: e.target.checked})} />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
                
                {prefs.soundEnabled && (
                  <div className="animate-fade-in">
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-2">Notification Sound</label>
                    <select 
                      value={prefs.notificationSound} 
                      onChange={e => setPrefs({...prefs, notificationSound: e.target.value})}
                      className="input-glass w-full"
                    >
                      <option value="default">Default (Ding)</option>
                      <option value="chime">Chime</option>
                      <option value="bell">Bell</option>
                      <option value="pop">Pop</option>
                      <option value="swoosh">Swoosh</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Event Notifications</h3>
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
            <div className="space-y-6 animate-fade-in">
              {/* HuggingFace Connection */}
              <div className="glass-card p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Server size={20} className="text-purple-400" /> HuggingFace Space
                    </h2>
                    <p className="text-sm text-slate-300 mt-1">Primary data source connection</p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-bold">
                    <div className="w-2 h-2 bg-green-500 rounded-full motion-safe:animate-pulse" />
                    Connected
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-2">Base URL</label>
                    <div className="input-glass w-full bg-white/[0.02] text-slate-300 font-mono text-sm p-3 rounded-lg">
                      {prefs.dataSource.hfBaseUrl}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase block mb-2">API Token (Optional)</label>
                    <div className="text-xs text-slate-500 mb-2">Configure in API Keys tab</div>
                    <div className="input-glass w-full bg-white/[0.02] text-slate-500 font-mono text-sm p-3 rounded-lg">
                      {prefs.dataSource.hfToken ? '••••••••••••••••' : 'Not configured'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Refresh Intervals */}
              <div className="glass-card p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity size={18} className="text-cyan-400" /> Refresh Intervals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Market Data', key: 'refreshRateMarket', val: prefs.dataSource.refreshRateMarket },
                    { label: 'News Feed', key: 'refreshRateNews', val: prefs.dataSource.refreshRateNews },
                    { label: 'Sentiment', key: 'refreshRateSentiment', val: prefs.dataSource.refreshRateSentiment },
                  ].map((item) => (
                    <div key={item.key} className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-3">{item.label}</label>
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
              </div>

              {/* Cache Settings */}
              <div className="glass-card p-8">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Database size={18} className="text-green-400" /> Cache Settings
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                      <div className="font-bold text-white">Enable Response Caching</div>
                      <div className="text-sm text-slate-300 mt-1">Cache API responses to reduce load times</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={prefs.dataSource.cacheEnabled} 
                        onChange={e => setPrefs({...prefs, dataSource: {...prefs.dataSource, cacheEnabled: e.target.checked}})} 
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-purple-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  {prefs.dataSource.cacheEnabled && (
                    <div className="animate-fade-in">
                      <label className="text-xs font-bold text-slate-300 uppercase block mb-2">Cache TTL (Time To Live)</label>
                      <select 
                        value={prefs.dataSource.cacheTTL} 
                        onChange={e => setPrefs({...prefs, dataSource: {...prefs.dataSource, cacheTTL: parseInt(e.target.value)}})}
                        className="input-glass w-full"
                      >
                        <option value={60}>1 Minute</option>
                        <option value={300}>5 Minutes</option>
                        <option value={600}>10 Minutes</option>
                        <option value={1800}>30 Minutes</option>
                        <option value={3600}>1 Hour</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Cached data will be refreshed after this duration</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={handleSavePrefs} className="btn-primary">Save Data Source Settings</button>
              </div>

              <div className="pt-6">
                <h3 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <Database size={18} className="text-cyan-400" /> Local Database (SQLite)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-300 text-xs uppercase mb-1">Storage Size</div>
                    <div className="text-2xl font-mono text-white">{(dbStats.size / 1024).toFixed(2)} KB</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-300 text-xs uppercase mb-1">Total Tables</div>
                    <div className="text-2xl font-mono text-white">{dbStats.tables.length}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-300 text-xs uppercase mb-1">Total Records</div>
                    <div className="text-2xl font-mono text-white">
                      {dbStats.tables.reduce((sum, t) => sum + t.count, 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="text-slate-300 text-xs uppercase mb-1">Last Saved</div>
                    <div className="text-sm font-mono text-white">
                      {dbStats.lastSaved ? new Date(dbStats.lastSaved).toLocaleTimeString() : 'N/A'}
                    </div>
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

                <div className="flex flex-wrap gap-3 justify-end">
                  {/* Export Database */}
                  <button 
                    onClick={() => {
                      try {
                        const blob = databaseService.exportDatabase();
                        if (!blob) {
                          addToast("No database to export", "warning");
                          return;
                        }
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `crypto_backup_${new Date().toISOString().split('T')[0]}.db`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        addToast("Database exported successfully", "success");
                      } catch (err) {
                        addToast("Failed to export database", "error");
                      }
                    }} 
                    className="flex items-center gap-2 px-4 py-2 border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 text-sm transition-colors"
                  >
                    <Download size={16} /> Export
                  </button>

                  {/* Import Database */}
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.db';
                      input.onchange = async (e: any) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        try {
                          await databaseService.importDatabase(file);
                          const newStats = databaseService.getStats();
                          setDbStats(newStats);
                          addToast("Database imported successfully", "success");
                        } catch (err) {
                          addToast("Failed to import database", "error");
                        }
                      };
                      input.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 text-sm transition-colors"
                  >
                    <Upload size={16} /> Import
                  </button>

                  {/* Vacuum Database */}
                  <button 
                    onClick={async () => {
                      try {
                        addToast("Optimizing database...", "info");
                        await databaseService.initDatabase();
                        databaseService.vacuum();
                        const newStats = databaseService.getStats();
                        setDbStats(newStats);
                        addToast("Database optimized successfully", "success");
                      } catch (err) {
                        addToast("Failed to optimize database", "error");
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-purple-500/20 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 text-sm transition-colors"
                  >
                    <Activity size={16} /> Optimize
                  </button>

                  {/* Clear All Data */}
                  <button 
                    onClick={async () => {
                      if (!confirm("⚠️ WARNING: This will permanently delete ALL local data including:\n\n• Trading positions\n• Trade history\n• Cached market data\n• Price alerts\n• AI signals\n• Strategies\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?")) {
                        return;
                      }
                      
                      // Double confirmation
                      if (!confirm("⚠️ FINAL WARNING: Type 'DELETE' in the next prompt to confirm")) {
                        return;
                      }
                      
                      const userInput = prompt("Type 'DELETE' to confirm:");
                      if (userInput !== 'DELETE') {
                        addToast("Database clear cancelled", "info");
                        return;
                      }
                      
                      try {
                        await databaseService.initDatabase();
                        databaseService.clearAllData();
                        setDbStats({ size: 0, tables: [] });
                        addToast("Database cleared successfully", "success");
                      } catch (err) {
                        addToast("Failed to clear database", "error");
                      }
                    }} 
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm transition-colors"
                  >
                    <Trash2 size={16} /> Clear All
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
