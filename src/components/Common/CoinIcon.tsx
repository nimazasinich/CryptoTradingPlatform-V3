
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface CoinIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
  '2xl': 'w-16 h-16'
};

const iconSizeMap = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 28,
  '2xl': 36
};

// SVG Paths for major coins
const COIN_SVGS: Record<string, React.ReactNode> = {
  BTC: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M23.19 15.36c1.24-.83 1.96-2.28 1.6-4.32-.56-3.23-3.08-4.22-6.52-4.43l1.2-4.81-2.92-.73-1.17 4.69c-.77-.19-1.57-.37-2.36-.55l1.18-4.72-2.92-.73-1.2 4.82c-.63-.15-1.28-.29-1.91-.43l.02-.07-4.04-1.01-.78 3.12s2.17.5 2.13.53c1.19.3.1.58.1.58l-1.02 4.09c.06.02.14.04.22.1.1.06.1.06-.06.1l-1.43 5.73c-.09-.03 1.25.32 1.25.32.7.17 1.34.33 1.95.49l-1.22 4.91 2.92.73 1.21-4.85c.8.22 1.58.42 2.35.61l-1.2 4.83 2.92.73 1.22-4.88c5.49 1.04 9.17.61 10.83-4.14.73-2.07.03-3.28-1.54-4.07zm-4.32 6.02c-1.63 6.53-7.64 3-9.8 2.47l1.75-7c2.16.54 8.23 1.62 8.05 4.53zm.57-6.22c-1.49 5.96-7.07 2.92-9.05 2.43l1.59-6.38c1.98.49 7.63 1.4 7.46 3.95z" /></svg>,
  ETH: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M15.92 2l-.08.27v21.68l.08.08 10.05-5.94L15.92 2zm0 24.3l-.08.1v5.6l.08.22 10.06-14.16-10.06 8.24zm-.56-24.03L5.3 18.01l9.96 5.94.09-.08V2.27l-.09-.16v.16zm0 29.85v-5.6l-.05-.05L5.3 18.25l10.06 14.17v-.12z" /><path d="M15.92 16.92v6.86l10.05-5.94-10.05-9.1v8.18zM5.3 18.01l10.06 5.77v-6.86L5.3 8.91l-.1.1v9z" fillOpacity="0.6"/></svg>,
  USDT: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M18.84 21.36v7.35h-5.8v-7.35c-5.7-.35-9.58-1.74-9.58-3.36 0-.3.13-.59.38-.87l.25 1.5c.98 2.11 5.34 3.33 8.95 3.33 3.65 0 8.04-1.24 8.97-3.37l.21-1.46c.26.28.4.57.4.87 0 1.62-3.88 3.01-9.58 3.36zm6.8-6.1c-1.37 1.83-5.22 2.87-9.64 2.87-4.42 0-8.28-1.04-9.64-2.87-.1-.13-.17-.27-.22-.4l-.06-.55-.17-1.43v-.05a5.53 5.53 0 0 1-.03-.55c0-2.3 4.51-4.17 10.08-4.17h.08c5.56 0 10.08 1.87 10.08 4.17 0 .19-.01.37-.03.55l-.23 1.98c-.05.14-.12.28-.22.41zm-6.8-6.1h5.8V3.29h-5.8v5.87z" /></svg>,
  SOL: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M4.7 9.56l2.35-2.37A1.56 1.56 0 0 1 8.16 2.7h18.27a.89.89 0 0 1 .63 1.52l-2.35 2.37a1.56 1.56 0 0 1-1.11.48H5.33a.89.89 0 0 1-.63-1.52zm22.42 12.58l-2.35 2.37a1.56 1.56 0 0 1-1.11.49H5.39a.89.89 0 0 1-.63-1.52l2.35-2.37a1.56 1.56 0 0 1 1.11-.48h18.27a.89.89 0 0 1 .63 1.52zm0-6.29l-2.35 2.37a1.56 1.56 0 0 1-1.11.49H5.39a.89.89 0 0 1-.63-1.52l2.35-2.37a1.56 1.56 0 0 1 1.11-.49h18.27a.89.89 0 0 1 .63 1.52z" /></svg>,
  BNB: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M10.66 12.92l5.34 5.34 5.33-5.34 3-3-8.33-8.33L7.66 9.92l3 3zM21.33 19l-5.33-5.33L10.66 19l-3 3 8.34 8.33 8.33-8.33-3-3zm-5.33-2.67l-3 3-3-3 3-3 3 3zM23.92 16l3.33-3.33L23.92 9.33 20.59 12.66 23.92 16zM8.08 16l-3.33 3.33L8.08 22.67l3.33-3.33L8.08 16z" /></svg>,
  ADA: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 32C7.16 32 0 24.84 0 16S7.16 0 16 0s16 7.16 16 16-7.16 16-16 16zm0-25.26a2.63 2.63 0 1 0 0 5.26 2.63 2.63 0 0 0 0-5.26zm0 13.48a2.63 2.63 0 1 0 0 5.26 2.63 2.63 0 0 0 0-5.26zm8.95-6.74a2.63 2.63 0 1 0 0 5.26 2.63 2.63 0 0 0 0-5.26zM7.05 13.48a2.63 2.63 0 1 0 0 5.26 2.63 2.63 0 0 0 0-5.26zm14.86 7.42a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm-3.52 3.16a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm-7.6 0a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm-3.52-3.16a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm14.64-9.84a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zM4.11 11.06a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm2.94-3.52a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68zm17.9 0a1.84 1.84 0 1 0 0 3.68 1.84 1.84 0 0 0 0-3.68z" /></svg>,
  MATIC: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M23.9 8.8l-4.9-2.9-4.9 2.9v5.7l4.9 2.9 4.9-2.9V8.8zM16 21.6l-4.9-2.9V13l-4.9 2.9v5.7l4.9 2.9 4.9-2.9v-2.9l-4.9 2.9zm-4.9-8.7l4.9-2.9V4.3L11.1 1.4 6.2 4.3v5.7l4.9 2.9zm14.7 0l-4.9-2.9V4.3l4.9-2.9 4.9 2.9v5.7l-4.9 2.9zM16 30.6l-4.9-2.9v-5.7l4.9 2.9 4.9-2.9v5.7l-4.9 2.9z"/></svg>,
  AVAX: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M30.7 22.8c-1 1.8-3 2.9-5.1 2.9H6.4c-2.1 0-4.1-1.1-5.1-2.9-1-1.8-1-4 0-5.8L10.7 2c1-1.8 3-2.9 5.1-2.9s4.1 1.1 5.1 2.9l9.8 15c1.1 1.8 1.1 4 0 5.8zM15.9 5.4L8.3 19.8h15.2L15.9 5.4z"/></svg>,
  XRP: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M26.4 16l-8.4-8.4 2.8-2.8L32 16l-11.2 11.2-2.8-2.8L26.4 16zM5.6 16L14 7.6l-2.8-2.8L0 16l11.2 11.2L14 24.4 5.6 16z"/></svg>,
  DOT: <svg viewBox="0 0 32 32" fill="currentColor"><circle cx="16" cy="16" r="14" fillOpacity="0.2"/><path d="M8 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm14-10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-6-10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm11 15a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0-10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm-11 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0-10a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/></svg>,
  DOGE: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M14 8h-4v16h5c5 0 9-4 9-8s-4-8-9-8zm0 12h-1v-8h2c3 0 5 2 5 4s-2 4-5 4z"/></svg>,
  LINK: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 2l12 7v14l-12 7-12-7V9l12-7zm0 2.4L6 10.2v11.6l10 5.8 10-5.8V10.2L16 4.4z"/></svg>,
  UNI: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M4 6l24 4v16l-24 4V6zm2 3v13.2l20-3.3V9.8L6 9z"/></svg>,
  LUNC: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M15.5 2C16.3 2 17 2.7 17 3.5V8.2C22.6 9.3 26.8 14.1 27 19.8L28.9 28.1C29.1 28.9 28.4 29.6 27.6 29.4L18.4 27.2C13.4 26 9.2 22.5 7 18L15.5 2Z"/></svg>,
  LUNA: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 2.5C16.8 2.5 17.5 3.2 17.5 4V16.5C17.5 17.3 16.8 18 16 18C15.2 18 14.5 17.3 14.5 16.5V4C14.5 3.2 15.2 2.5 16 2.5ZM6.5 28C6.5 22.2 10.3 17.2 15.5 15.2V19.5C11.6 21.2 9 24.5 8.2 28.5L6.5 28ZM25.5 28L23.8 28.5C23 24.5 20.4 21.2 16.5 19.5V15.2C21.7 17.2 25.5 22.2 25.5 28Z"/></svg>,
  NIGHT: <svg viewBox="0 0 32 32" fill="currentColor"><path d="M12 2C12 2 13.5 6 18 8C22.5 10 26 10 26 10C26 10 23 12 22 16C21 20 22 24 22 24C22 24 18 22 14 22C10 22 6 24 6 24C6 24 7.5 19 6 15C4.5 11 2 10 2 10C2 10 8 9 12 2Z"/></svg>
};

