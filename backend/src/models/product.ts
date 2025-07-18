import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ProductDocument extends Document {
  name: string;
  price: number;
  description?: string;
  image: string[];
  category?: string;
  stock?: number;
  seller: Types.ObjectId; // Reference to User
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: [String], required: true, validate: [(val: string[]) => val.length >= 4, 'At least 4 images required'] },
  category: { type: String },
  stock: { type: Number, default: 0 },
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Add seller reference
}, { timestamps: true });

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema); 