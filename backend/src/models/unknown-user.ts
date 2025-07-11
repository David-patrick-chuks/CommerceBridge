import mongoose, { Document, Schema } from 'mongoose';

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

const UnknownUserSchema = new Schema<UnknownUserDocument>({
  phoneNumber: { type: String, required: true, unique: true },
  firstMessage: { type: String, required: true },
  firstMessageTime: { type: Date, required: true },
  messageCount: { type: Number, default: 1 },
  lastMessageTime: { type: Date, required: true },
  userAgent: { type: String },
  deviceInfo: { type: String },
  location: { type: String },
  isConverted: { type: Boolean, default: false },
  convertedTo: { type: String, enum: ['customer', 'seller'] },
  convertedAt: { type: Date },
}, { timestamps: true });

export const UnknownUserModel = mongoose.model<UnknownUserDocument>('UnknownUser', UnknownUserSchema); 