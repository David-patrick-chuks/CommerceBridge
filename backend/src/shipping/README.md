# 🚚 Shipping Integration

This module integrates Shipbubble's shipping API into CommerceBridge, providing end-to-end shipping functionality for the WhatsApp e-commerce platform.

## 📋 Overview

The shipping integration allows customers to:
- Get real-time shipping rates from multiple couriers
- Select their preferred shipping option during checkout
- Track packages using tracking numbers
- View delivery ETAs and courier information

## ✨ Features

### 🛒 Checkout Integration
- **Multi-step checkout process** with shipping address collection
- **Real-time rate calculation** from Shipbubble API
- **Multiple courier options** (fastest, cheapest, all available)
- **Cash on Delivery (COD)** support
- **Delivery ETA** display for each option

### 📦 Package Tracking
- **Real-time tracking** by tracking number
- **Status updates** and delivery progress
- **Location tracking** and ETA updates
- **WhatsApp-based tracking** interface

### 🏪 Order Management
- **Shipping cost calculation** and order total updates
- **Shipment creation** with selected courier
- **Tracking number generation** and storage
- **Order history** with shipping details

## 🏗️ Architecture

```
shipping/
├── README.md                 # This documentation
├── shipbubble.ts            # Shipbubble API integration
├── types.ts                 # TypeScript interfaces
├── utils.ts                 # Utility functions
└── test.ts                  # Integration tests
```

## 🔧 Setup

### 1. Environment Variables

Add to your `.env` file:
```bash
# Shipbubble API Configuration
SHIPBUBBLE_API_KEY=your_shipbubble_api_key_here
SHIPBUBBLE_BASE_URL=https://api.shipbubble.com/v1
```

### 2. API Key Setup

