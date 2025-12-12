
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  CandlestickChart, 
  Bot, 
  ShieldAlert, 
  Settings, 
  User, 
  Bell, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown,
  Activity,
  Menu,
  X,
  Zap,
  Wallet,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  subItems?: { id: string; label: string; path: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { 
    id: 'market', 
    label: 'Market Analysis', 
    icon: LineChart,
    subItems: [
      { id: 'market-overview', label: 'Overview', path: '/market/overview' },
      { id: 'market-trending', label: 'Trending', path: '/market/trending' },
      { id: 'market-technical', label: 'Technical Analysis', path: '/market/technical' },
    ]
  },
  { 
    id: 'trading', 
    label: 'Trading Hub', 
    icon: CandlestickChart,
    path: '/trade/spot'
  },
  { 
    id: 'ai', 
    label: 'AI Lab', 
    icon: Bot,
    subItems: [
      { id: 'ai-signals', label: 'Trading Signals', path: '/ai/signals' },
      { id: 'ai-scanner', label: 'Market Scanner', path: '/ai/scanner' },
      { id: 'ai-backtest', label: 'Backtesting', path: '/ai/backtest' },
      { id: 'ai-strategy', label: 'Strategy Builder', path: '/ai/strategy' },
    ]
  },
  { id: 'risk', label: 'Risk Management', icon: ShieldAlert, path: '/risk' },
  { id: 'strategy', label: 'Strategy Manager', icon: Target, path: '/strategy' },
  { 
    id: 'settings', 
    label: 'Settings', 
    icon: Settings, 
    path: '/settings',
    subItems: [
      { id: 'settings-profile', label: 'Profile', path: '/settings/profile' },
      { id: 'settings-api', label: 'API Keys', path: '/settings/api' },
      { id: 'settings-exchanges', label: 'Exchanges', path: '/settings/exchanges' },
      { id: 'settings-telegram', label: 'Telegram Bot', path: '/settings/telegram' },
      { id: 'settings-personalization', label: 'Personalization', path: '/settings/personalization' },
      { id: 'settings-notifications', label: 'Notifications', path: '/settings/notifications' },
      { id: 'settings-data', label: 'Data Sources', path: '/settings/data' },
    ]
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    icon: ShieldCheck,
    subItems: [
      { id: 'admin-health', label: 'System Health', path: '/admin/health' },
      { id: 'admin-monitoring', label: 'Monitoring', path: '/admin/monitoring' },
      { id: 'admin-logs', label: 'System Logs', path: '/admin/logs' },
    ]
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar({ isMobileOpen, setIsMobileOpen, currentPath, onNavigate }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['settings']);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showPing, setShowPing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const toggleSubmenu = (menuId: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId) 
        : [...prev, menuId]
    );
  };

  const handleNavigate = (path: string) => {
    onNavigate(path);
    if (window.innerWidth < 768) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ 
          width: isCollapsed ? 80 : 280,
          x: isMobileOpen ? 0 : (window.innerWidth < 768 ? -280 : 0)
        }}
        transition={{ duration: 0.3, type: 'spring', stiffness: 100, damping: 20 }}
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 flex flex-col h-screen",
          "bg-slate-950 border-r border-white/5",
          "text-slate-300 shadow-2xl shadow-black/50",
          "motion-reduce:transition-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 h-20 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-[32px] min-h-[32px] rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-bold text-lg text-white whitespace-nowrap tracking-tight"
              >
                CryptoOne
              </motion.span>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
          
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-3 space-y-1.5 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = currentPath === item.path || item.subItems?.some(sub => sub.path === currentPath);
            const isExpanded = expandedMenus.includes(item.id);

            return (
              <div key={item.id} className="group">
                {/* Main Item */}
                <button
                  onClick={() => item.subItems ? toggleSubmenu(item.id) : handleNavigate(item.path!)}
                  className={cn(
                    "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 relative",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                    isActive ? "bg-white/5 text-white" : "text-slate-300 hover:text-white hover:bg-white/5",
                    isCollapsed ? "justify-center" : "justify-between"
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-full" />}
                  
                  <div className="flex items-center gap-4">
                    <item.icon 
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-purple-400" : "text-slate-300 group-hover:text-white"
                      )} 
                    />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </div>
                  
                  {!isCollapsed && item.subItems && (
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 text-slate-500 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} 
                    />
                  )}
                </button>

                {/* Submenu */}
                <AnimatePresence>
                  {!isCollapsed && isExpanded && item.subItems && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-12 pr-2 py-1 space-y-1">
                        {item.subItems.map((sub) => {
                          const isSubActive = currentPath === sub.path;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => handleNavigate(sub.path)}
                              className={cn(
                                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors block border-l border-white/5",
                                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                                isSubActive ? "border-purple-500 text-purple-200 bg-purple-500/10" : "text-slate-300 hover:text-white hover:bg-white/5 hover:border-white/20"
                              )}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 space-y-4 bg-black/20">
           {!isCollapsed ? (
             <button 
               onClick={() => setIsWalletConnected(!isWalletConnected)}
               className={cn(
                 "w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",
                 "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                 isWalletConnected 
                   ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-green-900/20" 
                   : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-purple-900/40"
               )}
             >
               <Wallet size={16} />
               {isWalletConnected ? '0x84...9A2' : 'Connect Wallet'}
             </button>
           ) : (
             <button 
               onClick={() => setIsWalletConnected(!isWalletConnected)}
               className="w-full flex justify-center p-2 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-950"
             >
                <Wallet size={20} />
             </button>
           )}

           <div className={cn(
             "flex items-center",
             isCollapsed ? "justify-center" : "justify-between"
           )}>
             {!isCollapsed && (
               <div className="flex items-center gap-3">
                 <div className="relative flex h-2.5 w-2.5">
                   {showPing && (
                     <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   )}
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs font-semibold text-white">System Operational</span>
                 </div>
               </div>
             )}
             <div className="p-2 rounded-lg bg-white/5 text-slate-300">
               <Activity size={16} />
             </div>
           </div>
        </div>
      </motion.aside>
    </>
  );
}
