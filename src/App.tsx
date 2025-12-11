
import React, { useState, Suspense, lazy, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Menu, Zap } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { databaseService } from './services/database';
import { backgroundTasks } from './services/backgroundTasks';

// Lazy Load Views
const Dashboard = lazy(() => import('./views/Dashboard'));
const MarketAnalysis = lazy(() => import('./views/MarketAnalysis'));
const TradingHub = lazy(() => import('./views/TradingHub'));
const AILab = lazy(() => import('./views/AILab'));
const RiskManagement = lazy(() => import('./views/RiskManagement'));
const Settings = lazy(() => import('./views/Settings'));
const Admin = lazy(() => import('./views/Admin'));

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
  const [currentPath, setCurrentPath] = useState('/');

  // Initialize DB and Background Tasks
  useEffect(() => {
    const init = async () => {
      await databaseService.initDatabase();
      backgroundTasks.start();
    };
    init();
    
    return () => {
      backgroundTasks.stop();
    };
  }, []);

  const renderContent = () => {
    if (currentPath === '/') return <Dashboard />;
    
    if (currentPath.startsWith('/market')) {
      if (currentPath.includes('technical')) return <PagePlaceholder title="Technical Analysis" />;
      return <MarketAnalysis />;
    }
    
    if (currentPath.startsWith('/trade')) {
      if (currentPath.includes('spot')) return <TradingHub />;
      return <PagePlaceholder title="Advanced Trading" />;
    }
    
    if (currentPath.startsWith('/ai')) {
      const parts = currentPath.split('/');
      const tab = parts[2] || 'signals';
      return <AILab defaultTab={tab} />;
    }
    
    if (currentPath === '/risk') return <RiskManagement />;
    
    // Handle Settings sub-routes
    if (currentPath.startsWith('/settings')) {
      const parts = currentPath.split('/');
      const tab = parts[2] || 'profile'; 
      return <Settings defaultTab={tab} />;
    }
    
    if (currentPath === '/profile') return <Settings defaultTab="profile" />;
    
    // Handle Admin sub-routes
    if (currentPath.startsWith('/admin')) {
      return <Admin />;
    }
    
    return <PagePlaceholder title="Not Found" />;
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-purple-500/30">
      <Sidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        currentPath={currentPath}
        onNavigate={setCurrentPath}
      />

      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden transition-all duration-300">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="font-bold text-lg text-gradient">CryptoOne</div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg bg-white/5 text-slate-300"
          >
            <Menu size={24} />
          </button>
        </div>

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
