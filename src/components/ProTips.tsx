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
        setTip("Neural patterns stabilized. Maintain current focus intensity.");
      } finally {
        setLoading(false);
      }
    };
    fetchTip();
  }, []);

  return (
    <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
        <Zap size={80} className="text-brand" />
      </div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center">
          <ShieldAlert size={16} className="text-brand animate-pulse" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/40">Neural Insight</span>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-12 flex items-center"
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 bg-brand/40 rounded-full animate-bounce" 
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="tip"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-black text-white italic tracking-tighter leading-tight"
          >
            "{tip}"
          </motion.p>
        )}
      </AnimatePresence>
      
      <div className="mt-6 flex items-center gap-2">
        <div className="h-[1px] flex-1 bg-white/10" />
        <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em]">Cortex Analysis Active</span>
      </div>
    </div>
  );
} 
