'use client';

import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { Conversation } from '@/types';
import { Search, X, MessageSquare } from 'lucide-react';
import { getConversationName, getConversationAvatar, getInitials } from '@/lib/utils';

export default function CommandPalette() {
  const { setCommandPaletteOpen } = useUIStore();
  const { conversations, setActiveConversation } = useChatStore();
  const { user } = useAuthStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!user) return null;

  const filtered = conversations.filter((conv) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const name = getConversationName(conv, user.id);
    return name.toLowerCase().includes(q);
  }).slice(0, 8);

  const handleSelect = (conv: Conversation) => {
    setActiveConversation(conv.id);
    setCommandPaletteOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setCommandPaletteOpen(false)}>
      <div className="rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', marginTop: '15vh' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text-primary)' }}
            placeholder="Jump to a conversation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search conversations"
          />
          <button className="icon-btn w-6 h-6" onClick={() => setCommandPaletteOpen(false)} aria-label="Close command palette">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="py-2">
          {filtered.length > 0 ? (
            filtered.map((conv) => {
              const name = getConversationName(conv, user.id);
              const avatarSrc = getConversationAvatar(conv, user.id);
              return (
                <button
                  key={conv.id}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => handleSelect(conv)}
                  aria-label={`Open conversation with ${name}`}
                >
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="avatar-fallback w-8 h-8 text-xs flex-shrink-0">{getInitials(name)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {conv.type === 'group' ? `${conv.members.length} members` : 'Direct message'}
                    </p>
                  </div>
                  <MessageSquare size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </button>
              );
            })
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2 flex items-center gap-4 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          <span><kbd className="px-1 font-mono rounded" style={{ border: '1px solid var(--border)' }}>↑↓</kbd> navigate</span>
          <span><kbd className="px-1 font-mono rounded" style={{ border: '1px solid var(--border)' }}>↵</kbd> open</span>
          <span><kbd className="px-1 font-mono rounded" style={{ border: '1px solid var(--border)' }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
