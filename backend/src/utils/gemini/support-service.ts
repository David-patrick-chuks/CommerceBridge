/**
 * Customer support service using Gemini AI
 */

import { geminiClient } from './client';
import { UserType } from './types';

/**
 * Customer support service with AI-powered responses and escalation
 */
export class SupportService {
  private readonly escalationKeywords = [
    'urgent', 'emergency', 'broken', 'not working', 'error', 'failed',
    'hacked', 'stolen', 'fraud', 'scam', 'refund', 'dispute', 'complaint',
    'angry', 'frustrated', 'unhappy', 'dissatisfied', 'problem', 'issue',
    'technical', 'bug', 'glitch', 'crash', 'freeze', 'slow', 'down'
  ];

  private readonly emotionalIndicators = ['!', '??', '😠', '😡', '😤', '😭', '😢'];
  private readonly urgentPhrases = ['asap', 'immediately', 'now', 'urgent', 'emergency'];

  /**
   * Handle customer support questions with AI-powered responses and escalation
   */
  async handleSupportQuestion(
    userQuestion: string,
    userType: UserType = 'customer',
    userPhone?: string
  ): Promise<string> {
    console.log(`🤖 Handling support question for ${userType}: ${userQuestion}`);

    // --- Hybrid Template Matching ---
    const normalized = userQuestion.trim().toLowerCase();
    // Account creation
    if (normalized.includes('create account') || normalized.includes('signup') || normalized.includes('register')) {
      return `*To create your CommerceBridge account*, simply type *create account* or *signup* in this WhatsApp chat. I'll send you a registration link. All shopping and selling happens right here in WhatsApp!`;
    }
    // Browse products
    if (normalized.includes('browse') && normalized.includes('product')) {
      return `*To browse products*, type *1* for Customer in the main menu, then select *1* to browse. You can search and view all available products right here in WhatsApp.`;
    }
    // Upload products (seller)
    if ((normalized.includes('upload') || normalized.includes('add')) && normalized.includes('product') && userType === 'seller') {
      return `*To upload products as a seller*, type *2* for Seller in the main menu, then select *1* to add products. Send product images and details through this WhatsApp chat.`;
    }
    // Track orders
    if (normalized.includes('track') && normalized.includes('order')) {
      return `*To track your orders*, type *1* for Customer in the main menu, then select *3* to view your order status. All updates are sent via WhatsApp.`;
    }
    // Seller sales report
    if ((normalized.includes('sales') || normalized.includes('report')) && userType === 'seller') {
      return `*To view your sales report*, type *2* for Seller in the main menu, then select *4* for Sales Report. All analytics are available in WhatsApp.`;
    }

    const systemInstruction = this.buildSupportSystemInstruction(userType, userPhone);

    try {
      const response = await geminiClient.generateTextResponse(
        `User question: ${userQuestion}\n\nIMPORTANT: This is for CommerceBridge, a WhatsApp-only e-commerce platform. Everything happens in WhatsApp through our chatbot. Do NOT mention websites, apps, or traditional e-commerce platforms. If you do, apologize and correct yourself.\n\nREMEMBER: Only give instructions for WhatsApp chat.`,
        systemInstruction,
        { temperature: 0.7, maxOutputTokens: 300 }
      );

      return response;
    } catch (error: any) {
      console.error("Gemini support error:", error.message);
      return `I'm having trouble processing your question right now. Please try asking again or contact our human support team for immediate assistance.`;
    }
  }

