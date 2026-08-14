import { WSEvent } from '@/types';

function getWsUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws');
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:8000`;
  }
  return 'ws://localhost:8000';
}

type EventHandler = (event: WSEvent) => void;

class SignalWebSocketClient {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private token: string | null = null;
  private handlers: Set<EventHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 15000;
  private isManuallyDisconnected = false;

  connect(userId: string, token: string) {
    this.userId = userId;
    this.token = token;
    this.isManuallyDisconnected = false;
    this._connect();
  }

  private _connect() {
    if (!this.userId || !this.token) return;

    try {
      const baseUrl = getWsUrl().replace(/\/+$/, '');
      const url = `${baseUrl}/ws/${this.userId}?token=${this.token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WS] Connected');
        this.reconnectDelay = 1000; // Reset backoff
        this._startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WSEvent;
          this.handlers.forEach((handler) => handler(data));
        } catch (e) {
          console.warn('[WS] Failed to parse message', e);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected', event.code);
        this._stopPing();
        if (!this.isManuallyDisconnected && event.code !== 4001) {
          this._scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.warn('[WS] Error', error);
      };
    } catch (e) {
      console.warn('[WS] Failed to create WebSocket', e);
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      console.log(`[WS] Reconnecting... (delay: ${this.reconnectDelay}ms)`);
      this._connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
    }, this.reconnectDelay);
  }

  private _startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000);
  }

  private _stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendMessage(conversationId: string, content: string, replyToMessageId?: string) {
    this.send({
      type: 'message:send',
      conversation_id: conversationId,
      content,
      reply_to_message_id: replyToMessageId,
    });
  }

  sendTypingStart(conversationId: string) {
    this.send({ type: 'typing:start', conversation_id: conversationId });
  }

  sendTypingStop(conversationId: string) {
    this.send({ type: 'typing:stop', conversation_id: conversationId });
  }

  on(handler: EventHandler) {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  disconnect() {
    this.isManuallyDisconnected = true;
    this._stopPing();
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.ws?.close();
    this.ws = null;
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton — one WS connection per session
export const wsClient = new SignalWebSocketClient();
export default wsClient;
