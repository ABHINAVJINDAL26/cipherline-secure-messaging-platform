'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/websocket';
import { TokenResponse } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Google OAuth callback
  const handleGoogleLogin = async (response: any) => {
    setError('');
    setLoading(true);
    try {
      const res = await authApi.googleLogin(response.credential);
      const data: TokenResponse = res.data;
      setAuth(data.user, data.access_token);
      wsClient.connect(data.user.id, data.access_token);
      router.replace('/chats');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Google Sign-In button
    const initGoogle = () => {
      if (typeof window !== 'undefined' && (window as any).google) {
        const client_id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
        (window as any).google.accounts.id.initialize({
          client_id: client_id,
          callback: handleGoogleLogin,
        });
        (window as any).google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 340, shape: 'circle' }
        );
      }
    };

    const timer = setTimeout(initGoogle, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    if (!username.trim() && !phoneNumber.trim()) { setError('Username or Phone Number is required'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register({
        username: username.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        password,
        display_name: displayName.trim(),
        avatar_url: avatarUrl.trim() || undefined,
      });

      const data: TokenResponse = res.data;
      setAuth(data.user, data.access_token);
      wsClient.connect(data.user.id, data.access_token);
      router.replace('/chats');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--accent)' }}>
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Account</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Cipherline Secure messaging</p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Username</label>
            <input className="signal-input" type="text" placeholder="e.g. alice"
              value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Phone Number (Optional)</label>
            <input className="signal-input" type="text" placeholder="e.g. +1-555-0001"
              value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Display Name</label>
            <input className="signal-input" type="text" placeholder="e.g. Alice Smith"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Password</label>
            <input className="signal-input" type="password" placeholder="Create a password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Avatar URL (Optional)</label>
            <input className="signal-input" type="url" placeholder="Link to profile picture"
              value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
          </div>

          {error && (
            <p className="text-xs text-center py-2 px-3 rounded-lg mt-1"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <button className="btn-primary mt-2" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        {/* Google Sign-In Option */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="px-3 text-xs text-gray-500 uppercase">Or</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        <div className="flex justify-center mb-6">
          <div id="google-signin-btn" />
        </div>

        <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
