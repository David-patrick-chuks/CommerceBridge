import { Message } from 'whatsapp-web.js';
import { CommandParseResult, ProcessedMessage, ProductInfo } from '../types';

export class MessageHandler {
  
  async processMessage(message: Message): Promise<ProcessedMessage> {
    try {
      // Handle different message types
      if (message.hasMedia) {
        return await this.handleMediaMessage(message);
      } else if (message.body) {
        return await this.handleTextMessage(message);
      } else {
        return await this.handleUnknownMessage(message);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      return await this.handleUnknownMessage(message);
    }
  }

  private async handleTextMessage(message: Message): Promise<ProcessedMessage> {
    let quotedMessageMeta = undefined;
    if (message.hasQuotedMsg) {
      try {
        const quoted = await message.getQuotedMessage();
        quotedMessageMeta = {
          id: quoted.id._serialized,
          body: quoted.body
        };
      } catch (e) {
        quotedMessageMeta = undefined;
      }
    }
    return {
      type: 'text',
      content: message.body,
      metadata: {
        timestamp: message.timestamp,
        from: message.from,
        to: message.to,
        isGroup: message.from.includes('@g.us'),
        quotedMessage: quotedMessageMeta
      }
    };
  }

  private async handleMediaMessage(message: Message): Promise<ProcessedMessage> {
    let quotedMessageMeta = undefined;
    if (message.hasQuotedMsg) {
      try {
        const quoted = await message.getQuotedMessage();
        quotedMessageMeta = {
          id: quoted.id._serialized,
          body: quoted.body
        };
      } catch (e) {
        quotedMessageMeta = undefined;
      }
    }
    try {
      const media = await message.downloadMedia();
      
      if (!media) {
        return await this.handleUnknownMessage(message);
      }

      const mediaType = this.getMediaType(media.mimetype);
      
      return {
        type: mediaType,
        content: message.body || '',
        media: media,
        metadata: {
          timestamp: message.timestamp,
          from: message.from,
          to: message.to,
          isGroup: message.from.includes('@g.us'),
          mimetype: media.mimetype,
          filename: media.filename,
          data: media.data,
          quotedMessage: quotedMessageMeta
        }
      };
    } catch (error) {
      console.error('❌ Error downloading media:', error);
      return await this.handleUnknownMessage(message);
    }
  }

  private async handleUnknownMessage(message: Message): Promise<ProcessedMessage> {
    return {
      type: 'unknown',
      content: 'Unsupported message type',
      metadata: {
        timestamp: message.timestamp,
        from: message.from,
        to: message.to,
        isGroup: message.from.includes('@g.us')
      }
    };
  }

  private getMediaType(mimetype: string): 'image' | 'document' | 'audio' | 'video' | 'unknown' {
    if (mimetype.startsWith('image/')) {
      return 'image';
    } else if (mimetype.startsWith('video/')) {
      return 'video';
    } else if (mimetype.startsWith('audio/')) {
      return 'audio';
    } else if (mimetype.startsWith('application/') || mimetype.startsWith('text/')) {
      return 'document';
    } else {
      return 'unknown';
    }
  }

  // Extract intent from text message
  extractIntent(text: string): string {
    const lowerText = text.toLowerCase().trim();
    
    // User type selection
    if (lowerText.includes('1') || lowerText.includes('customer') || lowerText.includes('buy')) {
      return 'select_customer';
    }
    if (lowerText.includes('2') || lowerText.includes('seller') || lowerText.includes('sell')) {
      return 'select_seller';
    }

    // Customer intents
    if (lowerText.includes('browse') || lowerText.includes('products') || lowerText.includes('catalog')) {
      return 'browse_products';
    }
    if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('look for')) {
      return 'search_products';
    }
    if (lowerText.includes('cart') || lowerText.includes('basket')) {
      return 'view_cart';
    }
    if (lowerText.includes('order') || lowerText.includes('track') || lowerText.includes('history')) {
      return 'view_orders';
    }
    if (lowerText.includes('checkout') || lowerText.includes('pay') || lowerText.includes('buy')) {
      return 'checkout';
    }
    if (lowerText.includes('help') || lowerText.includes('support')) {
      return 'help';
    }

    // Seller intents
    if (lowerText.includes('add') || lowerText.includes('upload') || lowerText.includes('new product')) {
      return 'add_product';
    }
    if (lowerText.includes('my product') || lowerText.includes('inventory') || lowerText.includes('manage')) {
      return 'manage_products';
    }
    if (lowerText.includes('sales') || lowerText.includes('report') || lowerText.includes('analytics')) {
      return 'sales_report';
    }

    // Navigation
    if (lowerText.includes('back') || lowerText.includes('menu') || lowerText.includes('home')) {
      return 'go_back';
    }
    if (lowerText.includes('cancel') || lowerText.includes('stop')) {
      return 'cancel';
    }

    // Default
    return 'unknown';
  }

  // Extract product information from text
  extractProductInfo(text: string): ProductInfo {
    const result: ProductInfo = {};
    
    // Extract price (look for currency symbols and numbers)
    const priceMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
    if (priceMatch) {
      result.price = parseFloat(priceMatch[1]);
    }

    // Extract category (common product categories)
    const categories = ['fashion', 'clothing', 'electronics', 'home', 'garden', 'beauty', 'health', 'sports', 'outdoors'];
    for (const category of categories) {
      if (text.toLowerCase().includes(category)) {
        result.category = category;
        break;
      }
    }

    // Extract name (everything before price or category)
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim() && !line.includes('$') && !categories.some(cat => line.toLowerCase().includes(cat))) {
        result.name = line.trim();
        break;
      }
    }

    return result;
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phoneNumber) && phoneNumber.replace(/\D/g, '').length >= 10;
  }

  // Sanitize user input
  sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  // Generate response template
  generateResponse(template: string, variables: Record<string, any>): string {
    let response = template;
    
    // Replace variables in template
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      response = response.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return response;
  }

  // Check if message is a command
  isCommand(text: string): boolean {
    return text.startsWith('/') || text.startsWith('!');
  }

  // Parse command
  parseCommand(text: string): CommandParseResult {
    const parts = text.slice(1).split(' ');
    return {
      command: parts[0].toLowerCase(),
      args: parts.slice(1)
    };
  }
} 