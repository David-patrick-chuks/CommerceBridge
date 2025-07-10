// API and request/response related types

export interface CreateUserRequest {
  phoneNumber: string;
  name: string;
  email: string;
  userType?: 'customer' | 'seller';
  storeName?: string;
  storeDescription?: string;
  storeAddress?: string;
  storeCategories?: string[];
  profileImage?: string;
}

export interface CreateShortUrlRequest {
  url: string;
  createdBy?: string;
  expiryMinutes?: number;
}

export interface ShortUrlResponse {
  shortUrl: string;
  expiresAt: Date;
}

export interface ValidateShortUrlResponse {
  valid: boolean;
  reason?: 'not_found' | 'expired';
  expiresAt?: Date;
}

export interface StoreCategoriesResponse {
  categories: string[];
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  services: {
    mongodb: {
      status: string;
      connectionState: string;
    };
    redis: {
      status: string;
      connectionState: string;
    };
    whatsappBot: {
      status: string;
      isReady: boolean;
      isConnected: boolean;
      isConnecting: boolean;
      lastActivity: Date;
    };
  };
  system: {
    memory: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
      external: string;
    };
    nodeVersion: string;
    platform: string;
    pid: number;
  };
  endpoints: {
    botStatus: string;
    qrCode: string;
    health: string;
  };
}

export interface BotStatusResponse {
  isConnected: boolean;
  isReady: boolean;
  isConnecting: boolean;
  lastActivity: Date;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'ready';
  message: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
} 