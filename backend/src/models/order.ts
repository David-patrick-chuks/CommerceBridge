import mongoose, { Schema } from 'mongoose';
import { OrderDocument, OrderItem } from '../types/models.types';

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