// Shipping-specific TypeScript interfaces and types

export interface ShippingAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface ShippingPackage {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
    weight?: number;
  }>;
}

export interface ShippingRate {
  courier_id: string | number;
  courier_name: string;
  courier_image: string;
  service_code: string;
  service_type: string;
  delivery_eta: string;
  delivery_eta_time: string;
  pickup_eta: string;
  pickup_eta_time: string;
  currency: string;
  total: number;
  rate_card_amount: number;
  discount?: {
    percentage: number;
    symbol: string;
    discounted: number;
  };
  insurance?: {
    code: string;
    fee: number;
  };
  is_cod_available: boolean;
  tracking_level: number;
  ratings: number;
  votes: number;
  tracking: {
    bars: number;
    label: string;
  };
}

export interface ShippingRatesResponse {
  status: string;
  message: string;
  data: {
    rates: ShippingRate[];
    fastest_courier: ShippingRate;
    cheapest_courier: ShippingRate;
    summary: {
      ship_from: ShippingAddress;
      ship_to: ShippingAddress;
      currency: string;
      package_amount: number;
      package_weight: number;
      pickup_date: string;
    };
  };
}

export interface ShippingShipmentResponse {
  status: string;
  message: string;
  data: {
    shipment_id: string;
    tracking_number: string;
    waybill_url: string;
    courier_name: string;
    delivery_eta: string;
    total: number;
    currency: string;
  };
}

export interface ShippingTrackingEvent {
  description: string;
  status: string;
  timestamp: string;
  location?: string;
}

export interface ShippingTrackingResponse {
  status: string;
  message: string;
  data: {
    tracking_number: string;
    status: string;
    eta?: string;
    location?: string;
    events?: ShippingTrackingEvent[];
  };
}

export interface ShipbubbleFetchRatesRequest {
  sender_address_code: number;
  reciever_address_code: number;
  pickup_date: string; // yyyy-mm-dd
  category_id: number;
  package_items: ShipbubblePackageItem[];
  package_dimension: {
    length: number;
    width: number;
    height: number;
  };
  service_type?: string;
  delivery_instructions?: string;
}

export interface ShipbubblePackageItem {
  name: string;
  description: string;
  unit_weight: string; // in KG, as string
  unit_amount: string; // as string
  quantity: string; // as string
}

// Checkout flow states
export type CheckoutState = 
  | 'collecting_address'
  | 'selecting_shipping'
  | 'confirming_order'
  | 'completed';

// Shipping service types
export type ShippingServiceType = 'pickup' | 'dropoff' | 'express' | 'standard';

// Tracking status types
export type TrackingStatus = 
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned';

// Currency types
export type Currency = 'NGN' | 'USD' | 'EUR' | 'GBP';

// Package weight units
export type WeightUnit = 'kg' | 'lb' | 'g' | 'oz';

// Dimensions units
export type DimensionUnit = 'cm' | 'in' | 'm' | 'ft'; 