import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse date string, treating native SQLite ISO datetimes (without offset/Z) as UTC
 */
export function parseDate(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d{2}:\d{2}$/)) {
    if (dateStr.includes('T') || dateStr.includes('-')) {
      return new Date(dateStr + 'Z');
    }
  }
  return new Date(dateStr);
}

/**
 * Format a message timestamp for display in conversation list or chat pane.
 * - Today: show time (e.g., "10:43 AM")
 * - Yesterday: "Yesterday"
 * - This week: day name (e.g., "Monday")
 * - Older: date (e.g., "Aug 12")
 */
export function formatMessageTime(dateStr: string): string {
  const date = parseDate(dateStr);
  if (isToday(date)) return format(date, 'h:mm a');
  if (isYesterday(date)) return 'Yesterday';
  const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (daysAgo < 7) return format(date, 'EEEE'); // e.g., "Monday"
  return format(date, 'MMM d'); // e.g., "Aug 12"
}

/**
 * Format relative time for "last seen" — e.g., "2 minutes ago"
 */
export function formatLastSeen(dateStr: string): string {
  try {
    return formatDistanceToNow(parseDate(dateStr), { addSuffix: true });
  } catch {
    return 'a while ago';
  }
}

/**
 * Get the display name for a conversation.
 * For DMs, returns the other user's display name.
 * For groups, returns the group name.
 */
export function getConversationName(
  conv: { type: string; group_name: string | null; members: Array<{ user: { display_name: string; id: string } }> },
  currentUserId: string
): string {
  if (conv.type === 'group') return conv.group_name || 'Group';
  const other = conv.members.find((m) => m.user.id !== currentUserId);
  return other?.user.display_name || 'Unknown';
}

/**
 * Get the avatar URL for a conversation.
 */
export function getConversationAvatar(
  conv: {
    type: string;
    group_avatar_url: string | null;
    members: Array<{ user: { avatar_url: string | null; id: string } }>;
  },
  currentUserId: string
): string | null {
  if (conv.type === 'group') return conv.group_avatar_url;
  const other = conv.members.find((m) => m.user.id !== currentUserId);
  return other?.user.avatar_url || null;
}

/**
 * Truncate a string for preview display
 */
export function truncate(str: string, maxLen = 40): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Get initials from a display name (for avatar fallback)
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Safely extract error message string from Axios error, handling string details
 * and list of Pydantic validation error objects.
 */
export function getErrorMessage(err: any): string {
  const detail = err.response?.data?.detail;
  if (!detail) return err.message || 'An error occurred';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => {
      const field = d.loc ? d.loc.filter((l: any) => l !== 'body').join('.') : 'field';
      return `${field}: ${d.msg}`;
    }).join(', ');
  }
  return typeof detail === 'object' ? JSON.stringify(detail) : String(detail);
}
