# Gemini AI Utilities - Modular Architecture

This directory contains a refactored, modular implementation of Gemini AI utilities for CommerceBridge. The code has been split into focused, maintainable modules following senior developer best practices.

## 📁 Module Structure

```
gemini/
├── index.ts              # Main entry point with clean exports
├── types.ts              # TypeScript interfaces and types
├── config.ts             # API key management and configuration
├── client.ts             # Core Gemini API client with retry logic
├── product-parser.ts     # Product parsing functionality
├── support-service.ts    # Customer support and escalation
├── clip-integration.ts   # CLIP server integration
├── support-messages.ts   # Message templates and formatting
└── README.md            # This documentation
```

## 🚀 Usage

### Basic Import
```typescript
import { 
  productParser, 
  supportService, 
  clipIntegration, 
  SupportMessages 
} from '../utils/gemini';
```

### Product Parsing
```typescript
// Parse loose product input
const product = await productParser.parseLooseProductInput(userInput);
console.log(product); // { name: string, price: number, description: string }
```

### Customer Support
```typescript
// Handle support questions
const response = await supportService.handleSupportQuestion(
  "How do I create an account?",
  "customer",
  "+1234567890"
);

// Check if escalation is needed
const shouldEscalate = await supportService.shouldEscalateToHuman(
  "My payment failed!",
  "customer"
);
```

### CLIP Server Integration
```typescript
// Send product to CLIP server
const result = await clipIntegration.sendProductToClipServer(
  [imageBuffer1, imageBuffer2],
  { name: "Product", price: 29.99, description: "Description" }
);

// Search products by image
const searchResults = await clipIntegration.searchProductsByImage(imageBuffer);
```

### Support Messages
```typescript
// Get escalation message
const escalationMsg = SupportMessages.getEscalationMessage();

// Wrap AI response
const wrappedResponse = SupportMessages.wrapAiResponse(aiResponse);

// Get support menu
const supportMenu = SupportMessages.getCustomerSupportMenu();
```

## 🔧 Core Components

### ApiKeyManager (`config.ts`)
- Manages multiple API keys with round-robin rotation
- Handles API key validation and loading
- Provides singleton instance for consistent state

### GeminiClient (`client.ts`)
- Core API client with retry logic and error handling
- Supports JSON and text response generation
- Automatic API key rotation on rate limits

### ProductParser (`product-parser.ts`)
- Parses loose user input into structured product data
- Uses Gemini AI for intelligent parsing
- Includes validation and error handling

### SupportService (`support-service.ts`)
- Handles customer support questions with AI
- Implements intelligent escalation detection
- Provides context-aware responses

### ClipIntegration (`clip-integration.ts`)
- Manages communication with CLIP server
- Handles image uploads and product search
- Includes health checks and error handling

### SupportMessages (`support-messages.ts`)
- Centralized message templates
- WhatsApp formatting utilities
- Consistent messaging across the application

## 🔄 Migration from Legacy Code

The old monolithic `gemini.ts` file has been deprecated but maintains backward compatibility:

```typescript
// Old way (deprecated)
import { parseLooseProductInput, handleSupportQuestion } from '../utils/gemini';

// New way (recommended)
import { productParser, supportService } from '../utils/gemini';
```

## 🧪 Testing

Each module can be tested independently:

```typescript
// Test product parsing
import { productParser } from './product-parser';
const result = await productParser.parseLooseProductInput("Test Product\n$29.99\nDescription");

// Test support service
import { supportService } from './support-service';
const response = await supportService.handleSupportQuestion("How do I browse products?", "customer");
```

## 🔒 Error Handling

All modules use consistent error handling:

```typescript
import { GeminiError } from './client';

try {
  const result = await productParser.parseLooseProductInput(input);
} catch (error) {
  if (error instanceof GeminiError) {
    console.error('Gemini API error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## 📊 Performance Considerations

- **API Key Rotation**: Automatic rotation prevents rate limiting
- **Retry Logic**: Exponential backoff for failed requests
- **Connection Pooling**: Reuses HTTP connections where possible
- **Error Caching**: Avoids repeated failed requests

## 🔧 Configuration

Environment variables are loaded automatically:

```env
GEMINI_API_KEYS=key1,key2,key3
CLIP_SERVER_URL=http://localhost:8000
SUPPORT_EMAIL=support@commercebridge.com
SUPPORT_PHONE=+1234567890
```

## 🚀 Future Enhancements

- **Caching Layer**: Redis-based response caching
- **Metrics Collection**: Performance and usage analytics
- **A/B Testing**: Support for multiple AI models
- **Rate Limiting**: Advanced rate limiting strategies
- **Webhook Support**: Real-time notifications for escalations 