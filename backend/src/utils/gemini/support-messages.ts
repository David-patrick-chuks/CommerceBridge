/**
 * Support message templates and formatting utilities
 */

import { formatWhatsAppBold, formatWhatsAppItalic } from '../text-formatter';

/**
 * Support message templates and utilities
 */
export class SupportMessages {
  /**
   * Generate escalation message with support contact information
   */
  static getEscalationMessage(): string {
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@commercebridge.com';
    const supportPhone = process.env.SUPPORT_PHONE || '+234-XXX-XXX-XXXX';
    
    return `${formatWhatsAppBold('🚨 Escalating to Human Support')}\n\n${formatWhatsAppItalic('I\'ve identified this as an urgent issue that requires human assistance.')}\n\n${formatWhatsAppItalic('Our support team will contact you shortly. In the meantime, please provide any additional details about your issue.')}\n\n${formatWhatsAppItalic('For immediate assistance, you can also:')}\n• Email: ${supportEmail}\n• Call: ${supportPhone}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  /**
   * Generate support welcome message
   */
  static getSupportWelcomeMessage(): string {
    return `${formatWhatsAppBold('🛟 Contact Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  /**
   * Generate AI response wrapper
   */
  static wrapAiResponse(response: string): string {
    return `${formatWhatsAppBold('🤖 AI Support Response')}\n\n${response}\n\n${formatWhatsAppItalic('Is there anything else I can help you with? Type "back" to return to the main menu.')}`;
  }

  /**
   * Generate error message for support failures
   */
  static getSupportErrorMessage(): string {
    return `${formatWhatsAppBold('❌ Support Error')}\n\n${formatWhatsAppItalic('I\'m having trouble processing your question right now. Please try asking again or contact our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  /**
   * Generate customer support menu message
   */
  static getCustomerSupportMenu(): string {
    return `${formatWhatsAppBold('🆘 Customer Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  /**
   * Generate seller support menu message
   */
  static getSellerSupportMenu(): string {
    return `${formatWhatsAppBold('🆘 Seller Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }
} 