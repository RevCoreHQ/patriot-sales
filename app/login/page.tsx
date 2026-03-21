'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Delete } from 'lucide-react';

const LOGO_URL = 'https://assets.cdn.filesafe.space/UrIbmSbNwH6Sfvb4CBZw/media/69be3176402511cd924021b3.png';

export default function LoginPage() {
  const router = useRouter();
  const { init, login, currentUser, initialized } = useAuthStore();

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'name' | 'pin'>('name');
  const [shake, setShake] = useState(false);

  useEffect(() => { init(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (initialized && currentUser) router.replace('/');
  }, [initialized, currentUser, router]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('pin');
    setError('');
  };

  const appendPin = (digit: string) => {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => attemptLogin(next), 120);
    }
  };

  const deletePin = () => setPin(p => p.slice(0, -1));

  const attemptLogin = (p: string) => {
    const ok = login(name.trim(), p);
    if (ok) {
      router.replace('/');
    } else {
      setShake(true);
      setPin('');
      setError('Incorrect PIN. Try again.');
      setTimeout(() => setShake(false), 500);
    }
  };

  if (!initialized) return null;
  if (currentUser) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-sm px-6">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src={LOGO_URL} alt="Patriot Roofing" className="h-24 w-auto object-contain mb-4" />
          <div className="text-xs tracking-widest uppercase text-c-text-4 font-medium">Roofing & Home Repairs</div>
        </div>

        {step === 'name' ? (
          /* ── Name entry ── */
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="rounded-2xl border border-c-border-inner p-6 bg-c-card">
              <div className="text-base font-semibold text-c-text mb-1">Welcome back</div>
              <div className="text-sm text-c-text-4 mb-5">Enter your name to continue</div>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-14 bg-c-input border border-c-border-input rounded-xl px-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full h-14 bg-gradient-to-br from-accent-from to-accent-to text-white text-base font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </form>
        ) : (
          /* ── PIN entry ── */
          <div
            className={`rounded-2xl border border-c-border-inner p-6 bg-c-card transition-all ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
          >
            <button onClick={() => { setStep('name'); setPin(''); setError(''); }}
              className="h-11 px-2 flex items-center text-sm text-c-text-4 hover:text-c-text-2 transition-colors mb-4">
              ← Back
            </button>
            <div className="text-base font-semibold text-c-text mb-1">Hello, {name}</div>
            <div className="text-sm text-c-text-4 mb-7">Enter your 4-digit PIN</div>

            {/* PIN dots */}
            <div className="flex items-center justify-center gap-5 mb-7">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    i < pin.length ? 'bg-accent scale-110 shadow-[0_0_12px_rgba(198,40,40,0.5)]' : 'bg-c-border-inner'
                  }`}
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
              {['1','2','3','4','5','6','7','8','9'].map(d => (
                <button key={d} onClick={() => appendPin(d)}
                  className="h-[72px] text-xl font-semibold text-c-text rounded-2xl bg-c-surface hover:bg-c-elevated active:scale-95 transition-all border border-c-border-inner">
                  {d}
                </button>
              ))}
              <div />
              <button onClick={() => appendPin('0')}
                className="h-[72px] text-xl font-semibold text-c-text rounded-2xl bg-c-surface hover:bg-c-elevated active:scale-95 transition-all border border-c-border-inner">
                0
              </button>
              <button onClick={deletePin}
                className="h-[72px] flex items-center justify-center text-c-text-3 hover:text-c-text rounded-2xl bg-c-surface hover:bg-c-elevated active:scale-95 transition-all border border-c-border-inner">
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 text-sm text-red-400 text-center">{error}</div>
            )}
          </div>
        )}

        <div className="mt-6 text-center text-xs text-c-text-5">
          Patriot Roofing · Internal Portal
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
