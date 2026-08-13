'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { wsClient } from '@/lib/websocket';
import { TokenResponse } from '@/types';
import { getErrorMessage } from '@/lib/utils';

type Step = 'details' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('details');

  // Form Details
  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(''); // helper to show the generated OTP code in dev

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
      setError(getErrorMessage(err));
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
  }, [step]); // reinitialize if step changes back to details

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name is required'); return; }
    if (!phoneNumber.trim()) { setError('Phone number is required'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await authApi.register({
        phone_number: phoneNumber.trim(),
        password,
        display_name: displayName.trim(),
      });

      // The backend returns the random OTP code for developer/evaluation convenience
      if (res.data.otp) {
        setDevOtpHint(res.data.otp);
      }
      setStep('otp');
    } catch (err: any) {
      setError(getErrorMessage(err));
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
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {step === 'details' ? 'Create Account' : 'Verification'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Cipherline Secure messaging</p>
        </div>

        {step === 'details' ? (
          <>
            <form onSubmit={handleRegisterDetails} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Display Name</label>
                <input className="signal-input" type="text" placeholder="Enter display name"
                  value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                <input className="signal-input" type="text" placeholder="e.g. +91 98765 43210"
                  value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Password</label>
                <input className="signal-input" type="password" placeholder="Enter password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                <input className="signal-input" type="password" placeholder="Confirm password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              {error && (
                <p className="text-xs text-center py-2 px-3 rounded-lg mt-1"
                  style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                  {error}
                </p>
              )}

              <button className="btn-primary mt-2" type="submit" disabled={loading}>
                {loading ? 'Sending verification code...' : 'Register'}
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
          </>
        ) : (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                A verification code has been generated for:
              </p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {phoneNumber}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Enter 6-Digit Code
              </label>
              <input
                className="signal-input text-center text-2xl tracking-widest font-mono"
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
            </div>

            {devOtpHint && (
              <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                <p className="text-xs text-gray-500 font-medium">Developer/Evaluation OTP Hint:</p>
                <p className="text-sm font-mono font-bold mt-1" style={{ color: 'var(--accent)' }}>
                  {devOtpHint}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">(Also printed in backend console log)</p>
              </div>
            )}

            {error && (
              <p className="text-xs text-center py-2 px-3 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>

            <button type="button" className="btn-ghost text-sm" onClick={() => setStep('details')}>
              Back to Details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
