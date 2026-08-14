'use client';

import { Conversation, User } from '@/types';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { getConversationName, getConversationAvatar, formatLastSeen, getInitials } from '@/lib/utils';
import { ArrowLeft, Phone, Video, MoreVertical, Users } from 'lucide-react';

interface ChatHeaderProps {
  conversation: Conversation;
  currentUser: User;
}

export default function ChatHeader({ conversation, currentUser }: ChatHeaderProps) {
  const { typingUsers, onlineUsers } = useChatStore();
  const { addToast, setGroupInfoOpen } = useUIStore();
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const name = getConversationName(conversation, currentUser.id);
  const avatarSrc = getConversationAvatar(conversation, currentUser.id);

  // Typing in this conversation
  const typingInConv = (typingUsers[conversation.id] || []).filter((uid) => uid !== currentUser.id);
  const isTyping = typingInConv.length > 0;

  // Online status for DM
  const otherMember = conversation.type === 'direct'
    ? conversation.members.find((m) => m.user.id !== currentUser.id)
    : null;
  const isOtherOnline = otherMember
    ? onlineUsers[otherMember.user.id] ?? otherMember.user.is_online
    : false;

  const getSubtitle = () => {
    if (isTyping) return 'typing...';
    if (conversation.type === 'group') {
      return `${conversation.members.length} members · Tap for info`;
    }
    if (isOtherOnline) return 'Online';
    if (otherMember?.user.last_seen) return `Last seen ${formatLastSeen(otherMember.user.last_seen)}`;
    return '';
  };

  const comingSoon = (feature: string) => {
    addToast({ message: `${feature} — Coming Soon!`, type: 'info' });
  };

  const handleOpenInfo = () => {
    if (conversation.type === 'group') {
      setGroupInfoOpen(true);
    } else if (otherMember) {
      addToast({
        message: `${name} (@${otherMember.user.username || otherMember.user.phone_number})`,
        type: 'info',
        duration: 3000,
      });
    }
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-chat)' }}
    >
      {/* Mobile back button */}
      <button
        className="icon-btn md:hidden"
        onClick={() => setActiveConversation(null)}
        aria-label="Back"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Avatar (clickable for group info) */}
      <div
        className="relative flex-shrink-0 cursor-pointer transition-transform hover:scale-105"
        onClick={handleOpenInfo}
        title={conversation.type === 'group' ? 'View Group Info & Members' : 'View Contact Info'}
      >
        {avatarSrc ? (
          <img src={avatarSrc} alt={name} className="w-10 h-10 rounded-full object-cover border border-[var(--border)]" />
        ) : (
          <div className="avatar-fallback w-10 h-10 text-sm">{getInitials(name)}</div>
        )}
        {conversation.type === 'group' ? (
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)', border: '2px solid var(--bg-chat)' }}>
            <Users size={8} color="white" />
          </div>
        ) : isOtherOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: 'var(--online)', borderColor: 'var(--bg-chat)' }} />
        )}
      </div>

      {/* Name + subtitle (clickable for group info) */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={handleOpenInfo}
        title={conversation.type === 'group' ? 'View Group Info & Members' : 'View Contact Info'}
      >
        <h2 className="text-sm font-semibold truncate hover:text-[var(--accent)] transition-colors" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h2>
        <p className="text-xs truncate"
          style={{ color: isTyping ? 'var(--accent)' : 'var(--text-muted)' }}>
          {getSubtitle()}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1">
        <button className="icon-btn" onClick={() => comingSoon('Voice call')} aria-label="Voice Call">
          <Phone size={18} />
        </button>
        <button className="icon-btn" onClick={() => comingSoon('Video call')} aria-label="Video Call">
          <Video size={18} />
        </button>
        <button
          className="icon-btn"
          onClick={handleOpenInfo}
          aria-label="Group Details & Options"
          title="Group Details & Members"
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
