import { 
  ShipbubbleRatesResponse, 
  ShipbubbleShipmentResponse,
  ShipbubbleAddress,
  ShipbubblePackage 
} from './types';

/**
 * Mock shipping service for testing without real API key
 */
export class MockShipbubbleService {
  
  static async getShippingRates(
    shipFrom: ShipbubbleAddress,
    shipTo: ShipbubbleAddress,
    packageInfo: ShipbubblePackage
  ): Promise<ShipbubbleRatesResponse> {
    console.log('🔧 Using MOCK Shipbubble service');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      status: 'success',
      message: 'Mock rates retrieved successfully',
      data: {
        rates: [
          {
            courier_id: 'mock-1',
            courier_name: 'Mock Express',
            courier_image: '',
            service_code: 'EXPRESS',
            service_type: 'Express Delivery',
            delivery_eta: '2-3 business days',
            delivery_eta_time: '48-72 hours',
            pickup_eta: 'Same day',
            pickup_eta_time: '2-4 hours',
            currency: 'NGN',
            total: 2500,
            rate_card_amount: 3000,
            discount: {
              percentage: 17,
              symbol: '%',
              discounted: 500
            },
            is_cod_available: true,
            tracking_level: 3,
            ratings: 4.5,
            votes: 120,
            tracking: {
              bars: 3,
              label: 'High'
            }
          },
          {
            courier_id: 'mock-2',
            courier_name: 'Mock Standard',
            courier_image: '',
            service_code: 'STANDARD',
            service_type: 'Standard Delivery',
            delivery_eta: '5-7 business days',
            delivery_eta_time: '120-168 hours',
            pickup_eta: 'Next day',
            pickup_eta_time: '24 hours',
            currency: 'NGN',
            total: 1500,
            rate_card_amount: 1500,
            is_cod_available: false,
            tracking_level: 2,
            ratings: 4.2,
            votes: 89,
            tracking: {
              bars: 2,
              label: 'Medium'
            }
          }
        ],
        fastest_courier: {
          courier_id: 'mock-1',
          courier_name: 'Mock Express',
          courier_image: '',
          service_code: 'EXPRESS',
          service_type: 'Express Delivery',
          delivery_eta: '2-3 business days',
          delivery_eta_time: '48-72 hours',
          pickup_eta: 'Same day',
          pickup_eta_time: '2-4 hours',
          currency: 'NGN',
          total: 2500,
          rate_card_amount: 3000,
          discount: {
            percentage: 17,
            symbol: '%',
            discounted: 500
          },
          is_cod_available: true,
          tracking_level: 3,
          ratings: 4.5,
          votes: 120,
          tracking: {
            bars: 3,
            label: 'High'
          }
        },
        cheapest_courier: {
          courier_id: 'mock-2',
          courier_name: 'Mock Standard',
          courier_image: '',
          service_code: 'STANDARD',
          service_type: 'Standard Delivery',
          delivery_eta: '5-7 business days',
          delivery_eta_time: '120-168 hours',
          pickup_eta: 'Next day',
          pickup_eta_time: '24 hours',
          currency: 'NGN',
          total: 1500,
          rate_card_amount: 1500,
          is_cod_available: false,
          tracking_level: 2,
          ratings: 4.2,
          votes: 89,
          tracking: {
            bars: 2,
            label: 'Medium'
          }
        },
        summary: {
          ship_from: shipFrom,
          ship_to: shipTo,
          currency: 'NGN',
          package_amount: packageInfo.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
          package_weight: packageInfo.weight,
          pickup_date: new Date().toISOString().split('T')[0]
        }
      }
    };
  }

  static async createShipment(
    requestToken: string,
    serviceCode: string,
    courierId: string,
    shipFrom: ShipbubbleAddress,
    shipTo: ShipbubbleAddress,
    packageInfo: ShipbubblePackage
  ): Promise<ShipbubbleShipmentResponse> {
    console.log('🔧 Using MOCK shipment creation');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      status: 'success',
      message: 'Mock shipment created successfully',
      data: {
        shipment_id: `MOCK-${Date.now()}`,
        tracking_number: `MOCK-TRACK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        waybill_url: 'https://mock-shipbubble.com/waybill/mock-waybill.pdf',
        courier_name: courierId === 'mock-1' ? 'Mock Express' : 'Mock Standard',
        delivery_eta: courierId === 'mock-1' ? '2-3 business days' : '5-7 business days',
        total: courierId === 'mock-1' ? 2500 : 1500,
        currency: 'NGN'
      }
    };
  }

  static async trackShipment(trackingNumber: string): Promise<any> {
    console.log('🔧 Using MOCK tracking service');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      status: 'success',
      message: 'Mock tracking information retrieved',
      data: {
        tracking_number: trackingNumber,
        status: 'in_transit',
        courier: 'Mock Express',
        events: [
          {
            location: 'Mock Warehouse',
            message: 'Package picked up',
            captured: new Date().toISOString()
          },
          {
            location: 'Mock Sorting Center',
            message: 'Package in transit',
            captured: new Date(Date.now() - 3600000).toISOString()
          }
        ],
        eta: '2024-01-15',
        delivery_address: 'Mock Delivery Address'
      }
    };
  }
} 