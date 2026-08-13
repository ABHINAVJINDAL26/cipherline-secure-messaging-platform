'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/websocket';
import { TokenResponse } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isPhone = identifier.startsWith('+');
      const res = await authApi.login({
        phone_number: isPhone ? identifier : undefined,
        username: !isPhone ? identifier : undefined,
        password,
      });

      const data: TokenResponse = res.data;
      setAuth(data.user, data.access_token);
      wsClient.connect(data.user.id, data.access_token);
      router.replace('/chats');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--accent)' }}>
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Signal</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Say "hello" to privacy</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Phone or Username
            </label>
            <input
              className="signal-input"
              type="text"
              placeholder="demo or +1-555-0001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Password
            </label>
            <input
              className="signal-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-xs text-center py-2 px-3 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.3"/>
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 rounded-xl text-center" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Demo Credentials</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Username: <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>demo</span> &nbsp;
            Password: <span className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>demo123</span>
          </p>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
