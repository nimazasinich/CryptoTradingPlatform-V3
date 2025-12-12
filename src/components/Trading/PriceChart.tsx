
import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, RefreshCw, Layers, BarChart2 } from 'lucide-react';
import { marketService } from '../../services/marketService';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const TIMEFRAMES = ['15m', '1h', '4h', '1d', '1w'];

export const PriceChart = ({ symbol }: { symbol: string }) => {
  const [data, setData] = useState<CandleData[]>([]);
  const [timeframe, setTimeframe] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<CandleData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to generate mock data for fallback
  const generateMockData = (sym: string, tf: string): CandleData[] => {
    const mockData: CandleData[] = [];
    const now = Date.now();
    let price = sym === 'BTC' ? 65000 : sym === 'ETH' ? 3500 : sym === 'SOL' ? 145 : 10;
    
    // Time interval mapping
    const intervalMs = 
      tf === '15m' ? 900000 : 
      tf === '1h' ? 3600000 : 
      tf === '4h' ? 14400000 : 
      tf === '1d' ? 86400000 : 604800000;

    for (let i = 0; i < 80; i++) {
      const time = new Date(now - (80 - i) * intervalMs).toISOString();
      const volatility = 0.02; 
      const change = price * (Math.random() - 0.5) * volatility;
      const close = price + change;
      const open = price;
      const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
      const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
      const volume = Math.random() * 5000 + 1000;
      
      mockData.push({ time, open, high, low, close, volume });
      price = close;
    }
    return mockData;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const rawData = await marketService.getHistory(symbol, timeframe, 100);
      
      let parsedData: CandleData[] = [];
      if (Array.isArray(rawData)) {
        parsedData = rawData.map((d: any) => ({
          time: d.time || d.t || new Date().toISOString(),
          open: Number(d.open || d.o),
          high: Number(d.high || d.h),
          low: Number(d.low || d.l),
          close: Number(d.close || d.c),
          volume: Number(d.volume || d.v)
        }));
      }

      if (parsedData.length === 0) {
        throw new Error("No data returned");
      }
      
      setData(parsedData);
    } catch (error) {
      console.warn("Chart data fetch failed, using simulation:", error);
      setData(generateMockData(symbol, timeframe));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbol, timeframe]);

  // Chart Rendering Logic
  const padding = { top: 20, right: 60, bottom: 30, left: 0 };
  const width = containerRef.current?.clientWidth || 800;
  const height = 400;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minPrice = Math.min(...data.map(d => d.low)) * 0.995;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.005;
  const priceRange = maxPrice - minPrice || 1;
  const maxVol = Math.max(...data.map(d => d.volume)) || 1;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getY = (price: number) => padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;

  const candleWidth = Math.max(3, (chartWidth / data.length) * 0.7);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const index = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    if (index >= 0 && index < data.length) {
      setHoveredCandle(data[index]);
    } else {
      setHoveredCandle(null);
    }
  };

  const currentPrice = data[data.length - 1]?.close || 0;
  const openPrice = data[data.length - 1]?.open || 0;
  const isPositive = currentPrice >= openPrice;

  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-white/5 gap-4 bg-slate-900/30">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-3">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <BarChart2 className="text-purple-400" size={20} />
               {symbol}/USDT
             </h2>
             <span className={cn("text-xl font-mono font-bold tracking-tight", 
                isPositive ? "text-green-400" : "text-red-400"
             )}>
                ${(currentPrice || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
             </span>
          </div>
          <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium transition-all",
                  timeframe === tf ? "bg-purple-600 text-white shadow-md shadow-purple-900/20" : "text-slate-300 hover:text-white"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 text-slate-300">
           <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white"><RefreshCw size={18} /></button>
           <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white"><Layers size={18} /></button>
           <button className="p-2 hover:bg-white/10 rounded-lg transition-colors hover:text-white"><Maximize2 size={18} /></button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div 
        className="flex-1 relative min-h-[400px] cursor-crosshair bg-[#0b0e16]" 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredCandle(null); setMousePos({x: -1, y: -1}); }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full motion-safe:animate-spin" />
          </div>
        ) : (
          <>
            <div 
              className="absolute z-10 pointer-events-none bg-slate-900/90 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-md shadow-xl flex gap-6 text-xs font-mono transition-opacity duration-100"
              style={{ 
                top: 10,
                left: 10,
                opacity: hoveredCandle ? 1 : 0
              }}
            >
              {hoveredCandle && (
                <>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">Open</span>
                    <span className="text-white font-bold">{hoveredCandle.open.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">High</span>
                    <span className="text-white font-bold">{hoveredCandle.high.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">Low</span>
                    <span className="text-white font-bold">{hoveredCandle.low.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[10px]">Close</span>
                    <span className={hoveredCandle.close >= hoveredCandle.open ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                      {hoveredCandle.close.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-white/10 pl-4">
                    <span className="text-slate-500 text-[10px]">Volume</span>
                    <span className="text-cyan-400 font-bold">{hoveredCandle.volume.toFixed(0)}</span>
                  </div>
                </>
              )}
            </div>

            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
              <defs>
                <linearGradient id="volGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="volGradientRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {[0, 0.2, 0.4, 0.6, 0.8, 1].map(pct => (
                <line 
                  key={pct}
                  x1={padding.left} 
                  y1={padding.top + chartHeight * pct} 
                  x2={width - padding.right} 
                  y2={padding.top + chartHeight * pct} 
                  stroke="rgba(255,255,255,0.03)" 
                />
              ))}
              
              {data.map((d, i) => {
                const x = getX(i);
                const yOpen = getY(d.open);
                const yClose = getY(d.close);
                const yHigh = getY(d.high);
                const yLow = getY(d.low);
                const isGreen = d.close >= d.open;
                const candleColor = isGreen ? '#4ade80' : '#f87171';
                const candleHeight = Math.max(1, Math.abs(yClose - yOpen));
                const volHeight = (d.volume / maxVol) * (chartHeight * 0.2);

                return (
                  <g key={i}>
                    <rect
                      x={x - candleWidth/2}
                      y={height - padding.bottom - volHeight}
                      width={candleWidth}
                      height={volHeight}
                      fill={isGreen ? "url(#volGradientGreen)" : "url(#volGradientRed)"}
                    />
                    <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={candleColor} strokeWidth="1" opacity={0.9} />
                    <rect
                      x={x - candleWidth/2}
                      y={Math.min(yOpen, yClose)}
                      width={candleWidth}
                      height={candleHeight}
                      fill={candleColor}
                      rx={1}
                    />
                  </g>
                );
              })}

              {hoveredCandle && mousePos.x > 0 && (
                <g>
                  <line 
                    x1={mousePos.x} y1={padding.top} 
                    x2={mousePos.x} y2={height - padding.bottom} 
                    stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" 
                  />
                  <line 
                    x1={padding.left} y1={mousePos.y} 
                    x2={width - padding.right} y2={mousePos.y} 
                    stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" 
                  />
                  
                  <rect 
                    x={width - padding.right} 
                    y={mousePos.y - 10} 
                    width={60} height={20} 
                    fill="#475569" 
                    rx={4}
                  />
                  <text 
                    x={width - padding.right + 5} 
                    y={mousePos.y + 4} 
                    fill="white" 
                    fontSize="11" 
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {((maxPrice - ((mousePos.y - padding.top) / chartHeight) * priceRange)).toFixed(2)}
                  </text>

                  <rect 
                    x={mousePos.x - 30} 
                    y={height - padding.bottom} 
                    width={60} height={20} 
                    fill="#475569" 
                    rx={4}
                  />
                  <text 
                    x={mousePos.x} 
                    y={height - padding.bottom + 14} 
                    fill="white" 
                    fontSize="10" 
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {new Date(hoveredCandle.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </text>
                  <circle cx={mousePos.x} cy={mousePos.y} r="3" fill="white" />
                </g>
              )}

              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const price = maxPrice - (priceRange * pct);
                return (
                  <text 
                    key={pct}
                    x={width - 50} 
                    y={padding.top + chartHeight * pct + 4} 
                    fill="#64748b" 
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {price.toFixed(2)}
                  </text>
                );
              })}
            </svg>
          </>
        )}
      </div>
    </div>
  );
};
