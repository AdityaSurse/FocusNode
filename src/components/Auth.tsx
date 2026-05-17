import React, { useState } from 'react';
import { api } from '../lib/api';
import { Button } from './ui/Button';

interface AuthProps {
  onSuccess: (user: { id: string; syncKey: string }) => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [syncKey, setSyncKey] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const user = await api.sync(isJoining ? syncKey : undefined);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="liquid-glass p-12 w-full max-w-md mx-auto rounded-[32px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-ink uppercase tracking-tighter font-display">
          {isJoining ? 'Sync Device' : 'Focus Node'}
        </h2>
        <p className="text-[10px] text-ink/30 font-bold mt-2 uppercase tracking-[0.3em] font-mono">
          {isJoining 
            ? 'Connect to your other devices' 
            : 'Private study tracker'}
        </p>
      </div>
      
      <form onSubmit={handleAuth} className="space-y-8">
        {isJoining && (
          <div>
            <label className="block text-[9px] font-bold text-brand uppercase tracking-[0.4em] mb-4">SYNC KEY</label>
            <input
              type="text"
              value={syncKey}
              onChange={(e) => setSyncKey(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full bg-surface border border-border-subtle rounded-2xl p-5 text-ink focus:outline-none focus:border-brand transition-all font-mono text-3xl text-center tracking-[0.4em] placeholder:text-ink/10"
              placeholder="00000000"
              required
            />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-[10px] font-bold bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center uppercase tracking-widest font-mono">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full h-16 bg-brand text-white font-black rounded-2xl hover:bg-brand transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] uppercase tracking-[0.3em] text-xs"
          disabled={loading}
        >
          {loading ? 'WAITING...' : (isJoining ? 'SYNC NOW' : 'START STUDYING')}
        </button>
      </form>

      <button
        onClick={() => {
          setIsJoining(!isJoining);
          setError(null);
        }}
        className="w-full mt-10 pt-8 text-[10px] font-black text-ink/20 hover:text-brand transition-all border-t border-border-subtle uppercase tracking-[0.3em]"
      >
        {isJoining ? '[ START NEW ]' : "[ SYNC EXISTING DEVICE ]"}
      </button>

      {!isJoining && (
        <p className="mt-8 text-[8px] text-ink/10 text-center uppercase tracking-[0.3em] px-4 font-mono leading-relaxed">
          Your data stays on your device unless you choose to sync.
        </p>
      )}
    </div>
  );
}
