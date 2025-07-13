import axios from 'axios';
import 'dotenv/config';
import { ShipbubbleFetchRatesRequest } from './types';

// Shipbubble API configuration
const SHIPBUBBLE_BASE_URL = 'https://api.shipbubble.com/v1';
const API_KEY = process.env.SHIPBUBBLE_API_KEY;

if (!API_KEY) {
  console.error('SHIPBUBBLE_API_KEY environment variable is required');
}

// TypeScript interfaces for Shipbubble API responses
export interface ShipbubbleAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}

export interface ShipbubblePackage {
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

export interface ShipbubbleRate {
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

export interface ShipbubbleRatesResponse {
  status: string;
  message: string;
  data: {
    rates: ShipbubbleRate[];
    fastest_courier: ShipbubbleRate;
    cheapest_courier: ShipbubbleRate;
    summary: {
      ship_from: ShipbubbleAddress;
      ship_to: ShipbubbleAddress;
      currency: string;
      package_amount: number;
      package_weight: number;
      pickup_date: string;
    };
  };
}

export interface ShipbubbleShipmentResponse {
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

/**
 * Get shipping rates from Shipbubble API (correct endpoint)
 * @param req ShipbubbleFetchRatesRequest
 * @returns Available shipping rates
 */
export async function getShippingRates(
  req: ShipbubbleFetchRatesRequest
): Promise<ShipbubbleRatesResponse> {
  try {
    const response = await axios.post(
      `${SHIPBUBBLE_BASE_URL}/shipping/fetch_rates`,
      req,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    console.log('Shipbubble API Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('Shipbubble rates error:', error.response?.data || error.message);
    console.error('Full error:', error);
    throw new Error(`Failed to get shipping rates: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Create a shipment with Shipbubble
 * @param rateId Selected rate ID
 * @param shipFrom Origin address
 * @param shipTo Destination address
 * @param packageInfo Package details
 * @returns Shipment details
 */
export async function createShipment(
  requestToken: string,
  serviceCode: string,
  courierId: string,
  shipFrom: ShipbubbleAddress,
  shipTo: ShipbubbleAddress,
  packageInfo: ShipbubblePackage
): Promise<ShipbubbleShipmentResponse> {
  try {
    const response = await axios.post(
      `${SHIPBUBBLE_BASE_URL}/shipping/labels`,
      {
        request_token: requestToken,
        service_code: serviceCode,
        courier_id: courierId,
        ship_from: shipFrom,
        ship_to: shipTo,
        package: packageInfo
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shipbubble shipment error:', error.response?.data || error.message);
    throw new Error(`Failed to create shipment: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Track a shipment
 * @param trackingNumber Shipment tracking number
 * @returns Tracking information
 */
export async function trackShipment(trackingNumber: string): Promise<any> {
  try {
    const response = await axios.get(
      `${SHIPBUBBLE_BASE_URL}/tracking/${trackingNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 15000
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Shipbubble tracking error:', error.response?.data || error.message);
    throw new Error(`Failed to track shipment: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Format shipping rates for WhatsApp display
 * @param rates Shipbubble rates response
 * @returns Formatted string for WhatsApp
 */
export function formatShippingRates(rates: ShipbubbleRatesResponse): string {
  const { data } = rates;
  let formatted = `🚚 *Available Shipping Options*\n\n`;

  // Add fastest and cheapest highlights
  if (data.fastest_courier) {
    formatted += `⚡ *Fastest:* ${data.fastest_courier.courier_name}\n`;
    formatted += `   💰 ${data.fastest_courier.currency} ${data.fastest_courier.total}\n`;
    formatted += `   📅 ${data.fastest_courier.delivery_eta}\n\n`;
  }

  if (data.cheapest_courier) {
    formatted += `💰 *Cheapest:* ${data.cheapest_courier.courier_name}\n`;
    formatted += `   💰 ${data.cheapest_courier.currency} ${data.cheapest_courier.total}\n`;
    formatted += `   📅 ${data.cheapest_courier.delivery_eta}\n\n`;
  }

  // List all available options
  formatted += `📋 *All Options:*\n`;
  data.rates.forEach((rate, index) => {
    formatted += `${index + 1}. ${rate.courier_name}\n`;
    formatted += `   💰 ${rate.currency} ${rate.total}\n`;
    formatted += `   📅 ${rate.delivery_eta}\n`;
    if (rate.is_cod_available) {
      formatted += `   💳 Cash on Delivery available\n`;
    }
    formatted += `\n`;
  });

  formatted += `Reply with the number of your preferred shipping option.`;

  return formatted;
} 