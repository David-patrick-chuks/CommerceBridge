// Utility and common types

export interface StaticProduct {
  id: number;
  name: string;
  price: number;
}

export interface OrderSummary {
  orderId: string;
  total: number;
  paid: boolean;
  items: any[]; // Using any[] to avoid circular dependency
}

// OrderItem is already defined in services.types.ts

export interface CartSummary {
  items: any[]; // Using any[] to avoid circular dependency
  total: number;
  itemCount: number;
}

// CartItem is already defined in session.types.ts

export interface WelcomeBannerData {
  userName: string;
  userType: 'customer' | 'seller';
  storeName?: string;
}

export interface TextFormatOptions {
  style: 'bold' | 'italic' | 'strikethrough' | 'monospace' | 'script' | 'title case' | 'high contrast' | 'code';
}

export interface FileUploadData {
  originalname: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface EnvironmentConfig {
  PORT: string;
  NODE_ENV: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  PAYSTACK_SECRET_KEY: string;
  PAYSTACK_PUBLIC_KEY: string;
  PAYSTACK_WEBHOOK_SECRET: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
  SHORTENER_BASE_URL: string;
  SHORTENER_EXPIRE_MINUTES: string;
  FRONTEND_BASE_URL: string;
} 