export const CoinIcon = ({ symbol, size = 'md', className }: CoinIconProps) => {
  const cleanSymbol = (symbol || '?').toUpperCase().split('/')[0];
  const SvgIcon = COIN_SVGS[cleanSymbol];

  // Map other common coins to generic SVGs if specific ones missing
  const GenericIcon = (
    <div className="flex items-center justify-center font-bold font-mono tracking-tighter">
      {cleanSymbol.slice(0, 3)}
    </div>
  );

  const isBTC = cleanSymbol === 'BTC';
  const isETH = cleanSymbol === 'ETH';
  const isUSDT = ['USDT', 'USDC', 'USD'].includes(cleanSymbol);
  const isSOL = cleanSymbol === 'SOL';
  const isBNB = cleanSymbol === 'BNB';
  const isADA = cleanSymbol === 'ADA';
  const isMATIC = cleanSymbol === 'MATIC';
  const isAVAX = cleanSymbol === 'AVAX';
  const isLUNA = ['LUNA', 'LUNC'].includes(cleanSymbol);
  const isXRP = cleanSymbol === 'XRP';
  const isDOT = cleanSymbol === 'DOT';
  const isDOGE = cleanSymbol === 'DOGE';
  
  const bgColorClass = 
    isBTC ? "bg-[#F7931A]" :
    isETH ? "bg-[#627EEA]" :
    isUSDT ? "bg-[#26A17B]" :
    isSOL ? "bg-gradient-to-br from-[#9945FF] to-[#14F195]" :
    isBNB ? "bg-[#F3BA2F]" :
    isADA ? "bg-[#0033AD]" :
    isMATIC ? "bg-[#8247E5]" :
    isAVAX ? "bg-[#E84142]" :
    isLUNA ? "bg-[#FFD83D] text-black" :
    isXRP ? "bg-white text-black" :
    isDOT ? "bg-[#E6007A]" :
    isDOGE ? "bg-[#C2A633]" :
    "bg-gradient-to-br from-purple-500 to-blue-600";

  return (
    <div 
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shadow-lg relative overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
        sizeMap[size],
        bgColorClass,
        className
      )}
    >
      {SvgIcon ? (
        <div className={cn("w-full h-full p-[18%] opacity-95 group-hover:opacity-100 transition-opacity")}>
          {SvgIcon}
        </div>
      ) : (
        <>
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 blur-[1px]" />
          <span className={cn("relative z-10 drop-shadow-md", `text-[${iconSizeMap[size]}px]`)}>
            {cleanSymbol.slice(0, 3)}
          </span>
        </>
      )}
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
