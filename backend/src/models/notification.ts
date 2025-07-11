import mongoose, { Document, Schema } from 'mongoose';

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

const NotificationSchema = new Schema<NotificationDocument>({
  phoneNumber: { type: String, required: true, index: true },
  userType: { 
    type: String, 
    enum: ['customer', 'seller', 'unknown', 'general'], 
    required: true,
    index: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['info', 'success', 'warning', 'error', 'promotional'], 
    default: 'info' 
  },
  category: { 
    type: String, 
    enum: ['order', 'payment', 'product', 'system', 'promotional', 'support'], 
    default: 'system' 
  },
  isRead: { type: Boolean, default: false, index: true },
  isSent: { type: Boolean, default: false, index: true },
  sentAt: { type: Date },
  readAt: { type: Date },
  scheduledFor: { type: Date, index: true },
  expiresAt: { type: Date, index: true },
  metadata: { type: Schema.Types.Mixed },
}, { 
  timestamps: true
});

// Create indexes separately
NotificationSchema.index({ phoneNumber: 1, userType: 1, isRead: 1 });
NotificationSchema.index({ userType: 1, isSent: 1, scheduledFor: 1 });
NotificationSchema.index({ expiresAt: 1 });
NotificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', NotificationSchema); 