# AI Utilities

This module provides a clean interface to all AI provider functionality for CommerceBridge. It includes:

- API key management and rotation
- Retry logic and error handling
- Product parsing and flow parsing
- Customer support and escalation
- Utility types and interfaces

## Environment Variables

- `AI_API_KEYS` - Comma-separated list of API keys for the AI provider
- `AI_API_KEY` - (Optional) Single API key fallback
- `DEBUG_AI` - Set to 'true' to enable debug logging for AI integration

## Usage

Import the main AI client and utilities:

```ts
import { aiClient, supportService, SupportMessages, parseProductInput } from './utils/ai';
```

## Features

- **API Key Rotation:** Handles multiple API keys and rotates on rate limit errors.
- **Retry Logic:** Retries failed requests with configurable delay and max retries.
- **Product Parsing:** Extracts structured product data from unstructured input.
- **Support Service:** Handles customer support and escalation using AI.
- **Flow Parsing:** Parses conversation flows for chatbot logic.

## Security

- Model name and provider are abstracted and not exposed in logs or errors.
- All environment variables are generic and do not reveal the underlying provider.

## Extending

You can add new AI-powered features by extending the service and utility modules in this directory. 