// Signal Clone — TypeScript Types
// Matches the backend Pydantic schemas exactly

export type ConversationType = 'direct' | 'group';
export type MemberRole = 'member' | 'admin';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface User {
  id: string;
  phone_number: string | null;
  username: string | null;
  display_name: string;
  avatar_url: string | null;
  about_status: string | null;
  is_online: boolean;
  last_seen: string; // ISO datetime
  created_at: string;
}

export interface MessageStatusEntry {
  user_id: string;
  status: MessageStatus;
  updated_at: string;
}

export interface MessageReaction {
  id: string;
  user_id: string;
  emoji: string;
  user: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: User;
  content?: string;
  attachment_url?: string;
  reply_to_message_id?: string;
  reply_to?: Message;
  client_temp_id?: string; // Used for optimistic UI replacement
  is_deleted: boolean;
  expires_at?: string;
  created_at: string;
  statuses: MessageStatusEntry[];
  reactions: MessageReaction[];
}

export interface ConversationMember {
  id: string;
  user: User;
  role: MemberRole;
  is_muted: boolean;
  is_pinned: boolean;
  joined_at: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  group_name: string | null;
  group_avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  members: ConversationMember[];
  last_message: Message | null;
  unread_count: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Contact {
  id: string;
  contact_user: User;
  nickname: string | null;
  created_at: string;
}

// WebSocket event types
export type WSEvent =
  | { type: 'message:new'; message: Message }
  | { type: 'message:status_update'; message_id: string; user_id: string; status: MessageStatus }
  | { type: 'message:reaction'; message_id: string; user_id: string; emoji: string; action: 'added' | 'removed' }
  | { type: 'typing:start'; conversation_id: string; user_id: string }
  | { type: 'typing:stop'; conversation_id: string; user_id: string }
  | { type: 'presence:update'; user_id: string; is_online: boolean; last_seen: string }
  | { type: 'pong' };