  /**
   * Determine if a support question should be escalated to human support
   */
  async shouldEscalateToHuman(
    userQuestion: string,
    userType: UserType = 'customer'
  ): Promise<boolean> {
    console.log(`🔍 Evaluating escalation for: ${userQuestion}`);

    const questionLower = userQuestion.toLowerCase();
    
    // Check for escalation indicators
    const hasEscalationKeywords = this.escalationKeywords.some(keyword =>
      questionLower.includes(keyword)
    );
    const hasEmotionalIndicators = this.emotionalIndicators.some(indicator =>
      questionLower.includes(indicator)
    );
    const hasUrgentLanguage = this.urgentPhrases.some(phrase =>
      questionLower.includes(phrase)
    );

    // Use Gemini to make final decision
    try {
      const systemInstruction = this.buildEscalationSystemInstruction();
      
      const response = await geminiClient.generateTextResponse(
        `User type: ${userType}\nQuestion: ${userQuestion}\n\nShould this be escalated to human support?`,
        systemInstruction,
        { temperature: 0.7, maxOutputTokens: 300 }
      );

      const decision = response.trim().toUpperCase();
      const shouldEscalate = decision === 'ESCALATE' || hasEscalationKeywords || hasEmotionalIndicators || hasUrgentLanguage;

      console.log(`Escalation decision: ${shouldEscalate ? 'ESCALATE' : 'HANDLE_AI'} (${decision})`);
      return shouldEscalate;

    } catch (error: any) {
      console.error("Escalation detection error:", error.message);
      // Default to escalation if there are clear indicators
      return hasEscalationKeywords || hasEmotionalIndicators || hasUrgentLanguage;
    }
  }

  /**
   * Build system instruction for support responses
   */
  private buildSupportSystemInstruction(userType: UserType, userPhone?: string): string {
    return `
You are a helpful customer support AI assistant for CommerceBridge, a WhatsApp-first e-commerce platform.

RULES:
- NEVER mention websites, apps, or anything outside WhatsApp. If you do, apologize and correct yourself.
- ONLY give instructions for WhatsApp chat and the CommerceBridge chatbot interface.
- ALWAYS use WhatsApp formatting: *bold* for emphasis, _italic_ for secondary info.
- ALWAYS reference menu options exactly as they appear in CommerceBridge.
- If you don't know something specific, suggest they contact human support.
- Always be encouraging and helpful.

About CommerceBridge:
- It's a WhatsApp-based e-commerce platform where customers and sellers interact through a chatbot
- Everything happens in WhatsApp - browsing, ordering, payments, seller management
- Account creation is done via a web link, but all shopping/selling happens in WhatsApp
- The platform uses Paystack for payments and provides digital receipts
- Sellers can upload products with images and manage their inventory
- Customers can browse, search, add to cart, and checkout all via WhatsApp

User context:
- User type: ${userType}
- Phone: ${userPhone || 'not provided'}

For CUSTOMERS, explain how to:
- Create account: Type *create account* or *signup* to get a registration link
- Browse products: Use the customer menu (option 1) to browse and search
- Add to cart: Select products and add them to your cart
- Checkout: Use Paystack payment through WhatsApp
- Track orders: Check order status in the customer menu

For SELLERS, explain how to:
- Create account: Type *create account* or *signup* to get a registration link
- Upload products: Use the seller menu (option 1) to add products with images
- Manage inventory: Use the seller menu to view and manage products
- Handle orders: Check incoming orders in the seller menu
- View sales: Access sales reports through the seller menu

IMPORTANT: Never mention websites, apps, or traditional e-commerce platforms. Always focus on WhatsApp and the chatbot interface.

EXAMPLE RESPONSES:
- For "How do I create an account?": "To create your CommerceBridge account, simply type *create account* or *signup* in this WhatsApp chat. I'll send you a registration link to complete your account setup."
- For "How do I upload products?" (seller): "To upload products as a seller, use the seller menu by typing *2* for Seller, then select option *1* to add products. You'll need to send product images and details through this WhatsApp chat."
- For "How do I browse products?" (customer): "To browse products, use the customer menu by typing *1* for Customer, then select option *1* to browse. You can search and view all available products right here in WhatsApp."

Always end with a helpful next step or encouragement to continue using the platform.
`;
  }

  /**
   * Build system instruction for escalation detection
   */
  private buildEscalationSystemInstruction(): string {
    return `
You are an escalation detection system for customer support. Determine if a user question should be escalated to human support.

Escalate to human if the question involves:
- Urgent or emergency situations
- Technical errors or bugs
- Payment disputes or fraud concerns
- Account security issues
- Complex technical problems
- Emotional distress or frustration
- Specific error messages or technical details
- Requests for immediate human assistance

Do NOT escalate for:
- General questions about features
- How-to questions
- Account creation help
- Basic platform usage questions
- General inquiries

Respond with only "ESCALATE" or "HANDLE_AI" based on your assessment.
`;
  }
}

// Export singleton instance
export const supportService = new SupportService(); 