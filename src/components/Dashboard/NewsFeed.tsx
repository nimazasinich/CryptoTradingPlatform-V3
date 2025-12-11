
import React from 'react';
import { Newspaper, ExternalLink, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNews } from '../../hooks/useNews';
import { NewsArticle } from '../../types';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CoinIcon } from '../Common/CoinIcon';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const NewsItem = ({ article, index }: { article: NewsArticle; index: number }) => {
  const sentiment = article.sentiment || 'neutral';
  
  const theme = 
    sentiment === 'positive' ? { border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: TrendingUp } :
    sentiment === 'negative' ? { border: 'border-l-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10', icon: TrendingDown } :
    { border: 'border-l-slate-500', text: 'text-slate-400', bg: 'bg-slate-500/10', icon: Minus };
    
  const SentimentIcon = theme.icon;

  const getImageUrl = () => {
    if (article.thumbnail_url && article.thumbnail_url.startsWith('http')) return article.thumbnail_url;
    
    // Placeholder logic based on keywords
    const keywords = ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'finance', 'technology', 'defi', 'nft'];
    const titleLower = article.title.toLowerCase();
    const keyword = keywords.find(k => titleLower.includes(k)) || 'crypto';
    return `https://source.unsplash.com/random/400x300/?${keyword},${index}`;
  };

  const getRelevantCoin = () => {
    const coins = [
        { name: 'bitcoin', symbol: 'BTC' },
        { name: 'ethereum', symbol: 'ETH' },
        { name: 'solana', symbol: 'SOL' },
        { name: 'binance', symbol: 'BNB' },
        { name: 'cardano', symbol: 'ADA' },
        { name: 'ripple', symbol: 'XRP' },
        { name: 'polkadot', symbol: 'DOT' },
        { name: 'doge', symbol: 'DOGE' },
        { name: 'avalanche', symbol: 'AVAX' },
        { name: 'polygon', symbol: 'MATIC' },
        { name: 'terra', symbol: 'LUNA' },
        { name: 'chainlink', symbol: 'LINK' },
        { name: 'uniswap', symbol: 'UNI' },
        { name: 'litecoin', symbol: 'LTC' },
        { name: 'shiba', symbol: 'SHIB' },
        { name: 'tether', symbol: 'USDT' }
    ];
    const titleLower = article.title.toLowerCase();
    return coins.find(c => 
      titleLower.includes(c.name) || 
      new RegExp(`\\b${c.symbol.toLowerCase()}\\b`).test(titleLower)
    );
  };

  const relatedCoin = getRelevantCoin();

  return (
    <a 
      href={article.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={cn(
        "group flex gap-4 p-4 rounded-xl hover:bg-white/[0.04] transition-all duration-300",
        "border border-white/5 hover:border-white/10 hover:shadow-lg hover:shadow-black/20",
        "bg-slate-900/40 backdrop-blur-md mb-3 last:mb-0 relative overflow-hidden"
      )}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5", theme.border)} />

      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden relative shadow-lg bg-slate-800">
        <div className="absolute inset-0 bg-slate-900/10 z-10 group-hover:bg-transparent transition-colors" />
        <img 
          src={getImageUrl()} 
          alt={article.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150/0f172a/334155?text=NEWS';
          }}
        />
        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm p-1 rounded text-[10px] text-white font-bold uppercase">
            {article.source?.slice(0, 2) || 'CW'}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between py-0.5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", theme.bg, theme.text)}>
                  <SentimentIcon size={12} />
                  {sentiment}
                </div>
                {relatedCoin && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-slate-300 font-bold hover:bg-white/10 transition-colors">
                        <CoinIcon symbol={relatedCoin.symbol} size="xs" />
                        {relatedCoin.symbol}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
              <Clock size={10} />
              {new Date(article.published_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          
          <h4 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
            {article.title}
          </h4>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300 transition-colors flex items-center gap-1">
             <Newspaper size={12} />
             {article.source || 'CryptoWire'}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 duration-300">
            Read Article <ExternalLink size={10} />
          </span>
        </div>
      </div>
    </a>
  );
};

const SkeletonNews = () => (
  <div className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 mb-3">
    <div className="w-24 h-24 rounded-lg bg-white/5 animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-3 py-1">
      <div className="flex justify-between">
        <div className="w-16 h-4 rounded bg-white/5 animate-pulse" />
        <div className="w-12 h-3 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-4 rounded bg-white/5 animate-pulse" />
        <div className="w-3/4 h-4 rounded bg-white/5 animate-pulse" />
      </div>
      <div className="pt-2">
        <div className="w-20 h-3 rounded bg-white/5 animate-pulse" />
      </div>
    </div>
  </div>
);

export const NewsFeed = () => {
  const { news, loading } = useNews();

  return (
    <div className="glass-card h-full flex flex-col overflow-hidden bg-gradient-to-b from-slate-900/50 to-slate-950/50 border-white/10">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Newspaper className="w-4 h-4 text-cyan-400" />
          </div>
          Market News
        </h3>
        <button className="text-xs font-medium text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
          View All
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
        {loading ? (
          <>
            <SkeletonNews />
            <SkeletonNews />
            <SkeletonNews />
          </>
        ) : (
          <div className="animate-fade-in">
             {news.map((item, idx) => (
               <NewsItem key={item.id || idx} article={item} index={idx} />
             ))}
             {news.length === 0 && (
               <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                 <Newspaper size={32} className="mb-2 opacity-50" />
                 <span className="text-sm">No recent news</span>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
