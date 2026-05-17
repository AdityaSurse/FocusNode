import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Sparkles, RefreshCw } from 'lucide-react';
import { PomodoroSession } from '../types';
import { cn } from '../lib/utils';

interface InsightsProps {
  sessions: PomodoroSession[];
}

interface InsightData {
  tag: string;
  label: string;
  tip: string;
}

export function Insights({ sessions }: InsightsProps) {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    if (sessions.length === 0) return;
    setLoading(true);
    try {
      const data = await api.getInsights();
      setInsight(data);
    } catch (error) {
      console.error('Error fetching insight:', error);
      setInsight({
        tag: "OFFLINE_MODE",
        label: "MANUAL_PROTOCOL",
        tip: "Maximize your efficiency by setting small, achievable goals each day."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessions.length > 0 && !insight) {
      getInsight();
    }
  }, [sessions]);

  return (
    <div className="glass-card p-12 relative overflow-hidden group rounded-[32px]">
      <div className="ambient-glow w-64 h-64 bg-brand/5 -top-32 -left-32 animate-pulse-slow" />
      
      <div className="flex flex-col gap-10 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-ink uppercase tracking-[0.3em] font-display">Focus Insights</h3>
            <p className="text-[9px] text-ink/20 uppercase tracking-widest mt-2 font-bold font-mono">Personalized study tips</p>
          </div>
          
          <button 
            onClick={getInsight}
            disabled={loading || sessions.length === 0}
            className="w-12 h-12 rounded-2xl border border-border-subtle flex items-center justify-center hover:bg-surface transition-all disabled:opacity-30 group"
          >
            <RefreshCw size={18} className={cn("text-ink/20 transition-all group-hover:text-brand", loading && "animate-spin")} />
          </button>
        </div>

        <div className="bg-surface border border-border-subtle p-10 rounded-3xl relative overflow-hidden group/box">
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover/box:opacity-100 transition-opacity" />
            <div className="flex items-center gap-3 mb-6 relative z-10">
               <Sparkles className="text-brand shadow-[0_0_10px_rgba(59,130,246,0.5)]" size={16} />
               <span className="text-[9px] font-bold text-brand uppercase tracking-[0.4em]">Smart Suggestion</span>
            </div>

            <div className="text-xl font-bold text-ink leading-relaxed relative z-10 text-glow">
              {sessions.length === 0 ? (
                <span className="text-ink/10 uppercase tracking-[0.4em] font-mono text-[10px]">Finish a session for insights...</span>
              ) : (
                loading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse shadow-[0_0_8px_var(--color-brand)]" />
                       <div className="h-2 w-24 bg-surface rounded animate-pulse" />
                    </div>
                    <div className="h-4 w-full bg-surface rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-brand bg-brand/10 px-2 py-0.5 rounded font-mono uppercase tracking-[0.2em] border border-brand/20">{insight?.tag}</span>
                        <span className="text-[10px] font-black text-ink/30 uppercase tracking-[0.3em] font-mono">{insight?.label}</span>
                     </div>
                     <p className="text-xl font-bold leading-tight tracking-tight font-display">{insight?.tip}</p>
                  </div>
                )
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
