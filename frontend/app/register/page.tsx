'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

type Step = 'register' | 'otp' | 'profile';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const isPhone = identifier.startsWith('+');
      await authApi.register({
        phone_number: isPhone ? identifier : undefined,
        username: !isPhone ? identifier : undefined,
        password,
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('OTP must be 6 digits'); return; }
    setError('');
    setStep('profile');
  };

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) { setError('Display name required'); return; }
    setError('');
    setLoading(true);
    try {
      const isPhone = identifier.startsWith('+');
      const res = await authApi.verifyOtp({
        phone_number: isPhone ? identifier : undefined,
        username: !isPhone ? identifier : undefined,
        otp,
        display_name: displayName,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`,
      });
      const { access_token, user } = res.data;
      localStorage.setItem('signal_token', access_token);
      localStorage.setItem('signal_user', JSON.stringify(user));
      router.replace('/chats');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'var(--accent)' }}>
            <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
              <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white"/>
            </svg>
          </div>
          {/* Step indicators */}
          <div className="flex gap-2 mt-2">
            {(['register', 'otp', 'profile'] as Step[]).map((s, i) => (
              <div key={s} className="w-6 h-1 rounded-full transition-all"
                style={{ background: s === step || (i < ['register','otp','profile'].indexOf(step)) ? 'var(--accent)' : 'var(--border)' }}/>
            ))}
          </div>
        </div>

        {/* Step 1: Register */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Account</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Enter your phone or username</p>
            </div>
            <input className="signal-input" type="text" placeholder="Username or +1-555-0001"
              value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            <input className="signal-input" type="password" placeholder="Create a password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn-primary mt-2" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Enter OTP</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Use code <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>123456</span>
              </p>
            </div>
            <input className="signal-input text-center text-2xl tracking-widest font-mono"
              type="text" placeholder="123456" maxLength={6}
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required />
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn-primary" type="submit">Verify OTP</button>
            <button type="button" className="btn-ghost text-sm" onClick={() => setStep('register')}>
              Back
            </button>
          </form>
        )}

        {/* Step 3: Profile */}
        {step === 'profile' && (
          <form onSubmit={handleProfile} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Set Up Profile</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>How should others see you?</p>
            </div>
            <input className="signal-input" type="text" placeholder="Your display name"
              value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            <input className="signal-input" type="url" placeholder="Avatar URL (optional)"
              value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            {error && <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button className="btn-primary mt-2" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Get Started'}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
