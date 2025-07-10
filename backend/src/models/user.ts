import mongoose, { Document, Schema } from 'mongoose';

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

const UserSchema = new Schema<UserDocument>({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  userType: { type: String, enum: ['customer', 'seller'], required: true, default: 'customer' },
  profileImage: { type: String },
  storeName: { type: String },
  storeDescription: { type: String },
  storeAddress: { type: String },
  storeCategories: { type: [String] },
}, { timestamps: true });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema); 