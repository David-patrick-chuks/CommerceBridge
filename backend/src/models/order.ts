import mongoose, { Schema } from 'mongoose';
import { OrderDocument, OrderItem } from '../types/models.types';

const OrderItemSchema = new Schema<OrderItem>({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const ShippingAddressSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  postal_code: { type: String },
});

const ShippingSchema = new Schema({
  cost: { type: Number, required: true },
  courier: { type: String, required: true },
  tracking_number: { type: String, required: true },
  address: { type: ShippingAddressSchema, required: true },
  eta: { type: String },
});

const OrderSchema = new Schema<OrderDocument>({
  orderId: { type: String, required: true, unique: true },
  user: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  total: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  items: { type: [OrderItemSchema], required: true },
  shipping: { type: ShippingSchema },
}, { timestamps: true });

export const OrderModel = mongoose.model<OrderDocument>('Order', OrderSchema); 