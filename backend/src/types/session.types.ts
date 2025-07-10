// Session management related types

export interface UserSession {
  userId: string;
  phoneNumber: string;
  userType: 'customer' | 'seller' | 'unknown';
  currentState: string;
  context: Record<string, any>;
  lastActivity: Date;
  isActive: boolean;
  cart?: CartItem[];
  orderHistory?: string[];
  preferences?: UserPreferences;
  needsAccount?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: boolean;
} 