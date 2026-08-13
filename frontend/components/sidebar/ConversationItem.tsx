'use client';

import { Conversation, User } from '@/types';
import { useChatStore } from '@/store/chatStore';
import { getConversationName, getConversationAvatar, formatMessageTime, truncate, getInitials } from '@/lib/utils';
import { CheckCheck, Check } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  currentUser: User;
  isActive: boolean;
  onClick: () => void;
}

function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <img src={src} alt={name} width={size} height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div className="avatar-fallback flex-shrink-0" style={{ width: size, height: size, fontSize: size / 3.5 }}>
      {getInitials(name)}
    </div>
  );
}

export default function ConversationItem({ conversation, currentUser, isActive, onClick }: ConversationItemProps) {
  const { typingUsers, onlineUsers } = useChatStore();

  const name = getConversationName(conversation, currentUser.id);
  const avatarSrc = getConversationAvatar(conversation, currentUser.id);
  const lastMsg = conversation.last_message;
  const typingInConv = typingUsers[conversation.id] || [];
  const isTyping = typingInConv.some((uid) => uid !== currentUser.id);

  // For DMs: check if other user is online
  const otherMember = conversation.type === 'direct'
    ? conversation.members.find((m) => m.user.id !== currentUser.id)
    : null;
  const isOtherOnline = otherMember ? onlineUsers[otherMember.user.id] ?? otherMember.user.is_online : false;

  // Last message preview
  const getLastMsgPreview = () => {
    if (isTyping) return '';
    if (!lastMsg) return 'No messages yet';
    if (lastMsg.is_deleted) return 'Message deleted';
    const prefix = lastMsg.sender_id === currentUser.id ? 'You: ' :
      (conversation.type === 'group' ? `${lastMsg.sender.display_name.split(' ')[0]}: ` : '');
    return prefix + (lastMsg.content || 'Attachment');
  };

  // Tick icon for sent messages
  const getTickIcon = () => {
    if (!lastMsg || lastMsg.sender_id !== currentUser.id) return null;
    const otherStatuses = lastMsg.statuses.filter((s) => s.user_id !== currentUser.id);
    const allRead = otherStatuses.length > 0 && otherStatuses.every((s) => s.status === 'read');
    const allDelivered = otherStatuses.some((s) => s.status === 'delivered' || s.status === 'read');
    if (allRead) return <CheckCheck size={14} className="tick-read flex-shrink-0" />;
    if (allDelivered) return <CheckCheck size={14} className="tick-delivered flex-shrink-0" />;
    return <Check size={14} className="tick-sent flex-shrink-0" />;
  };

  return (
    <div
      className={`conv-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Conversation with ${name}`}
    >
      {/* Avatar + online dot */}
      <div className="relative flex-shrink-0">
        <Avatar src={avatarSrc} name={name} size={48} />
        {conversation.type === 'direct' && isOtherOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: 'var(--online)', borderColor: isActive ? 'var(--bg-active)' : 'var(--bg-sidebar)' }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{name}</span>
          {lastMsg && (
            <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              {formatMessageTime(lastMsg.created_at)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {isTyping ? (
            <div className="flex items-center gap-1.5">
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
              <span className="text-xs" style={{ color: 'var(--accent)' }}>typing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 min-w-0">
              {getTickIcon()}
              <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {truncate(getLastMsgPreview(), 40)}
              </span>
            </div>
          )}

          {conversation.unread_count > 0 && (
            <div className="unread-badge">{conversation.unread_count > 99 ? '99+' : conversation.unread_count}</div>
          )}
        </div>
      </div>
    </div>
  );
}
