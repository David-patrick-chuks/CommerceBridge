import { v4 as uuidv4 } from 'uuid';
import { MessageMedia } from 'whatsapp-web.js';
import { OrderModel } from '../../models/order';
import { ProductModel } from '../../models/product';
import { UserModel } from '../../models/user';
import { notificationService } from '../../services/notification-service';
import { validateAddressWithShipbubble } from '../../services/shipbubble-service';
import {
  createShipment,
  formatShippingRates,
  getShippingRates,
  ShipbubbleAddress,
  ShipbubblePackage,
  ShipbubbleRatesResponse,
  trackShipment
} from '../../shipping/shipbubble';
import { CartItem, UserSession } from '../../types/session.types';
import { generateProductCollage } from '../../utils/banner-generator';
import { SupportMessages, supportService } from '../../utils/gemini/index';
import { formatMonospace, formatWhatsAppBold, formatWhatsAppItalic } from '../../utils/text-formatter';
import { chatSession } from '../session-manager';

export class CustomerFlow {
  private readonly customerMenu = `${formatWhatsAppBold('🛍️ Customer Menu')}

What would you like to do?

${formatWhatsAppBold('1️⃣ Browse Products')} - See what's available
${formatWhatsAppBold('2️⃣ Search Products')} - Find specific items
${formatWhatsAppBold('3️⃣ View Cart')} - Check your cart
${formatWhatsAppBold('4️⃣ My Orders')} - Track your orders
${formatWhatsAppBold('5️⃣ Track Package')} - Track by tracking number
${formatWhatsAppBold('6️⃣ Help')} - Get support

${formatWhatsAppItalic('Type the number or describe what you need!')}`;

  async handleCustomerMain(messageText: string, session: UserSession): Promise<string> {
    if (messageText.includes('1') || messageText.includes('browse') || messageText.includes('products')) {
      session.currentState = 'browsing_products';
      // Don't call getProductCatalog here - let the conversation flow handle it
      return '';
    } else if (messageText.includes('2') || messageText.includes('search')) {
      session.currentState = 'searching_products';
      return `${formatWhatsAppBold('🔍 Product Search')}\n\n${formatWhatsAppItalic('What are you looking for? Please describe the product you want to find.')}\n\nExamples:\n• "red shoes"\n• "laptop under $500"\n• "organic vegetables"`;
    } else if (messageText.includes('3') || messageText.includes('cart')) {
      session.currentState = 'cart_management';
      return this.getCartSummary(session);
    } else if (messageText.includes('4') || messageText.includes('order')) {
      return await this.getOrderHistory(session);
    } else if (messageText.includes('5') || messageText.includes('track')) {
      session.currentState = 'tracking_package';
      return `${formatWhatsAppBold('📦 Track Package')}\n\n${formatWhatsAppItalic('Please enter your tracking number:')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    } else if (messageText.includes('6') || messageText.includes('help')) {
      session.currentState = 'customer_support';
      return `${formatWhatsAppBold('🆘 Customer Support')}\n\n${formatWhatsAppItalic('I\'m here to help! Please ask your question and I\'ll do my best to assist you.')}\n\n${formatWhatsAppItalic('For urgent issues, I\'ll automatically escalate to our human support team.')}\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
    } else {
      return `${formatWhatsAppBold("I didn't understand.")} Please choose from the menu:\n\n${this.customerMenu}`;
    }
  }

  async handleCustomerSupport(message: any, session: UserSession): Promise<string> {
    const userQuestion = message.body.trim();
    
    // Handle navigation back to main menu
    if (userQuestion.toLowerCase() === 'back') {
      session.currentState = 'customer_main';
      return this.customerMenu;
    }

    // Check if question should be escalated to human support
    const shouldEscalate = await supportService.shouldEscalateToHuman(userQuestion, 'customer');
    
    if (shouldEscalate) {
      // Escalate to human support
      session.currentState = 'escalated_support';
      return SupportMessages.getEscalationMessage();
    }

    // Use Gemini to generate AI response
    try {
      const aiResponse = await supportService.handleSupportQuestion(
        userQuestion, 
        'customer', 
        session.phoneNumber
      );
      
      return SupportMessages.wrapAiResponse(aiResponse);
    } catch (error) {
      console.error('Error handling support question:', error);
      return SupportMessages.getSupportErrorMessage();
    }
  }

