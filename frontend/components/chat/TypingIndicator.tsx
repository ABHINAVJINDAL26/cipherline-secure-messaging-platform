'use client';

import { Conversation } from '@/types';
import { getInitials } from '@/lib/utils';

interface TypingIndicatorProps {
  userIds: string[];
  conversation: Conversation;
  currentUserId: string;
}

export default function TypingIndicator({ userIds, conversation, currentUserId }: TypingIndicatorProps) {
  const typingMembers = conversation.members
    .filter((m) => userIds.includes(m.user.id) && m.user.id !== currentUserId)
    .slice(0, 3);

  if (typingMembers.length === 0) return null;

  const names = typingMembers.map((m) => m.user.display_name.split(' ')[0]);
  const label = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing`
    : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div className="flex items-end gap-2 mt-2 px-1 message-appear">
      {/* Avatars */}
      <div className="flex -space-x-2">
        {typingMembers.slice(0, 2).map((m) => (
          m.user.avatar_url ? (
            <img key={m.user.id} src={m.user.avatar_url} alt={m.user.display_name}
              className="w-7 h-7 rounded-full object-cover border-2"
              style={{ borderColor: 'var(--bg-chat)' }} />
          ) : (
            <div key={m.user.id} className="avatar-fallback w-7 h-7 text-[10px] border-2"
              style={{ borderColor: 'var(--bg-chat)' }}>
              {getInitials(m.user.display_name)}
            </div>
          )
        ))}
      </div>

      {/* Bubble with dots */}
      <div className="bubble-received py-3 px-4">
        <div className="typing-dots">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>

      <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
