'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { usersApi, conversationsApi } from '@/lib/api';
import { User } from '@/types';
import { X, Search, Check, Users, ArrowLeft, Plus } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function NewGroupModal() {
  const { setNewGroupOpen, addToast } = useUIStore();
  const { addConversation, setActiveConversation } = useChatStore();
  const [step, setStep] = useState<'members' | 'name'>('members');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Load all users initially on mount so member list is immediately visible
  useEffect(() => {
    setLoading(true);
    usersApi.searchUsers('')
      .then((res) => {
        setResults(res.data);
      })
      .catch(() => {
        addToast({ message: 'Failed to load contacts', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [addToast]);

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
        group_name: groupName.trim(),
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
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {step === 'name' && (
              <button
                className="icon-btn -ml-1"
                onClick={() => setStep('members')}
                aria-label="Back to member selection"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {step === 'members' ? 'New Group' : 'Name This Group'}
              </h2>
              {step === 'members' && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selected.length > 0 ? `${selected.length} members selected` : 'Select contacts to add'}
                </p>
              )}
            </div>
          </div>
          <button className="icon-btn" onClick={() => setNewGroupOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {step === 'members' ? (
          <>
            {/* Selected users horizontal pill list */}
            {selected.length > 0 && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-xl overflow-x-auto" style={{ background: 'var(--bg-input)' }}>
                {selected.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 animate-scale-in"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    <span>{u.display_name.split(' ')[0]}</span>
                    <button
                      onClick={() => toggleSelect(u)}
                      className="hover:opacity-80 transition-opacity"
                      aria-label={`Remove ${u.display_name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="search-bar mb-3" style={{ margin: '0 0 12px 0' }}>
              <Search size={16} />
              <input
                placeholder="Search name or @username..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                aria-label="Search users to add"
              />
            </div>

            {/* Contacts list */}
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
                    <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="skeleton h-3 w-32 rounded" />
                      <div className="skeleton h-2 w-20 rounded" />
                    </div>
                  </div>
                ))
              ) : results.length > 0 ? (
                results.map((user) => {
                  const isSelected = selected.some((u) => u.id === user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      className="flex items-center gap-3 p-2.5 rounded-xl transition-all text-left w-full cursor-pointer"
                      style={{
                        background: isSelected ? 'var(--bg-hover)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => toggleSelect(user)}
                    >
                      {/* Avatar */}
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

                      {/* Name + Username */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {user.display_name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          @{user.username || user.phone_number}
                        </p>
                      </div>

                      {/* Selection Checkbox Pill */}
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center transition-colors border"
                        style={{
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                          color: '#fff',
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <p className="text-sm">No contacts found</p>
                </div>
              )}
            </div>

            {/* Next button */}
            <button
              type="button"
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              disabled={selected.length === 0}
              onClick={() => setStep('name')}
            >
              <span>Next</span>
              {selected.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                  {selected.length}
                </span>
              )}
            </button>
          </>
        ) : (
          <>
            {/* Step 2: Group Name & Creation */}
            <div className="flex flex-col items-center justify-center my-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner mb-3"
                style={{ background: 'var(--bg-input)', border: '2px dashed var(--accent)' }}
              >
                <Users size={36} style={{ color: 'var(--accent)' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Group with {selected.length} members
              </p>
            </div>

            {/* Selected Avatars Preview */}
            <div className="flex items-center justify-center gap-1 mb-4 flex-wrap max-w-xs mx-auto">
              {selected.slice(0, 6).map((u) => (
                u.avatar_url ? (
                  <img
                    key={u.id}
                    src={u.avatar_url}
                    alt={u.display_name}
                    title={u.display_name}
                    className="w-7 h-7 rounded-full object-cover border border-[var(--border)]"
                  />
                ) : (
                  <div key={u.id} className="avatar-fallback w-7 h-7 text-[10px]" title={u.display_name}>
                    {getInitials(u.display_name)}
                  </div>
                )
              ))}
              {selected.length > 6 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                  +{selected.length - 6}
                </span>
              )}
            </div>

            {/* Group Name Input */}
            <input
              className="signal-input mb-4"
              placeholder="Enter group name (e.g. Project Alpha)..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
              aria-label="Group name"
            />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-ghost flex-1"
                onClick={() => setStep('members')}
              >
                Back
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={!groupName.trim() || creating}
                onClick={handleCreate}
              >
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
