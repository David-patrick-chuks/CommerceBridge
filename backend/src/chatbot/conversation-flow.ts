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
    
    console.log(`🔄 Processing message: "${messageText}" for state: ${session.currentState}`);

    try {
      // Onboarding: If needsAccount, show onboarding welcome and ask for role first
      if (session.needsAccount) {
        if (session.currentState !== 'onboarding') {
          session.currentState = 'onboarding';
        }
        return await this.onboardingFlow.handleOnboarding(message, session, client);
      }

      // Handle different user types and states
      if (session.userType === 'customer') {
        return await this.handleCustomerFlow(messageText, session);
      }
      if (session.userType === 'seller') {
        return await this.handleSellerFlow(messageText, session);
      }
      
      return this.onboardingFlow.getOnboardingWelcome();
    } catch (error) {
      console.error('❌ Error in conversation flow:', error);
      return this.getErrorMessage();
    }
  }

  private async handleCustomerFlow(messageText: string, session: UserSession): Promise<string> {
    switch (session.currentState) {
      case 'customer_main':
        return await this.customerFlow.handleCustomerMain(messageText, session);
      case 'browsing_products':
        return await this.customerFlow.handleProductBrowsing(messageText, session);
      case 'searching_products':
        return this.customerFlow.handleProductSearch(messageText, session);
      case 'cart_management':
        return await this.customerFlow.handleCartManagement(messageText, session);
      case 'checkout':
        return this.customerFlow.handleCheckout(messageText, session);
      default:
        session.currentState = 'customer_main';
        return this.customerFlow.getCustomerMenu();
    }
  }

  private async handleSellerFlow(messageText: string, session: UserSession): Promise<string> {
    switch (session.currentState) {
      case 'seller_main':
        return this.sellerFlow.handleSellerMain(messageText, session);
      case 'adding_product':
        return this.sellerFlow.handleAddingProduct(messageText, session);
      case 'managing_products':
        return this.sellerFlow.handleManagingProducts(messageText, session);
      case 'order_management':
        return this.sellerFlow.handleOrderManagement(messageText, session);
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