  async handleProductBrowsing(messageText: string, session: UserSession): Promise<string> {
    const num = parseInt(messageText.trim());
    if (!isNaN(num)) {
      const products = await ProductModel.find({}).limit(10);
      const product = products[num - 1];
      if (product) {
        // Use session manager to add to cart (persists to DB)
        await chatSession.addToCart(session.phoneNumber, {
          productId: String(product._id),
          name: product.name,
          price: product.price,
          quantity: 1
        });
        
        // Update session cart from session manager
        session.cart = await chatSession.getCart(session.phoneNumber);
        // Send notification for product added to cart
        try {
          await notificationService.createNotification({
            phoneNumber: session.phoneNumber,
            userType: 'customer',
            title: 'Product Added to Cart',
            message: `${product.name} has been added to your cart. Continue shopping or proceed to checkout!`,
            type: 'success',
            category: 'product'
          });
        } catch (err) {
          console.error('❌ Failed to send cart notification:', err);
        }
        return `${formatWhatsAppBold(`✅ ${product.name} added to your cart!`)}\n\n${formatWhatsAppItalic('Type "view cart" to see your cart, or another product number to add more.')}`;
      }
    }
    if (messageText.toLowerCase() === 'view cart') {
      return this.getCartSummary(session);
    }
    if (messageText.toLowerCase() === 'checkout') {
      return await this.initiateCheckout(session);
    }
    if (messageText.toLowerCase() === 'back') {
      session.currentState = 'customer_main';
      return this.customerMenu;
    }
    return this.getProductCatalog();
  }

