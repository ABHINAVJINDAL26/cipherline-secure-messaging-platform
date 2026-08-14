'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { conversationsApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { Conversation, User } from '@/types';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import TypingIndicator from './TypingIndicator';
import { parseDate } from '@/lib/utils';

interface ChatPaneProps {
  conversationId: string;
  currentUser: User;
}

export default function ChatPane({ conversationId, currentUser }: ChatPaneProps) {
  const { messages, setMessages, conversations, typingUsers, markConversationRead } = useChatStore();
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === conversationId);
  const convMessages = messages[conversationId] || [];
  const typingInConv = (typingUsers[conversationId] || []).filter((uid) => uid !== currentUser.id);

  // Load message history & keep in sync with background polling fallback
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchMessages = async (silent = false) => {
      try {
        const res = await conversationsApi.getMessages(conversationId, 50);
        if (isMounted) {
          setMessages(conversationId, res.data);
          markConversationRead(conversationId);
        }
      } catch (e) {
        // silent
      } finally {
        if (isMounted && !silent) setLoading(false);
      }
    };

    // Initial load
    fetchMessages(false);

    // 2.5s Background Sync Interval (handles WebSocket drops, sleeping server, or background tab)
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 2500);

    // Re-fetch instantly on window focus or tab visibility
    const handleFocus = () => fetchMessages(true);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [convMessages.length, conversationId]);

  // Group messages by sender (consecutive messages within 60s = grouped)
  const shouldShowAvatar = (idx: number) => {
    if (idx === 0) return true;
    const curr = convMessages[idx];
    const prev = convMessages[idx - 1];
    if (curr.sender_id !== prev.sender_id) return true;
    const timeDiff = parseDate(curr.created_at).getTime() - parseDate(prev.created_at).getTime();
    return timeDiff > 60 * 1000; // 60 seconds
  };

  const shouldShowTimestamp = (idx: number) => {
    if (idx === 0) return true;
    const curr = convMessages[idx];
    const prev = convMessages[idx - 1];
    const timeDiff = parseDate(curr.created_at).getTime() - parseDate(prev.created_at).getTime();
    return timeDiff > 5 * 60 * 1000; // Show timestamp every 5 minutes
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="skeleton w-full h-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader conversation={conversation} currentUser={currentUser} />

      {/* Messages Area */}
      <div
        ref={containerRef}
        className="messages-container flex-1"
        aria-live="polite"
        aria-label="Messages"
      >
        {loading ? (
          // Skeleton loaders
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} my-1`}>
              <div className="skeleton h-10 rounded-2xl" style={{ width: `${100 + Math.random() * 150}px` }} />
            </div>
          ))
        ) : (
          convMessages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.sender_id === currentUser.id}
              showAvatar={shouldShowAvatar(idx) && conversation.type === 'group'}
              showTimestamp={shouldShowTimestamp(idx)}
              isGrouped={!shouldShowAvatar(idx)}
              onReply={() => setReplyTo(msg.id)}
              conversationId={conversationId}
              currentUserId={currentUser.id}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingInConv.length > 0 && (
          <TypingIndicator userIds={typingInConv} conversation={conversation} currentUserId={currentUser.id} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <Composer
        conversationId={conversationId}
        currentUser={currentUser}
        replyToMessageId={replyTo}
        replyToMessage={replyTo ? convMessages.find((m) => m.id === replyTo) : undefined}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
