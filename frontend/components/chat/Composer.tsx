'use client';

import { useState, useRef, useCallback } from 'react';
import { User, Message } from '@/types';
import { wsClient } from '@/lib/websocket';
import { conversationsApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { X, SendHorizonal, Smile } from 'lucide-react';

interface ComposerProps {
  conversationId: string;
  currentUser: User;
  replyToMessageId?: string | null;
  replyToMessage?: Message;
  onCancelReply: () => void;
}

export default function Composer({ conversationId, currentUser, replyToMessageId, replyToMessage, onCancelReply }: ComposerProps) {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const EMOJI_LIST = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '🙃', '😉', '😌', '😍', '🥰', '😘', '😋', '😛', '😜', '🤪',
    '😎', '🥳', '🥺', '😭', '😤', '👍', '👎', '👏', '🙌', '🙏',
    '❤️', '💖', '🔥', '✨', '💯', '🚀', '🎉', '💡', '🌟', '🤝'
  ];

  const handleInsertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { addMessage, updateLastMessage } = useChatStore();

  const sendTypingStart = useCallback(() => {
    wsClient.sendTypingStart(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsClient.sendTypingStop(conversationId);
    }, 2000);
  }, [conversationId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTypingStart();
    // Auto-resize textarea
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    // Reset textarea height instantly
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Stop typing indicator
    wsClient.sendTypingStop(conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      sender: currentUser,
      content,
      reply_to_message_id: replyToMessageId || undefined,
      reply_to: replyToMessage || undefined,
      client_temp_id: tempId,
      is_deleted: false,
      created_at: new Date().toISOString(),
      statuses: [{ user_id: currentUser.id, status: 'sent', updated_at: new Date().toISOString() }],
      reactions: [],
    };

    // 1. Optimistic UI: Add immediately
    addMessage(conversationId, tempMessage);
    updateLastMessage(conversationId, tempMessage);
    onCancelReply();
    setText('');
    textareaRef.current?.focus();

    // 2. Send in background
    try {
      const res = await conversationsApi.sendMessage(conversationId, {
        content,
        reply_to_message_id: replyToMessageId || undefined,
        client_temp_id: tempId,
      });
      // 3. Replace temp message with real message
      useChatStore.getState().replaceTempMessage(conversationId, tempId, res.data);
      updateLastMessage(conversationId, res.data);
    } catch (err) {
      console.error('Failed to send message', err);
      // Optional: Add a failed status or show a toast
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="flex-shrink-0"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-chat)' }}
    >
      {/* Reply preview */}
      {replyToMessage && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-l-4"
          style={{ borderColor: 'var(--accent)', background: 'var(--bg-input)' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              {replyToMessage.sender.display_name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {replyToMessage.content}
            </p>
          </div>
          <button className="icon-btn w-6 h-6" onClick={onCancelReply}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Composer row */}
      <div className="flex items-end gap-3 px-4 py-3 relative">
        {/* Emoji button & Picker */}
        <div className="relative">
          <button
            className="icon-btn flex-shrink-0 mb-1"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Emoji"
            title="Choose emoji"
          >
            <Smile size={20} style={{ color: showEmojiPicker ? 'var(--accent)' : 'var(--text-muted)' }} />
          </button>

          {/* Emoji Picker Popup */}
          {showEmojiPicker && (
            <div
              className="absolute bottom-12 left-0 z-30 p-3 rounded-2xl shadow-2xl grid grid-cols-8 gap-1.5 w-64 max-h-48 overflow-y-auto"
              style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}
            >
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleInsertEmoji(emoji)}
                  className="text-lg hover:scale-125 transition-transform w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-hover)]"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text area */}
        <div
          className="flex-1 flex items-end rounded-2xl px-3"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={textareaRef}
            className="composer-input"
            placeholder="Message"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            aria-label="Message input"
            aria-multiline="true"
          />
        </div>

        {/* Send button */}
        <button
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full transition-all duration-150"
          style={{
            background: text.trim() ? 'var(--accent)' : 'var(--bg-input)',
            color: text.trim() ? '#fff' : 'var(--text-muted)',
            transform: text.trim() ? 'scale(1)' : 'scale(0.9)',
          }}
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label="Send message"
        >
          <SendHorizonal size={18} />
        </button>
      </div>

      <p className="text-center text-[10px] pb-2" style={{ color: 'var(--text-muted)' }}>
        Enter to send · Shift+Enter for new line · End-to-end encrypted
      </p>
    </div>
  );
}