1. Create a Shipbubble account at [app.shipbubble.com/register](https://app.shipbubble.com/register)
2. Visit the API keys & Webhook tab in settings
3. Generate an API key for your test environment
4. Enable API access for your account

### 3. Installation

The integration is already included in the main CommerceBridge backend. No additional installation required.

## 📡 API Endpoints Used

### Get Shipping Rates
```typescript
POST /rates
```
- **Purpose**: Get available shipping rates for origin/destination
- **Input**: Ship from address, ship to address, package details
- **Output**: List of courier options with rates and ETAs

### Create Shipment
```typescript
POST /shipping/labels
```
- **Purpose**: Create a shipment with selected courier
- **Input**: Rate ID, addresses, package details
- **Output**: Tracking number and shipment details

### Track Shipment
```typescript
GET /tracking/{tracking_number}
```
- **Purpose**: Get real-time tracking information
- **Input**: Tracking number
- **Output**: Status, location, ETA, and events

## 🚀 Usage

### Customer Checkout Flow

1. **Add items to cart**
2. **Initiate checkout** → `Type "checkout"`
3. **Enter shipping address** → `John Doe, +2348012345678, 123 Main St, Lagos, Lagos State, 100001`
4. **Select shipping option** → `Reply with number (1, 2, 3...)`
5. **Confirm order** → `Type "confirm"`
6. **Complete payment** → Click payment link
7. **Track package** → Use tracking number

### Shipping Options Display

```
🚚 Available Shipping Options

⚡ Fastest: DHL Express
   💰 NGN 3,308
   📅 Within 9 hrs

💰 Cheapest: Dellyman
   💰 NGN 400
   📅 Within 1 - 2 working days

📋 All Options:
1. DHL Express
   💰 NGN 3,308
   📅 Within 9 hrs

2. Dellyman
   💰 NGN 400
   📅 Within 1 - 2 working days
   💳 Cash on Delivery available

Reply with the number of your preferred shipping option.
```

### Package Tracking

```
📦 Track Package

Please enter your tracking number:

Type "back" to return to menu.
```

## 🧪 Testing

### Run Integration Tests

```bash
cd backend
npx ts-node src/shipping/test.ts
```

### Test Individual Functions

```typescript
import { testShipbubbleIntegration } from './shipping/test';

// Test all functionality
await testShipbubbleIntegration();
```

### Sample Test Data

```typescript
const sampleAddress = {
  name: 'John Doe',
  phone: '+2348012345678',
  email: 'john@example.com',
  address: '123 Main Street',
  city: 'Lagos',
  state: 'Lagos State',
  country: 'Nigeria',
  postal_code: '100001'
};

const samplePackage = {
  weight: 1.5,
  items: [
    {
      name: 'Test Product',
      quantity: 2,
      price: 25.00,
      weight: 0.75
    }
  ]
};
```

## 📊 Data Models

### ShipbubbleAddress
```typescript
interface ShipbubbleAddress {
  name: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
}
```

### ShipbubblePackage
```typescript
interface ShipbubblePackage {
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
```

### ShipbubbleRate
```typescript
interface ShipbubbleRate {
  courier_id: string | number;
  courier_name: string;
  courier_image: string;
  service_code: string;
  delivery_eta: string;
  currency: string;
  total: number;
  is_cod_available: boolean;
  tracking_level: number;
}
```

## 🔄 Integration Points

### Customer Flow Integration
- **File**: `backend/src/chatbot/flows/customer-flow.ts`
- **States**: `checkout`, `tracking_package`
- **Methods**: `handleCheckout()`, `handleTracking()`

### Order Model Integration
- **File**: `backend/src/models/order.ts`
- **Fields**: `shipping` (cost, courier, tracking_number, address, eta)

### Conversation Flow Integration
- **File**: `backend/src/chatbot/conversation-flow.ts`
- **States**: `tracking_package`

## 🛠️ Configuration

### Default Store Address
```typescript
const defaultStoreAddress = {
  name: 'CommerceBridge Store',
  phone: '+2348000000000',
  email: 'store@commercebridge.com',
  address: '123 Commerce Street',
  city: 'Lagos',
  state: 'Lagos State',
  country: 'Nigeria',
  postal_code: '100001'
};
```

### Package Weight Estimation
- **Default weight per item**: 0.5kg
- **Minimum package weight**: 0.1kg
- **Weight calculation**: `items.length * 0.5kg`

## 🚨 Error Handling

### Common Errors

1. **API Key Issues**
   ```
   ❌ Failed to get shipping rates: Invalid API key
   ```
   **Solution**: Check `SHIPBUBBLE_API_KEY` in `.env`

2. **Address Validation**
   ```
   ❌ Shipping Error: Invalid address format
   ```
   **Solution**: Ensure address follows format: `Name, Phone, Address, City, State, Postal Code`

3. **Rate Selection**
   ```
   ❌ Invalid Selection: Please select a valid shipping option number
   ```
   **Solution**: Choose a number from the displayed options

### Error Recovery

- **Network errors**: Automatic retry with exponential backoff
- **API rate limits**: Automatic API key rotation (if multiple keys configured)
- **Invalid data**: User-friendly error messages with instructions

## 📈 Monitoring

### Logs to Monitor
```bash
# Shipping rate requests
📦 Parsing product input with Gemini...

# Shipment creation
🚚 Creating shipment with courier_id: 123...

# Tracking requests
📋 Tracking shipment: TRK123456789...

# Errors
❌ Shipbubble rates error: Invalid API key
```

### Metrics to Track
- Shipping rate request success rate
- Average response time for rate requests
- Shipment creation success rate
- Tracking request success rate
- Most popular courier selections

## 🔒 Security

### API Key Security
- Store API keys in environment variables only
- Never commit API keys to version control
- Use different keys for development and production
- Rotate keys regularly

### Data Privacy
- Shipping addresses are stored securely in MongoDB
- Tracking numbers are encrypted in transit
- Customer data is not shared with third parties

## 🚀 Production Deployment

### Checklist
- [ ] Set production Shipbubble API key
- [ ] Configure webhook endpoints (if needed)
- [ ] Set up monitoring and alerting
- [ ] Test with real addresses and packages
- [ ] Verify error handling and recovery
- [ ] Monitor API usage and rate limits

### Environment Variables for Production
```bash
SHIPBUBBLE_API_KEY=your_production_api_key
SHIPBUBBLE_BASE_URL=https://api.shipbubble.com/v1
NODE_ENV=production
```

## 🤝 Support

### Shipbubble Support
- **Documentation**: [docs.shipbubble.com](https://docs.shipbubble.com)
- **Dashboard**: [app.shipbubble.com](https://app.shipbubble.com)
- **API Reference**: [docs.shipbubble.com/api-reference](https://docs.shipbubble.com/api-reference)

### CommerceBridge Support
- **Issues**: Create GitHub issue
- **Documentation**: Check this README and main project docs
- **Testing**: Use the provided test suite

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Initial Shipbubble integration
- ✅ Multi-step checkout with shipping
- ✅ Real-time rate calculation
- ✅ Package tracking
- ✅ Order management with shipping
- ✅ WhatsApp-based interface
- ✅ Comprehensive error handling
- ✅ Integration tests

### Future Enhancements
- [ ] Webhook support for real-time updates
- [ ] Multiple courier accounts support
- [ ] Advanced tracking features
- [ ] Shipping analytics dashboard
- [ ] Bulk shipment creation
- [ ] International shipping support 