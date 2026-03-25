'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';

const LOGO_URL = 'https://assets.cdn.filesafe.space/UrIbmSbNwH6Sfvb4CBZw/media/69be3176402511cd924021b3.png';

export default function AuthLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error: authError } = await signInWithEmail(email, password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }
      router.replace('/');
    } else {
      if (!name.trim()) {
        setError('Name is required');
        setLoading(false);
        return;
      }

      const { data, error: authError } = await signUpWithEmail(email, password);
      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        const supabase = createClient();

        // Check if an org already exists (join existing team)
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();

        let orgId: string;

        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          const { data: newOrg, error: orgError } = await supabase
            .from('organizations')
            .insert({ name: 'Patriot Roofing' })
            .select('id')
            .single();

          if (orgError || !newOrg) {
            setError('Failed to create organization');
            setLoading(false);
            return;
          }
          orgId = newOrg.id;
          await supabase.from('app_settings').insert({ org_id: orgId });
        }

        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          org_id: orgId,
          name: name.trim(),
          pin: '0000',
          role: existingOrg ? 'sales' : 'admin',
        });

        if (profileError) {
          setError('Account created but profile setup failed. Contact your admin.');
          setLoading(false);
          return;
        }

        router.replace('/');
      } else {
        setSuccess('Check your email for a confirmation link, then sign in.');
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setSuccess('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--background)' }}
    >
      <div className="w-full max-w-sm px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img src={LOGO_URL} alt="Patriot Roofing" className="h-24 w-auto object-contain mb-4" />
          <div className="text-xs tracking-widest uppercase text-c-text-4 font-medium">
            Roofing & Home Repairs
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl border border-c-border-inner p-6 bg-c-card">
            <div className="text-base font-semibold text-c-text mb-1">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </div>
            <div className="text-sm text-c-text-4 mb-5">
              {mode === 'login'
                ? 'Enter your email and password to continue'
                : 'Set up your account to get started'}
            </div>

            <div className="space-y-3">
              {mode === 'signup' && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-14 bg-c-input border border-c-border-input rounded-xl px-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent/50 transition-colors"
                />
              )}
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full h-14 bg-c-input border border-c-border-input rounded-xl px-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent/50 transition-colors"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full h-14 bg-c-input border border-c-border-input rounded-xl px-4 text-base text-c-text placeholder:text-c-text-4 focus:outline-none focus:border-accent/50 transition-colors"
              />
            </div>

            {error && (
              <div className="mt-3 text-sm text-red-400">{error}</div>
            )}
            {success && (
              <div className="mt-3 text-sm text-green-400">{success}</div>
            )}
          </div>

          <button
            type="submit"
            disabled={!email || !password || (mode === 'signup' && !name.trim()) || loading}
            className="w-full h-14 bg-gradient-to-br from-accent-from to-accent-to text-white text-base font-bold rounded-xl active:scale-[0.98] transition-all shadow-lg shadow-accent/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <button
          onClick={toggleMode}
          className="w-full mt-4 text-center text-sm text-c-text-3 hover:text-c-text transition-colors py-2"
        >
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>

        <div className="mt-4 text-center text-xs text-c-text-5">
          Patriot Roofing · Internal Portal
        </div>
      </div>
    </div>
  );
}
