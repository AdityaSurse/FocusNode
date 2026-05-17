import React, { useEffect, useState } from 'react';
import { api } from './lib/api';
import { Timer } from './components/Timer';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Insights } from './components/Insights';
import { SyncSetup } from './components/SyncSetup';
import { History, Timer as TimerIcon, LogOut, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PomodoroSession } from './types';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<{ id: string; syncKey: string } | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [targetSessions, setTargetSessions] = useState(() => parseInt(localStorage.getItem('target_sessions') || '8'));
  const [activeTab, setActiveTab] = useState<'timer' | 'dashboard' | 'sync'>('timer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('pomo_token');
      if (token) {
        try {
          // We don't have a getProfile endpoint, but we can verify by trying to fetch sessions
          const data = await api.getSessions();
          setSessions(data);
          setUser({ id: 'current', syncKey: localStorage.getItem('pomo_sync_key') || 'NODE-ID-HIDDEN' }); 
        } catch (e) {
          api.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch (e) {
      console.error('Fetch sessions error:', e);
    }
  };

  const onAuthSuccess = (userData: { id: string; syncKey: string }) => {
    setUser(userData);
    fetchSessions();
  };

  const handleSignOut = () => {
    api.logout();
    setUser(null);
  };

  const handleSync = async (key: string) => {
    try {
      const userData = await api.sync(key);
      setUser(userData);
      fetchSessions();
      setActiveTab('timer');
    } catch (e) {
      console.error('Sync error:', e);
      alert('Node synchronization failed. Verify identity key.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-12 h-12 rounded-full border-2 border-brand"
      />
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mb-16 text-center relative z-10 transition-all">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            <span>Neural Focus Node</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[120px] font-black text-white tracking-tighter leading-none italic select-none"
          >
            FOCUS<span className="text-brand underline decoration-8 underline-offset-[16px]">NODE</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/20 max-w-sm mx-auto leading-relaxed mt-12 font-medium tracking-wide uppercase text-[10px]"
          >
            Minimalist logic for human productivity. <br />
            Synchronized across all active nodes.
          </motion.p>
        </div>
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
        >
          <Auth onSuccess={onAuthSuccess} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-deep text-[#e0e0e0] flex flex-col overflow-hidden select-none">
      <div className="noise" />
      <div className="bg-mesh">
        <div className="mesh-item w-[600px] h-[600px] bg-brand/20 -top-48 -left-48" />
        <div className="mesh-item w-[500px] h-[500px] bg-zinc-800/30 bottom-0 right-0" style={{ animationDelay: '-5s' }} />
        <div className="mesh-item w-[400px] h-[400px] bg-brand/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '-10s' }} />
      </div>

      <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-black/20 backdrop-blur-3xl fixed top-0 w-full z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand shadow-[0_0_25px_rgba(239,68,68,0.4)] flex items-center justify-center">
              <TimerIcon size={20} className="text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white italic">FOCUS<span className="text-brand underline decoration-2 underline-offset-4">NODE</span></span>
          </div>

          <nav className="hidden lg:flex items-center gap-2">
            {[
              { id: 'timer', label: 'Timer', icon: TimerIcon },
              { id: 'dashboard', label: 'Progress', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === tab.id 
                    ? "bg-white/10 text-white border border-white/20" 
                    : "text-white/30 hover:text-white"
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('sync')}
            className={cn(
              "hidden md:flex items-center gap-3 px-4 py-2 rounded-full border transition-all group",
              user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN'
                ? "bg-green-500/5 border-green-500/20 text-green-400"
                : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN' ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-white/20"
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN' ? 'Node Synced' : 'Offline Node'}
            </span>
            <Smartphone size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button 
            onClick={handleSignOut}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/40 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 pt-32 pb-24 px-8 max-w-7xl mx-auto w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'timer' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-12"
            >
              <Timer onSessionComplete={fetchSessions} sessions={sessions} targetSessions={targetSessions} />
              <div className="max-w-2xl mx-auto w-full">
                <Insights sessions={sessions} />
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Dashboard 
                sessions={sessions} 
                loading={false} 
                targetSessions={targetSessions} 
                setTargetSessions={setTargetSessions} 
              />
            </motion.div>
          )}

          {activeTab === 'sync' && (
            <motion.div
              key="sync"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SyncSetup 
                syncKey={user?.syncKey ?? 'NODE-ID-HIDDEN'} 
                onDataCleared={() => {
                  setSessions([]);
                  fetchSessions();
                }}
                onSync={handleSync}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-black/60 backdrop-blur-2xl border-t border-white/5 py-6 px-10 flex justify-around items-center z-50">
        {[
          { id: 'timer', icon: TimerIcon },
          { id: 'dashboard', icon: History },
          { id: 'sync', icon: Smartphone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "p-3 rounded-2xl transition-all relative overflow-hidden",
              activeTab === tab.id ? "text-brand" : "text-white/20"
            )}
          >
            <tab.icon size={26} />
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute inset-0 bg-brand/10 rounded-2xl -z-10" 
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
