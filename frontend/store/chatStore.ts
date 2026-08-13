import { create } from 'zustand';
import { Conversation, Message, User } from '@/types';
import { parseDate } from '@/lib/utils';

interface TypingState {
  [conversationId: string]: string[]; // array of user IDs currently typing
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // conversationId → messages
  typingUsers: TypingState;
  onlineUsers: Record<string, boolean>; // userId → isOnline

  // Actions
  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  updateConversation: (conv: Conversation) => void;
  setActiveConversation: (id: string | null) => void;

  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessageStatus: (conversationId: string, messageId: string, userId: string, status: string) => void;
  updateMessageReaction: (conversationId: string, messageId: string, userId: string, emoji: string, action: 'added' | 'removed', reactionUser: User) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;

  markConversationRead: (conversationId: string) => void;
  updateLastMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typingUsers: {},
  onlineUsers: {},

  setConversations: (convs) => set({ conversations: convs }),

  addConversation: (conv) =>
    set((state) => ({
      conversations: [conv, ...state.conversations.filter((c) => c.id !== conv.id)],
    })),

  updateConversation: (conv) =>
    set((state) => ({
      conversations: state.conversations.map((c) => (c.id === conv.id ? conv : c)),
    })),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [conversationId]: messages },
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existing = state.messages[conversationId] || [];
      // Avoid duplicates
      if (existing.some((m) => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existing, message],
        },
      };
    }),

  updateMessageStatus: (conversationId, messageId, userId, status) =>
    set((state) => {
      const msgs = state.messages[conversationId] || [];
      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;
        const existingStatus = msg.statuses.find((s) => s.user_id === userId);
        if (existingStatus) {
          return {
            ...msg,
            statuses: msg.statuses.map((s) =>
              s.user_id === userId ? { ...s, status: status as any } : s
            ),
          };
        }
        return {
          ...msg,
          statuses: [...msg.statuses, { user_id: userId, status: status as any, updated_at: new Date().toISOString() }],
        };
      });
      return { messages: { ...state.messages, [conversationId]: updated } };
    }),

  updateMessageReaction: (conversationId, messageId, userId, emoji, action, reactionUser) =>
    set((state) => {
      const msgs = state.messages[conversationId] || [];
      const updated = msgs.map((msg) => {
        if (msg.id !== messageId) return msg;
        if (action === 'added') {
          const alreadyHas = msg.reactions.some((r) => r.user_id === userId && r.emoji === emoji);
          if (alreadyHas) return msg;
          return {
            ...msg,
            reactions: [
              ...msg.reactions,
              { id: `${userId}-${emoji}`, user_id: userId, emoji, user: reactionUser },
            ],
          };
        } else {
          return {
            ...msg,
            reactions: msg.reactions.filter((r) => !(r.user_id === userId && r.emoji === emoji)),
          };
        }
      });
      return { messages: { ...state.messages, [conversationId]: updated } };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = state.typingUsers[conversationId] || [];
      const updated = isTyping
        ? Array.from(new Set([...current, userId]))
        : current.filter((id) => id !== userId);
      return {
        typingUsers: { ...state.typingUsers, [conversationId]: updated },
      };
    }),

  setOnlineStatus: (userId, isOnline) =>
    set((state) => ({
      onlineUsers: { ...state.onlineUsers, [userId]: isOnline },
    })),

  markConversationRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ),
    })),

  updateLastMessage: (conversationId, message) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, last_message: message } : c
      ).sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return parseDate(bTime).getTime() - parseDate(aTime).getTime();
      }),
    })),
}));
