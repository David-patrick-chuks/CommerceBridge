import mongoose, { Schema } from 'mongoose';

export interface CartItem {
  productId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  addedAt: Date;
}

export interface CartDocument extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  phoneNumber: string;
  items: CartItem[];
  total: number;
  itemCount: number;
  lastUpdated: Date;
  isActive: boolean;
}

const CartItemSchema = new Schema<CartItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  addedAt: { type: Date, default: Date.now }
});

const CartSchema = new Schema<CartDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  phoneNumber: { type: String, required: true, index: true },
  items: { type: [CartItemSchema], default: [] },
  total: { type: Number, default: 0 },
  itemCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

CartSchema.pre('save', function (next) {
  const cart = this as CartDocument;
  cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  cart.lastUpdated = new Date();
  next();
});

CartSchema.index({ phoneNumber: 1, isActive: 1 });
CartSchema.index({ userId: 1, isActive: 1 });

export const CartModel = mongoose.model<CartDocument>('Cart', CartSchema); 