'use client';

import { User } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { getInitials } from '@/lib/utils';

interface LeftRailProps {
  user: User;
  onLogout: () => void;
}

const NavIcon = ({ onClick, active, tooltip, children }: {
  onClick?: () => void; active?: boolean; tooltip: string; children: React.ReactNode;
}) => (
  <div className="relative group">
    <button
      onClick={onClick}
      className="icon-btn w-10 h-10 transition-all duration-150"
      style={{
        background: active ? 'var(--accent-light)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        borderRadius: '12px',
      }}
    >
      {children}
    </button>
    {/* Tooltip */}
    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
      style={{ background: 'var(--bg-hover)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
      {tooltip}
    </div>
  </div>
);

export default function LeftRail({ user, onLogout }: LeftRailProps) {
  const { setNewChatOpen, setNewGroupOpen, setSettingsOpen, addToast } = useUIStore();
  const { activeConversationId } = useChatStore();

  const comingSoon = (feature: string) => {
    addToast({ message: `${feature} — Coming Soon!`, type: 'info' });
  };

  return (
    <div className="left-rail">
      {/* Signal Logo */}
      <div className="flex items-center justify-center w-10 h-10 rounded-xl mb-2"
        style={{ background: 'var(--accent)' }}>
        <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
          <path d="M32 10C24.27 10 18 16.27 18 24v6H14v26h36V30h-4v-6c0-7.73-6.27-14-14-14zm0 4c5.52 0 10 4.48 10 10v6H22v-6c0-5.52 4.48-10 10-10zm0 18a4 4 0 110 8 4 4 0 010-8z" fill="white"/>
        </svg>
      </div>

      <div className="w-6 h-px my-1" style={{ background: 'var(--border)' }} />

      {/* Chats */}
      <NavIcon tooltip="Chats" active={true}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </NavIcon>

      {/* Stories */}
      <NavIcon tooltip="Stories — Coming Soon" onClick={() => comingSoon('Stories')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/>
        </svg>
      </NavIcon>

      {/* Calls */}
      <NavIcon tooltip="Calls — Coming Soon" onClick={() => comingSoon('Calls')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.4 19.79 19.79 0 0 1 1.61 4.77C1.60 3.7 2.38 2.83 3.43 2H6.4a2 2 0 0 1 2 1.72c.127.96.36 1.905.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.905.34 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/>
        </svg>
      </NavIcon>

      {/* Spacer */}
      <div className="flex-1" />

      {/* New Chat */}
      <NavIcon tooltip="New Chat" onClick={() => setNewChatOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </NavIcon>

      {/* Settings */}
      <NavIcon tooltip="Settings" onClick={() => setSettingsOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </NavIcon>

      {/* User avatar */}
      <div className="relative cursor-pointer mt-1" onClick={() => setSettingsOpen(true)}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.display_name}
            className="w-10 h-10 rounded-full object-cover border-2"
            style={{ borderColor: 'var(--border)' }} />
        ) : (
          <div className="avatar-fallback w-10 h-10 text-sm">
            {getInitials(user.display_name)}
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: 'var(--online)', borderColor: 'var(--bg-sidebar)' }} />
      </div>
    </div>
  );
}
