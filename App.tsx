
import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './src/components/Sidebar/Sidebar';
import { Menu, Zap } from 'lucide-react';
import { AppProvider } from './src/context/AppContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Lazy Load Views for Performance Optimization (Phase 14)
const Dashboard = lazy(() => import('./src/views/Dashboard'));
const MarketAnalysis = lazy(() => import('./src/views/MarketAnalysis'));
const TradingHub = lazy(() => import('./src/views/TradingHub'));
const AILab = lazy(() => import('./src/views/AILab'));
const RiskManagement = lazy(() => import('./src/views/RiskManagement'));
const Settings = lazy(() => import('./src/views/Settings'));
const Admin = lazy(() => import('./src/views/Admin'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="h-full flex flex-col items-center justify-center">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
      <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin"></div>
      <div className="absolute inset-4 rounded-full bg-purple-500/20 blur-sm animate-pulse"></div>
    </div>
    <div className="mt-4 text-slate-400 font-medium animate-pulse">Loading Workspace...</div>
  </div>
);

const PagePlaceholder = ({ title }: { title: string }) => (
  <div className="glass-card p-8 animate-fade-in max-w-4xl mx-auto mt-10 text-center">
    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
      <Zap className="text-purple-400" size={32} />
    </div>
    <h1 className="text-3xl font-bold mb-4 text-gradient">{title}</h1>
    <p className="text-slate-400">This module is scheduled for implementation in upcoming phases.</p>
  </div>
);

function AppContent() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);

  // Handle navigation and update browser URL
  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState({ path }, '', path);
  };

  // Listen for browser back/forward navigation
  React.useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderContent = () => {
    // Extract base path and query params
    const [basePath] = currentPath.split('?');
    const params = new URLSearchParams(currentPath.split('?')[1] || '');
    const tab = params.get('tab');

    // Dashboard
    if (basePath === '/') return <Dashboard />;
    
    // Market Analysis - all tabs handled within component
    if (basePath === '/market-analysis') return <MarketAnalysis />;
    
    // Trading Hub - all tabs handled within component
    if (basePath === '/trading-hub') return <TradingHub />;
    
    // AI Lab - all tabs handled within component
    if (basePath === '/ai-lab') return <AILab />;
    
    // Risk Management
    if (basePath === '/risk') return <RiskManagement />;
    
    // Settings - pass tab as prop
    if (basePath === '/settings') {
      const defaultTab = tab || 'profile';
      return <Settings defaultTab={defaultTab} />;
    }
    
    // Admin - all tabs handled within component
    if (basePath === '/admin') return <Admin />;
    
    return <PagePlaceholder title="Not Found" />;
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentPath={currentPath}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="font-bold text-lg text-gradient">CryptoOne</div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-slate-300"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar">
          <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1]">
             <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
             <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[100px]" />
          </div>

          <Suspense fallback={<PageLoader />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
