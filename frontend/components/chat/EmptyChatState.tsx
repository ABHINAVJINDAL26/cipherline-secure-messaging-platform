'use client';

export default function EmptyChatState() {
  return (
    <div className="empty-state">
      {/* Signal lock illustration */}
      <div className="flex items-center justify-center w-24 h-24 rounded-3xl mb-2" style={{ background: 'var(--accent-light)' }}>
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
          <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="var(--accent)"/>
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
