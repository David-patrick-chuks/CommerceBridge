import mongoose, { Schema } from 'mongoose';
import { UserDocument } from '../types/models.types';

const UserSchema = new Schema<UserDocument>({
  phoneNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  userType: { type: String, enum: ['customer', 'seller'], required: true, default: 'customer' },
  profileImage: { type: String },
  storeName: { type: String },
  storeDescription: { type: String },
  storeAddress: { type: String },
  storeCategories: { type: [String] },
  storeAddressValidation: { type: Object }, // Shipbubble address validation response
}, { timestamps: true });

export const UserModel = mongoose.model<UserDocument>('User', UserSchema); 