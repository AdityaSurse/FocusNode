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
    <div className="flex flex-col items-center justify-center p-12 glass-card rounded-[40px] w-full max-w-md mx-auto relative overflow-hidden group">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
      
      <h2 className="text-3xl font-black mb-8 text-white text-center tracking-tighter italic">
        {isJoining ? 'BRIDGE NODE' : 'INITIALIZE NODE'}
      </h2>
      
      <form onSubmit={handleAuth} className="w-full space-y-6 relative z-10">
        {isJoining && (
          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-2 px-1">Identification Key</label>
            <input
              type="text"
              value={syncKey}
              onChange={(e) => setSyncKey(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all font-mono text-2xl tracking-[0.4em] placeholder:text-white/10 placeholder:tracking-normal placeholder:text-[10px]"
              placeholder="ENTER 8-DIGIT NODE ID"
              required
            />
          </div>
        )}

        {error && (
          <div className="text-brand text-[10px] font-bold uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 bg-white text-black font-black hover:bg-zinc-200"
          disabled={loading}
        >
          {loading ? 'Processing...' : (isJoining ? 'CONNECT NODE' : 'GENERATE NEW NODE')}
        </Button>
      </form>

      <button
        onClick={() => {
          setIsJoining(!isJoining);
          setError(null);
        }}
        className="mt-8 text-[10px] font-bold uppercase tracking-widest text-white/30 hover:text-white transition-colors"
      >
        {isJoining ? 'Create isolated node instead' : "Have an existing key? Sync here"}
      </button>

      {!isJoining && (
        <p className="mt-6 text-[9px] text-white/10 uppercase tracking-widest text-center leading-relaxed">
          Initializing generates a unique identity <br />
          bridged only across your authorized nodes.
        </p>
      )}
    </div>
  );
}
