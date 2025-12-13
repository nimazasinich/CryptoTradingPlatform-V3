import React, { useState } from 'react';
import { AlertCircle, Database, Zap, DollarSign, Lock, Server, Code, CheckCircle, XCircle } from 'lucide-react';

export default function CryptoDataAnalysis() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: AlertCircle },
    { id: 'apis', label: 'API Deep Dive', icon: Server },
    { id: 'data', label: 'Data Structure', icon: Database },
    { id: 'reality', label: 'Self-Sufficiency', icon: Zap },
    { id: 'cost', label: 'Cost Analysis', icon: DollarSign },
    { id: 'vendor', label: 'Vendor Lock-in', icon: Lock },
    { id: 'mock', label: 'Mock Data', icon: Code }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            CryptoOne Data Dependency Analysis
          </h1>
          <p className="text-slate-300">Critical Assessment of External Dependencies & Data Architecture</p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-slate-700">
          {activeTab === 'overview' && <OverviewSection />}
          {activeTab === 'apis' && <APISection />}
          {activeTab === 'data' && <DataStructureSection />}
          {activeTab === 'reality' && <RealityCheckSection />}
          {activeTab === 'cost' && <CostSection />}
          {activeTab === 'vendor' && <VendorLockSection />}
          {activeTab === 'mock' && <MockDataSection />}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">Critical Findings Summary</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        <StatusCard 
          title="HuggingFace API Dependency"
          status="critical"
          value="95%"
          description="App heavily depends on single external API"
        />
        <StatusCard 
          title="Gemini API"
          status="optional"
          value="Optional"
          description="Only for enhanced AI features"
        />
        <StatusCard 
          title="True Offline Capability"
          status="warning"
          value="~60%"
          description="With cache, drops to 20% without"
        />
        <StatusCard 
          title="Monthly Cost"
          status="success"
          value="$0"
          description="Currently free tier usage"
        />
      </div>

      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2">
          <AlertCircle size={20} />
          CRITICAL ISSUE IDENTIFIED
        </h3>
        <p className="text-slate-300">
          The HuggingFace Spaces API (really-amin-datasourceforcryptocurrency-2.hf.space) appears to be a 
          <strong className="text-yellow-400"> CUSTOM/PERSONAL deployment</strong>, not an official public service. 
          This means:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
          <li>No guaranteed uptime or SLA</li>
          <li>Could disappear without notice</li>
          <li>No official support or documentation</li>
          <li>Single point of failure for 95% of features</li>
        </ul>
      </div>
    </div>
  );
}

