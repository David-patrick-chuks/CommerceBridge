/**
 * Gemini AI configuration and API key management
 */

import { GoogleGenAI } from "@google/genai";
import 'dotenv/config';

// Load and validate API keys from environment
const loadApiKeys = (): string[] => {
  const rawKeys = process.env.GEMINI_API_KEYS || '';
  console.log(`🔍 Debug: Raw GEMINI_API_KEYS: "${rawKeys}"`);
  
  const apiKeys = rawKeys.split(',').filter(k => k.trim());
  console.log(`🔍 Debug: Filtered API keys count: ${apiKeys.length}`);
  console.log(`🔍 Debug: API keys:`, apiKeys.map((k, i) => `${i}: "${k.substring(0, 10)}..."`));
  
  if (apiKeys.length === 0) {
    if (process.env.GENAI_API_KEY) {
      apiKeys.push(process.env.GENAI_API_KEY);
      console.log(`🔍 Debug: Using GENAI_API_KEY fallback`);
    } else {
      console.error("FATAL: No API keys found. Please set GEMINI_API_KEYS or GENAI_API_KEY in your .env file.");
      process.exit(1);
    }
  }
  
  return apiKeys;
};

/**
 * API Key Manager for handling multiple Gemini API keys with rotation
 */
export class ApiKeyManager {
  private keys: string[];
  private currentIndex: number = 0;

  constructor() {
    this.keys = loadApiKeys();
  }

  /**
   * Get current Gemini client
   */
  getClient(): GoogleGenAI {
    return new GoogleGenAI({ apiKey: this.keys[this.currentIndex] });
  }

  /**
   * Switch to next API key (round-robin)
   */
  switchKey(): GoogleGenAI {
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`🔄 Switching to API key index ${this.currentIndex}`);
    return this.getClient();
  }

  /**
   * Get current key index for logging
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Get total number of available keys
   */
  getKeyCount(): number {
    return this.keys.length;
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();

/**
 * Default Gemini configuration
 */
export const DEFAULT_GEMINI_CONFIG = {
  model: "gemini-1.5-flash", // Changed from gemini-2.5-flash to gemini-1.5-flash
  temperature: 0.7,
  maxOutputTokens: 300,
  retryDelay: 5000, // 5 seconds
  maxRetries: 3
} as const; 