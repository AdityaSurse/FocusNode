import React, { useEffect, useState } from 'react';
import { api } from './lib/api';
import { Timer } from './components/Timer';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Insights } from './components/Insights';
import { SyncSetup } from './components/SyncSetup';
import { History, Timer as TimerIcon, LogOut, Smartphone } from 'lucide-react';
import { ThemeToggle } from './components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { PomodoroSession } from './types';
import { cn } from './lib/utils';

import { MatrixBackground } from './components/MatrixBackground';

export default function App() {
  const [user, setUser] = useState<{ id: string; syncKey: string } | null>(null);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [targetSessions, setTargetSessions] = useState(() => parseInt(localStorage.getItem('target_sessions') || '8'));
  const [activeTab, setActiveTab] = useState<'timer' | 'dashboard' | 'sync'>('timer');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('pomo_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('pomo_theme', theme);
  }, [theme]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('pomo_token');
      if (token) {
        try {
          const data = await api.getSessions();
          setSessions(data);
          setUser({ id: 'current', syncKey: localStorage.getItem('pomo_sync_key') || 'NODE-ID-HIDDEN' }); 
        } catch (e) {
          // If token expired, try to auto-sync a new guest session
          try {
            const userData = await api.sync(undefined, true);
            setUser(userData);
          } catch (syncErr) {
            console.error('Auto-sync retry failed:', syncErr);
          }
        }
      } else {
        // No token, auto-create a session
        try {
          const userData = await api.sync(undefined, true);
          setUser(userData);
        } catch (e) {
          console.error('Initial auto-sync failed:', e);
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
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
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="w-16 h-16 rounded-full border border-brand/30 shadow-[0_0_40px_rgba(59,130,246,0.2)]"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-deep text-ink flex flex-col font-sans relative overflow-hidden">
      <MatrixBackground />
      <div className="bg-mesh">
        <div className="mesh-item w-[800px] h-[800px] bg-brand/5 -top-40 -left-40" />
        <div className="mesh-item w-[600px] h-[600px] bg-blue-500/5 bottom-0 right-0 animate-pulse-slow" />
      </div>
      <div className="noise" />

      <header className="h-20 border-b border-border-subtle flex items-center justify-between backdrop-blur-xl bg-bg-deep/50 sticky top-0 z-50 px-8">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab('timer')}>
          <div className="w-10 h-10 liquid-glass rounded-xl flex items-center justify-center text-brand transition-transform group-hover:scale-110">
            <TimerIcon size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter text-ink uppercase font-display">Focus<span className="text-brand">.</span>Node</span>
        </div>

        <nav className="hidden md:flex items-center border border-border-subtle bg-surface p-1 rounded-xl">
          {[
            { id: 'timer', label: 'Timer' },
            { id: 'dashboard', label: 'Stats' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-8 py-2 rounded-lg text-[10px] font-bold tracking-[0.3em] uppercase transition-all",
                activeTab === tab.id 
                  ? "bg-white/10 text-white shadow-xl" 
                  : "text-ink/20 hover:text-ink/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('sync')}
            className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all",
              user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN'
                ? "bg-brand/10 border-brand/30 text-brand"
                : "bg-surface border-border-subtle text-ink/20"
            )}
          >
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
              user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN' ? "bg-brand animate-pulse" : "bg-ink/10"
            )} />
            {user?.syncKey && user.syncKey !== 'NODE-ID-HIDDEN' ? 'Cloud Sync On' : 'Offline Mode'}
          </button>

          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

          <button 
            onClick={handleSignOut}
            className="w-10 h-10 border border-border-subtle rounded-xl flex items-center justify-center hover:bg-surface transition-all text-ink/30 hover:text-ink"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12 pb-24">
        {(!user && !loading) && (
          <div className="mb-12">
            <Auth onSuccess={onAuthSuccess} />
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeTab === 'timer' && (
            <motion.div
              key="timer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <Timer 
                onSessionComplete={fetchSessions} 
                sessions={sessions} 
                targetSessions={targetSessions} 
                onTargetUpdate={(val) => {
                  setTargetSessions(val);
                  localStorage.setItem('target_sessions', val.toString());
                }}
              />
              <Insights sessions={sessions} />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-md mx-auto"
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

      <nav className="fixed bottom-0 left-0 right-0 md:hidden backdrop-blur-2xl bg-bg-deep/80 border-t border-border-subtle h-20 flex justify-around items-center z-50 px-4">
        {[
          { id: 'timer', label: 'TIMER', icon: TimerIcon },
          { id: 'dashboard', label: 'STATS', icon: History },
          { id: 'sync', label: 'SYNC', icon: Smartphone },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 h-full flex flex-col items-center justify-center gap-2 transition-all",
              activeTab === tab.id ? "text-brand" : "text-ink/20"
            )}
          >
            <div className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === tab.id ? "bg-brand/10" : ""
            )}>
              <tab.icon size={20} />
            </div>
            <span className="text-[8px] font-bold tracking-widest uppercase">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
