// Database model types and interfaces

import { Document } from 'mongoose';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDocument extends Document {
  orderId: string;
  user: string;
  phoneNumber: string;
  total: number;
  paid: boolean;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ShortUrlDocument extends Document {
  code: string;
  targetUrl: string;
  createdAt: Date;
  createdBy?: string;
  expiresAt?: Date;
}

export interface UserDocument extends Document {
  phoneNumber: string;
  name: string;
  email: string;
  userType: 'customer' | 'seller';
  profileImage?: string; // URL or path
  storeName?: string;
  storeDescription?: string;
  storeAddress?: string;
  storeCategories?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UnknownUserDocument extends Document {
  phoneNumber: string;
  firstMessage: string;
  firstMessageTime: Date;
  messageCount: number;
  lastMessageTime: Date;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  isConverted: boolean;
  convertedTo?: 'customer' | 'seller';
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDocument extends Document {
  phoneNumber: string;
  userType: 'customer' | 'seller' | 'unknown' | 'general';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotional';
  category: 'order' | 'payment' | 'product' | 'system' | 'promotional' | 'support';
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
} 