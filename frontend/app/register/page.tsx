'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/websocket';
import { TokenResponse } from '@/types';
import { getErrorMessage } from '@/lib/utils';
import { User, Phone, Lock as LockIcon, Shield, CheckCircle, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

type Step = 'details' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('details');

  // Form Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Real-time Username Availability Check
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState('');

  // Debounced check username
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage('');
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Min 3 characters');
      return;
    }

    if (!/^[a-z0-9._]{3,20}$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Letters, numbers, dot, or _ only');
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const res = await authApi.checkUsername(clean);
        if (res.data.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username available');
        } else {
          setUsernameStatus('taken');
          setUsernameMessage(res.data.reason || 'Username taken');
        }
      } catch {
        setUsernameStatus('idle');
        setUsernameMessage('');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // OTP Verification
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-700' };
    if (password.length < 6) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { score: 2, label: 'Medium', color: 'bg-yellow-500' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pStrength = getPasswordStrength();

  // Google Sign-In removed for this demo

  const triggerShake = () => {
    setShouldShake(true);
    setTimeout(() => setShouldShake(false), 500);
  };

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    if (!username.trim()) { setError('Username is required'); return; }
    if (!/^[a-z0-9._]{3,20}$/.test(username.trim().toLowerCase())) {
      setError('Username must be 3-20 chars, lowercase letters, numbers, dots, underscores only');
      triggerShake();
      return;
    }
    if (usernameStatus === 'taken') {
      setError('Username already taken, please choose another');
      triggerShake();
      return;
    }
    if (!phoneNumber.trim()) { setError('Phone number is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); triggerShake(); return; }
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register({
        phone_number: phoneNumber.trim(),
        password,
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
      });

      if (res.data.otp) {
        setDevOtpHint(res.data.otp);
      }
      setStep('otp');
    } catch (err: any) {
      setError(getErrorMessage(err));
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Verification code must be 6 digits'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyOtp({
        phone_number: phoneNumber.trim(),
        otp,
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

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      // Re-call register to trigger resend (backend returns fixed demo OTP)
      const res = await authApi.register({
        phone_number: phoneNumber.trim(),
        username: username.trim(),
        password,
        display_name: displayName.trim(),
      });
      if (res.data.otp) setDevOtpHint(res.data.otp);
    } catch (err: any) {
      setError(getErrorMessage(err));
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
              <circle cx="100" cy="100" r="70" fill="url(#circleGrad)" opacity="0.15" />
              
              {/* Shield Outline */}
              <path d="M100 45 L145 60 V105 C145 135 125 155 100 165 C75 155 55 135 55 105 V60 L100 45 Z" stroke="url(#accentGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" strokeDasharray="4 4" />
              
              {/* Chat Bubbles */}
              <g filter="drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.25))">
                <path d="M55 110C55 98.9543 63.9543 90 75 90H115C126.046 90 135 98.9543 135 110C135 121.046 126.046 130 115 130H68L55 138V110Z" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
                <line x1="75" y1="106" x2="115" y2="106" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="75" y1="114" x2="100" y2="114" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
              </g>

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
            Privacy that fits in your pocket.
          </h2>
          <p className="text-slate-400 text-center text-sm leading-relaxed max-w-xs">
            Cipherline protects your personal conversations. No tracking, no metadata leaks. Only secure chats.
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

      {/* RIGHT PANEL - Wizard Auth Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-indigo-500/5 blur-[80px] md:hidden pointer-events-none" />

        <div className={`w-full max-w-sm mx-auto ${shouldShake ? 'animate-shake' : ''}`}>
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-blue-600 shadow-lg shadow-blue-500/20">
              <div className="absolute w-20 h-20 rounded-2xl bg-blue-600/10 animate-pulse-ring" />
              <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {step === 'details' ? 'Create Account' : 'Verify Phone'}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {step === 'details' ? 'Join Cipherline secure messaging' : 'Enter the code sent to your phone'}
            </p>
            <p className="text-xs mt-2 text-center text-slate-400 max-w-sm">
              This is a demo app. Use OTP: <strong style={{ color: 'var(--accent)' }}>123456</strong> to verify.
            </p>
          </div>

          {step === 'details' ? (
            <>
              <form onSubmit={handleRegisterDetails} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Display Name</label>
                  <div className="signal-input-container">
                    <User size={18} className="signal-input-icon" />
                    <input className="signal-input signal-input-with-icon w-full" type="text" placeholder="Your full name"
                      value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Username</label>
                    {usernameStatus !== 'idle' && (
                      <span className={`text-[11px] font-medium flex items-center gap-1 transition-all ${
                        usernameStatus === 'available' ? 'text-emerald-500' :
                        usernameStatus === 'taken' ? 'text-red-500' :
                        usernameStatus === 'invalid' ? 'text-amber-500' :
                        'text-slate-400'
                      }`}>
                        {usernameStatus === 'checking' && <Loader2 size={11} className="animate-spin" />}
                        {usernameStatus === 'available' && <CheckCircle2 size={11} />}
                        {usernameStatus === 'taken' && <XCircle size={11} />}
                        {usernameStatus === 'invalid' && <AlertCircle size={11} />}
                        {usernameMessage}
                      </span>
                    )}
                  </div>
                  <div className="signal-input-container relative">
                    <span className="signal-input-icon text-sm font-bold" style={{ left: '14px' }}>@</span>
                    <input
                      className={`signal-input signal-input-with-icon w-full pr-9 transition-colors ${
                        usernameStatus === 'available' ? 'border-emerald-500/50 focus:border-emerald-500' :
                        usernameStatus === 'taken' ? 'border-red-500/50 focus:border-red-500' :
                        ''
                      }`}
                      type="text"
                      placeholder="e.g. john_doe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                      {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-slate-400" />}
                      {usernameStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                      {usernameStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <p className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>Others will find you by this. 3–20 chars, letters/numbers/_.</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                  <div className="signal-input-container">
                    <Phone size={18} className="signal-input-icon" />
                    <input className="signal-input signal-input-with-icon w-full" type="text" placeholder="e.g. +91 98765 43210"
                      value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                  <div className="signal-input-container">
                    <LockIcon size={18} className="signal-input-icon" />
                    <input className="signal-input signal-input-with-icon w-full" type="password" placeholder="Enter password"
                      value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  
                  {/* Password strength indicator */}
                  {password && (
                    <div className="mt-1.5">
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${pStrength.color}`}
                          style={{ width: `${(pStrength.score / 3) * 100}%` }} />
                      </div>
                      <p className="text-[10px] mt-1 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                        Password Strength: <span className="font-semibold" style={{ color: pStrength.score === 3 ? 'var(--accent)' : 'inherit' }}>{pStrength.label}</span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                  <div className="signal-input-container">
                    <LockIcon size={18} className="signal-input-icon" />
                    <input className="signal-input signal-input-with-icon w-full" type="password" placeholder="Confirm password"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-center py-2 px-3 rounded-xl border border-red-500/10"
                    style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                    ⚠️ {error}
                  </p>
                )}

                <button className="btn-primary mt-2 py-3 w-full font-semibold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" type="submit" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="spinner" />
                      <span>Sending code...</span>
                    </span>
                  ) : (
                    'Register'
                  )}
                </button>
              </form>

              {/* Social sign-in removed */}

              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                  Sign In
                </Link>
              </p>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="text-center mb-2 p-3 rounded-xl" style={{ background: 'var(--bg-sidebar)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                  Verification Target
                </p>
                <p className="text-base font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                  {phoneNumber}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--text-muted)' }}>
                  Enter 6-Digit Verification Code
                </label>
                <input
                  className="signal-input text-center text-3xl tracking-widest font-mono py-3"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
              </div>

              {devOtpHint && (
                <div className="p-3.5 rounded-xl border border-blue-500/10 text-center relative overflow-hidden bg-blue-950/20">
                  <div className="absolute top-1 right-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-[9px] text-blue-500 font-mono">Dev Mode</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">OTP Code generated for testing:</p>
                  <p className="text-2xl font-mono font-extrabold tracking-widest mt-1 text-blue-500">
                    {devOtpHint}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Copy and paste this code to complete validation.</p>
                  <div className="mt-3 flex justify-center">
                    <button type="button" className="btn-ghost text-sm py-2 rounded-xl" onClick={handleResendOtp} disabled={loading}>
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-xs text-center py-2 px-3 rounded-xl border border-red-500/10"
                  style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--danger)' }}>
                  ⚠️ {error}
                </p>
              )}

              <button className="btn-primary py-3 w-full font-semibold rounded-xl shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200" type="submit" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="spinner" />
                    <span>Verifying...</span>
                  </span>
                ) : (
                  'Verify & Sign In'
                )}
              </button>

              <button type="button" className="btn-ghost text-sm py-2 rounded-xl" onClick={() => setStep('details')}>
                Back to Details
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
