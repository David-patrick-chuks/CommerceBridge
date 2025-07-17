// conversation-flow.ts
import { Message } from 'whatsapp-web.js';
import { UserSession } from '../types/session.types';
import { CustomerFlow } from './flows/customer-flow';
import { OnboardingFlow } from './flows/onboarding-flow';
import { SellerFlow } from './flows/seller-flow';

export class ConversationFlow {
  private customerFlow: CustomerFlow;
  private sellerFlow: SellerFlow;
  private onboardingFlow: OnboardingFlow;

  constructor() {
    this.customerFlow = new CustomerFlow();
    this.sellerFlow = new SellerFlow();
    this.onboardingFlow = new OnboardingFlow();
  }

  async processMessage(message: Message, session: UserSession, client: any): Promise<string | null> {
    // Always normalize phone number for session management
    const normalizedPhone = session.phoneNumber.replace(/@c\.us$/, '');
    session.phoneNumber = normalizedPhone;
    const messageText = message.body.toLowerCase().trim();
    
    // --- LOG GEMINI FLOW PARSER RESULT IF AVAILABLE ---
    if (session.lastParsedFlow) {
      console.log('[ConversationFlow] Gemini parsed flow:', JSON.stringify(session.lastParsedFlow, null, 2));
      if (session.lastParsedFlow.intent && session.lastParsedFlow.intent !== 'unknown') {
        console.log(`[ConversationFlow] Parsed intent: ${session.lastParsedFlow.intent}`);
      }
    }
    // --- END LOG ---

    console.log(`🔄 Processing message: "${messageText}" for state: ${session.currentState}`);

    try {
      // Onboarding: If needsAccount, show onboarding welcome and ask for role first
      if (session.needsAccount) {
        if (session.currentState !== 'onboarding' && session.currentState !== 'support_mode') {
          session.currentState = 'onboarding';
        }
        return await this.onboardingFlow.handleOnboarding(message, session, client);
      }

      // Handle support states first
      if (session.currentState === 'customer_support') {
        return await this.customerFlow.handleCustomerSupport(message, session);
      }
      if (session.currentState === 'seller_support') {
        return await this.sellerFlow.handleSellerSupport(message, session);
      }
      if (session.currentState === 'support_mode') {
        return await this.onboardingFlow.handleOnboarding(message, session, client);
      }

      // Handle different user types and states
      if (session.userType === 'customer') {
        return await this.handleCustomerFlow(messageText, session, client, message.from);
      }
      if (session.userType === 'seller') {
        return await this.handleSellerFlow(message, session);
      }
      
      return this.onboardingFlow.getOnboardingWelcome();
    } catch (error) {
      console.error('❌ Error in conversation flow:', error);
      return this.getErrorMessage();
    }
  }

  private async handleCustomerFlow(messageText: string, session: UserSession, client?: any, from?: string): Promise<string> {
    switch (session.currentState) {
      case 'customer_main': {
        const response = await this.customerFlow.handleCustomerMain(messageText, session);
        // If the response is empty and state is now browsing_products, handle it immediately
        if (response === '' && String(session.currentState) === 'browsing_products') {
          if (client && from) {
            await this.customerFlow.getProductCatalog(session, client, from);
            return '';
          } else {
            return await this.customerFlow.getProductCatalog(session);
          }
        }
        return response;
      }
      case 'browsing_products':
        // Handle product selection when browsing products
        return await this.customerFlow.handleProductBrowsing(messageText, session);
      case 'searching_products':
        return this.customerFlow.handleProductSearch(messageText, session);
      case 'cart_management':
        return await this.customerFlow.handleCartManagement(messageText, session);
      case 'checkout':
        return await this.customerFlow.handleCheckout(messageText, session);
      case 'tracking_package':
        return await this.customerFlow.handleTracking(messageText, session);
      default:
        session.currentState = 'customer_main';
        return this.customerFlow.getCustomerMenu();
    }
  }

  private async handleSellerFlow(message: Message, session: UserSession): Promise<string> {
    switch (session.currentState) {
      case 'seller_main':
        return this.sellerFlow.handleSellerMain(message.body, session);
      case 'adding_product':
        return await this.sellerFlow.handleAddingProduct(message, session);
      case 'managing_products':
        return this.sellerFlow.handleManagingProducts(message.body, session);
      case 'order_management':
        return this.sellerFlow.handleOrderManagement(message.body, session);
      default:
        session.currentState = 'seller_main';
        return this.sellerFlow.getSellerMenu();
    }
  }

  private getErrorMessage(): string {
    return `${formatWhatsAppBold('❌ Something went wrong')}\n\n${formatWhatsAppItalic('I encountered an error processing your request. Please try again or type "help" for support.')}`;
  }
}

// Import formatting functions for error message
import { formatWhatsAppBold, formatWhatsAppItalic } from '../utils/text-formatter';

