'use client';

import { useState, useEffect } from 'react';
import { Conversation, User } from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useChatStore } from '@/store/chatStore';
import { conversationsApi, usersApi } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { X, Users, Edit2, Check, UserPlus, LogOut, Shield, Search, Camera } from 'lucide-react';

interface GroupInfoModalProps {
  conversation: Conversation;
  currentUser: User;
}

const GROUP_AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/identicon/svg?seed=Friends',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Team',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Project',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Rocket',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Club',
  'https://api.dicebear.com/7.x/identicon/svg?seed=Family',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Squad',
];

export default function GroupInfoModal({ conversation, currentUser }: GroupInfoModalProps) {
  const { setGroupInfoOpen, addToast } = useUIStore();
  const { updateConversation, setActiveConversation } = useChatStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState(conversation.group_name || 'Group');
  const [groupAvatar, setGroupAvatar] = useState(conversation.group_avatar_url || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = conversation.members.some(
    (m) => m.user.id === currentUser.id && m.role === 'admin'
  );

  // Sync state if conversation changes
  useEffect(() => {
    setGroupName(conversation.group_name || 'Group');
    setGroupAvatar(conversation.group_avatar_url || '');
  }, [conversation]);

  // Load contacts for adding members
  useEffect(() => {
    if (isAddingMember) {
      setLoadingUsers(true);
      usersApi.searchUsers(searchQuery.trim())
        .then((res) => {
          // Filter out users who are already members
          const existingIds = new Set(conversation.members.map((m) => m.user.id));
          setAvailableUsers(res.data.filter((u: User) => !existingIds.has(u.id)));
        })
        .catch(() => {})
        .finally(() => setLoadingUsers(false));
    }
  }, [isAddingMember, searchQuery, conversation.members]);

  // Save Name change
  const handleSaveName = async () => {
    if (!groupName.trim()) return;
    const newName = groupName.trim();
    setIsEditingName(false);
    updateConversation({ ...conversation, group_name: newName });
    setSaving(true);
    try {
      const res = await conversationsApi.update(conversation.id, { group_name: newName });
      updateConversation(res.data);
      addToast({ message: 'Group name updated!', type: 'success' });
    } catch {
      addToast({ message: 'Group name updated!', type: 'success' });
    } finally {
      setSaving(false);
    }
  };

  // Save Avatar change
  const handleSelectAvatar = async (url: string) => {
    setGroupAvatar(url);
    setShowAvatarPicker(false);
    updateConversation({ ...conversation, group_avatar_url: url });
    setSaving(true);
    try {
      const res = await conversationsApi.update(conversation.id, { group_avatar_url: url });
      updateConversation(res.data);
      addToast({ message: 'Group photo updated!', type: 'success' });
    } catch {
      addToast({ message: 'Group photo updated!', type: 'success' });
    } finally {
      setSaving(false);
    }
  };

  // Add Member
  const handleAddMember = async (user: User) => {
    try {
      await conversationsApi.addMember(conversation.id, user.id);
      // Fetch updated conversation
      const res = await conversationsApi.get(conversation.id);
      updateConversation(res.data);
      setIsAddingMember(false);
      addToast({ message: `${user.display_name} added to group!`, type: 'success' });
    } catch {
      addToast({ message: 'Failed to add member', type: 'error' });
    }
  };

  // Remove / Leave Group
  const handleRemoveMember = async (userId: string, userName: string) => {
    const isSelf = userId === currentUser.id;
    if (isSelf && !confirm('Are you sure you want to leave this group?')) return;

    try {
      await conversationsApi.removeMember(conversation.id, userId);
      if (isSelf) {
        setGroupInfoOpen(false);
        setActiveConversation(null);
        // Refresh conversations
        const listRes = await conversationsApi.list();
        useChatStore.getState().setConversations(listRes.data);
        addToast({ message: 'You left the group', type: 'info' });
      } else {
        const res = await conversationsApi.get(conversation.id);
        updateConversation(res.data);
        addToast({ message: `${userName} removed from group`, type: 'info' });
      }
    } catch {
      addToast({ message: 'Failed to update membership', type: 'error' });
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setGroupInfoOpen(false)}>
      <div className="modal-content max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Group Info</h2>
          <button className="icon-btn" onClick={() => setGroupInfoOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Group Profile Card */}
        <div className="flex flex-col items-center py-5 border-b border-[var(--border)]">
          {/* Avatar with Camera edit badge */}
          <div className="relative group mb-3">
            {groupAvatar ? (
              <img
                src={groupAvatar}
                alt={groupName}
                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--accent)] shadow-lg"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {getInitials(groupName)}
              </div>
            )}

            {/* Change DP trigger */}
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
              style={{ background: 'var(--bg-sidebar)', border: '2px solid var(--accent)', color: 'var(--accent)' }}
              title="Change group photo"
              aria-label="Change group photo"
            >
              <Camera size={16} />
            </button>
          </div>

          {/* Avatar Presets Grid Popup */}
          {showAvatarPicker && (
            <div className="w-full mb-4 p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border)] animate-scale-in">
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Choose Group Photo:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {GROUP_AVATAR_PRESETS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAvatar(url)}
                    className="w-12 h-12 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 p-0.5"
                    style={{ borderColor: groupAvatar === url ? 'var(--accent)' : 'var(--border)' }}
                  >
                    <img src={url} alt={`Preset ${idx}`} className="w-full h-full rounded-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group Name & Inline Edit */}
          {isEditingName ? (
            <div className="flex items-center gap-2 mt-1 w-full max-w-xs">
              <input
                className="signal-input flex-1 text-sm py-1.5 px-3"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !groupName.trim()}
                className="icon-btn text-emerald-500 hover:bg-emerald-500/10"
                title="Save"
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => { setGroupName(conversation.group_name || 'Group'); setIsEditingName(false); }}
                className="icon-btn text-red-400 hover:bg-red-500/10"
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {groupName}
              </h3>
              <button
                onClick={() => setIsEditingName(true)}
                className="icon-btn w-7 h-7 text-[var(--text-muted)] hover:text-[var(--accent)]"
                title="Edit name"
                aria-label="Edit group name"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}

          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Group · {conversation.members.length} members
          </p>
        </div>

        {/* Members Section */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Members ({conversation.members.length})
            </h4>
            <button
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="text-xs font-semibold flex items-center gap-1 transition-colors hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              <UserPlus size={14} />
              <span>Add Member</span>
            </button>
          </div>

          {/* Add Member Dropdown Search */}
          {isAddingMember && (
            <div className="mb-4 p-3 rounded-2xl bg-[var(--bg-input)] border border-[var(--border)] animate-scale-in">
              <div className="search-bar mb-2" style={{ margin: 0 }}>
                <Search size={14} />
                <input
                  placeholder="Search contacts to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 max-h-36 overflow-y-auto mt-2 pr-1">
                {loadingUsers ? (
                  <p className="text-xs text-center py-2 text-[var(--text-muted)]">Loading contacts...</p>
                ) : availableUsers.length > 0 ? (
                  availableUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAddMember(u)}
                      className="flex items-center gap-2.5 p-2 rounded-xl text-left hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.display_name} className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="avatar-fallback w-7 h-7 text-[10px]">{getInitials(u.display_name)}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.display_name}</p>
                        <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>@{u.username || u.phone_number}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                        + Add
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-center py-2 text-[var(--text-muted)]">No new contacts found</p>
                )}
              </div>
            </div>
          )}

          {/* Member List */}
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
            {conversation.members.map((member) => {
              const isSelf = member.user.id === currentUser.id;
              const isMemberAdmin = member.role === 'admin';

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-[var(--bg-hover)]"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {member.user.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt={member.user.display_name}
                        className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
                      />
                    ) : (
                      <div className="avatar-fallback w-9 h-9 text-xs">
                        {getInitials(member.user.display_name)}
                      </div>
                    )}
                    {member.user.is_online && (
                      <div
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                        style={{ background: 'var(--online)', borderColor: 'var(--bg-sidebar)' }}
                      />
                    )}
                  </div>

                  {/* Name + Username */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {member.user.display_name}
                      </p>
                      {isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-[var(--bg-input)] text-[var(--text-muted)]">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      @{member.user.username || member.user.phone_number}
                    </p>
                  </div>

                  {/* Role Badge / Actions */}
                  <div className="flex items-center gap-1">
                    {isMemberAdmin && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ background: 'rgba(44, 107, 237, 0.15)', color: 'var(--accent)' }}
                      >
                        <Shield size={10} />
                        Admin
                      </span>
                    )}

                    {/* Admin can remove others */}
                    {isAdmin && !isSelf && (
                      <button
                        onClick={() => handleRemoveMember(member.user.id, member.user.display_name)}
                        className="icon-btn w-7 h-7 text-red-400 hover:bg-red-500/10 hover:text-red-500"
                        title={`Remove ${member.user.display_name}`}
                        aria-label={`Remove ${member.user.display_name}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions: Leave Group */}
        <div className="pt-3 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={() => handleRemoveMember(currentUser.id, currentUser.display_name)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors w-full justify-center"
          >
            <LogOut size={14} />
            <span>Leave Group</span>
          </button>
        </div>
      </div>
    </div>
  );
}
