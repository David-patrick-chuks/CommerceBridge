/**
 * AI utility types and interfaces
 */

export interface AIRequest {
  model: string;
  config: Record<string, any>;
  systemInstruction?: string;
  contents: Array<{ parts: Array<{ text: string }> }>;
}

export interface AIResponse {
  text: string;
  [key: string]: any;
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
