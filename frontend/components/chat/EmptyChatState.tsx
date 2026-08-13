'use client';

export default function EmptyChatState() {
  return (
    <div className="empty-state">
      {/* Premium Chat Illustration */}
      <div className="flex items-center justify-center w-48 h-48 mb-2 relative" style={{ animation: 'scaleIn 0.3s ease-out' }}>
        <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Background circle decoration */}
          <circle cx="100" cy="100" r="80" fill="var(--accent-light)" opacity="0.4" />
          <circle cx="100" cy="100" r="60" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />
          
          {/* Decorative floating dots */}
          <circle cx="45" cy="65" r="5" fill="var(--accent)" opacity="0.6" />
          <circle cx="160" cy="85" r="3" fill="var(--accent)" opacity="0.4" />
          <circle cx="140" cy="145" r="6" fill="var(--accent)" opacity="0.5" />
          
          {/* Speech bubble 2 (background received message) */}
          <g filter="drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.05))">
            <path d="M50 115C50 101.193 61.1929 90 75 90H125C138.807 90 150 101.193 150 115C150 128.807 138.807 140 125 140H70L50 150V115Z" fill="var(--bg-input)" stroke="var(--border)" strokeWidth="1.5" />
            {/* Typing status dots in bubble 2 */}
            <circle cx="80" cy="115" r="3" fill="var(--text-muted)" opacity="0.6" />
            <circle cx="95" cy="115" r="3" fill="var(--text-muted)" opacity="0.6" />
            <circle cx="110" cy="115" r="3" fill="var(--text-muted)" opacity="0.6" />
          </g>

          {/* Speech bubble 1 (foreground sent message) */}
          <g filter="drop-shadow(0px 8px 16px rgba(44, 107, 237, 0.15))">
            <path d="M150 85C150 98.8071 138.807 110 125 110H75C61.1929 110 50 98.8071 50 85C50 71.1929 61.1929 60 75 60H130L150 50V85Z" fill="var(--accent)" />
            {/* Lines inside bubble 1 representing text */}
            <line x1="75" y1="80" x2="125" y2="80" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <line x1="75" y1="90" x2="110" y2="90" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
          </g>
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          Signal Clone
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>
          Select a conversation to start messaging, or create a new chat. Messages are end-to-end encrypted.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        <p>💡 <strong>Tip:</strong> Press <kbd className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>Cmd+K</kbd> to quickly search</p>
        <p>↵ Send · ⇧↵ New line</p>
      </div>

      <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>End-to-end encrypted (mocked)</span>
      </div>
    </div>
  );
}
