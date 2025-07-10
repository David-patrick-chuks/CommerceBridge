import mongoose, { Schema } from 'mongoose';
import { ShortUrlDocument } from '../types/models.types';

const ShortUrlSchema = new Schema<ShortUrlDocument>({
  code: { type: String, required: true, unique: true },
  targetUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  expiresAt: { type: Date, required: false, index: { expires: 0 } }, // TTL index
});

export const ShortUrlModel = mongoose.model<ShortUrlDocument>('ShortUrl', ShortUrlSchema); 