'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chats');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-app)' }}>
      <div className="flex flex-col items-center gap-4">
        {/* Signal Lock Icon Animation */}
        <div className="relative">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
            style={{ animation: 'scaleIn 0.5s ease-out' }}>
            <rect width="64" height="64" rx="16" fill="#2C6BED"/>
            <path d="M32 14C26.48 14 22 18.48 22 24v4H18v22h28V28h-4v-4c0-5.52-4.48-10-10-10zm0 4c3.31 0 6 2.69 6 6v4H26v-4c0-3.31 2.69-6 6-6zm0 14a3 3 0 110 6 3 3 0 010-6z" fill="white"/>
          </svg>
        </div>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', animation: 'typingBounce 1.2s ease-in-out infinite' }}></div>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', animation: 'typingBounce 1.2s ease-in-out 0.2s infinite' }}></div>
          <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)', animation: 'typingBounce 1.2s ease-in-out 0.4s infinite' }}></div>
        </div>
      </div>
    </div>
  );
}
