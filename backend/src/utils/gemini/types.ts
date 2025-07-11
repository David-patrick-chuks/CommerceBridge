/**
 * Gemini AI utility types and interfaces
 */

export interface ProductInfo {
  name: string;
  price: number;
  description: string;
}

export interface ClipServerResponse {
  added: number;
  duplicates: number;
  errors: string[];
}

export interface GeminiRequest {
  model: string;
  config?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: any;
  };
  systemInstruction?: string;
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  text?: string;
  candidates?: any[];
}

export type UserType = 'customer' | 'seller';

export interface SupportContext {
  userType: UserType;
  userPhone?: string;
  userQuestion: string;
}

export interface EscalationDecision {
  shouldEscalate: boolean;
  reason: string;
  confidence: number;
} 