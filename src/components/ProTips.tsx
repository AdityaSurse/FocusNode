import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Zap, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ProTips() {
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const data = await api.getInsights();
        setTip(data.tip);
      } catch (error) {
        setTip("Consistency is the secret to getting things done.");
      } finally {
        setLoading(false);
      }
    };
    fetchTip();
  }, []);

  return (
    <div className="liquid-glass p-12 rounded-[32px] border border-border-subtle border-l-4 border-l-brand relative overflow-hidden group">
      <div className="ambient-glow w-48 h-48 bg-brand/5 -top-24 -right-24 animate-pulse-slow" />
      
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all">
        <Zap size={100} className="text-ink" />
      </div>
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-2 h-2 bg-brand animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]" />
        <span className="text-[9px] font-black uppercase tracking-[0.5em] text-brand font-display">Quick Study Tip</span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-10 flex items-center gap-2"
          >
            <span className="text-[10px] font-mono text-brand uppercase animate-pulse">Loading tip...</span>
          </motion.div>
        ) : (
          <motion.div
            key="tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <p className="text-xl font-bold text-ink font-mono leading-tight max-w-3xl">
              <span className="text-brand mr-2">»</span>
              {tip}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between">
        <span className="text-[8px] font-mono text-ink/20 uppercase tracking-[0.3em]">Status: Secure</span>
        <span className="text-[8px] font-mono text-ink/20 uppercase tracking-[0.3em]">Session_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
      </div>
    </div>
  );
} 
