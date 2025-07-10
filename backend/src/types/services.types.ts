// Service-related types and interfaces

export interface DatabaseHealthCheck {
  mongodb: boolean;
  redis: boolean;
}

export interface DatabaseConnectionStatus {
  mongodb: boolean;
  redis: boolean;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export interface OrderData {
  orderId: string;
  user: string;
  phoneNumber: string;
  total: number;
  paid: boolean;
  items: any[]; // Using any[] to avoid circular dependency
}

// OrderItem is already defined in models.types.ts

export interface ReceiptData {
  orderId: string;
  total: number;
  items: any[]; // Using any[] to avoid circular dependency
  customerName?: string;
  customerPhone?: string;
  paymentDate: Date;
  transactionId?: string;
} 