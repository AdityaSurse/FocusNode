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
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="glass-card p-10 rounded-[40px] w-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Smartphone size={160} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Share2 className="text-brand" size={24} />
            </div>
            <div>
              <h3 className="text-white font-black text-2xl tracking-tighter italic uppercase">Neural Matrix</h3>
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em]">Telemetry Synchronization</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {/* Identity revealing section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Active Node Identity</label>
                <button 
                  onClick={() => setShowKey(!showKey)}
                  className="text-white/20 hover:text-white transition-colors flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest"
                >
                  {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showKey ? 'Hide' : 'Reveal'}
                </button>
              </div>
              
              <div className="flex items-center gap-2 p-1.5 liquid-glass rounded-3xl border border-white/5 shadow-inner">
                <div className="flex-1 px-6 py-4 font-mono text-xl font-black text-white/80 tracking-[0.5em] truncate">
                  {showKey ? syncKey : '••••••••'}
                </div>
                <Button
                  onClick={copyKey}
                  className="rounded-2xl h-12 w-12 p-0 bg-white/5 border border-white/10 hover:bg-white/10 shadow-none"
                >
                  {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                </Button>
              </div>

              <Button 
                variant="ghost" 
                onClick={generateNewKey}
                className="w-full text-[9px] font-black tracking-[0.3em] h-10 border border-white/5 hover:bg-white/5"
              >
                <RefreshCw size={12} className="mr-2" />
                REGENERATE NODE ID
              </Button>
            </div>

            <div className="h-[1px] bg-white/5 flex items-center justify-center">
              <span className="bg-[#0b0b0b] px-6 text-[9px] font-black italic text-white/10 tracking-[0.5em]">BRIDGE UPLINK</span>
            </div>

            {/* Input key section */}
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-3 px-1">Connect External Node</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="8-Digit Node ID..."
                  className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white font-mono text-xl tracking-[0.4em] focus:outline-none focus:ring-1 focus:ring-brand/40 transition-all placeholder:text-white/10 placeholder:tracking-normal placeholder:text-xs"
                />
                <Button 
                  onClick={handleBridge}
                  disabled={linking || !inputKey}
                  className="px-10 h-14 bg-brand text-white font-black italic tracking-tighter"
                >
                  {linking ? 'LINKING...' : 'BRIDGE NODE'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3 p-5 bg-white/[0.02] rounded-3xl border border-white/5 group-hover:bg-white/5 transition-colors">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">Continuous connection matrix established</p>
          </div>
        </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-500/10 p-10 rounded-[40px] w-full max-w-lg mx-auto backdrop-blur-xl group relative overflow-hidden transition-all hover:bg-rose-500/[0.07]">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-rose-500 font-bold tracking-tighter italic text-lg uppercase">System Purge</h3>
              <p className="text-rose-500/40 text-[9px] font-bold uppercase tracking-widest">Destructive Sequence</p>
            </div>
          </div>

          <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mb-8 leading-relaxed px-1">
            Clearing local telemetry will permanently disconnect this node from the neural matrix and wipe historical records.
          </p>

          {!showConfirm ? (
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(true)}
              className="w-full h-12 border-rose-900/40 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-[10px] font-black tracking-widest"
            >
              <Trash2 size={14} className="mr-2" />
              INITIATE PURGE
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button 
                onClick={handleClearData}
                disabled={clearing}
                className="flex-[2] h-12 bg-rose-600 hover:bg-rose-500 text-white border-none shadow-[0_0_20px_rgba(225,29,72,0.2)] text-[10px] font-black tracking-widest"
              >
                {clearing ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Trash2 size={14} className="mr-2" />}
                CONFIRM WIPE
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setShowConfirm(false)}
                className="flex-1 h-12 text-[10px] font-black tracking-widest"
              >
                ABORT
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

