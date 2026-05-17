import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Coffee, Brain, FastForward, Settings2, X, Plus, Minus } from 'lucide-react';
import { formatDuration, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { SessionType, PomodoroSession } from '../types';
import { startOfDay } from 'date-fns';

interface TimerProps {
  onSessionComplete?: () => void;
  sessions?: PomodoroSession[];
  targetSessions: number;
}

export function Timer({ onSessionComplete, sessions = [], targetSessions }: TimerProps) {
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

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(settings[mode]);
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
  };

  const updateSetting = (key: keyof typeof settings, value: number) => {
    const newSettings = { ...settings, [key]: value * 60 };
    setSettings(newSettings);
    localStorage.setItem('timer_settings', JSON.stringify(newSettings));
    if (mode === key && !isActive) setTimeLeft(value * 60);
  };

  const skipSession = () => {
    if (confirm('Teleport to next phase? Current progress will not be logged.')) {
      handleComplete(true);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-12 relative">
      {/* Background Immersive Elements */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
        <motion.div 
          animate={{ 
            rotate: 360,
            scale: isActive ? [1, 1.05, 1] : 1
          }}
          transition={{ 
            rotate: { duration: 60, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute w-[500px] h-[500px] border border-white/5 rounded-full"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-brand shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white/5 border border-white/10 backdrop-blur-md" />
        </motion.div>
        
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute w-[650px] h-[650px] border border-white/[0.02] rounded-full"
        >
          <div className="absolute top-1/4 right-0 w-3 h-3 rounded-full bg-white/10 blur-sm" />
        </motion.div>

        {/* Scanner Effect */}
        <motion.div
          animate={{ translateY: [-200, 200, -200] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400px] h-[1px] bg-brand/40 blur-md pointer-events-none z-0"
          style={{ opacity: isActive ? 1 : 0 }}
        />
      </div>

      <div className="z-10 flex gap-2 p-1 liquid-glass rounded-full mb-16">
        {[
          { id: 'work', label: 'Focus', icon: Brain },
          { id: 'short_break', label: 'Short Break', icon: Coffee },
          { id: 'long_break', label: 'Long Break', icon: Coffee },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => switchMode(id as SessionType)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
              mode === id 
                ? "bg-white/10 text-white border border-white/20 shadow-lg" 
                : "text-white/40 hover:text-white"
            )}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      <div 
        onClick={() => !isActive && setShowSettings(true)}
        className={cn(
          "relative z-10 flex items-center justify-center glass-card w-[520px] h-80 rounded-[48px] shadow-[0_0_80px_rgba(255,255,255,0.05)] border-white/5 transition-all overflow-hidden",
          !isActive && "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
          isActive && "animate-pulse-slow ring-2 ring-brand/20 bg-brand/[0.05]"
        )}
      >
        {/* Decorative Corners */}
        <div className="absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-white/10 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-white/10 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-white/10 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-white/10 rounded-br-sm pointer-events-none" />

        <motion.div
           key={timeLeft}
           initial={{ opacity: 0.8, filter: "blur(10px)" }}
           animate={{ opacity: 1, filter: "blur(0px)" }}
           className="text-[140px] font-black leading-none tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)] select-none tabular-nums italic group"
        >
          {formatDuration(timeLeft || 0)}
          {!isActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-[48px] backdrop-blur-[4px]"
            >
               <Settings2 className="text-white/40" size={48} />
            </motion.div>
          )}
        </motion.div>

        <div className="absolute bottom-24 flex items-center gap-2 text-brand font-mono tracking-[0.4em] text-[10px] uppercase opacity-80 font-bold">
          <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          {mode === 'work' ? 'Focus Session' : 'Rest Phase'} { (workSessionsCompleted % 4) + 1 }/04
        </div>

        {/* Daily Objective Progress */}
        <div className="absolute bottom-10 w-48 space-y-2">
          <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">
            <span>Daily Objective</span>
            <span>{dailyProgress.current}/{dailyProgress.target}</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${dailyProgress.percent}%` }}
              className="h-full bg-brand shadow-[0_0_10px_rgba(239,68,68,0.3)]"
            />
          </div>
        </div>

        {/* Settings Button */}
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="absolute top-6 right-10 p-3 text-white/10 hover:text-white transition-colors"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* Settings Modal (Inline) */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="z-50 absolute inset-0 flex items-center justify-center"
          >
            <div className="glass-card p-10 rounded-[40px] w-80 space-y-8 relative">
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 text-white/20 hover:text-white"
              >
                <X size={18} />
              </button>
              
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.4em] text-center mb-4">Neural Configurator</h4>
              
              <div className="space-y-8">
                {[
                  { id: 'work', label: 'Combat', current: settings.work / 60 },
                  { id: 'short_break', label: 'Recovery', current: settings.short_break / 60 },
                  { id: 'long_break', label: 'Uplink', current: settings.long_break / 60 },
                ].map((s) => (
                  <div key={s.id} className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-black italic uppercase tracking-widest text-white/20">{s.label} Phase</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateSetting(s.id as keyof typeof settings, Math.max(1, s.current - 1))}
                          className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xl font-black italic text-white min-w-[3ch] text-center">{s.current}m</span>
                        <button 
                          onClick={() => updateSetting(s.id as keyof typeof settings, Math.min(90, s.current + 1))}
                          className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="90" 
                      value={s.current}
                      onChange={(e) => updateSetting(s.id as keyof typeof settings, parseInt(e.target.value))}
                      className="w-full accent-brand h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                ))}

                {/* Keyboard Shortcuts Section */}
                <div className="pt-4 border-t border-white/5">
                  <h5 className="text-[8px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">Neural Overrides</h5>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {[
                      { key: 'P / Space', action: 'Toggle' },
                      { key: 'R', action: 'Reset' },
                      { key: 'W', action: 'Focus' },
                      { key: 'S', action: 'Rest' },
                      { key: 'L', action: 'Uplink' }
                    ].map((shortcut) => (
                      <div key={shortcut.key} className="flex justify-between items-center text-[9px] tracking-widest font-bold">
                        <span className="text-brand/60 uppercase">{shortcut.action}</span>
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-white/40">{shortcut.key}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button onClick={() => setShowSettings(false)} className="w-full text-[10px] h-10 tracking-widest font-black">
                UPLINK STABILIZED
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 flex items-center gap-8 mt-20">
        <Button
          variant="outline"
          size="lg"
          onClick={resetTimer}
          className="rounded-full w-14 h-14 p-0 border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <RotateCcw size={20} />
        </Button>

        <Button
          onClick={toggleTimer}
          className={cn(
            "rounded-full w-24 h-24 p-0 shadow-[0_0_50px_rgba(255,255,255,0.2)] transition-transform active:scale-95",
            isActive ? "bg-white/10 text-white border border-white/20" : "bg-white text-black hover:bg-zinc-200"
          )}
        >
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Pause size={32} fill="currentColor" />
              </motion.div>
            ) : (
              <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Play size={32} fill="currentColor" className="ml-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={skipSession}
          className="rounded-full w-14 h-14 p-0 border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <FastForward size={20} />
        </Button>
      </div>

      <div className="z-10 mt-12 flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "w-8 h-1 rounded-full transition-all duration-500",
              i <= (workSessionsCompleted % 4 || (workSessionsCompleted > 0 && workSessionsCompleted % 4 === 0 ? 4 : 0))
                ? "bg-brand w-12 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                : "bg-white/10"
            )}
          />
        ))}
      </div>
    </div>
  );
}
