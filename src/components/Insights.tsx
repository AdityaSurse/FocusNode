import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Sparkles, RefreshCw } from 'lucide-react';
import { PomodoroSession } from '../types';

interface InsightsProps {
  sessions: PomodoroSession[];
}

export function Insights({ sessions }: InsightsProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    if (sessions.length === 0) return;
    setLoading(true);
    try {
      const data = await api.getInsights();
      setInsight(data.tip);
    } catch (error) {
      console.error('Error fetching insight:', error);
      setInsight("Maximize focus by maintaining a consistent node connection. Neural patterns are forming.");
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
    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl relative overflow-hidden group backdrop-blur-md">
      <div className="relative z-10 flex items-center gap-6">
        <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
          {loading ? <RefreshCw size={24} className="animate-spin" /> : <Sparkles size={24} />}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="text-cyan-400 font-bold uppercase tracking-[0.2em] text-[10px]">
              Intelligent Node Insight
            </div>
            <button 
              onClick={getInsight}
              disabled={loading || sessions.length === 0}
              className="text-white/20 hover:text-white transition-colors disabled:opacity-0"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="text-white/80 text-base font-medium leading-relaxed">
            {sessions.length === 0 ? (
              <span className="text-white/30 italic">Initialize sessions to activate neural analysis...</span>
            ) : (
              loading ? "Processing focus heuristics..." : insight
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
