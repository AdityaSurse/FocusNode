import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Coffee, Brain, FastForward, Settings2, X, Plus, Minus } from 'lucide-react';
import { formatDuration, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { SessionType, PomodoroSession } from '../types';
import { startOfDay } from 'date-fns';
import { playSound } from '../lib/sounds';

interface TimerProps {
  onSessionComplete?: () => void;
  sessions?: PomodoroSession[];
  targetSessions: number;
  onTargetUpdate?: (val: number) => void;
}

export function Timer({ onSessionComplete, sessions = [], targetSessions, onTargetUpdate }: TimerProps) {
  const [settings, setSettings] = useState({
    work: 25 * 60,
    short_break: 5 * 60,
    long_break: 15 * 60,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<SessionType>('work');
  const [timeLeft, setTimeLeft] = useState(settings.work);
  const [isActive, setIsActive] = useState(false);
  const [workSessionsCompleted, setWorkSessionsCompleted] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const notify = (title: string, body: string) => {
    if (notificationPermission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico'
      });
    }
  };
  
  const dailyProgress = React.useMemo(() => {
    const today = startOfDay(new Date());
    const target = targetSessions;
    const sessionsToday = sessions.filter(s => {
      const d = new Date(s.completed_at || new Date());
      return d >= today && s.session_type === 'work';
    });
    return {
      current: sessionsToday.length,
      target,
      percent: Math.min(100, (sessionsToday.length / target) * 100)
    };
  }, [sessions]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load local settings
  useEffect(() => {
    const saved = localStorage.getItem('timer_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      if (!isActive) setTimeLeft(parsed[mode]);
    }
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    playSound('click');
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(settings[mode]);
    playSound('click');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      switch (key) {
        case ' ':
        case 'p':
          e.preventDefault();
          toggleTimer();
          break;
        case 'r':
          resetTimer();
          break;
        case 'w':
          switchMode('work');
          break;
        case 's':
          switchMode('short_break');
          break;
        case 'l':
          switchMode('long_break');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, mode, settings]); // Re-bind when state changes to have fresh closures

  const handleComplete = async (isManualSkip = false) => {
    setIsActive(false);
    
    if (!isManualSkip) {
      playSound('complete');
      const modeLabels = {
        work: 'Focus Session',
        short_break: 'Short Break',
        long_break: 'Long Break'
      };
      notify(`${modeLabels[mode]} Complete`, `Time to ${mode === 'work' ? 'take a break' : 'get back to work'}!`);

      try {
        await api.saveSession(mode, Math.ceil(settings[mode] / 60));
        onSessionComplete?.();
      } catch (error) {
        console.error('Error logging session:', error);
      }
    }

    if (mode === 'work') {
      const completed = workSessionsCompleted + 1;
      setWorkSessionsCompleted(completed);
      if (completed % 4 === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      switchMode('work');
    }
  };

  const switchMode = (newMode: SessionType) => {
    setMode(newMode);
    setTimeLeft(settings[newMode]);
    setIsActive(false);
    playSound('click');
  };

  const updateSetting = (key: keyof typeof settings, value: number) => {
    const newSettings = { ...settings, [key]: value * 60 };
    setSettings(newSettings);
    localStorage.setItem('timer_settings', JSON.stringify(newSettings));
    if (mode === key && !isActive) setTimeLeft(value * 60);
  };

  const skipSession = () => {
    if (confirm('Skip this session? Current progress will not be logged.')) {
      handleComplete(true);
    }
  };

  const keyboardShortcuts = [
    { key: 'Space / P', action: 'Play / Pause' },
    { key: 'R', action: 'Reset Timer' },
    { key: 'W', action: 'Session Mode' },
    { key: 'S', action: 'Short Break' },
    { key: 'L', action: 'Long Break' },
  ];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Mode Selector */}
      <div className="flex items-center gap-2 mb-12 bg-surface border border-border-subtle p-1 rounded-2xl backdrop-blur-md">
        {[
          { id: 'work', label: 'FOCUS', icon: Brain },
          { id: 'short_break', label: 'BREAK', icon: Coffee },
          { id: 'long_break', label: 'LONG BREAK', icon: Coffee },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id as SessionType)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest transition-all",
              mode === id 
                ? "bg-brand text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]" 
                : "text-ink/30 hover:text-ink/60"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="w-full liquid-glass p-16 flex flex-col items-center relative overflow-hidden rounded-[40px] group border border-white/10">
        <div className="scanner opacity-20" />
        <div className="ambient-glow w-96 h-96 bg-brand/5 -top-48 -right-48 animate-pulse-slow" />
        
        <div className="flex items-center gap-2 mb-12 relative z-10">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isActive ? "bg-brand animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "bg-ink/10"
          )} />
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink/30">
            {isActive ? 'Timer Active' : 'Timer Paused'}
          </span>
        </div>

        <motion.div
           key={timeLeft}
           initial={{ opacity: 0.8, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="text-[140px] font-black leading-none tracking-tighter text-ink font-display select-none tabular-nums mb-12 relative z-10 text-glow"
        >
          {formatDuration(timeLeft || 0)}
        </motion.div>

        {/* Progress Display */}
        <div className="w-full max-w-sm space-y-6 relative z-10">
          <div className="h-1 w-full bg-surface rounded-full overflow-hidden">
             <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(timeLeft / settings[mode]) * 100}%` }}
                className="h-full bg-brand shadow-[0_0_10px_rgba(59,130,246,0.5)]"
             />
          </div>
          
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.3em] text-ink/20">
             <span>Focus Cycle {workSessionsCompleted % 4 + 1} / 4</span>
             <span>Daily Progress: {dailyProgress.current} / {dailyProgress.target}</span>
          </div>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="absolute top-8 right-8 text-ink/10 hover:text-brand transition-all hover:rotate-90 z-20"
        >
          <Settings2 size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10 mt-16">
        <button
          onClick={resetTimer}
          className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center text-ink/20 hover:text-ink hover:bg-white/5 transition-all group"
        >
          <RotateCcw size={22} className="group-hover:-rotate-180 transition-transform duration-500" />
        </button>

        <button
          onClick={toggleTimer}
          className={cn(
            "w-32 h-32 rounded-full flex items-center justify-center transition-all shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-110 active:scale-95 group relative overflow-hidden",
            isActive ? "bg-white/5 border border-white/10 text-brand" : "bg-brand text-white"
          )}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
        </button>

        <button
          onClick={skipSession}
          className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center text-ink/20 hover:text-ink hover:bg-white/5 transition-all group"
        >
          <FastForward size={22} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            <div className="liquid-glass rounded-[32px] w-full max-w-lg p-12 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative border border-white/10">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-8 right-8 p-2 text-ink/20 hover:text-brand transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="mb-12">
                <h4 className="text-2xl font-black text-ink tracking-tight uppercase font-display">Timer Settings</h4>
                <p className="text-[10px] text-ink/30 font-bold uppercase tracking-widest mt-2">Adjust focus durations</p>
              </div>
              
              <div className="space-y-12 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                <div>
                  <h5 className="text-[9px] font-bold text-brand uppercase tracking-[0.4em] mb-6">Durations</h5>
                  <div className="space-y-8">
                    {[
                      { id: 'work', label: 'Study session', current: settings.work / 60 },
                      { id: 'short_break', label: 'Short break', current: settings.short_break / 60 },
                      { id: 'long_break', label: 'Long break', current: settings.long_break / 60 },
                    ].map((s) => (
                      <div key={s.id} className="flex justify-between items-center bg-surface border border-border-subtle p-4 rounded-2xl">
                        <span className="font-bold text-xs text-ink/60 uppercase tracking-widest">{s.label}</span>
                        <div className="flex items-center gap-6">
                          <button 
                            onClick={() => updateSetting(s.id as keyof typeof settings, Math.max(1, s.current - 1))}
                            className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-brand hover:text-white transition-all text-ink/40"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-xl font-black w-12 text-center text-brand font-mono">{s.current}m</span>
                          <button 
                            onClick={() => updateSetting(s.id as keyof typeof settings, Math.min(90, s.current + 1))}
                            className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-brand hover:text-white transition-all text-ink/40"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-10 border-t border-border-subtle">
                  <h5 className="text-[9px] font-bold text-brand uppercase tracking-[0.4em] mb-6">Goals</h5>
                  <div className="flex justify-between items-center bg-surface border border-border-subtle p-4 rounded-2xl">
                    <span className="text-xs font-bold text-ink/60 uppercase tracking-widest">Daily Session Goal</span>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => onTargetUpdate?.(Math.max(1, targetSessions - 1))}
                        className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-brand hover:text-white transition-all text-ink/40"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-xl font-black w-12 text-center text-brand font-mono">{targetSessions}</span>
                      <button 
                        onClick={() => onTargetUpdate?.(Math.min(24, targetSessions + 1))}
                        className="w-10 h-10 rounded-xl bg-surface border border-border-subtle flex items-center justify-center hover:bg-brand hover:text-white transition-all text-ink/40"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                  <h5 className="text-[9px] font-bold text-brand uppercase tracking-[0.4em] mb-6">Notifications</h5>
                  <div className="flex justify-between items-center bg-surface border border-border-subtle p-4 rounded-2xl">
                    <span className="text-xs font-bold text-ink/60 uppercase tracking-widest">Browser Alerts</span>
                    {notificationPermission === 'granted' ? (
                      <span className="text-[9px] font-black text-brand uppercase tracking-widest bg-brand/10 px-3 py-1 rounded-full">Active</span>
                    ) : (
                      <button 
                        onClick={requestPermission}
                        className="px-6 py-2 bg-brand text-white text-[9px] font-black rounded-xl hover:bg-brand shadow-[0_5px_15px_rgba(59,130,246,0.3)] uppercase tracking-widest transition-all"
                      >
                        Enable
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-10 border-t border-white/5">
                  <h5 className="text-[9px] font-bold text-brand uppercase tracking-[0.4em] mb-6">Shortcuts</h5>
                  <div className="grid grid-cols-1 gap-4">
                    {keyboardShortcuts.map((shortcut) => (
                      <div key={shortcut.key} className="flex justify-between items-center p-3 bg-surface rounded-xl border border-border-subtle">
                        <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">{shortcut.action}</span>
                        <kbd className="px-3 py-1 bg-ink/5 border border-border-subtle rounded-lg text-[9px] font-black text-brand uppercase font-mono">{shortcut.key}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)} 
                className="w-full h-16 bg-brand text-white font-black rounded-2xl mt-12 hover:bg-brand shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all uppercase tracking-[0.3em] text-xs"
              >
                SAVE SETTINGS
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
