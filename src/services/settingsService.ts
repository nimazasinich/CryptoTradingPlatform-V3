
import { HttpClient } from './httpClient';

const STORAGE_KEY = 'crypto_settings_v1';

// Mock Encryption (In a real app, this would use a backend or proper encryption lib)
const encrypt = (text: string) => `enc_${btoa(text)}`;
const decrypt = (text: string) => text.startsWith('enc_') ? atob(text.slice(4)) : text;

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  bio: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  passwordHash?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: 'huggingface' | 'openai' | 'custom';
  permissions: string[];
  created: number;
  lastUsed?: number;
  usageCount: number;
}

export interface ExchangeConnection {
  id: string;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  permissions: ('read' | 'trade' | 'withdraw')[];
  status: 'connected' | 'disconnected' | 'error';
  lastChecked: number;
}

export interface TelegramConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifications: {
    signals: boolean;
    alerts: boolean;
    dailyDigest: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
  minConfidence: number;
}

export interface UserPreferences {
  theme: 'purple' | 'cyan' | 'green';
  currency: string;
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  decimalPlaces: number;
  chartPreferences: {
    defaultTimeframe: string;
    chartType: 'candlestick' | 'line' | 'area';
    showVolume: boolean;
  };
  notifications: {
    email: boolean;
    push: boolean;
    telegram: boolean;
    priceAlerts: boolean;
    tradeExecutions: boolean;
    signalGeneration: boolean;
    newsUpdates: boolean;
    portfolioUpdates: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  soundEnabled: boolean;
  notificationSound: string;
  dataSource: {
    refreshRateMarket: number;
    refreshRateNews: number;
    refreshRateSentiment: number;
    cacheEnabled: boolean;
    cacheTTL: number;
    hfToken?: string;
    hfBaseUrl: string;
  };
}

const DEFAULT_SETTINGS = {
  profile: {
    name: 'Admin User',
    username: 'cryptotrader',
    email: 'admin@crypto.one',
    emailVerified: true,
    bio: 'Professional crypto trader and analyst.',
    twoFactorEnabled: false,
    // Default hash for 'password'
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
  },
  apiKeys: [],
  exchanges: [],
  telegram: {
    enabled: false,
    botToken: '',
    chatId: '',
    notifications: { signals: true, alerts: true, dailyDigest: false },
    frequency: 'immediate',
    minConfidence: 75
  },
  preferences: {
    theme: 'purple',
    currency: 'USD',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    decimalPlaces: 2,
    chartPreferences: {
      defaultTimeframe: '1h',
      chartType: 'candlestick',
      showVolume: true
    },
    notifications: { 
      email: true, 
      push: true, 
      telegram: false,
      priceAlerts: true, 
      tradeExecutions: true,
      signalGeneration: true,
      newsUpdates: true,
      portfolioUpdates: true
    },
    quietHours: { enabled: false, start: '22:00', end: '07:00' },
    soundEnabled: true,
    notificationSound: 'default',
    dataSource: { 
      refreshRateMarket: 30, 
      refreshRateNews: 300, 
      refreshRateSentiment: 3600,
      cacheEnabled: true,
      cacheTTL: 300,
      hfToken: '',
      hfBaseUrl: 'https://really-amin-datasourceforcryptocurrency-2.hf.space'
    }
  }
};

class SettingsService {
  private state: any;

  constructor() {
    this.load();
  }

