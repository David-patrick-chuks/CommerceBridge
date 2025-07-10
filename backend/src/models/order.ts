import mongoose, { Document, Schema } from 'mongoose';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDocument extends Document {
  orderId: string;
  user: string;
  phoneNumber: string;
  total: number;
  paid: boolean;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const OrderSchema = new Schema<OrderDocument>({
  orderId: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  total: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  items: { type: [OrderItemSchema], required: true },
}, { timestamps: true });

export const OrderModel = mongoose.model<OrderDocument>('Order', OrderSchema); 