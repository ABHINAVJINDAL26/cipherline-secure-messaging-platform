'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/websocket';
import { TokenResponse } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { Phone, Lock as LockIcon, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

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
      setError(getErrorMessage(err));
      triggerShake();
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

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({
        phone_number: phoneNumber.trim(),
        password,
      });

      const data: TokenResponse = res.data;
      setAuth(data.user, data.access_token);
      wsClient.connect(data.user.id, data.access_token);
      router.replace('/chats');
    } catch (err: any) {
      setError(getErrorMessage(err));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg-app)' }}>
      {/* LEFT PANEL - 3D/Gradient Privacy Showcase (Desktop only) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-16 relative overflow-hidden bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border-r border-slate-800">
        {/* Floating gradient background blobs */}
        <div className="absolute top-10 left-10 w-80 h-80 rounded-full bg-blue-600/10 blur-[80px] animate-float-blob" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-indigo-500/10 blur-[90px] animate-float-blob-reverse" />

        {/* Top Header */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
              <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Cipherline</span>
        </div>

        {/* Central 3D Chat Vector Illustration */}
        <div className="flex flex-col items-center justify-center my-auto z-10 relative py-8">
          <div className="relative flex items-center justify-center w-64 h-64 mb-8">
            {/* Pulsing glow rings */}
            <div className="absolute w-44 h-44 rounded-full bg-blue-500/10 animate-pulse-ring" />
            <div className="absolute w-56 h-56 rounded-full bg-indigo-500/5 animate-pulse-ring" style={{ animationDelay: '1s' }} />
            
            {/* Elegant SVG illustration */}
            <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Central glowing background circle */}
              <circle cx="100" cy="100" r="70" fill="url(#circleGrad)" opacity="0.15" />
              
              {/* Back elements (shield outline) */}
              <path d="M100 45 L145 60 V105 C145 135 125 155 100 165 C75 155 55 135 55 105 V60 L100 45 Z" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" strokeDasharray="4 4" />
              
              {/* Floating Chat Bubbles */}
              {/* Left bubble */}
              <g filter="drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.25))">
                <path d="M55 110C55 98.9543 63.9543 90 75 90H115C126.046 90 135 98.9543 135 110C135 121.046 126.046 130 115 130H68L55 138V110Z" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
                <line x1="75" y1="106" x2="115" y2="106" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="75" y1="114" x2="100" y2="114" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Right bubble */}
              <g filter="drop-shadow(0px 12px 24px rgba(44, 107, 237, 0.25))">
                <path d="M145 80C145 91.0457 136.046 100 125 100H85C73.9543 100 65 91.0457 65 80C65 68.9543 73.9543 60 85 60H135L145 52V80Z" fill="#2C6BED" />
                <line x1="85" y1="76" x2="125" y2="76" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                <line x1="85" y1="84" x2="110" y2="84" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
              </g>

              {/* Secure lock badge */}
              <rect x="88" y="125" width="24" height="24" rx="6" fill="#10B981" />
              <path d="M96 135 V133 C96 130.8 97.8 129 100 129 C102.2 129 104 130.8 104 133 V135" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <rect x="94" y="135" width="12" height="9" rx="2" fill="white" />
              
              <defs>
                <radialGradient id="circleGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(100 100) rotate(90) scale(70)">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="accentGrad" x1="55" y1="45" x2="145" y2="165" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2 className="text-3xl font-extrabold text-white text-center tracking-tight leading-tight max-w-sm mb-3">
            Your conversations, encrypted end-to-end.
          </h2>
          <p className="text-slate-400 text-center text-sm leading-relaxed max-w-xs">
            Say hello to real-time security. Cipherline keeps your personal data locked and private.
          </p>
        </div>

        {/* Bottom footer tag */}
        <div className="flex items-center justify-between text-xs text-slate-500 z-10 border-t border-slate-900 pt-6">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-500" />
            <span>End-to-End Encrypted</span>
          </div>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* RIGHT PANEL - Focused Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        {/* Subtle decorative background blob for mobile */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-blue-500/5 blur-[80px] md:hidden pointer-events-none" />

        <div className={`w-full max-w-sm mx-auto ${shouldShake ? 'animate-shake' : ''}`}>
          {/* Logo / Form Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-blue-600 shadow-lg shadow-blue-500/20">
              <div className="absolute w-20 h-20 rounded-2xl bg-blue-600/10 animate-pulse-ring" />
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>Sign In</h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>Welcome back to Cipherline</p>
            <p className="text-xs mt-2 text-center text-slate-400 max-w-sm">
              This is a demo app. Use OTP: <strong style={{ color: 'var(--accent)' }}>123456</strong> to verify when testing registration.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Phone Number
              </label>
              <div className="signal-input-container">
                <Phone size={18} className="signal-input-icon" />
                <input
                  className="signal-input signal-input-with-icon w-full"
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Password
              </label>
              <div className="signal-input-container">
                <LockIcon size={18} className="signal-input-icon" />
                <input
                  className="signal-input signal-input-with-icon w-full"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-center py-2.5 px-3.5 rounded-xl border border-red-500/10"
                style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)' }}>
                ⚠️ {error}
              </p>
            )}

            <button
              className="btn-primary mt-3 py-3 w-full font-semibold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              type="submit"
              disabled={loading}
              style={{ background: 'var(--accent)', color: '#white' }}
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="spinner" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="px-3 text-xs uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>Or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* Google Button */}
          <div className="flex justify-center mb-6">
            <div id="google-signin-btn" className="hover:scale-[1.02] transition-transform duration-200" />
          </div>

          {/* Register Link */}
          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
