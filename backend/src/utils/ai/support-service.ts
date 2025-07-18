/**
 * Customer support service using AI
 */

import { aiClient } from './client';
import { SupportMessages } from './support-messages';

export const supportService = {
  async handleCustomerSupport(context: any): Promise<string> {
    try {
      const response = await aiClient.generateTextResponse(
        SupportMessages.customerSupportPrompt(context)
      );
      return response;
    } catch (error: any) {
      console.error("AI support error:", error.message);
      throw error;
    }
  },

  async handleEscalation(context: any): Promise<string> {
    try {
      const response = await aiClient.generateTextResponse(
        SupportMessages.escalationPrompt(context)
      );
      return response;
    } catch (error: any) {
      console.error("AI escalation error:", error.message);
      throw error;
    }
  },

  async makeFinalDecision(context: any): Promise<string> {
    try {
      // Use AI to make final decision
      const response = await aiClient.generateTextResponse(
        SupportMessages.finalDecisionPrompt(context)
      );
      return response;
    } catch (error: any) {
      console.error("AI decision error:", error.message);
      throw error;
    }
  }
}; 