import axios from 'axios';
import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { UserSession } from '../../types/session.types';
import { SupportMessages, supportService } from '../../utils/gemini/index';
import { formatCode, formatMonospace, formatWhatsAppBold, formatWhatsAppItalic } from '../../utils/text-formatter';

export class OnboardingFlow {
  private readonly onboardingWelcome = `${formatWhatsAppBold('👋 Welcome to CommerceBridge!')}

${formatCode("I'm your AI shopping assistant! Here's what I can help you with:")}

What would you like to do?

${formatWhatsAppBold('1️⃣ Customer')} - Shop for products
${formatWhatsAppBold('2️⃣ Seller')} - Sell your products
${formatWhatsAppBold('3️⃣ FAQs')} - Common questions & answers
${formatWhatsAppBold('4️⃣ Contact Support')} - Get help from our team

`;

  private readonly welcomeMessage = `${formatWhatsAppBold('🎉 Welcome to CommerceBridge!')}

I'm your personal shopping assistant. Here's what I can help you with:

${formatWhatsAppBold('🛍️ For Customers:')}
• Browse products
• Search and filter items
• Add to cart and checkout
• Track orders
• Get support

${formatWhatsAppBold('🏪 For Sellers:')}
• Upload products
• Manage inventory
• Track sales
• Handle orders

${formatWhatsAppItalic('What would you like to do today?')}

Type *1* for Customer or *2* for Seller`;

  async handleOnboarding(message: any, session: UserSession, client: any): Promise<string | null> {
    const messageText = message.body.toLowerCase().trim();
    
    // Handle support state - if user is in support mode, process their question
    if (session.currentState === 'support_mode') {
      return await this.handleSupportQuestion(message, session);
    }
    
    // Handle onboarding response
    if (messageText.includes('1') || messageText.includes('customer')) {
      session.userType = 'customer';
      session.currentState = 'awaiting_account_creation';
      return `Great! To shop as a customer, you'll need to create an account.\n\nType *create account* or *signup* to get your registration link.`;
    }
    if (messageText.includes('2') || messageText.includes('seller')) {
      session.userType = 'seller';
      session.currentState = 'awaiting_account_creation';
      return `Awesome! To sell on CommerceBridge, you'll need to create a seller account.\n\nType *create account* or *signup* to get your registration link.`;
    }
    // Handle FAQs
    if (messageText.trim() === '3' || messageText.includes('faq')) {
      return this.getOnboardingFAQs();
    }
    // Handle Contact Support
    if (messageText.trim() === '4' || messageText.includes('support')) {
      session.currentState = 'support_mode';
      return `${formatWhatsAppBold('🛟 Contact Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
    }
    if (messageText.includes('create account') || messageText.includes('signup') || messageText.includes('register')) {
      const phone = session.phoneNumber.replace(/@c\.us$/, '');
      const longLink = `http://localhost:5173/create-account?wa=${encodeURIComponent(phone)}`;
      let link = longLink;
      try {
        const res = await axios.post('http://localhost:3001/api/shorten', { url: longLink });
        if (res.data && res.data.shortUrl) link = res.data.shortUrl;
      } catch (err) {
        console.error('Shortener failed, using long URL:', err);
      }
      return `${formatWhatsAppBold('🔗 Create Your Account')}\n\nClick the link below to create your account:\n${formatMonospace(link)}\n\n${formatWhatsAppItalic('Once done, return here to continue!')}`;
    }
    // If user tries to use a feature, prompt for account creation
    if (messageText.match(/browse|product|cart|order|add|upload|inventory|manage|sales|report|help/)) {
      return `${formatWhatsAppBold("You'll need to create an account before using this feature.")}\n\n${formatWhatsAppItalic('Type *create account* to get started.')}`;
    }
    // Default: always send the banner image with onboarding welcome as caption
    const bannerPath = path.join(__dirname, '../../../public/banner.jpeg');
    const media = await MessageMedia.fromFilePath(bannerPath);
    console.log('[Onboarding] Sending onboarding image with caption (no buttons, buttons deprecated)');
    await client.sendMessage(message.from, media, { caption: this.onboardingWelcome });
    return null;
  }

  private async handleSupportQuestion(message: any, session: UserSession): Promise<string> {
    const userQuestion = message.body.trim();
    
    // Handle navigation back to main menu
    if (userQuestion.toLowerCase() === 'back') {
      session.currentState = 'onboarding';
      return this.onboardingWelcome;
    }

    // Convert session userType to Gemini UserType (filter out 'unknown')
    const userType = session.userType === 'unknown' ? undefined : session.userType as 'customer' | 'seller';

    // Check if question should be escalated to human support
    const shouldEscalate = await supportService.shouldEscalateToHuman(userQuestion, userType);
    
    if (shouldEscalate) {
      // Escalate to human support
      session.currentState = 'escalated_support';
      return SupportMessages.getEscalationMessage();
    }

    // Use Gemini to generate AI response
    try {
      const aiResponse = await supportService.handleSupportQuestion(
        userQuestion, 
        userType, 
        session.phoneNumber
      );
      
      return SupportMessages.wrapAiResponse(aiResponse);
    } catch (error) {
      console.error('Error handling support question:', error);
      return SupportMessages.getSupportErrorMessage();
    }
  }

  private getOnboardingFAQs(): string {
    return `${formatWhatsAppBold('❓ Frequently Asked Questions (FAQs)')}\n\n${formatWhatsAppBold('About CommerceBridge:')}\nCommerceBridge helps small businesses like yours sell online easily — right inside WhatsApp! We provide digital storefronts, automated orders, and easy payment options to streamline your sales.\n\n${formatWhatsAppBold('1. How do I create an account?')}\n- Just type ${formatWhatsAppItalic('create account')} or ${formatWhatsAppItalic('signup')} and follow the link!\n\n${formatWhatsAppBold('2. Is CommerceBridge free to use?')}\n- Yes, creating an account and browsing is free.\n\n${formatWhatsAppBold('3. How do I contact support?')}\n- Reply with ${formatWhatsAppItalic('4')} or ${formatWhatsAppItalic('Contact Support')} at any time.\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  private getOnboardingSupport(): string {
    return `${formatWhatsAppBold('🛟 Contact Support')}\n\n${formatWhatsAppItalic('Our team is here to help!')}\n\n• For urgent issues, reply with your question and a human agent will respond soon.\n• For common questions, check our ${formatWhatsAppItalic('FAQs')} (type ${formatWhatsAppItalic('3')}).\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  getOnboardingWelcome(): string {
    return this.onboardingWelcome;
  }

  getWelcomeMessage(): string {
    return this.welcomeMessage;
  }
} 