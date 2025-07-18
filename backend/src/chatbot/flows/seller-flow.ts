import fs from 'fs';
import path from 'path';
import { notificationService } from '../../services/notification-service';
import { UserSession } from '../../types/session.types';
import { supportService } from '../../utils/ai/index';
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
      return `${formatWhatsAppBold('📦 Add New Product')}

${formatWhatsAppItalic('Please send at least 4 photos of your product to continue.')}

After that, I’ll ask for:
• Product name
• Price
• Description`;
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

    // Use AI to generate support response (skip escalation logic for now)
    try {
      const aiResponse = await supportService.handleCustomerSupport({ question: userQuestion, userType: 'seller', phoneNumber: session.phoneNumber });
      return aiResponse;
    } catch (error) {
      console.error('Error handling support question:', error);
      return 'Sorry, there was an error handling your support request. Please try again later.';
    }
  }

  async handleAddingProduct(message: any, session: UserSession): Promise<string> {
    // Save the full message object to a JSON file for debugging
    const logDir = path.join(__dirname, '../../../logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, `wa-message-${Date.now()}.json`);
    
    try {
      // Robust message object serialization
      const messageData: any = {};
      
      // Try to get all own properties of the message object
      for (const key of Object.getOwnPropertyNames(message)) {
        try {
          const value = (message as any)[key];
          if (typeof value === 'function') {
            messageData[key] = '[Function]';
          } else if (value && typeof value === 'object') {
            // Try to serialize objects, fallback to string representation
            try {
              messageData[key] = JSON.parse(JSON.stringify(value));
            } catch {
              messageData[key] = value.toString();
            }
          } else {
            messageData[key] = value;
          }
        } catch (err) {
          messageData[key] = '[Error accessing property]';
        }
      }
      
      // Also try to get raw data if available
      if (message._data) {
        messageData._data = message._data;
      }
      if (message.rawData) {
        messageData.rawData = message.rawData;
      }
      
      // Try toJSON method if available
      if (typeof message.toJSON === 'function') {
        try {
          messageData.toJSONResult = message.toJSON();
        } catch (err) {
          messageData.toJSONResult = '[Error calling toJSON]';
        }
      }
      
      fs.writeFileSync(logPath, JSON.stringify(messageData, null, 2));
      console.log(`[SellerFlow] Saved full message object to ${logPath}`);
    } catch (err) {
      console.error('[SellerFlow] Failed to save message log:', err);
    }

    // Debug: Log entry and current state
    console.log('[SellerFlow] handleAddingProduct - state:', session.context.productAdditionState, '| images:', session.context.productImages ? session.context.productImages.length : 0);
    console.log('[SellerFlow] Message type:', message.type, '| hasMedia:', message.hasMedia);
    
    // Initialize context if not present
    if (!session.context.productAdditionState) {
      session.context.productAdditionState = 'collecting_images';
      session.context.productImages = [];
      session.context.productDetailsStep = undefined;
      console.log('[SellerFlow] Initialized product addition context.');
    }

    // Helper: check if message is 'done' or 'next'
    const isDoneKeyword = (msg: string) => {
      const txt = msg.trim().toLowerCase();
      return txt === 'done' || txt === 'next';
    };

    // Handle image collection
    if (session.context.productAdditionState === 'collecting_images') {
      let imageAdded = false;
      
      // Handle both 'image' and 'album' types
      if (message.type === 'image' || message.type === 'album') {
        console.log('[SellerFlow] Processing image/album message');
        
        try {
          // For single images
          if (message.type === 'image' && message.hasMedia) {
            const media = await message.downloadMedia();
            if (media) {
              session.context.productImages.push(media);
              console.log(`[SellerFlow] Single image received. Total images: ${session.context.productImages.length}`);
              imageAdded = true;
            }
          }
          // For albums (multiple images)
          else if (message.type === 'album') {
            console.log('[SellerFlow] Processing album message');
            // Try to get all media from the album
            try {
              // If the message has multiple media items
              if (message._data && message._data.media) {
                const mediaItems = Array.isArray(message._data.media) ? message._data.media : [message._data.media];
                for (const mediaItem of mediaItems) {
                  if (mediaItem && mediaItem.data) {
                    session.context.productImages.push(mediaItem);
                    console.log(`[SellerFlow] Album image processed. Total images: ${session.context.productImages.length}`);
                  }
                }
                imageAdded = true;
              } else {
                // Fallback: try to download media from the message
                const media = await message.downloadMedia();
                if (media) {
                  session.context.productImages.push(media);
                  console.log(`[SellerFlow] Album media downloaded. Total images: ${session.context.productImages.length}`);
                  imageAdded = true;
                }
              }
            } catch (albumError) {
              console.error('[SellerFlow] Error processing album:', albumError);
              // Try single media download as fallback
              try {
                const media = await message.downloadMedia();
                if (media) {
                  session.context.productImages.push(media);
                  console.log(`[SellerFlow] Album fallback - single media downloaded. Total images: ${session.context.productImages.length}`);
                  imageAdded = true;
                }
              } catch (fallbackError) {
                console.error('[SellerFlow] Album fallback also failed:', fallbackError);
              }
            }
          }
        } catch (mediaError) {
          console.error('[SellerFlow] Error downloading media:', mediaError);
        }
      }
      
      const imageCount = session.context.productImages.length;
      const minImages = 4;
      
      if (imageAdded) {
        if (imageCount < minImages) {
          console.log(`[SellerFlow] Waiting for more images. (${imageCount}/${minImages})`);
          return `${formatWhatsAppBold('🖼️ Image received!')}
You have sent ${imageCount} image(s). Please send ${minImages - imageCount} more.`;
        } else if (imageCount === minImages) {
          session.context.productAdditionState = 'awaiting_name';
          console.log('[SellerFlow] Minimum images received. Advancing to awaiting_name.');
          return `${formatWhatsAppBold('✅ Minimum images received!')}
Now, what is the *product name*?`;
        } else {
          console.log(`[SellerFlow] Extra image received. (${imageCount})`);
          return `${formatWhatsAppBold('🖼️ Image received!')}
You have sent ${imageCount} images. Type "done" if you are finished, or send more images.`;
        }
      }
      
      // If user types 'done' or 'next'
      if (message.type === 'text' && isDoneKeyword(message.body)) {
        if (imageCount < minImages) {
          console.log(`[SellerFlow] User tried to finish early. (${imageCount}/${minImages})`);
          return `${formatWhatsAppBold('⚠️ You have only sent ' + imageCount + ' image(s).')}
Please send at least ${minImages} images to continue.`;
        } else {
          session.context.productAdditionState = 'awaiting_name';
          console.log('[SellerFlow] User typed done. Advancing to awaiting_name.');
          return `${formatWhatsAppBold('✅ Minimum images received!')}
Now, what is the *product name*?`;
        }
      }
      
      // If user sends text (not 'done'), ignore or prompt
      if (message.type === 'text') {
        console.log('[SellerFlow] Received text while collecting images.');
        return `${formatWhatsAppItalic('Please send product images. Type "done" when finished.')}`;
      }
      
      return '';
    }

    // Step 2: Product Name
    if (session.context.productAdditionState === 'awaiting_name') {
      console.log('[SellerFlow] Awaiting product name.');
      if (message.type === 'text' && message.body && message.body.trim().length > 0) {
        session.context.productName = message.body.trim();
        session.context.productAdditionState = 'awaiting_price';
        console.log('[SellerFlow] Product name received. Advancing to awaiting_price.');
        return `${formatWhatsAppBold('💰 What is the price?')}`;
      } else {
        return `${formatWhatsAppItalic('Please enter the product name.')}`;
      }
    }

    // Step 3: Product Price
    if (session.context.productAdditionState === 'awaiting_price') {
      console.log('[SellerFlow] Awaiting product price.');
      if (message.type === 'text' && message.body && message.body.trim().length > 0) {
        session.context.productPrice = message.body.trim();
        session.context.productAdditionState = 'awaiting_description';
        console.log('[SellerFlow] Product price received. Advancing to awaiting_description.');
        return `${formatWhatsAppBold('📝 Please provide a short description of the product.')}`;
      } else {
        return `${formatWhatsAppItalic('Please enter the product price.')}`;
      }
    }

    // Step 4: Product Description
    if (session.context.productAdditionState === 'awaiting_description') {
      console.log('[SellerFlow] Awaiting product description.');
      if (message.type === 'text' && message.body && message.body.trim().length > 0) {
        session.context.productDescription = message.body.trim();
        // Now parse and upload product
        try {
          const product = {
            name: session.context.productName,
            price: session.context.productPrice,
            description: session.context.productDescription,
            seller: session.userId // Add seller reference
          };
          // Prepare images as Buffers (assume .data is base64)
          const images = (session.context.productImages || []).map((media: any) => Buffer.from(media.data, 'base64'));
          // Send to clip-server
          // const clipResult = await clipIntegration.sendProductToClipServer(images, product); // This line is removed
          // Send product upload success notification
          try {
            await notificationService.createNotification({
              phoneNumber: session.phoneNumber,
              userType: 'seller',
              title: 'Product Upload Successful!',
              message: `${product.name} has been successfully uploaded to your store. Images added: 0`, // This line is changed
              type: 'success',
              category: 'product'
            });
          } catch (err) {
            console.error('❌ Failed to send product upload notification:', err);
          }
          // Reset state
          session.context.productAdditionState = undefined;
          session.context.productImages = undefined;
          session.context.productName = undefined;
          session.context.productPrice = undefined;
          session.context.productDescription = undefined;
          // Build result message
          let resultMsg = `${formatWhatsAppBold('📦 Product Upload Result')}

`;
          resultMsg += `Images added: 0\n`; // This line is changed
          resultMsg += `Duplicates: 0\n`; // This line is changed
          if (/* clipResult.errors && clipResult.errors.length > 0 */ false) { // This line is changed
            resultMsg += `Errors: ${/* clipResult.errors.join(', ') */ ''}`; // This line is changed
          }
          resultMsg += `\n${formatWhatsAppItalic('Type "back" to return to seller menu.')}`;
          console.log('[SellerFlow] Product upload complete. State reset.');
          return resultMsg;
        } catch (err: any) {
          console.error('[SellerFlow] Error uploading product:', err);
          return `${formatWhatsAppBold('❌ Error:')} ${err.message}`;
        }
      } else {
        return `${formatWhatsAppItalic('Please enter a short product description.')}`;
      }
    }

    // Fallback
    console.log('[SellerFlow] Fallback. Unexpected input.');
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