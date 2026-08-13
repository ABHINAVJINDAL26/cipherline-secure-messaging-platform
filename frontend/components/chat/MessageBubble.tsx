'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, User } from '@/types';
import { format } from 'date-fns';
import { Check, CheckCheck, Reply, Smile } from 'lucide-react';
import { conversationsApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { getInitials, parseDate } from '@/lib/utils';

const EMOJI_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  isGrouped: boolean;
  onReply: () => void;
  conversationId: string;
  currentUserId: string;
}

function TickIcon({ status }: { status: string }) {
  if (status === 'read') return <CheckCheck size={12} className="tick-read" />;
  if (status === 'delivered') return <CheckCheck size={12} className="tick-delivered" />;
  return <Check size={12} className="tick-sent" />;
}

function getMyStatus(message: Message, currentUserId: string): string {
  const otherStatuses = message.statuses.filter((s) => s.user_id !== currentUserId);
  if (otherStatuses.length === 0) return 'sent';
  if (otherStatuses.every((s) => s.status === 'read')) return 'read';
  if (otherStatuses.some((s) => s.status === 'delivered' || s.status === 'read')) return 'delivered';
  return 'sent';
}

export default function MessageBubble({
  message, isMine, showAvatar, showTimestamp, isGrouped, onReply, conversationId, currentUserId
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { updateMessageReaction } = useChatStore();

  const handleReaction = async (emoji: string) => {
    try {
      const res = await conversationsApi.addReaction(conversationId, message.id, emoji);
      const action = res.data.action as 'added' | 'removed';
      // Optimistic update (find current user from message data)
      const currentUser = message.sender; // fallback
      updateMessageReaction(conversationId, message.id, currentUserId, emoji, action, currentUser);
    } catch {}
    setShowEmojiPicker(false);
  };

  const myStatus = getMyStatus(message, currentUserId);

  if (message.is_deleted) {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-2'}`}>
        <div className="px-4 py-2 rounded-2xl italic text-sm"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'} message-appear`}>
      {/* Timestamp separator */}
      {showTimestamp && (
        <div className="self-center my-3 px-3 py-1 rounded-full text-xs"
          style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
          {format(parseDate(message.created_at), 'MMM d, yyyy h:mm a')}
        </div>
      )}

      <div
        className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%] group`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowEmojiPicker(false); }}
      >
        {/* Avatar (groups, received messages) */}
        {showAvatar && !isMine ? (
          <div className="flex-shrink-0 mb-1">
            {message.sender.avatar_url ? (
              <img src={message.sender.avatar_url} alt={message.sender.display_name}
                className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="avatar-fallback w-7 h-7 text-[10px]">{getInitials(message.sender.display_name)}</div>
            )}
          </div>
        ) : !isMine && <div className="w-7" />}

        <div className="flex flex-col">
          {/* Sender name (group received messages) */}
          {showAvatar && !isMine && (
            <span className="text-xs font-medium mb-0.5 px-1" style={{ color: 'var(--accent)' }}>
              {message.sender.display_name}
            </span>
          )}

          {/* Reply-to preview */}
          {message.reply_to && (
            <div className="mb-1 px-3 py-1.5 rounded-lg border-l-4 text-xs opacity-70"
              style={{ borderColor: 'var(--accent)', background: isMine ? 'rgba(255,255,255,0.1)' : 'var(--bg-hover)' }}>
              <span className="font-semibold">{message.reply_to.sender.display_name}</span>
              <p className="truncate">{message.reply_to.content}</p>
            </div>
          )}

          {/* Main bubble */}
          <div className={isMine ? 'bubble-sent' : 'bubble-received'} style={{ position: 'relative' }}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>

            {/* Time + tick */}
            <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] opacity-70">
                {format(parseDate(message.created_at), 'h:mm a')}
              </span>
              {isMine && <TickIcon status={myStatus} />}
            </div>
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(
                message.reactions.reduce((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([emoji, count]) => (
                <button key={emoji} onClick={() => handleReaction(emoji)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                  {emoji} {count > 1 && <span style={{ color: 'var(--text-muted)' }}>{count}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Hover / Tap actions */}
        <div className={`flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity self-center ${isMine ? 'flex-row' : 'flex-row-reverse'}`}>
            <button className="icon-btn w-7 h-7" onClick={onReply} title="Reply">
              <Reply size={14} />
            </button>
            <div className="relative">
              <button className="icon-btn w-7 h-7" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="React">
                <Smile size={14} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-8 z-20 flex gap-1 p-2 rounded-xl shadow-lg"
                  style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', [isMine ? 'right' : 'left']: 0 }}>
                  {EMOJI_REACTIONS.map((emoji) => (
                    <button key={emoji} onClick={() => handleReaction(emoji)}
                      className="text-lg hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-hover)]">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}
