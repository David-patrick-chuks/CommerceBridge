// Bot and WhatsApp related types

export interface BotStatus {
  isConnected: boolean;
  isReady: boolean;
  isConnecting: boolean;
  qrCode?: string;
  lastActivity: Date;
  sessionInfo?: any;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'ready';
}

export interface ConversationResponse {
  message: string;
  nextState?: string;
  context?: Record<string, any>;
}

export interface ProcessedMessage {
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'unknown';
  content: string;
  media?: any; // MessageMedia type from whatsapp-web.js
  metadata?: Record<string, any>;
}

export interface QuotedMessageMeta {
  id: string;
  body: string;
}

export interface MessageMetadata {
  timestamp: number;
  from: string;
  to: string;
  isGroup: boolean;
  quotedMessage?: QuotedMessageMeta;
  mimetype?: string;
  filename?: string;
  data?: string;
}

export interface ProductInfo {
  name?: string;
  price?: number;
  category?: string;
  description?: string;
}

export interface CommandParseResult {
  command: string;
  args: string[];
} 