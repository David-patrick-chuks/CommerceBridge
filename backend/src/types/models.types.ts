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