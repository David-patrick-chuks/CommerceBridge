/**
 * Core AI API client with retry logic and error handling
 */

import { apiKeyManager, DEFAULT_AI_CONFIG } from './config';
import { AIRequest, AIResponse } from './types';

/**
 * Error types for AI API
 */
export class AIError extends Error {
  constructor(
    message: string,
    public readonly isRateLimit: boolean = false,
    public readonly isServiceUnavailable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/**
 * Core AI API client with retry logic and API key rotation
 */
export class AIClient {
  /**
   * Generate content with automatic retry and API key rotation
   */
  async generateContent(
    request: AIRequest,
    maxRetries?: number
  ): Promise<AIResponse> {
    // Set maxRetries to the number of API keys if not provided
    const totalRetries = maxRetries ?? apiKeyManager.getKeyCount();
    let retryCount = 0;
    let client = apiKeyManager.getClient();

    while (retryCount < totalRetries) {
      try {
        const response = await client.models.generateContent(request);
        // Ensure response.text is always a string
        return { ...response, text: response.text ?? '' };
      } catch (error: any) {
        retryCount++;
        if (retryCount >= totalRetries) {
          throw new AIError("Failed to generate content after maximum retries.");
        }

        const isRateLimitError = error.message?.includes('429');
        const isServiceUnavailableError = error.message?.includes('503');

        if (isRateLimitError) {
          client = apiKeyManager.switchKey();
          await this.delay(DEFAULT_AI_CONFIG.retryDelay);
        } else if (isServiceUnavailableError) {
          await this.delay(DEFAULT_AI_CONFIG.retryDelay);
        } else {
          throw new AIError(error.message);
        }
      }
    }

    throw new AIError("Unexpected error in generateContent");
  }

  /**
   * Generate JSON response with schema validation
   */
  async generateJsonResponse(
    prompt: string,
    schema: any,
    systemInstruction?: string
  ): Promise<any> {
    const request: AIRequest = {
      model: DEFAULT_AI_CONFIG.model,
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
      throw new AIError("AI failed to return structured data.");
    }

    try {
      return JSON.parse(response.text);
    } catch (error) {
      throw new AIError("Failed to parse JSON response from AI.");
    }
  }

  /**
   * Generate text response with custom configuration
   */
  async generateTextResponse(
    prompt: string,
    systemInstruction?: string,
    config?: Partial<typeof DEFAULT_AI_CONFIG>
  ): Promise<string> {
    const request: AIRequest = {
      model: DEFAULT_AI_CONFIG.model,
      config: {
        temperature: config?.temperature ?? DEFAULT_AI_CONFIG.temperature,
        maxOutputTokens: config?.maxOutputTokens ?? DEFAULT_AI_CONFIG.maxOutputTokens
      },
      systemInstruction,
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await this.generateContent(request);

    if (!response?.text) {
      throw new AIError("AI failed to generate text response.");
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
export const aiClient = new AIClient();

/**
 * Generic function to parse user message into structured data using AI
 */
export async function parseStructured(
  userMessage: string,
  schema: any,
  systemInstruction?: string
): Promise<any> {
  return aiClient.parseStructured(userMessage, schema, systemInstruction);
}

/**
 * @deprecated Use aiClient.generateContent() instead
 * Legacy function for backward compatibility
 */
export async function generateWithRetry(request: any, maxRetries: number = DEFAULT_AI_CONFIG.maxRetries): Promise<any> {
  return aiClient.generateContent(request, maxRetries);
} 