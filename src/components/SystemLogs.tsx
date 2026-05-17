import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Cpu, Wifi } from 'lucide-react';
import { cn } from '../lib/utils';

interface LogEntry {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      message,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type
    };
    setLogs(prev => [...prev.slice(-19), entry]);
  };

  useEffect(() => {
    // Initial logs
    addLog('NEURAL_LINK_ESTABLISHED', 'success');
    addLog('SECURE_NODE_ACTIVE', 'info');
    
    // Simulate some logs
    const interval = setInterval(() => {
      const messages = [
        'TELEMETRY_SYNCING...',
        'ENCRYPTION_LAYER_STABLE',
        'CORE_TEMP_OPTIMAL',
        'CLEANING_CACHE_REGISTRY',
        'SCANNING_NEURAL_PATTERNS...',
        'UPLINK_READY',
      ];
      addLog(messages[Math.floor(Math.random() * messages.length)], 'info');
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 flex flex-col h-[400px]">
      <div className="bg-surface p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-brand" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/30">System Console</span>
        </div>
        <div className="flex gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500/20" />
           <div className="w-2 h-2 rounded-full bg-blue-500/20" />
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-8 overflow-y-auto font-mono text-[10px] space-y-3 custom-scrollbar bg-black/20"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-4"
            >
              <span className="text-ink/10 shrink-0">[{log.time}]</span>
              <span className={cn(
                "transition-colors",
                log.type === 'success' ? 'text-green-500/80' : 
                log.type === 'error' ? 'text-red-500/80' :
                log.type === 'warn' ? 'text-yellow-500/80' : 'text-brand/80'
              )}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-surface/50 border-t border-white/5 grid grid-cols-3 gap-6">
         {[
           { icon: Shield, label: 'SECURE', value: 'AES-256' },
           { icon: Cpu, label: 'LOAD', value: '4.2%' },
           { icon: Wifi, label: 'PING', value: '12ms' },
         ].map(stat => (
           <div key={stat.label} className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-ink/20">
                <stat.icon size={10} />
                <span className="text-[8px] font-bold uppercase tracking-widest">{stat.label}</span>
              </div>
              <span className="text-[10px] font-black text-ink/40 font-mono">{stat.value}</span>
           </div>
         ))}
      </div>
    </div>
  );
}
