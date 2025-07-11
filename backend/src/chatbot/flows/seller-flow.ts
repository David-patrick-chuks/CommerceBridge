import { notificationService } from '../../services/notification-service';
import { UserSession } from '../../types/session.types';
import { clipIntegration, productParser, SupportMessages, supportService } from '../../utils/gemini/index';
import { formatWhatsAppBold, formatWhatsAppItalic } from '../../utils/text-formatter';

export class SellerFlow {
  private readonly sellerMenu = `${formatWhatsAppBold('🏪 Seller Menu')}

What would you like to do?

${formatWhatsAppBold('1️⃣ Add Product')} - Upload new items
${formatWhatsAppBold('2️⃣ My Products')} - Manage inventory
${formatWhatsAppBold('3️⃣ View Orders')} - Handle customer orders
${formatWhatsAppBold('4️⃣ Sales Report')} - Check your performance
${formatWhatsAppBold('5️⃣ Help')} - Get support

${formatWhatsAppItalic('Type the number or describe what you need!')}`;

  handleSellerMain(messageText: string, session: UserSession): string {
    if (messageText.includes('1') || messageText.includes('add') || messageText.includes('upload')) {
      session.currentState = 'adding_product';
      return `${formatWhatsAppBold('📦 Add New Product')}\n\n${formatWhatsAppItalic('Please send me:')}\n1. A photo of your product\n2. Product name\n3. Price\n4. Description\n\n${formatWhatsAppItalic('Send the photo first, then I\'ll ask for the details!')}`;
    } else if (messageText.includes('2') || messageText.includes('my product')) {
      session.currentState = 'managing_products';
      return this.getSellerProducts(session);
    } else if (messageText.includes('3') || messageText.includes('order')) {
      session.currentState = 'order_management';
      return this.getSellerOrders(session);
    } else if (messageText.includes('4') || messageText.includes('report') || messageText.includes('sales')) {
      return this.getSalesReport(session);
    } else if (messageText.includes('5') || messageText.includes('help')) {
      session.currentState = 'seller_support';
      return `${formatWhatsAppBold('🆘 Seller Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
    } else {
      return `${formatWhatsAppBold("I didn't understand.")} Please choose from the menu:\n\n${this.sellerMenu}`;
    }
  }

  async handleSellerSupport(message: any, session: UserSession): Promise<string> {
    const userQuestion = message.body.trim();
    
    // Handle navigation back to main menu
    if (userQuestion.toLowerCase() === 'back') {
      session.currentState = 'seller_main';
      return this.sellerMenu;
    }

    // Check if question should be escalated to human support
    const shouldEscalate = await supportService.shouldEscalateToHuman(userQuestion, 'seller');
    
    if (shouldEscalate) {
      // Escalate to human support
      session.currentState = 'escalated_support';
      return SupportMessages.getEscalationMessage();
    }

    // Use Gemini to generate AI response
    try {
      const aiResponse = await supportService.handleSupportQuestion(
        userQuestion, 
        'seller', 
        session.phoneNumber
      );
      
      return SupportMessages.wrapAiResponse(aiResponse);
    } catch (error) {
      console.error('Error handling support question:', error);
      return SupportMessages.getSupportErrorMessage();
    }
  }

  async handleAddingProduct(message: any, session: UserSession): Promise<string> {
    // Initialize context if not present
    if (!session.context.productAdditionState) {
      session.context.productAdditionState = 'collecting_images';
      session.context.productImages = [];
    }

    // Helper: check if message is 'done' or 'next'
    const isDoneKeyword = (msg: string) => {
      const txt = msg.trim().toLowerCase();
      return txt === 'done' || txt === 'next';
    };

    // Handle image collection
    if (session.context.productAdditionState === 'collecting_images') {
      let imageAdded = false;
      if (message.type === 'image' && message.media) {
        session.context.productImages.push(message.media);
        imageAdded = true;
      }
      const imageCount = session.context.productImages.length;
      // If user sends 'done' or 'next'
      if (message.type === 'text' && isDoneKeyword(message.content)) {
        if (imageCount < 4) {
          return `${formatWhatsAppBold('🖼️ You have sent ' + imageCount + ' image(s).')}
Send more images, or type "done" when finished.\n${formatWhatsAppItalic('You need at least 4 images to continue.')}`;
        } else {
          session.context.productAdditionState = 'awaiting_details';
          return `${formatWhatsAppBold('📝 Now send the product details:')}

Please provide the product name, price, and description (each on a new line).\nExample:\nProduct Name\n$Price\nDescription`;
        }
      }
      // Always log image count after each image
      if (imageAdded || message.type === 'text') {
        return `${formatWhatsAppBold('🖼️ You have sent ' + imageCount + ' image(s).')}
Send more images, or type "done" when finished.`;
      }
      // Otherwise, do not prompt (wait for more images or 'done')
      return '';
    }

    // Handle product details collection
    if (session.context.productAdditionState === 'awaiting_details') {
      if (message.type === 'text' && message.content && !isDoneKeyword(message.content)) {
        try {
          const product = await productParser.parseLooseProductInput(message.content);
          // Prepare images as Buffers (assume .data is base64)
          const images = (session.context.productImages || []).map((media: any) => Buffer.from(media.data, 'base64'));
          // Send to clip-server
          const clipResult = await clipIntegration.sendProductToClipServer(images, product);
          
          // Send product upload success notification
          try {
            await notificationService.createNotification({
              phoneNumber: session.phoneNumber,
              userType: 'seller',
              title: 'Product Upload Successful!',
              message: `${product.name} has been successfully uploaded to your store. Images added: ${clipResult.added || 0}`,
              type: 'success',
              category: 'product'
            });
          } catch (err) {
            console.error('❌ Failed to send product upload notification:', err);
          }
          
          // Reset state
          session.context.productAdditionState = undefined;
          session.context.productImages = undefined;
          // Build result message
          let resultMsg = `${formatWhatsAppBold('📦 Product Upload Result')}

`;
          resultMsg += `Images added: ${clipResult.added || 0}\n`;
          resultMsg += `Duplicates: ${clipResult.duplicates || 0}\n`;
          if (clipResult.errors && clipResult.errors.length > 0) {
            resultMsg += `Errors: ${clipResult.errors.join(', ')}\n`;
          }
          resultMsg += `\n${formatWhatsAppItalic('Type "back" to return to seller menu.')}`;
          return resultMsg;
        } catch (err: any) {
          return `${formatWhatsAppBold('❌ Error:')} ${err.message}`;
        }
      } else if (message.type === 'text' && isDoneKeyword(message.content)) {
        return `${formatWhatsAppBold('📝 Please send the product details as text (name, price, description).')}`;
      } else {
        return `${formatWhatsAppBold('📝 Please send the product details as text (name, price, description).')}`;
      }
    }

    // Fallback
    return `${formatWhatsAppBold('❌ Unexpected input.')} Please send product images or details as requested.`;
  }

  handleManagingProducts(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'seller_main';
      return this.sellerMenu;
    } else {
      return this.getSellerProducts(session);
    }
  }

  handleOrderManagement(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'seller_main';
      return this.sellerMenu;
    } else {
      return this.getSellerOrders(session);
    }
  }

  private getSellerProducts(session: UserSession): string {
    return `${formatWhatsAppBold('🏪 Your Products')}\n\nYou have 0 products in your catalog.\n\n${formatWhatsAppItalic('Type "add product" to upload your first item or "back" to return to menu.')}`;
  }

  private getSellerOrders(session: UserSession): string {
    return `${formatWhatsAppBold('📋 Customer Orders')}\n\nYou have 0 pending orders.\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
  }

  private getSalesReport(session: UserSession): string {
    return `${formatWhatsAppBold('📊 Sales Report')}\n\n${formatWhatsAppBold('Total Sales:')} ${formatWhatsAppItalic('$0')}\n${formatWhatsAppBold('Total Orders:')} 0\n${formatWhatsAppBold('This Month:')} ${formatWhatsAppItalic('$0')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
  }

  getSellerMenu(): string {
    return this.sellerMenu;
  }
} 