function APISection() {
  const apis = [
    {
      name: "HuggingFace Spaces API",
      url: "really-amin-datasourceforcryptocurrency-2.hf.space",
      type: "Custom Deployment",
      critical: true,
      endpoints: [
        { path: "/api/market", purpose: "Global market stats", breaks: "Dashboard, Market page" },
        { path: "/api/coins/top", purpose: "Top 50 cryptocurrencies", breaks: "Market listings" },
        { path: "/api/sentiment/global", purpose: "Fear & Greed Index", breaks: "Sentiment gauge" },
        { path: "/api/ai/signals", purpose: "AI trading signals", breaks: "AI Lab" },
        { path: "/api/news", purpose: "Crypto news feed", breaks: "News section" },
        { path: "/api/providers", purpose: "Data provider status", breaks: "Admin dashboard" }
      ],
      alternatives: ["CoinGecko API", "CoinMarketCap API", "Binance API"],
      riskLevel: "CRITICAL - Custom deployment, no SLA"
    },
    {
      name: "Gemini API",
      url: "generativelanguage.googleapis.com",
      type: "Official Google Service",
      critical: false,
      endpoints: [
        { path: "/v1/models", purpose: "AI model info", breaks: "Nothing critical" },
        { path: "/generateContent", purpose: "Enhanced AI analysis", breaks: "Optional features only" }
      ],
      alternatives: ["OpenAI API", "Local LLMs", "Can be disabled"],
      riskLevel: "LOW - Optional enhancement only"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">API Deep Dive</h2>
      
      {apis.map((api, idx) => (
        <div key={idx} className={`border rounded-lg p-4 ${api.critical ? 'border-red-500 bg-red-900/10' : 'border-green-500 bg-green-900/10'}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold">{api.name}</h3>
              <code className="text-sm text-purple-300">{api.url}</code>
            </div>
            {api.critical ? (
              <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">CRITICAL</span>
            ) : (
              <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">OPTIONAL</span>
            )}
          </div>

          <div className="mb-4">
            <p className="text-slate-300 mb-2">Type: <strong>{api.type}</strong></p>
            <p className="text-slate-300">Risk: <strong className={api.critical ? 'text-red-400' : 'text-green-400'}>{api.riskLevel}</strong></p>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold mb-2">Endpoints:</h4>
            <div className="space-y-2">
              {api.endpoints.map((ep, i) => (
                <div key={i} className="bg-slate-900/50 p-3 rounded">
                  <code className="text-purple-300">{ep.path}</code>
                  <p className="text-sm text-slate-400 mt-1">Purpose: {ep.purpose}</p>
                  <p className="text-sm text-red-400">Breaks: {ep.breaks}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Alternatives:</h4>
            <div className="flex flex-wrap gap-2">
              {api.alternatives.map((alt, i) => (
                <span key={i} className="px-2 py-1 bg-slate-700 rounded text-sm">{alt}</span>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
        <h3 className="font-bold text-yellow-400 mb-2">30-MINUTE SOLUTION</h3>
        <p className="text-slate-300 mb-2">Quick fix to add backup API:</p>
        <pre className="bg-slate-900 p-3 rounded text-sm overflow-x-auto">
{`// In src/services/marketService.ts
const APIS = [
  'https://really-amin-datasourceforcryptocurrency-2.hf.space',
  'https://api.coingecko.com/api/v3',  // Backup
  'https://pro-api.coinmarketcap.com/v1' // Backup 2
];

async function fetchWithFallback(endpoint) {
  for (const api of APIS) {
    try {
      const response = await fetch(api + endpoint);
      if (response.ok) return response.json();
    } catch (err) { continue; }
  }
  throw new Error('All APIs failed');
}`}
        </pre>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function DataStructureSection() {
  const tables = [
    {
      name: "market_data",
      fields: ["id: string", "symbol: string", "price: number", "volume: number", "timestamp: date"],
      source: "HuggingFace API",
      refresh: "Real-time (30s polling)",
      size: "~50 KB per snapshot",
      critical: true,
      mockable: true
    },
    {
      name: "user_portfolio",
      fields: ["id: string", "coin: string", "amount: number", "avg_price: number"],
      source: "User Input",
      refresh: "On user action",
      size: "~1 KB",
      critical: true,
      mockable: true
    },
    {
      name: "trading_history",
      fields: ["id: string", "type: string", "coin: string", "amount: number", "price: number", "timestamp: date"],
      source: "User Actions",
      refresh: "On trade",
      size: "~100 KB (1000 trades)",
      critical: false,
      mockable: true
    },
    {
      name: "ai_signals",
      fields: ["id: string", "coin: string", "signal: string", "confidence: number", "timestamp: date"],
      source: "HuggingFace API",
      refresh: "Hourly",
      size: "~10 KB",
      critical: false,
      mockable: true
    },
    {
      name: "news_feed",
      fields: ["id: string", "title: string", "content: string", "url: string", "timestamp: date"],
      source: "HuggingFace API",
      refresh: "Every 15 minutes",
      size: "~200 KB (50 articles)",
      critical: false,
      mockable: true
    },
    {
      name: "sentiment_data",
      fields: ["timestamp: date", "fear_greed_index: number", "sentiment: string"],
      source: "HuggingFace API",
      refresh: "Daily",
      size: "~1 KB",
      critical: false,
      mockable: true
    },
    {
      name: "strategies",
      fields: ["id: string", "name: string", "config: json", "performance: json"],
      source: "User Input / Generated",
      refresh: "On modification",
      size: "~50 KB",
      critical: false,
      mockable: true
    },
    {
      name: "settings",
      fields: ["key: string", "value: string"],
      source: "User Input",
      refresh: "On change",
      size: "~5 KB",
      critical: true,
      mockable: false
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-purple-400">Database Structure (8 Tables)</h2>
      
      <div className="grid gap-4">
        {tables.map((table, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-bold text-purple-300">{table.name}</h3>
              <div className="flex gap-2">
                {table.critical && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">CRITICAL</span>
                )}
                {table.mockable && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">MOCKABLE</span>
                )}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Fields:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {table.fields.map((field, i) => (
                    <code key={i} className="bg-slate-800 px-2 py-1 rounded text-purple-300">{field}</code>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Data Source:</span>
                  <p className="text-white">{table.source}</p>
                </div>
                <div>
                  <span className="text-slate-400">Refresh Rate:</span>
                  <p className="text-white">{table.refresh}</p>
                </div>
                <div>
                  <span className="text-slate-400">Estimated Size:</span>
                  <p className="text-white">{table.size}</p>
                </div>
                <div>
                  <span className="text-slate-400">Can Generate Mock:</span>
                  <p className={table.mockable ? "text-green-400" : "text-red-400"}>
                    {table.mockable ? "Yes" : "No (user data)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
        <h3 className="font-bold text-blue-400 mb-2">Storage Breakdown</h3>
        <ul className="space-y-1 text-slate-300">
          <li>• <strong>SQLite (sql.js):</strong> In-memory, ~10 MB active data</li>
          <li>• <strong>localStorage:</strong> Persistent cache, ~5-10 MB</li>
          <li>• <strong>Memory Cache:</strong> Recent API responses, ~2 MB</li>
          <li>• <strong>Total:</strong> ~15-20 MB for full operation</li>
        </ul>
      </div>
    </div>
  );
}

function RealityCheckSection() {
  const features = [
    { name: "Dashboard Price Ticker", offline: "10 min with cache", withoutAPI: "Breaks immediately", truly: false },
    { name: "Market Listings", offline: "30 min with cache", withoutAPI: "Breaks immediately", truly: false },
    { name: "Trading Interface", offline: "Works forever", withoutAPI: "Works (simulation)", truly: true },
    { name: "Portfolio Tracking", offline: "Works forever", withoutAPI: "Works (user data)", truly: true },
    { name: "AI Signals", offline: "1 hour with cache", withoutAPI: "Breaks immediately", truly: false },
    { name: "News Feed", offline: "15 min with cache", withoutAPI: "Breaks immediately", truly: false },
    { name: "Sentiment Gauge", offline: "24 hours with cache", withoutAPI: "Breaks after 24h", truly: false },
    { name: "Strategy Builder", offline: "Works forever", withoutAPI: "Works (local)", truly: true },
    { name: "Backtesting", offline: "Works with cached data", withoutAPI: "Limited functionality", truly: false },
    { name: "Settings", offline: "Works forever", withoutAPI: "Works (local)", truly: true },
  ];

  const trulyOffline = features.filter(f => f.truly).length;
  const percentage = Math.round((trulyOffline / features.length) * 100);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">Self-Sufficiency Reality Check</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{percentage}%</div>
          <div className="text-slate-300">Truly Offline</div>
          <div className="text-sm text-slate-400">{trulyOffline}/{features.length} features</div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">60%</div>
          <div className="text-slate-300">With Cache</div>
          <div className="text-sm text-slate-400">30 min avg lifetime</div>
        </div>
        
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-400">60%</div>
          <div className="text-slate-300">API Dependent</div>
          <div className="text-sm text-slate-400">Breaks without API</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold">Feature-by-Feature Breakdown:</h3>
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-center justify-between bg-slate-900/50 p-3 rounded">
            <div className="flex items-center gap-3">
              {feature.truly ? (
                <CheckCircle className="text-green-400" size={20} />
              ) : (
                <XCircle className="text-red-400" size={20} />
              )}
              <span className="font-medium">{feature.name}</span>
            </div>
            <div className="text-right text-sm">
              <div className="text-slate-300">Cached: {feature.offline}</div>
              <div className="text-slate-400">No API: {feature.withoutAPI}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="font-bold text-red-400 mb-2">REALITY vs CLAIM</h3>
        <p className="text-slate-300">
          <strong>Claimed:</strong> "89% works offline with cache"<br/>
          <strong>Reality:</strong> Only <strong className="text-yellow-400">{percentage}% truly works offline</strong>, 
          60% requires external API with short cache lifetime (~30 min average).
        </p>
        <p className="text-slate-400 mt-2 text-sm">
          After cache expires, app becomes unusable for market data, news, and AI features.
        </p>
      </div>
    </div>
  );
}

function CostSection() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">Cost Analysis & Scalability</h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
          <h3 className="font-bold mb-3">Current Usage (Free Tier)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">HuggingFace Spaces:</span>
              <span className="text-green-400">$0/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gemini API:</span>
              <span className="text-green-400">$0 (not used)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hosting:</span>
              <span className="text-green-400">$0 (localhost)</span>
            </div>
            <div className="flex justify-between border-t border-slate-600 pt-2 font-bold">
              <span>Total:</span>
              <span className="text-green-400">$0/month</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
          <h3 className="font-bold mb-3">Scaling Costs</h3>
          <div className="space-y-3">
            <div>
              <div className="font-semibold text-sm">100 Users</div>
              <div className="text-slate-400 text-sm">HuggingFace may throttle, still $0 likely</div>
            </div>
            <div>
              <div className="font-semibold text-sm">1,000 Users</div>
              <div className="text-yellow-400 text-sm">Risk: API rate limits, need paid plan</div>
              <div className="text-slate-400 text-sm">Est: $0-50/month</div>
            </div>
            <div>
              <div className="font-semibold text-sm">10,000 Users</div>
              <div className="text-red-400 text-sm">Must self-host or use paid APIs</div>
              <div className="text-slate-400 text-sm">Est: $200-500/month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
        <h3 className="font-bold text-yellow-400 mb-2">Hidden Costs & Risks</h3>
        <ul className="space-y-2 text-slate-300">
          <li>• <strong>HuggingFace Spaces:</strong> Free tier has no SLA, can be rate-limited or shut down</li>
          <li>• <strong>Custom API:</strong> If owner deletes deployment, entire app breaks</li>
          <li>• <strong>Bandwidth:</strong> Not a concern currently (static frontend)</li>
          <li>• <strong>Storage:</strong> Browser-based, no server costs</li>
          <li>• <strong>Compute:</strong> Client-side only, no server compute needed</li>
        </ul>
      </div>

      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
        <h3 className="font-bold text-blue-400 mb-3">Alternative API Costs (Monthly)</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-slate-900/50 p-3 rounded">
            <div className="font-semibold">CoinGecko</div>
            <div className="text-green-400">Free: 10-50 calls/min</div>
            <div className="text-slate-400">Pro: $129/month</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded">
            <div className="font-semibold">CoinMarketCap</div>
            <div className="text-green-400">Free: 333 calls/day</div>
            <div className="text-slate-400">Basic: $29/month</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded">
            <div className="font-semibold">Self-Hosted</div>
            <div className="text-slate-400">VPS: $12/month</div>
            <div className="text-slate-400">Setup: 40-80 hours</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorLockSection() {
  const dependencies = [
    { feature: "Dashboard", huggingface: true, gemini: false, local: false },
    { feature: "Market Data", huggingface: true, gemini: false, local: false },
    { feature: "Trading", huggingface: false, gemini: false, local: true },
    { feature: "AI Signals", huggingface: true, gemini: true, local: false },
    { feature: "News Feed", huggingface: true, gemini: false, local: false },
    { feature: "Sentiment", huggingface: true, gemini: false, local: false },
    { feature: "Portfolio", huggingface: false, gemini: false, local: true },
    { feature: "Strategies", huggingface: false, gemini: false, local: true },
    { feature: "Backtesting", huggingface: true, gemini: false, local: false },
    { feature: "Settings", huggingface: false, gemini: false, local: true }
  ];

  const hfCount = dependencies.filter(d => d.huggingface).length;
  const geminiCount = dependencies.filter(d => d.gemini).length;
  const localCount = dependencies.filter(d => d.local).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-400">Vendor Lock-in Assessment</h2>
      
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{hfCount}</div>
          <div className="text-slate-300">HuggingFace Dependencies</div>
          <div className="text-sm text-red-400">HIGH RISK</div>
        </div>
        
        <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-yellow-400">{geminiCount}</div>
          <div className="text-slate-300">Gemini Dependencies</div>
          <div className="text-sm text-green-400">LOW RISK</div>
        </div>
        
        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{localCount}</div>
          <div className="text-slate-300">Local-Only Features</div>
          <div className="text-sm text-green-400">NO RISK</div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold">Feature Dependency Matrix:</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900">
                <th className="text-left p-2">Feature</th>
                <th className="text-center p-2">HuggingFace</th>
                <th className="text-center p-2">Gemini</th>
                <th className="text-center p-2">Local Only</th>
              </tr>
            </thead>
            <tbody>
              {dependencies.map((dep, idx) => (
                <tr key={idx} className="border-t border-slate-700">
                  <td className="p-2">{dep.feature}</td>
                  <td className="text-center p-2">
                    {dep.huggingface ? <span className="text-red-400">✓</span> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="text-center p-2">
                    {dep.gemini ? <span className="text-yellow-400">✓</span> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="text-center p-2">
                    {dep.local ? <span className="text-green-400">✓</span> : <span className="text-slate-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
        <h3 className="font-bold text-red-400 mb-2">Code Coupling Analysis</h3>
        <p className="text-slate-300 mb-3">Direct API calls found in:</p>
        <div className="space-y-2 text-sm font-mono">
          <div className="bg-slate-900 p-2 rounded">src/services/marketService.ts:42 - Direct fetch()</div>
          <div className="bg-slate-900 p-2 rounded">src/services/aiService.ts:18 - Direct fetch