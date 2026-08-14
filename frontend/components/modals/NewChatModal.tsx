'use client';

import { useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Load all contacts initially on mount
  useEffect(() => {
    setLoading(true);
    usersApi.searchUsers('')
      .then((res) => {
        setResults(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (q: string) => {
    setQuery(q);
    setLoading(true);
    try {
      const res = await usersApi.searchUsers(q.trim());
      setResults(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user: User) => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await conversationsApi.create({ type: 'direct', target_user_id: user.id });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setNewChatOpen(false);
    } catch {
      addToast({ message: 'Failed to start conversation', type: 'error' });
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setNewChatOpen(false)}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>New Chat</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Choose a contact to start messaging</p>
          </div>
          <button className="icon-btn" onClick={() => setNewChatOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="search-bar mb-3" style={{ margin: '0 0 12px 0' }}>
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
        <div className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
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
                type="button"
                className="flex items-center gap-3 p-2.5 rounded-xl transition-all text-left w-full cursor-pointer hover:bg-[var(--bg-hover)]"
                onClick={() => handleStartChat(user)}
                aria-label={`Start chat with ${user.display_name}`}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[var(--border)]"
                  />
                ) : (
                  <div className="avatar-fallback w-10 h-10 text-xs flex-shrink-0">
                    {getInitials(user.display_name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {user.display_name}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    @{user.username || user.phone_number}
                  </p>
                </div>
                <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
              </button>
            ))
          ) : (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
