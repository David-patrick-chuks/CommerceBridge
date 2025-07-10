import mongoose, { Document, Schema } from 'mongoose';

export interface ShortUrlDocument extends Document {
  code: string;
  targetUrl: string;
  createdAt: Date;
  createdBy?: string;
  expiresAt?: Date;
}

const ShortUrlSchema = new Schema<ShortUrlDocument>({
  code: { type: String, required: true, unique: true },
  targetUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  expiresAt: { type: Date, required: false, index: { expires: 0 } }, // TTL index
});

export const ShortUrlModel = mongoose.model<ShortUrlDocument>('ShortUrl', ShortUrlSchema); 