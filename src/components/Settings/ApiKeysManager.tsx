
import React, { useState, useEffect } from 'react';
import { Key, Trash2, Eye, EyeOff, Copy, Plus, Check, Server } from 'lucide-react';
import { settingsService, ApiKey } from '../../services/settingsService';
import { useApp } from '../../context/AppContext';

interface Props {
  apiKeys: ApiKey[];
  onUpdate: (keys: ApiKey[]) => void;
}

export const ApiKeysManager = ({ apiKeys, onUpdate }: Props) => {
  const { addToast } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [keyForm, setKeyForm] = useState({ name: '', key: '', provider: 'custom' as 'custom' | 'huggingface' });
  const [isSaving, setIsSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<{ [id: string]: boolean }>({});
  const [testingKeys, setTestingKeys] = useState<{ [id: string]: boolean }>({});

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newKey = await settingsService.saveApiKey(keyForm.name, keyForm.key, keyForm.provider);
      onUpdate([...apiKeys, newKey]);
      setKeyForm({ name: '', key: '', provider: 'custom' });
      setShowForm(false);
      addToast("API Key saved successfully", "success");
    } catch (err) {
      addToast("Failed to save API key", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Delete this API key? This action cannot be undone.")) return;
    try {
      await settingsService.deleteApiKey(id);
      onUpdate(apiKeys.filter(k => k.id !== id));
      addToast("API Key deleted", "success");
    } catch (err) {
      addToast("Failed to delete key", "error");
    }
  };

  const handleTestKey = async (key: ApiKey) => {
    setTestingKeys(prev => ({ ...prev, [key.id]: true }));
    try {
      await settingsService.testApiConnection(key.key, key.provider);
      addToast(`${key.name} connection successful!`, "success");
    } catch (err: any) {
      addToast(err.message || "Connection test failed", "error");
    } finally {
      setTestingKeys(prev => ({ ...prev, [key.id]: false }));
    }
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, name: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${name} copied to clipboard`, "info");
  };

  const maskKey = (key: string) => {
    if (key.length < 10) return '***';
    return key.substring(0, 4) + '...' + key.substring(key.length - 4);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">API Keys</h3>
          <p className="text-sm text-slate-400">Manage access keys for third-party integrations.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
        >
          <Plus size={16} /> {showForm ? 'Cancel' : 'Create New Key'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddKey} className="glass-card p-6 border-l-4 border-l-purple-500 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Key Name</label>
              <input
                type="text"
                value={keyForm.name}
                onChange={e => setKeyForm({ ...keyForm, name: e.target.value })}
                placeholder="e.g., Production API"
                className="input-glass w-full"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Provider</label>
              <select
                value={keyForm.provider}
                onChange={e => setKeyForm({ ...keyForm, provider: e.target.value as any })}
                className="input-glass w-full"
              >
                <option value="custom">Custom / Generic</option>
                <option value="huggingface">HuggingFace</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">API Key / Token</label>
            <input
              type="password"
              value={keyForm.key}
              onChange={e => setKeyForm({ ...keyForm, key: e.target.value })}
              placeholder="Enter your API key"
              className="input-glass w-full"
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-white/10 rounded-lg text-slate-300 hover:bg-white/5 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary">
              {isSaving ? 'Saving...' : 'Save API Key'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {apiKeys.map(key => (
          <div key={key.id} className="glass-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                {key.provider === 'huggingface' ? <Server size={20} /> : <Key size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white">{key.name}</div>
                <div className="text-xs text-slate-500">
                  Created: {new Date(key.created).toLocaleDateString()} • {key.provider === 'huggingface' ? 'HuggingFace' : 'Custom'}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <span className="text-cyan-400 font-bold">{key.usageCount}</span> uses
                  </span>
                  {key.lastUsed && (
                    <span className="text-xs text-slate-600">
                      Last used: <span className="text-purple-400">{new Date(key.lastUsed).toLocaleString()}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-lg border border-white/5 flex-1 max-w-md">
              <code className="text-sm font-mono text-slate-300 flex-1">
                {visibleKeys[key.id] ? key.key : maskKey(key.key)}
              </code>
              <button 
                onClick={() => toggleKeyVisibility(key.id)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                {visibleKeys[key.id] ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button 
                onClick={() => copyToClipboard(key.key, key.name)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleTestKey(key)}
                disabled={testingKeys[key.id]}
                className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
              >
                {testingKeys[key.id] ? 'Testing...' : 'Test'}
              </button>
              <button 
                onClick={() => handleDeleteKey(key.id)}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {apiKeys.length === 0 && (
          <div className="glass-card p-8 text-center text-slate-500">
            <Key size={48} className="mx-auto mb-4 opacity-20" />
            <p>No API keys configured</p>
            <p className="text-sm mt-1">Click "Create New Key" to add your first API key</p>
          </div>
        )}
      </div>
    </div>
  );
};
