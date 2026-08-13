'use client';

import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { usersApi, conversationsApi } from '@/lib/api';
import { User } from '@/types';
import { X, Search, Check, Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function NewGroupModal() {
  const { setNewGroupOpen, addToast } = useUIStore();
  const { addConversation, setActiveConversation } = useChatStore();
  const [step, setStep] = useState<'members' | 'name'>('members');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

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

  const toggleSelect = (user: User) => {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setCreating(true);
    try {
      const res = await conversationsApi.create({
        type: 'group',
        group_name: groupName,
        member_ids: selected.map((u) => u.id),
      });
      addConversation(res.data);
      setActiveConversation(res.data.id);
      setNewGroupOpen(false);
      addToast({ message: `Group "${groupName}" created!`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to create group', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setNewGroupOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {step === 'members' ? 'New Group' : 'Name your group'}
          </h2>
          <button className="icon-btn" onClick={() => setNewGroupOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === 'members' ? (
          <>
            {/* Selected users chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-2 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                {selected.map((u) => (
                  <div key={u.id} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                    style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    <span>{u.display_name.split(' ')[0]}</span>
                    <button onClick={() => toggleSelect(u)} aria-label={`Remove ${u.display_name}`}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="search-bar mb-4" style={{ margin: '0 0 12px 0' }}>
              <Search size={16} />
              <input placeholder="Search users to add..." value={query}
                onChange={(e) => handleSearch(e.target.value)} autoFocus />
            </div>

            {/* Results */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {results.map((user) => {
                const isSelected = selected.some((u) => u.id === user.id);
                return (
                  <button key={user.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left"
                    style={{ background: isSelected ? 'var(--accent-light)' : 'transparent' }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => toggleSelect(user)}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="avatar-fallback w-9 h-9 text-xs">{getInitials(user.display_name)}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.display_name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{user.username}</p>
                    </div>
                    {isSelected && <Check size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              className="btn-primary w-full mt-4"
              disabled={selected.length === 0}
              onClick={() => setStep('name')}
            >
              Next ({selected.length} selected)
            </button>
          </>
        ) : (
          <>
            {/* Group name step */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                <Users size={32} style={{ color: 'var(--accent)' }} />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              {selected.slice(0, 3).map((u) => (
                u.avatar_url ? (
                  <img key={u.id} src={u.avatar_url} alt={u.display_name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div key={u.id} className="avatar-fallback w-8 h-8 text-xs">{getInitials(u.display_name)}</div>
                )
              ))}
              {selected.length > 3 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{selected.length - 3} more</span>
              )}
            </div>

            <input
              className="signal-input mb-4"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />

            <div className="flex gap-3">
              <button className="btn-ghost flex-1" onClick={() => setStep('members')}>Back</button>
              <button className="btn-primary flex-1" disabled={!groupName.trim() || creating} onClick={handleCreate}>
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
