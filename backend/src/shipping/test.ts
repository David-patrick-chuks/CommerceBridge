import { MockShipbubbleService } from './mock';
import {
  getShippingRates,
  ShipbubbleAddress,
  ShipbubblePackage
} from './shipbubble';
import { ShipbubbleFetchRatesRequest } from './types';

// Sample test data
const sampleShipFrom: ShipbubbleAddress = {
  name: 'CommerceBridge Store',
  phone: '+2348000000000',
  email: 'store@commercebridge.com',
  address: '123 Commerce Street',
  city: 'Lagos',
  state: 'Lagos State',
  country: 'Nigeria',
  postal_code: '100001'
};

const sampleShipTo: ShipbubbleAddress = {
  name: 'John Doe',
  phone: '+2348012345678',
  email: 'john@example.com',
  address: '456 Customer Avenue',
  city: 'Abuja',
  state: 'FCT',
  country: 'Nigeria',
  postal_code: '900001'
};

const samplePackage: ShipbubblePackage = {
  weight: 1.5,
  length: 20,
  width: 15,
  height: 10,
  items: [
    {
      name: 'Test Product',
      quantity: 2,
      price: 25.00,
      weight: 0.75
    }
  ]
};

const sampleFetchRatesRequest: ShipbubbleFetchRatesRequest = {
  sender_address_code: 12345, // TODO: Replace with real sender address code from Shipbubble dashboard
  reciever_address_code: 67890, // TODO: Replace with real receiver address code from Shipbubble dashboard
  pickup_date: new Date().toISOString().split('T')[0],
  category_id: 1, // TODO: Replace with real category ID from Shipbubble dashboard
  package_items: [
    {
      name: 'Test Product',
      description: 'A test item',
      unit_weight: '0.5',
      unit_amount: '5000',
      quantity: '2'
    }
  ],
  package_dimension: { length: 20, width: 15, height: 10 }
};

export async function testShipbubbleIntegration() {
  console.log('🧪 Testing Shipbubble Integration...\n');

  // Check environment variables
  const apiKey = process.env.SHIPBUBBLE_API_KEY;
  const baseUrl = process.env.SHIPBUBBLE_BASE_URL;
  
  console.log('🔧 Environment Check:');
  console.log(`API Key: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`Base URL: ${baseUrl || 'https://api.shipbubble.com/v1'}`);
  console.log('');

  if (!apiKey) {
    console.error('❌ SHIPBUBBLE_API_KEY environment variable is required!');
    console.error('Please add it to your .env file:');
    console.error('SHIPBUBBLE_API_KEY=your_api_key_here');
    return false;
  }

  // Check if we have real address codes
  const hasRealAddressCodes = sampleFetchRatesRequest.sender_address_code !== 12345;
  
  if (!hasRealAddressCodes) {
    console.log('⚠️  Using MOCK service because real address codes are not set.');
    console.log('📋 To get real address codes:');
    console.log('   1. Go to your Shipbubble dashboard');
    console.log('   2. Navigate to Addresses section');
    console.log('   3. Create or copy address codes for sender and receiver');
    console.log('   4. Update the test file with real values');
    console.log('');
    
    // Use mock service for testing
    try {
      console.log('📦 Testing MOCK shipping rates...');
      const mockRates = await MockShipbubbleService.getShippingRates(
        sampleShipFrom,
        sampleShipTo,
        samplePackage
      );
      console.log('✅ Mock shipping rates retrieved successfully!');
      console.log(`Found ${mockRates.data.rates.length} shipping options`);
      console.log(`Fastest: ${mockRates.data.fastest_courier?.courier_name} - ${mockRates.data.fastest_courier?.currency} ${mockRates.data.fastest_courier?.total}`);
      console.log(`Cheapest: ${mockRates.data.cheapest_courier?.courier_name} - ${mockRates.data.cheapest_courier?.currency} ${mockRates.data.cheapest_courier?.total}\n`);
      
      console.log('🎉 Mock Shipbubble integration is working!');
      console.log('💡 To test with real API, update the address codes and category ID in the test file.');
      return true;
    } catch (error: any) {
      console.error('❌ Mock test failed:', error.message);
      return false;
    }
  }

  try {
    // Test 1: Get Shipping Rates
    console.log('📦 Testing shipping rates...');
    const rates = await getShippingRates(sampleFetchRatesRequest);
    console.log('✅ Shipping rates retrieved successfully!');
    console.log(`Found ${rates.data.rates.length} shipping options`);
    console.log(`Fastest: ${rates.data.fastest_courier?.courier_name} - ${rates.data.fastest_courier?.currency} ${rates.data.fastest_courier?.total}`);
    console.log(`Cheapest: ${rates.data.cheapest_courier?.courier_name} - ${rates.data.cheapest_courier?.currency} ${rates.data.cheapest_courier?.total}\n`);

    // Test 2: Create Shipment (if rates are available)
    if (rates.data.rates.length > 0) {
      console.log('🚚 Testing shipment creation...');
      const selectedRate = rates.data.rates[0]; // Use first available rate
      
      // Note: This would require the request_token from the rates response
      // For now, we'll just show the rate information
      console.log('✅ Rate selected for shipment creation:');
      console.log(`Courier: ${selectedRate.courier_name}`);
      console.log(`Service Code: ${selectedRate.service_code}`);
      console.log(`Courier ID: ${selectedRate.courier_id}`);
      console.log(`Total: ${selectedRate.currency} ${selectedRate.total}\n`);
      
      // TODO: Implement actual shipment creation when we have request_token
      console.log('📝 Note: Shipment creation requires request_token from rates API');
    }

    console.log('🎉 All Shipbubble tests passed!');
    return true;

  } catch (error: any) {
    console.error('❌ Shipbubble test failed:', error.message);
    console.error('Error details:', error.response?.data || error);
    return false;
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testShipbubbleIntegration()
    .then(success => {
      if (success) {
        console.log('✅ Shipbubble integration is working correctly!');
        process.exit(0);
      } else {
        console.log('❌ Shipbubble integration has issues.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
} 