'use client';

import { useUIStore } from '@/store/uiStore';
import { MessageSquare, Users, Search, Shield, Lock, Sparkles } from 'lucide-react';

export default function EmptyChatState() {
  const { setNewChatOpen, setNewGroupOpen, setCommandPaletteOpen } = useUIStore();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center select-none overflow-y-auto">
      {/* 3D Animated Illustration Container */}
      <div className="relative flex items-center justify-center w-56 h-56 mb-6">
        {/* Glowing background aura rings */}
        <div className="absolute w-48 h-48 rounded-full bg-blue-500/10 animate-pulse-ring" />
        <div className="absolute w-60 h-60 rounded-full bg-indigo-500/5 animate-pulse-ring" style={{ animationDelay: '1.2s' }} />

        {/* 3D Privacy Shield & Chat Bubbles Vector SVG */}
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Radial gradient background glow */}
          <circle cx="100" cy="100" r="75" fill="url(#emptyGlow)" opacity="0.2" />

          {/* Security Shield Outline */}
          <path
            d="M100 35 L150 52 V102 C150 135 125 160 100 172 C75 160 50 135 50 102 V52 L100 35 Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.8"
            strokeDasharray="4 4"
          />

          {/* Floating Left Chat Bubble */}
          <g filter="drop-shadow(0px 8px 16px rgba(0, 0, 0, 0.25))">
            <path
              d="M50 110C50 98.9543 58.9543 90 70 90H115C126.046 90 135 98.9543 135 110C135 121.046 126.046 130 115 130H65L50 138V110Z"
              fill="#1E293B"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <line x1="70" y1="106" x2="115" y2="106" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="70" y1="114" x2="98" y2="114" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          {/* Floating Right Chat Bubble */}
          <g filter="drop-shadow(0px 12px 24px rgba(44, 107, 237, 0.3))">
            <path
              d="M150 78C150 89.0457 141.046 98 130 98H88C76.9543 98 68 89.0457 68 78C68 66.9543 76.9543 58 88 58H140L150 50V78Z"
              fill="#2C6BED"
            />
            <line x1="88" y1="74" x2="132" y2="74" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
            <line x1="88" y1="82" x2="115" y2="82" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
          </g>

          {/* Center Lock Badge */}
          <rect x="88" y="124" width="24" height="24" rx="6" fill="#10B981" />
          <path d="M96 134 V132 C96 129.8 97.8 128 100 128 C102.2 128 104 129.8 104 132 V134" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="94" y="134" width="12" height="9" rx="2" fill="white" />

          <defs>
            <radialGradient id="emptyGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(100 100) rotate(90) scale(75)">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="shieldGrad" x1="50" y1="35" x2="150" y2="172" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
        Cipherline Messaging
      </h2>
      <p className="text-sm max-w-sm mb-8 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Send end-to-end encrypted messages to anyone by username. Fast, private, and secure.
      </p>

      {/* Quick Action Cards */}
      <div className="flex flex-wrap items-center justify-center gap-3 max-w-md mb-8">
        <button
          onClick={() => setNewChatOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <MessageSquare size={16} />
          <span>New Chat</span>
        </button>

        <button
          onClick={() => setNewGroupOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          <Users size={16} style={{ color: 'var(--text-muted)' }} />
          <span>Create Group</span>
        </button>

        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <span>Search (Cmd+K)</span>
        </button>
      </div>

      {/* Security Footer Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <Shield size={13} className="text-emerald-500" />
        <span>End-to-End Encrypted</span>
      </div>
    </div>
  );
}
