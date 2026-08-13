'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { usersApi, conversationsApi } from '@/lib/api';
import { User } from '@/types';
import { X, Search, MessageSquare } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function NewChatModal() {
  const { setNewChatOpen, addToast } = useUIStore();
  const { addConversation, setActiveConversation } = useChatStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await usersApi.searchUsers(q);
      setResults(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      const res = await conversationsApi.create({ type: 'direct', target_user_id: user.id });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setNewChatOpen(false);
    } catch {
      addToast({ message: 'Failed to start conversation', type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setNewChatOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Chat</h2>
          <button className="icon-btn" onClick={() => setNewChatOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="search-bar mb-4" style={{ margin: '0 0 16px 0' }}>
          <Search size={16} />
          <input
            placeholder="Search by username or name..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            aria-label="Search users"
          />
        </div>

        {/* Results */}
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="skeleton h-3 w-28 rounded" />
                  <div className="skeleton h-2 w-20 rounded" />
                </div>
              </div>
            ))
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onClick={() => handleStartChat(user)}
                aria-label={`Start chat with ${user.display_name}`}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="avatar-fallback w-10 h-10 text-sm">{getInitials(user.display_name)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user.display_name}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{user.username || user.phone_number}</p>
                </div>
                <MessageSquare size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))
          ) : query ? (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No users found for "{query}"</p>
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">Type to search for users</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
