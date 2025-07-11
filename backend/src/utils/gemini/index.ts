/**
 * Gemini AI utilities - Main entry point
 * 
 * This module provides a clean interface to all Gemini AI functionality
 * including product parsing, customer support, and CLIP server integration.
 */

// Core exports
export { geminiClient, GeminiError } from './client';
export { apiKeyManager, DEFAULT_GEMINI_CONFIG } from './config';

// Type exports
export type {
    ClipServerResponse, EscalationDecision, GeminiRequest,
    GeminiResponse, ProductInfo, SupportContext, UserType
} from './types';

// Service exports
export { clipIntegration } from './clip-integration';
export { productParser } from './product-parser';
export { SupportMessages } from './support-messages';
export { supportService } from './support-service';

// Legacy function exports for backward compatibility
import { clipIntegration } from './clip-integration';
import { productParser } from './product-parser';
import { SupportMessages } from './support-messages';
import { supportService } from './support-service';

/**
 * @deprecated Use productParser.parseLooseProductInput() instead
 */
export const parseLooseProductInput = productParser.parseLooseProductInput.bind(productParser);

/**
 * @deprecated Use clipIntegration.sendProductToClipServer() instead
 */
export const sendProductToClipServer = clipIntegration.sendProductToClipServer.bind(clipIntegration);

/**
 * @deprecated Use supportService.handleSupportQuestion() instead
 */
export const handleSupportQuestion = supportService.handleSupportQuestion.bind(supportService);

/**
 * @deprecated Use supportService.shouldEscalateToHuman() instead
 */
export const shouldEscalateToHuman = supportService.shouldEscalateToHuman.bind(supportService);

/**
 * @deprecated Use SupportMessages.getEscalationMessage() instead
 */
export const getEscalationMessage = SupportMessages.getEscalationMessage; 