  private load() {
    const stored = localStorage.getItem(STORAGE_KEY);
    this.state = stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  // --- Security Helpers ---
  public async hashPassword(password: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Profile ---
  public async getProfile(): Promise<UserProfile> {
    return { ...this.state.profile };
  }

  public async saveProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await new Promise(r => setTimeout(r, 500)); // Sim latency
    this.state.profile = { ...this.state.profile, ...data };
    this.save();
    return this.state.profile;
  }

  public async uploadAvatar(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error("File too large (max 2MB)"));
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  public async changePassword(current: string, newPass: string): Promise<boolean> {
    const currentHash = await this.hashPassword(current);
    if (currentHash !== this.state.profile.passwordHash) {
      throw new Error("Incorrect current password");
    }
    const newHash = await this.hashPassword(newPass);
    this.state.profile.passwordHash = newHash;
    this.save();
    return true;
  }

  // --- API Keys ---
  public async getApiKeys(): Promise<ApiKey[]> {
    return [...this.state.apiKeys];
  }

  public async saveApiKey(name: string, key: string, provider: 'custom' | 'huggingface' = 'custom'): Promise<ApiKey> {
    await new Promise(r => setTimeout(r, 600));
    const newKey: ApiKey = {
      id: Math.random().toString(36).substring(7),
      name,
      key: encrypt(key),
      provider,
      permissions: ['read'],
      created: Date.now(),
      usageCount: 0
    };
    this.state.apiKeys.push(newKey);
    this.save();
    return newKey;
  }

  public async updateApiKeyUsage(id: string) {
    const key = this.state.apiKeys.find((k: ApiKey) => k.id === id);
    if (key) {
      key.lastUsed = Date.now();
      key.usageCount = (key.usageCount || 0) + 1;
      this.save();
    }
  }

  public async deleteApiKey(id: string) {
    this.state.apiKeys = this.state.apiKeys.filter((k: ApiKey) => k.id !== id);
    this.save();
  }

  public async testApiConnection(key: string, provider: string): Promise<boolean> {
    await new Promise(r => setTimeout(r, 1500));
    
    // Format validation
    if (!key || key.length < 10) {
      throw new Error("Invalid API Key format");
    }

    // Provider-specific validation
    if (provider === 'huggingface') {
      if (!key.startsWith('hf_')) {
        throw new Error("HuggingFace tokens must start with 'hf_'");
      }
      // Simulate API call to validate token
      try {
        const response = await fetch('https://huggingface.co/api/whoami', {
          headers: { 'Authorization': `Bearer ${key}` }
        });
        if (!response.ok) {
          throw new Error("Invalid HuggingFace token");
        }
        return true;
      } catch (err) {
        // If network error or invalid, throw error
        throw new Error("Failed to validate HuggingFace token. Check your internet connection.");
      }
    }

    // For custom keys, just validate format
    return true;
  }

  // --- Exchanges ---
  public async getExchanges(): Promise<ExchangeConnection[]> {
    return [...this.state.exchanges];
  }

  public async connectExchange(exchange: string, apiKey: string, apiSecret: string, passphrase?: string, permissions: ('read' | 'trade' | 'withdraw')[] = ['read', 'trade']): Promise<ExchangeConnection> {
    await new Promise(r => setTimeout(r, 1200));
    
    // Validate credentials
    if (!apiKey || apiKey.length < 10) {
      throw new Error("API Key must be at least 10 characters");
    }
    if (!apiSecret || apiSecret.length < 10) {
      throw new Error("API Secret must be at least 10 characters");
    }

    // Exchange-specific validation
    const exchangeLower = exchange.toLowerCase();
    if (exchangeLower === 'binance') {
      if (apiKey.length !== 64) {
        throw new Error("Binance API keys are typically 64 characters");
      }
    } else if (exchangeLower === 'coinbase') {
      if (!apiKey.includes('-')) {
        throw new Error("Coinbase API keys typically contain hyphens");
      }
    }

    // Simulate testing connection to exchange
    // In production, this would make a real API call to test credentials
    const isValid = await this.testExchangeConnection(exchange, apiKey, apiSecret);
    if (!isValid) {
      throw new Error(`Failed to connect to ${exchange}. Check your credentials.`);
    }

    const conn: ExchangeConnection = {
      id: exchangeLower,
      exchange,
      apiKey: encrypt(apiKey),
      apiSecret: encrypt(apiSecret),
      passphrase: passphrase ? encrypt(passphrase) : undefined,
      permissions,
      status: 'connected',
      lastChecked: Date.now()
    };

    // Update or add
    const idx = this.state.exchanges.findIndex((e: ExchangeConnection) => e.id === conn.id);
    if (idx >= 0) this.state.exchanges[idx] = conn;
    else this.state.exchanges.push(conn);
    
    this.save();
    return conn;
  }

  private async testExchangeConnection(exchange: string, apiKey: string, apiSecret: string): Promise<boolean> {
    // Simulate network latency
    await new Promise(r => setTimeout(r, 800));
    
    // In production, make real API calls to exchange endpoints
    // For now, simulate success if credentials meet basic format requirements
    return true;
  }

  public async disconnectExchange(id: string) {
    this.state.exchanges = this.state.exchanges.filter((e: ExchangeConnection) => e.id !== id);
    this.save();
  }

  // --- Telegram ---
  public async getTelegramConfig(): Promise<TelegramConfig> {
    return { ...DEFAULT_SETTINGS.telegram, ...this.state.telegram };
  }

  public async saveTelegramConfig(config: Partial<TelegramConfig>) {
    if (config.botToken && !config.botToken.startsWith('enc_')) {
      config.botToken = encrypt(config.botToken);
    }
    this.state.telegram = { ...this.state.telegram, ...config };
    this.save();
  }

  public async sendTestMessage(chatId: string, token: string): Promise<boolean> {
    // Validate inputs
    if (!token || token.length < 20) {
      throw new Error("Invalid Bot Token format");
    }
    if (!chatId) {
      throw new Error("Chat ID is required");
    }
    if (!chatId.startsWith('@') && !/^-?\d+$/.test(chatId)) {
      throw new Error("Invalid Chat ID format. Use @username or numeric ID");
    }

    // Attempt to send test message via Telegram Bot API
    try {
      const decryptedToken = token.startsWith('enc_') ? decrypt(token) : token;
      const message = `🤖 Test message from Crypto Trading Platform\n\n✅ Your Telegram bot is configured correctly!\n\nTimestamp: ${new Date().toLocaleString()}`;
      
      const response = await fetch(`https://api.telegram.org/bot${decryptedToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.description || "Failed to send message");
      }
      
      return true;
    } catch (err: any) {
      if (err.message.includes('chat not found')) {
        throw new Error("Chat ID not found. Make sure you've started a conversation with the bot first.");
      } else if (err.message.includes('Unauthorized')) {
        throw new Error("Invalid bot token. Get a new token from @BotFather");
      } else if (err.message.includes('Failed to fetch')) {
        throw new Error("Network error. Check your internet connection.");
      }
      throw new Error(err.message || "Failed to send test message");
    }
  }

  // --- Preferences ---
  public getPreferences(): UserPreferences {
    return { 
      ...DEFAULT_SETTINGS.preferences, 
      ...this.state.preferences,
      quietHours: { ...DEFAULT_SETTINGS.preferences.quietHours, ...(this.state.preferences?.quietHours || {}) },
      dataSource: { ...DEFAULT_SETTINGS.preferences.dataSource, ...(this.state.preferences?.dataSource || {}) }
    };
  }

  public async savePreferences(prefs: Partial<UserPreferences>) {
    this.state.preferences = { ...this.state.preferences, ...prefs };
    this.save();
  }
}

export const settingsService = new SettingsService();
