import React, { useState } from 'react';
import { Share2, Copy, Check, Smartphone, Trash2, AlertTriangle, RefreshCw, Eye, EyeOff, Link2 } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../lib/api';

interface SyncSetupProps {
  syncKey: string | null;
  onDataCleared?: () => void;
  onSync?: (key: string) => void;
}

export function SyncSetup({ syncKey, onDataCleared, onSync }: SyncSetupProps) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [linking, setLinking] = useState(false);

  const copyKey = () => {
    if (syncKey) {
      navigator.clipboard.writeText(syncKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await api.clearSessions();
      onDataCleared?.();
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setClearing(false);
    }
  };

  const handleBridge = async () => {
    if (!inputKey) return;
    setLinking(true);
    try {
      if (onSync) onSync(inputKey);
    } finally {
      setLinking(false);
    }
  };

  const generateNewKey = async () => {
    if (confirm('Generating a new Node identity will disconnect your current session. Continue?')) {
      try {
        const data = await api.sync(undefined, true);
        if (onSync) onSync(data.syncKey);
      } catch (error) {
        console.error('Failed to generate key:', error);
      }
    }
  };

  return (
    <div className="space-y-12 max-w-2xl mx-auto pb-20">
      <div className="liquid-glass p-12 rounded-[32px] border border-white/5 relative overflow-hidden group">
        <div className="ambient-glow w-64 h-64 bg-brand/5 -top-32 -left-32 animate-pulse-slow" />
        
        <div className="relative z-10 font-sans">
          <div className="flex items-center gap-6 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-brand/5 border border-brand/20 flex items-center justify-center">
              <Share2 className="text-brand shadow-[0_0_15px_rgba(59,130,246,0.5)]" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-ink tracking-tight uppercase font-display">Cloud Sync</h3>
              <p className="text-[10px] text-ink/20 font-bold uppercase tracking-widest mt-1 font-mono">Keep your devices in sync</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {/* Identity revealing section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label className="text-[9px] font-black text-brand uppercase tracking-[0.4em]">Your Sync Key</label>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="text-ink/20 hover:text-brand transition-colors flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 px-8 py-5 font-mono text-3xl font-black text-ink bg-surface border border-border-subtle rounded-2xl tracking-[0.4em] truncate text-center shadow-inner">
                  {showKey ? syncKey : '••••••••'}
                </div>
                <button
                  onClick={copyKey}
                  className="w-16 h-16 flex items-center justify-center bg-surface border border-border-subtle rounded-2xl hover:bg-brand/10 hover:text-brand transition-all text-ink/20"
                >
                  {copied ? <Check size={24} className="text-brand" /> : <Copy size={24} />}
                </button>
              </div>

              <button 
                onClick={generateNewKey}
                className="w-full text-[9px] font-black tracking-[0.3em] h-12 text-ink/10 hover:text-brand transition-all uppercase border border-dashed border-border-subtle rounded-xl flex items-center justify-center gap-3 hover:bg-surface"
              >
                <RefreshCw size={12} className="opacity-50" />
                GENERATE NEW KEY
              </button>
            </div>

            <div className="flex items-center gap-8 py-4 opacity-20">
               <div className="h-px flex-1 bg-white" />
               <span className="text-[8px] font-black text-white tracking-[0.6em] uppercase whitespace-nowrap">Sync with another device</span>
               <div className="h-px flex-1 bg-white" />
            </div>

            {/* Input key section */}
            <div className="space-y-6">
              <label className="block text-[9px] font-black text-brand uppercase tracking-[0.4em]">Enter device key</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="00000000"
                  className="flex-1 bg-surface border border-border-subtle rounded-2xl px-8 py-5 text-ink font-mono text-3xl tracking-[0.4em] focus:outline-none focus:border-brand placeholder:text-ink/10 placeholder:tracking-normal placeholder:text-xs text-center"
                />
                <button 
                  onClick={handleBridge}
                  disabled={linking || !inputKey}
                  className="px-10 bg-brand text-white font-black rounded-2xl hover:bg-brand transition-all disabled:opacity-20 uppercase tracking-[0.3em] text-[10px] shadow-[0_15px_30px_rgba(0,0,0,0.5)]"
                >
                  {linking ? 'CONNECTING...' : 'SYNC'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-glass p-12 rounded-[32px] border border-red-500/10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertTriangle size={24} />
          </div>
          
          <h3 className="text-xl font-black text-ink mb-2 uppercase tracking-tight font-display">Delete All Data</h3>
          <p className="text-[10px] text-ink/30 mb-10 max-w-[40ch] uppercase tracking-widest font-mono font-bold leading-relaxed">
            This will permanently delete all your sessions from this device.
          </p>

          {!showConfirm ? (
            <button 
              onClick={() => setShowConfirm(true)}
              className="px-12 py-4 text-red-500 font-bold border border-red-500/20 rounded-2xl hover:bg-red-500/10 transition-all text-[10px] uppercase tracking-widest"
            >
              DELETE ALL DATA
            </button>
          ) : (
            <div className="flex w-full gap-4 max-w-sm">
              <button 
                onClick={handleClearData}
                disabled={clearing}
                className="flex-[2] h-14 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all text-[10px] uppercase tracking-widest shadow-[0_10px_20px_rgba(239,68,68,0.3)]"
              >
                {clearing ? 'DELETING...' : 'YES, DELETE EVERYTHING'}
              </button>
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-14 bg-surface border border-border-subtle text-ink/40 font-black rounded-2xl hover:bg-ink/10 transition-all text-[10px] uppercase tracking-widest"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

