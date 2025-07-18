/**
 * AI utilities - Main entry point
 * 
 * This module provides a clean interface to all AI functionality
 * including product parsing, customer support, and CLIP server integration.
 */

import { Type } from "@google/genai";
import { parseStructured } from "./client";

/**
 * Ready-to-use handler for understanding user messages and extracting flow options
 */
export async function parseUserMessageForFlow(userMessage: string) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      intent: { type: Type.STRING },
      entities: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      flowOption: {
        type: Type.STRING,
        enum: ["upload", "browse", "order", "track", "support", "other"]
      }
    },
    required: ["intent", "flowOption"],
    propertyOrdering: ["intent", "entities", "flowOption"]
  };

  const systemInstruction = `
You are a chatbot message parser for an e-commerce WhatsApp bot.
- Extract the user's intent (e.g., 'upload', 'browse', 'order', 'track', etc.).
- Extract any entities mentioned (e.g., product names, numbers, dates).
- Decide the flowOption: one of 'upload', 'browse', 'order', 'track', 'support', or 'other'.
Return a JSON object matching the schema.
`;

  return parseStructured(userMessage, schema, systemInstruction);
}

// Core exports
export { aiClient, AIError } from './client';
export { apiKeyManager, DEFAULT_AI_CONFIG } from './config';

// Type exports
export type {
  AIRequest,
  AIResponse, ClipServerResponse, EscalationDecision, ProductInfo, SupportContext, UserType
} from './types';

// Service exports
export { parseStructured } from './client';
export { parseProductInput } from './product-parser';
export { SupportMessages } from './support-messages';
export { supportService } from './support-service';
