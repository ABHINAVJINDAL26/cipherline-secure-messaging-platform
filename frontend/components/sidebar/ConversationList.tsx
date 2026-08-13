'use client';

import { useEffect, useState } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { conversationsApi } from '@/lib/api';
import { Conversation, User } from '@/types';
import ConversationItem from './ConversationItem';
import { Search, Plus, Users } from 'lucide-react';

interface ConversationListProps {
  currentUser: User;
}

export default function ConversationList({ currentUser }: ConversationListProps) {
  const { conversations, setConversations, setActiveConversation, activeConversationId } = useChatStore();
  const { setNewChatOpen, setNewGroupOpen } = useUIStore();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    conversationsApi.list()
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = conversations.filter((conv) => {
    if (!search) return true;
    const q = search.toLowerCase();
    if (conv.type === 'group') return conv.group_name?.toLowerCase().includes(q);
    const other = conv.members.find((m) => m.user.id !== currentUser.id);
    return other?.user.display_name.toLowerCase().includes(q) ||
      other?.user.username?.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Chats</h1>
        <div className="flex items-center gap-1">
          <button className="icon-btn" onClick={() => setNewGroupOpen(true)} title="New Group">
            <Users size={18} />
          </button>
          <button className="icon-btn" onClick={() => setNewChatOpen(true)} title="New Chat">
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar mx-4 mb-2">
        <Search size={16} />
        <input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search conversations"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-2 w-48 rounded" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-input)' }}>
              <Search size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {search ? 'No conversations found' : 'No chats yet. Start one!'}
            </p>
            {!search && (
              <button className="btn-primary text-xs px-4 py-2" onClick={() => setNewChatOpen(true)}>
                Start a Chat
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              currentUser={currentUser}
              isActive={conv.id === activeConversationId}
              onClick={() => setActiveConversation(conv.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
