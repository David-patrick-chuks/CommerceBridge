/**
 * Core Gemini API client with retry logic and error handling
 */

import { apiKeyManager, DEFAULT_GEMINI_CONFIG } from './config';
import { GeminiRequest, GeminiResponse } from './types';

/**
 * Error types for Gemini API
 */
export class GeminiError extends Error {
  constructor(
    message: string,
    public readonly isRateLimit: boolean = false,
    public readonly isServiceUnavailable: boolean = false
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

/**
 * Core Gemini API client with retry logic and API key rotation
 */
export class GeminiClient {
  /**
   * Generate content with automatic retry and API key rotation
   */
  async generateContent(
    request: GeminiRequest,
    maxRetries?: number
  ): Promise<GeminiResponse> {
    // Set maxRetries to the number of API keys if not provided
    const totalRetries = maxRetries ?? apiKeyManager.getKeyCount();
    let retryCount = 0;
    let client = apiKeyManager.getClient();

    console.log(`🔍 Debug: API Key count: ${apiKeyManager.getKeyCount()}, Current index: ${apiKeyManager.getCurrentIndex()}`);
    console.log(`🔍 Debug: Request model: ${request.model}, config:`, request.config);

    while (retryCount < totalRetries) {
      try {
        console.log(`🔑 Using API Key index: ${apiKeyManager.getCurrentIndex()}`);
        const response = await client.models.generateContent(request);
        console.log(`✅ Success: Response received`);
        return response;
      } catch (error: any) {
        retryCount++;
        console.error(`❌ Error attempt ${retryCount}/${totalRetries}:`, error.message);
        console.error(`❌ Full error:`, error);

        if (retryCount >= totalRetries) {
          console.error("Maximum retry attempts reached. Could not complete the API call.");
          throw new GeminiError("Failed to generate content after maximum retries.");
        }

        const isRateLimitError = error.message?.includes('429');
        const isServiceUnavailableError = error.message?.includes('503');

        if (isRateLimitError) {
          console.error(`🚨 API key index ${apiKeyManager.getCurrentIndex()} limit exhausted, switching...`);
          client = apiKeyManager.switchKey();
          await this.delay(DEFAULT_GEMINI_CONFIG.retryDelay);
        } else if (isServiceUnavailableError) {
          console.error("⏳ Service is unavailable. Retrying in 5 seconds...");
          await this.delay(DEFAULT_GEMINI_CONFIG.retryDelay);
        } else {
          console.error("⚠ Error generating content:", error.message);
          throw new GeminiError(error.message);
        }
      }
    }

    throw new GeminiError("Unexpected error in generateContent");
  }

  /**
   * Generate JSON response with schema validation
   */
  async generateJsonResponse(
    prompt: string,
    schema: any,
    systemInstruction?: string
  ): Promise<any> {
    const request: GeminiRequest = {
      model: DEFAULT_GEMINI_CONFIG.model,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
        maxOutputTokens: 500
      },
      systemInstruction,
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await this.generateContent(request);

    if (!response?.text) {
      throw new GeminiError("Gemini failed to return structured data.");
    }

    try {
      return JSON.parse(response.text);
    } catch (error) {
      throw new GeminiError("Failed to parse JSON response from Gemini.");
    }
  }

  /**
   * Generate text response with custom configuration
   */
  async generateTextResponse(
    prompt: string,
    systemInstruction?: string,
    config?: Partial<typeof DEFAULT_GEMINI_CONFIG>
  ): Promise<string> {
    const request: GeminiRequest = {
      model: DEFAULT_GEMINI_CONFIG.model,
      config: {
        temperature: config?.temperature ?? DEFAULT_GEMINI_CONFIG.temperature,
        maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_GEMINI_CONFIG.maxOutputTokens
      },
      systemInstruction,
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await this.generateContent(request);

    if (!response?.text) {
      throw new GeminiError("Gemini failed to generate text response.");
    }

    return response.text.trim();
  }

  /**
   * Parse user message into structured data using a custom schema and system instruction
   */
  async parseStructured(
    userMessage: string,
    schema: any,
    systemInstruction?: string
  ): Promise<any> {
    return this.generateJsonResponse(userMessage, schema, systemInstruction);
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const geminiClient = new GeminiClient();

/**
 * Generic function to parse user message into structured data using Gemini
 */
export async function parseStructured(
  userMessage: string,
  schema: any,
  systemInstruction?: string
): Promise<any> {
  return geminiClient.parseStructured(userMessage, schema, systemInstruction);
}

/**
 * @deprecated Use geminiClient.generateContent() instead
 * Legacy function for backward compatibility
 */
export async function generateWithRetry(request: any, maxRetries: number = DEFAULT_GEMINI_CONFIG.maxRetries): Promise<any> {
  return geminiClient.generateContent(request, maxRetries);
} 