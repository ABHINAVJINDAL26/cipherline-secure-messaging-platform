'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useUIStore } from '@/store/uiStore';
import { conversationsApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';
import { WSEvent, User } from '@/types';

// Components
import LeftRail from '@/components/sidebar/LeftRail';
import ConversationList from '@/components/sidebar/ConversationList';
import ChatPane from '@/components/chat/ChatPane';
import EmptyChatState from '@/components/chat/EmptyChatState';
import ToastContainer from '@/components/shared/ToastContainer';
import NewChatModal from '@/components/modals/NewChatModal';
import NewGroupModal from '@/components/modals/NewGroupModal';
import SettingsPanel from '@/components/modals/SettingsPanel';
import GroupInfoModal from '@/components/modals/GroupInfoModal';
import CommandPalette from '@/components/shared/CommandPalette';

export default function ChatsPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, logout } = useAuthStore();
  const {
    conversations, setConversations, addMessage, updateMessageStatus, setTyping,
    setOnlineStatus, updateLastMessage, activeConversationId, addConversation
  } = useChatStore();
  const { isNewChatOpen, isNewGroupOpen, isSettingsOpen, isGroupInfoOpen, commandPaletteOpen, addToast } = useUIStore();

  // Guard: redirect if not authenticated.
  // Small delay lets Zustand persist middleware rehydrate from localStorage before we check.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace('/login');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [router]);

  // Load conversations on mount & keep in sync periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const fetchConversations = () => {
      conversationsApi.list().then((res) => {
        if (isMounted) setConversations(res.data);
      }).catch(() => {});
    };

    fetchConversations();

    // 4s Background Sync
    const interval = setInterval(fetchConversations, 4000);

    // Focus & Visibility refresh
    const handleFocus = () => fetchConversations();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAuthenticated, setConversations]);

  // Connect WebSocket
  useEffect(() => {
    if (!user || !token) return;
    wsClient.connect(user.id, token);
    return () => { /* Don't disconnect on page re-render — keep connection alive */ };
  }, [user, token]);

  // Handle WebSocket events
  const handleWSEvent = useCallback((event: WSEvent) => {
    switch (event.type) {
      case 'message:new': {
        const msg = event.message;
        addMessage(msg.conversation_id, msg);
        updateLastMessage(msg.conversation_id, msg);
        // Show toast if message is from another user and not in active chat
        if (msg.sender_id !== user?.id && msg.conversation_id !== activeConversationId) {
          addToast({
            message: `${msg.sender.display_name}: ${msg.content?.slice(0, 50) || 'Attachment'}`,
            type: 'info',
            duration: 4000,
          });
        }
        break;
      }
      case 'message:status_update': {
        // Find conversation for this message (search through all)
        const { message_id, user_id, status } = event;
        // Update in all conversations (we don't know which one without a lookup)
        const allConvIds = Object.keys(useChatStore.getState().messages);
        for (const convId of allConvIds) {
          updateMessageStatus(convId, message_id, user_id, status);
        }
        break;
      }
      case 'typing:start':
        setTyping(event.conversation_id, event.user_id, true);
        // Auto-clear typing indicator after 3s if no stop event
        setTimeout(() => setTyping(event.conversation_id, event.user_id, false), 3000);
        break;
      case 'typing:stop':
        setTyping(event.conversation_id, event.user_id, false);
        break;
      case 'presence:update':
        setOnlineStatus(event.user_id, event.is_online);
        break;
    }
  }, [user, activeConversationId, addMessage, updateLastMessage, updateMessageStatus, setTyping, setOnlineStatus, addToast]);

  useEffect(() => {
    const unsub = wsClient.on(handleWSEvent);
    return unsub;
  }, [handleWSEvent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const { setCommandPaletteOpen } = useUIStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        useUIStore.getState().setNewChatOpen(false);
        useUIStore.getState().setNewGroupOpen(false);
        useUIStore.getState().setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="app-shell">
      {/* Left navigation rail */}
      <LeftRail user={user} onLogout={logout} />

      {/* Conversation list pane */}
      <div className="chat-list-pane">
        <ConversationList currentUser={user} />
      </div>

      {/* Main chat pane */}
      <div className={`chat-pane ${activeConversationId ? 'mobile-open' : ''}`}>
        {activeConversationId ? (
          <ChatPane conversationId={activeConversationId} currentUser={user} />
        ) : (
          <EmptyChatState />
        )}
      </div>

      {/* Modals */}
      {isNewChatOpen && <NewChatModal />}
      {isNewGroupOpen && <NewGroupModal />}
      {isSettingsOpen && <SettingsPanel user={user} />}
      {isGroupInfoOpen && activeConversationId && (
        (() => {
          const activeConv = conversations.find((c) => c.id === activeConversationId);
          return activeConv && activeConv.type === 'group' ? (
            <GroupInfoModal conversation={activeConv} currentUser={user} />
          ) : null;
        })()
      )}
      {commandPaletteOpen && <CommandPalette />}

      {/* Global toasts */}
      <ToastContainer />
    </div>
  );
}