  handleProductSearch(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'customer_main';
      return this.customerMenu;
    } else {
      return `${formatWhatsAppBold(`🔍 Search Results for "${messageText}"`)}\n\nI found some products matching your search. This feature is coming soon!\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
  }

  async handleCartManagement(messageText: string, session: UserSession): Promise<string> {
    if (messageText.includes('checkout') || messageText.includes('pay')) {
      session.currentState = 'checkout';
      return await this.initiateCheckout(session);
    } else if (messageText.includes('remove') || messageText.includes('delete')) {
      return this.removeFromCart(messageText, session);
    } else if (messageText.toLowerCase().includes('clear cart')) {
      await chatSession.clearCart(session.phoneNumber);
      session.cart = [];
      return `${formatWhatsAppBold('🗑️ Cart Cleared')}\n\n${formatWhatsAppItalic('All items have been removed from your cart.')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    } else if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'customer_main';
      return this.customerMenu;
    } else {
      return this.getCartSummary(session);
    }
  }

  async handleCheckout(messageText: string, session: UserSession): Promise<string> {
    // Initialize checkout context if not present
    if (!session.context.checkoutState) {
      session.context.checkoutState = 'collecting_address';
      session.context.shippingAddress = {};
      session.context.shippingRates = null;
      session.context.selectedRate = null;
    }

    const checkoutState = session.context.checkoutState;

    // Handle address collection
    if (checkoutState === 'collecting_address') {
      if (messageText.toLowerCase() === 'back') {
        session.currentState = 'cart_management';
        session.context.checkoutState = undefined;
        return this.getCartSummary(session);
      }

      // Parse address from message (simple format: "Name, Phone, Address, City, State, Postal Code")
      const addressParts = messageText.split(',').map(part => part.trim());
      if (addressParts.length >= 3) {
        session.context.shippingAddress = {
          name: addressParts[0],
          phone: addressParts[1],
          email: session.phoneNumber + '@commercebridge.com', // Use phone as email
          address: addressParts[2],
          city: addressParts[3] || '',
          state: addressParts[4] || '',
          country: addressParts[5] || 'Nigeria',
          postal_code: addressParts[6] || ''
        };

        // --- Shipbubble address validation ---
        try {
          const validation = await validateAddressWithShipbubble({
            phone: session.context.shippingAddress.phone,
            email: session.context.shippingAddress.email,
            name: session.context.shippingAddress.name,
            address: session.context.shippingAddress.address,
          });
          if (validation.status !== 'success') {
            return `${formatWhatsAppBold('❌ Address Invalid')}
\nPlease check your address and try again.`;
          }
          session.context.shippingAddressValidation = validation.data;
        } catch (err) {
          console.error('❌ Shipbubble address validation failed:', err);
          return `${formatWhatsAppBold('❌ Address Validation Error')}
\nWe could not validate your address. Please try again or type "back" to return to cart.`;
        }

        // Get shipping rates
        try {
          const rates = await this.getShippingRatesForOrder(session);
          session.context.shippingRates = rates;
          session.context.checkoutState = 'selecting_shipping';
          
          return formatShippingRates(rates);
        } catch (error: any) {
          return `${formatWhatsAppBold('❌ Shipping Error')}
\n${error.message}
\n${formatWhatsAppItalic('Please try again or type "back" to return to cart.')}`;
        }
      } else {
        return `${formatWhatsAppBold('📦 Shipping Address Required')}
\nPlease provide your shipping address in this format:
\n${formatMonospace('Name, Phone, Address, City, State, Postal Code')}
\nExample:
${formatMonospace('John Doe, +2348012345678, 123 Main St, Lagos, Lagos State, 100001')}
\n${formatWhatsAppItalic('Type "back" to return to cart.')}`;
      }
    }

    // Handle shipping rate selection
    if (checkoutState === 'selecting_shipping') {
      if (messageText.toLowerCase() === 'back') {
        session.context.checkoutState = 'collecting_address';
        session.context.shippingRates = null;
        return `${formatWhatsAppBold('📦 Shipping Address Required')}\n\nPlease provide your shipping address in this format:\n\n${formatMonospace('Name, Phone, Address, City, State, Postal Code')}\n\n${formatWhatsAppItalic('Type "back" to return to cart.')}`;
      }

      const rateIndex = parseInt(messageText) - 1;
      const rates = session.context.shippingRates?.data?.rates;
      
      if (rates && rateIndex >= 0 && rateIndex < rates.length) {
        session.context.selectedRate = rates[rateIndex];
        session.context.checkoutState = 'confirming_order';
        
        return this.getOrderConfirmation(session);
      } else {
        return `${formatWhatsAppBold('❌ Invalid Selection')}\n\nPlease select a valid shipping option number.\n\n${formatShippingRates(session.context.shippingRates)}`;
      }
    }

    // Handle order confirmation
    if (checkoutState === 'confirming_order') {
      if (messageText.toLowerCase() === 'confirm' || messageText.toLowerCase() === 'yes') {
        return await this.processOrder(session);
      } else if (messageText.toLowerCase() === 'cancel' || messageText.toLowerCase() === 'no') {
      session.currentState = 'cart_management';
        session.context.checkoutState = undefined;
      return this.getCartSummary(session);
    } else {
        return this.getOrderConfirmation(session);
      }
    }

    // Fallback
    return `${formatWhatsAppBold('❌ Unexpected input.')} Please follow the checkout process or type "back" to return to cart.`;
  }

  private async getShippingRatesForOrder(session: UserSession): Promise<ShipbubbleRatesResponse> {
    const cart = session.cart || [];
    if (cart.length === 0) {
      throw new Error('Cart is empty');
    }

    // Calculate package weight (estimate 0.5kg per item)
    const totalWeight = cart.reduce((sum, item) => sum + (item.quantity * 0.5), 0);
    
    // --- Fetch seller's validated address_code ---
    const seller = await UserModel.findOne({ userType: 'seller', storeAddressValidation: { $exists: true } });
    if (!seller || !seller.storeAddressValidation?.address_code) {
      throw new Error('Seller address not validated. Please contact support.');
    }
    const sellerAddressCode = seller.storeAddressValidation.address_code;

    // --- Get customer's validated address_code ---
    const customerAddressCode = session.context.shippingAddressValidation?.address_code;
    if (!customerAddressCode) {
      throw new Error('Customer address not validated. Please re-enter your address.');
    }

    // Build the Shipbubble rate request using required fields
    const fetchRatesRequest = {
      sender_address_code: sellerAddressCode,
      reciever_address_code: customerAddressCode,
      pickup_date: new Date().toISOString().split('T')[0], // today
      category_id: 1, // default category, adjust as needed
      package_items: cart.map(item => ({
        name: item.name,
        description: item.name, // or a better description if available
        quantity: item.quantity.toString(), // must be a string
        unit_weight: "0.5", // must be a string
        unit_amount: item.price.toString() // must be a string
      })),
      package_dimension: {
        weight: Math.max(totalWeight, 0.1),
        length: 10, // default or calculated
        width: 10,  // default or calculated
        height: 10  // default or calculated
      }
    };

    return await getShippingRates(fetchRatesRequest);
  }

  private getOrderConfirmation(session: UserSession): string {
    const cart = session.cart || [];
    const selectedRate = session.context.selectedRate;
    
    let subtotal = 0;
    cart.forEach((item: CartItem) => {
      subtotal += item.price * item.quantity;
    });

    const shippingCost = selectedRate?.total || 0;
    const total = subtotal + shippingCost;

    let confirmation = `${formatWhatsAppBold('📋 Order Summary')}\n\n`;
    
    // Cart items
    cart.forEach((item: CartItem, index: number) => {
      confirmation += `${index + 1}. ${formatWhatsAppBold(item.name)} x${item.quantity} - ${formatMonospace(`$${item.price * item.quantity}`)}\n`;
    });
    
    confirmation += `\n${formatWhatsAppBold('Subtotal:')} ${formatMonospace(`$${subtotal}`)}\n`;
    confirmation += `${formatWhatsAppBold('Shipping:')} ${formatMonospace(`$${shippingCost}`)} (${selectedRate?.courier_name})\n`;
    confirmation += `${formatWhatsAppBold('Total:')} ${formatMonospace(`$${total}`)}\n\n`;
    
    confirmation += `${formatWhatsAppBold('📦 Shipping to:')}\n`;
    const address = session.context.shippingAddress;
    confirmation += `${address.name}\n${address.address}\n${address.city}, ${address.state} ${address.postal_code}\n\n`;
    
    confirmation += `${formatWhatsAppItalic('Type *confirm* to proceed with payment or *cancel* to go back.')}`;
    
    return confirmation;
  }

  private async processOrder(session: UserSession): Promise<string> {
    const cart = session.cart || [];
    const selectedRate = session.context.selectedRate;
    const shippingAddress = session.context.shippingAddress;
    
    if (cart.length === 0) {
      return `${formatWhatsAppBold('❌ Error:')} Cart is empty.`;
    }

    let subtotal = 0;
    cart.forEach((item: CartItem) => {
      subtotal += item.price * item.quantity;
    });

    const shippingCost = selectedRate?.total || 0;
    const total = subtotal + shippingCost;
    const orderId = uuidv4();

    try {
      // Create shipment with Shipbubble
      const packageInfo: ShipbubblePackage = {
        weight: Math.max(cart.reduce((sum, item) => sum + (item.quantity * 0.5), 0), 0.1),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          weight: 0.5
        }))
      };

      const shipFrom: ShipbubbleAddress = {
        name: 'CommerceBridge Store',
        phone: '+2348000000000',
        email: 'store@commercebridge.com',
        address: '123 Commerce Street',
        city: 'Lagos',
        state: 'Lagos State',
        country: 'Nigeria',
        postal_code: '100001'
      };

      // Use all required arguments for createShipment
      const shipment = await createShipment(
        selectedRate.request_token,
        selectedRate.service_code,
        selectedRate.courier_id,
        shipFrom,
        shippingAddress,
        packageInfo
      );

      // Save order to database with shipping details
      await OrderModel.create({
        orderId,
        user: session.userId || 'guest',
        phoneNumber: session.phoneNumber,
        total,
        paid: false,
        items: cart.map((item: CartItem) => ({ ...item })),
        shipping: {
          cost: shippingCost,
          courier: selectedRate.courier_name,
          tracking_number: shipment.data.tracking_number,
          address: shippingAddress,
          eta: selectedRate.delivery_eta
        }
      });

      // Send order confirmation notification
      try {
        await notificationService.createNotification({
          phoneNumber: session.phoneNumber,
          userType: 'customer',
          title: 'Order Confirmed!',
          message: `Your order #${orderId} has been created successfully. Total: $${total}. Shipping: ${selectedRate.courier_name}. Tracking: ${shipment.data.tracking_number}`,
          type: 'success',
          category: 'order'
        });
      } catch (err) {
        console.error('❌ Failed to send order confirmation notification:', err);
      }

      // Clear cart and checkout state
      session.cart = [];
      session.context.checkoutState = undefined;

      const paymentLink = `http://localhost:3001/api/pay/dummy/${orderId}`;
      
      return `${formatWhatsAppBold('✅ Order Created Successfully!')}\n\n${formatWhatsAppBold('Order ID:')} ${orderId}\n${formatWhatsAppBold('Total:')} $${total}\n${formatWhatsAppBold('Shipping:')} ${selectedRate.courier_name}\n${formatWhatsAppBold('Tracking:')} ${shipment.data.tracking_number}\n${formatWhatsAppBold('ETA:')} ${selectedRate.delivery_eta}\n\n${formatWhatsAppItalic('Click the link below to complete your payment:')}\n${formatMonospace(paymentLink)}\n\n${formatWhatsAppItalic('Once payment is confirmed, you\'ll receive tracking updates!')}`;

    } catch (error: any) {
      console.error('❌ Failed to process order:', error);
      return `${formatWhatsAppBold('❌ Order Error')}\n\n${error.message}\n\n${formatWhatsAppItalic('Please try again or contact support.')}`;
    }
  }

  // Replace getProductCatalog to send a WhatsApp image with a cool caption and prices
  async getProductCatalog(session?: UserSession, client?: any, to?: string): Promise<string> {
    try {
      console.log('[CustomerFlow] Getting product catalog...');
      const products = await ProductModel.find({}).limit(4);
      console.log('[CustomerFlow] Found products:', products.length);
      
      if (!products.length) {
        console.log('[CustomerFlow] No products found in database');
        return 'No products found.';
      }
      
      // Get the first 4 images from all products (flattened)
      const imageUrls = products.flatMap(p => p.image).slice(0, 4);
      console.log('[CustomerFlow] Image URLs:', imageUrls);
      
      if (imageUrls.length < 4) {
        console.log('[CustomerFlow] Not enough images, falling back to text');
        return this.getProductCatalogTextOnly(products);
      }
      
      console.log('[CustomerFlow] Generating collage...');
      const collageBuffer = await generateProductCollage(imageUrls);
      console.log('[CustomerFlow] Collage generated, size:', collageBuffer.length);
      
      const media = new MessageMedia('image/jpeg', collageBuffer.toString('base64'));
      
      // Build a cool caption
      let caption = `${formatWhatsAppBold('🛒 Trending Hot Products! 🔥🔥')}

`;
      products.forEach((p, idx) => {
        caption += `${idx + 1}. ${formatWhatsAppBold(p.name)} - ${formatMonospace(`$${p.price}`)}\n`;
      });
      caption += `\n${formatWhatsAppItalic('Type the product number to add to cart, or "back" to return to menu.')}`;
      
      console.log('[CustomerFlow] Caption:', caption);
      
      // Send the image with caption if client and to are provided
      if (client && to) {
        console.log('[CustomerFlow] Sending image via WhatsApp to:', to);
        await client.sendMessage(to, media, { caption });
        console.log('[CustomerFlow] Image sent successfully');
        return '';
      } else {
        console.log('[CustomerFlow] No client/to provided, returning caption only');
        return caption;
      }
    } catch (error) {
      console.error('[CustomerFlow] Error in getProductCatalog:', error);
      // Fallback to text-only
      const products = await ProductModel.find({}).limit(4);
      return this.getProductCatalogTextOnly(products);
    }
  }

  private getProductCatalogTextOnly(products: any[]): string {
    let text = `${formatWhatsAppBold('🛒 Trending Hot Products! 🔥🔥')}

`;
    products.forEach((p, idx) => {
      text += `${idx + 1}. ${formatWhatsAppBold(p.name)} - ${formatMonospace(`$${p.price}`)}\n`;
    });
    text += `\n${formatWhatsAppItalic('Type the product number to add to cart, or "back" to return to menu.')}`;
    return text;
  }

  private getCartSummary(session: UserSession): string {
    const cart = session.cart || [];
    if (cart.length === 0) {
      return `${formatWhatsAppBold('🛒 Your Cart is Empty')}\n\n${formatWhatsAppItalic('Add some products to get started!')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
    let summary = `${formatWhatsAppBold('🛒 Your Cart')}\n\n`;
    let total = 0;
    cart.forEach((item: CartItem, index: number) => {
      summary += `${index + 1}. ${formatWhatsAppBold(item.name)} x${item.quantity} - ${formatMonospace(`$${item.price * item.quantity}`)}\n`;
      total += item.price * item.quantity;
    });
    summary += `\n${formatWhatsAppBold(`💰 Subtotal: $${total}`)}\n`;
    summary += `${formatWhatsAppItalic('Shipping cost will be calculated at checkout.')}\n\n`;
    summary += `${formatWhatsAppItalic('Commands:')}\n`;
    summary += `${formatWhatsAppItalic('• checkout" - Start payment')}\n`;
    summary += `${formatWhatsAppItalic('• "remove 1- Remove item #1')}\n`;
    summary += `${formatWhatsAppItalic('• "clear cart" - Remove all items')}\n`;
    summary += `${formatWhatsAppItalic('• back- Return to menu')}`;
    return summary;
  }

  private async getOrderHistory(session: UserSession): Promise<string> {
    const phoneNumber = session.phoneNumber;
    if (!phoneNumber) {
      return `${formatWhatsAppBold('❌ Unable to fetch order history:')} phone number not found.`;
    }
    try {
      const orders = await OrderModel.find({ phoneNumber }).sort({ createdAt: -1 }).limit(10);
      if (!orders.length) {
        return `${formatWhatsAppBold('📋 No Orders Yet')}\n\n${formatWhatsAppItalic('You haven\'t placed any orders yet.')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
      }
      return `${formatWhatsAppBold('📋 Your Order History')}\n\n${orders
        .map((order, idx) => {
          const shippingInfo = order.shipping ? ` - ${order.shipping.courier}` : '';
          return `${idx + 1}. ${formatWhatsAppBold(`Order #${order.orderId}`)} - Status: ${formatWhatsAppItalic(order.paid ? 'Paid' : 'Pending')} - Total: ${formatMonospace(`$${order.total}`)}${shippingInfo}`;
        })
        .join('\n')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    } catch (err) {
      console.error('❌ Failed to fetch order history from MongoDB:', err);
      return `${formatWhatsAppBold('❌ Unable to fetch order history')} due to a server error.`;
    }
  }

  private async removeFromCart(messageText: string, session: UserSession): Promise<string> {
    // Parse the remove command: "remove 1", "remove 2", etc.
    const removeMatch = messageText.toLowerCase().match(/remove\s+(\d+)/);
    if (!removeMatch) {
      return `${formatWhatsAppBold('❌ Invalid Remove Command')}\n\n${formatWhatsAppItalic('Please use the format: "remove item number]"')}\n\n${formatWhatsAppItalic('Example: "remove 1" to remove the first item')}`;
    }

    const itemIndex = parseInt(removeMatch[1]) - 1;
    const cart = session.cart || [];
    if (itemIndex < 0 || itemIndex >= cart.length) {
      return `${formatWhatsAppBold('❌ Invalid Item Number')}\n\n${formatWhatsAppItalic(`Please select a number between 1 and ${cart.length}`)}`;
    }

    const removedItem = cart[itemIndex];
    // Use session manager to remove from cart (persists to DB)
    await chatSession.removeFromCart(session.phoneNumber, removedItem.productId);
    // Update session cart from session manager
    session.cart = await chatSession.getCart(session.phoneNumber);

    return `${formatWhatsAppBold('🗑️ Item Removed')}\n\n${formatWhatsAppBold(removedItem.name)} has been removed from your cart.\n\n${formatWhatsAppItalic('Type "view cart" to see your updated cart or "back" to return to menu.')}`;
  }

  async handleTracking(messageText: string, session: UserSession): Promise<string> {
    if (messageText.toLowerCase() === 'back') {
      session.currentState = 'customer_main';
      return this.customerMenu;
    }

    const trackingNumber = messageText.trim();
    if (!trackingNumber) {
      return `${formatWhatsAppBold('❌ Invalid Tracking Number')}\n\n${formatWhatsAppItalic('Please enter a valid tracking number.')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }

    try {
      const trackingInfo = await trackShipment(trackingNumber);
      
      if (trackingInfo.status === 'success' && trackingInfo.data) {
        const data = trackingInfo.data;
        let trackingMessage = `${formatWhatsAppBold('📦 Package Tracking')}\n\n`;
        trackingMessage += `${formatWhatsAppBold('Tracking Number:')} ${trackingNumber}\n`;
        trackingMessage += `${formatWhatsAppBold('Status:')} ${data.status || 'Unknown'}\n`;
        
        if (data.eta) {
          trackingMessage += `${formatWhatsAppBold('ETA:')} ${data.eta}\n`;
        }
        
        if (data.location) {
          trackingMessage += `${formatWhatsAppBold('Location:')} ${data.location}\n`;
        }
        
        if (data.events && data.events.length > 0) {
          trackingMessage += `\n${formatWhatsAppBold('Recent Updates:')}\n`;
          data.events.slice(0, 3).forEach((event: any, index: number) => {
            trackingMessage += `${index + 1}. ${event.description || event.status}\n`;
            if (event.timestamp) {
              trackingMessage += `   📅 ${new Date(event.timestamp).toLocaleDateString()}\n`;
            }
            trackingMessage += '\n';
          });
        }
        
        trackingMessage += `${formatWhatsAppItalic('Type "back" to return to menu.')}`;
        return trackingMessage;
      } else {
        return `${formatWhatsAppBold('❌ Tracking Not Found')}\n\n${formatWhatsAppItalic('No tracking information found for this number.')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
      }
    } catch (error: any) {
      console.error('❌ Tracking error:', error);
      return `${formatWhatsAppBold('❌ Tracking Error')}\n\n${error.message}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
  }

  getCustomerMenu(): string {
    return this.customerMenu;
  }

  // Add this method to fix missing initiateCheckout errors
  async initiateCheckout(session: UserSession): Promise<string> {
    // This is a stub. Implement the actual checkout logic as needed.
    return 'Checkout process initiated. (Stub implementation)';
  }
} 