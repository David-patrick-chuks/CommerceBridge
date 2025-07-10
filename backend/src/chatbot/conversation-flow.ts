// conversation-flow.ts
import axios from 'axios';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Client, Message, MessageMedia } from 'whatsapp-web.js';
import { OrderModel } from '../models/order';
import { formatCode, formatMonospace, formatWhatsAppBold, formatWhatsAppItalic } from '../utils/text-formatter';
import { UserSession } from './session-manager';


export interface ConversationResponse {
  message: string;
  nextState?: string;
  context?: Record<string, any>;
}

declare const orders: Record<string, { user: string; phoneNumber: string; total: number; paid: boolean; items: any[] }>;

export class ConversationFlow {
  private staticProducts = [
    { id: 1, name: 'Fashion & Clothing', price: 25 },
    { id: 2, name: 'Electronics', price: 120 },
    { id: 3, name: 'Home & Garden', price: 45 },
    { id: 4, name: 'Beauty & Health', price: 30 },
    { id: 5, name: 'Sports & Outdoors', price: 60 }
  ];

  private readonly onboardingWelcome = `${formatWhatsAppBold('👋 Welcome to CommerceBridge!')}

${formatCode("I'm your AI shopping assistant! Here's what I can help you with:")}

What would you like to do?

${formatWhatsAppBold('1️⃣ Customer')} - Shop for products
${formatWhatsAppBold('2️⃣ Seller')} - Sell your products
${formatWhatsAppBold('3️⃣ FAQs')} - Common questions & answers
${formatWhatsAppBold('4️⃣ Contact Support')} - Get help from our team

`;

  private readonly switchRoleOption = `\n${formatWhatsAppBold('6️⃣ Switch Role')} - Change between Customer/Seller`;

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

  private readonly customerMenu = `${formatWhatsAppBold('🛍️ Customer Menu')}

What would you like to do?

${formatWhatsAppBold('1️⃣ Browse Products')} - See what's available
${formatWhatsAppBold('2️⃣ Search Products')} - Find specific items
${formatWhatsAppBold('3️⃣ View Cart')} - Check your cart
${formatWhatsAppBold('4️⃣ My Orders')} - Track your orders
${formatWhatsAppBold('5️⃣ Help')} - Get support${this.switchRoleOption}

${formatWhatsAppItalic('Type the number or describe what you need!')}`;

  private readonly sellerMenu = `${formatWhatsAppBold('🏪 Seller Menu')}

What would you like to do?

${formatWhatsAppBold('1️⃣ Add Product')} - Upload new items
${formatWhatsAppBold('2️⃣ My Products')} - Manage inventory
${formatWhatsAppBold('3️⃣ View Orders')} - Handle customer orders
${formatWhatsAppBold('4️⃣ Sales Report')} - Check your performance
${formatWhatsAppBold('5️⃣ Help')} - Get support${this.switchRoleOption}

${formatWhatsAppItalic('Type the number or describe what you need!')}`;

  async processMessage(message: Message, session: UserSession, client: Client): Promise<string | null> {
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
        // Handle onboarding response
        if (message.body.toLowerCase().includes('1') || message.body.toLowerCase().includes('customer')) {
          session.userType = 'customer';
          session.currentState = 'awaiting_account_creation';
          return `Great! To shop as a customer, you'll need to create an account.\n\nType *create account* or *signup* to get your registration link.`;
        }
        if (message.body.toLowerCase().includes('2') || message.body.toLowerCase().includes('seller')) {
          session.userType = 'seller';
          session.currentState = 'awaiting_account_creation';
          return `Awesome! To sell on CommerceBridge, you'll need to create a seller account.\n\nType *create account* or *signup* to get your registration link.`;
        }
        // Handle FAQs
        if (message.body.trim() === '3' || message.body.toLowerCase().includes('faq')) {
          return this.getOnboardingFAQs();
        }
        // Handle Contact Support
        if (message.body.trim() === '4' || message.body.toLowerCase().includes('support')) {
          return this.getOnboardingSupport();
        }
        if (message.body.toLowerCase().includes('create account') || message.body.toLowerCase().includes('signup') || message.body.toLowerCase().includes('register')) {
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
        if (message.body.toLowerCase().match(/browse|product|cart|order|add|upload|inventory|manage|sales|report|help/)) {
          return `${formatWhatsAppBold("You'll need to create an account before using this feature.")}\n\n${formatWhatsAppItalic('Type *create account* to get started.')}`;
        }
        // Default: always send the banner image with onboarding welcome as caption
        const bannerPath = path.join(__dirname, '../../public/banner.jpeg');
        const media = await MessageMedia.fromFilePath(bannerPath);
        // WhatsApp buttons are deprecated and not supported as of 2025
        // Only send the onboarding image with caption
        console.log('[Onboarding] Sending onboarding image with caption (no buttons, buttons deprecated)');
        await client.sendMessage(message.from, media, { caption: this.onboardingWelcome });
        return null;
      }
      if (session.userType === 'customer') {
        session.currentState = 'customer_main';
        return this.customerMenu;
      }
      if (session.userType === 'seller') {
        session.currentState = 'seller_main';
        return this.sellerMenu;
      }
      return this.onboardingWelcome;
    } catch (error) {
      console.error('❌ Error in conversation flow:', error);
      return this.getErrorMessage();
    }
  }

  private async handleCustomerMain(messageText: string, session: UserSession): Promise<string> {
    if (messageText.includes('1') || messageText.includes('browse') || messageText.includes('products')) {
      session.currentState = 'browsing_products';
      return this.getProductCatalog();
    } else if (messageText.includes('2') || messageText.includes('search')) {
      session.currentState = 'searching_products';
      return `${formatWhatsAppBold('🔍 Product Search')}\n\n${formatWhatsAppItalic('What are you looking for? Please describe the product you want to find.')}\n\nExamples:\n• "red shoes"\n• "laptop under $500"\n• "organic vegetables"`;
    } else if (messageText.includes('3') || messageText.includes('cart')) {
      session.currentState = 'cart_management';
      return this.getCartSummary(session);
    } else if (messageText.includes('4') || messageText.includes('order')) {
      return await this.getOrderHistory(session);
    } else if (messageText.includes('5') || messageText.includes('help')) {
      return this.getCustomerHelp();
    } else {
      return `${formatWhatsAppBold("I didn't understand.")} Please choose from the menu:\n\n${this.customerMenu}`;
    }
  }

  private handleSellerMain(messageText: string, session: UserSession): string {
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
      return this.getSellerHelp();
    } else {
      return `${formatWhatsAppBold("I didn't understand.")} Please choose from the menu:\n\n${this.sellerMenu}`;
    }
  }

  private async handleProductBrowsing(messageText: string, session: UserSession): Promise<string> {
    const num = parseInt(messageText.trim());
    if (!isNaN(num)) {
      const product = this.staticProducts.find(p => p.id === num);
      if (product) {
        if (!session.cart) session.cart = [];
        session.cart.push({ productId: String(product.id), name: product.name, price: product.price, quantity: 1 });
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

  private handleProductSearch(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'customer_main';
      return this.customerMenu;
    } else {
      return `${formatWhatsAppBold(`🔍 Search Results for "${messageText}"`)}\n\nI found some products matching your search. This feature is coming soon!\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
  }

  private async handleCartManagement(messageText: string, session: UserSession): Promise<string> {
    if (messageText.includes('checkout') || messageText.includes('pay')) {
      session.currentState = 'checkout';
      return await this.initiateCheckout(session);
    } else if (messageText.includes('remove') || messageText.includes('delete')) {
      return this.removeFromCart(messageText, session);
    } else if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'customer_main';
      return this.customerMenu;
    } else {
      return this.getCartSummary(session);
    }
  }

  private handleCheckout(messageText: string, session: UserSession): string {
    if (messageText.includes('confirm') || messageText.includes('yes')) {
      return `${formatWhatsAppBold('💳 Payment Link Generated')}\n\n${formatWhatsAppItalic('Click here to complete your payment:')}\n${formatMonospace('https://paystack.com/pay/order-123')}\n\n${formatWhatsAppItalic('Once payment is confirmed, you\'ll receive a digital receipt!')}`;
    } else if (messageText.includes('cancel') || messageText.includes('no')) {
      session.currentState = 'cart_management';
      return this.getCartSummary(session);
    } else {
      return `${formatWhatsAppBold('💳 Checkout Summary')}\n\n${this.getCartSummary(session)}\n\n${formatWhatsAppItalic('Type *confirm* to proceed with payment or *cancel* to go back.')}`;
    }
  }

  private handleAddingProduct(messageText: string, session: UserSession): string {
    return `${formatWhatsAppBold('📦 Product Added Successfully!')}\n\nYour product has been uploaded to the catalog.\n\n${formatWhatsAppItalic('Type "back" to return to seller menu.')}`;
  }

  private handleManagingProducts(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'seller_main';
      return this.sellerMenu;
    } else {
      return this.getSellerProducts(session);
    }
  }

  private handleOrderManagement(messageText: string, session: UserSession): string {
    if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'seller_main';
      return this.sellerMenu;
    } else {
      return this.getSellerOrders(session);
    }
  }

  private handleUnknownState(messageText: string, session: UserSession): string {
    session.currentState = session.userType === 'customer' ? 'customer_main' : 'seller_main';
    return session.userType === 'customer' ? this.customerMenu : this.sellerMenu;
  }

  private getProductCatalog(): string {
    let catalog = `${formatWhatsAppBold('🛍️ Product Catalog')}\n\n${formatWhatsAppItalic('Here are our featured products:')}\n`;
    this.staticProducts.forEach((p) => {
      catalog += `\n${p.id}. ${formatWhatsAppBold(p.name)} - ${formatMonospace(`$${p.price}`)}`;
    });
    catalog += `\n\n${formatWhatsAppItalic('Type the product number to add to cart, or "back" to return to menu.')}`;
    return catalog;
  }

  private getCartSummary(session: UserSession): string {
    const cart = session.cart || [];
    if (cart.length === 0) {
      return `${formatWhatsAppBold('🛒 Your Cart is Empty')}\n\n${formatWhatsAppItalic('Add some products to get started!')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
    let summary = `${formatWhatsAppBold('🛒 Your Cart')}\n\n`;
    let total = 0;
    cart.forEach((item, index) => {
      summary += `${index + 1}. ${formatWhatsAppBold(item.name)} x${item.quantity} - ${formatMonospace(`$${item.price * item.quantity}`)}\n`;
      total += item.price * item.quantity;
    });
    summary += `\n${formatWhatsAppBold(`💰 Total: $${total}`)}\n\n`;
    summary += `${formatWhatsAppItalic('Type *checkout* to pay or *remove [item number]* to remove items.')}`;
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
        .map((order, idx) => `${idx + 1}. ${formatWhatsAppBold(`Order #${order.orderId}`)} - Status: ${formatWhatsAppItalic(order.paid ? 'Paid' : 'Pending')} - Total: ${formatMonospace(`$${order.total}`)}`)
        .join('\n')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    } catch (err) {
      console.error('❌ Failed to fetch order history from MongoDB:', err);
      return `${formatWhatsAppBold('❌ Unable to fetch order history')} due to a server error.`;
    }
  }

  private getCustomerHelp(): string {
    return `${formatWhatsAppBold('🆘 Customer Support')}\n\n${formatWhatsAppItalic('Need help? Here\'s what I can assist with:')}\n\n• Product questions\n• Order tracking\n• Payment issues\n• Returns & refunds\n• General inquiries\n\n${formatWhatsAppItalic('Type your question or "back" to return to menu.')}`;
  }

  private getSellerProducts(session: UserSession): string {
    return `${formatWhatsAppBold('🏪 Your Products')}\n\nYou have 0 products in your catalog.\n\n${formatWhatsAppItalic('Type "add product" to upload your first item or "back" to return to menu.')}`;
  }

  private getSellerOrders(session: UserSession): string {
    return `${formatWhatsAppBold('📋 Customer Orders')}\n\nYou have 0 pending orders.\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
  }

  private getSalesReport(session: UserSession): string {
    return `${formatWhatsAppBold('📊 Sales Report')}\n\n${formatWhatsAppBold('Total Sales:')} ${formatMonospace('$0')}\n${formatWhatsAppBold('Total Orders:')} 0\n${formatWhatsAppBold('This Month:')} ${formatMonospace('$0')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
  }

  private getSellerHelp(): string {
    return `${formatWhatsAppBold('🆘 Seller Support')}\n\n${formatWhatsAppItalic('Need help? Here\'s what I can assist with:')}\n\n• Product upload issues\n• Order management\n• Payment processing\n• Account settings\n• General inquiries\n\n${formatWhatsAppItalic('Type your question or "back" to return to menu.')}`;
  }

  private addToCart(messageText: string, session: UserSession): string {
    return `${formatWhatsAppBold('✅ Added to Cart')}\n\nProduct has been added to your cart!\n\n${formatWhatsAppItalic('Type "view cart" to see your items or "back" to continue shopping.')}`;
  }

  private removeFromCart(messageText: string, session: UserSession): string {
    return `${formatWhatsAppBold('🗑️ Removed from Cart')}\n\nItem has been removed from your cart.\n\n${formatWhatsAppItalic('Type "view cart" to see your updated cart or "back" to return to menu.')}`;
  }

  private async initiateCheckout(session: UserSession): Promise<string> {
    const cart = session.cart || [];
    if (cart.length === 0) {
      return `${formatWhatsAppBold('🛒 Your Cart is Empty')}\n\n${formatWhatsAppItalic('Add some products to get started!')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
    let total = 0;
    cart.forEach(item => {
      total += item.price * item.quantity;
    });
    const orderId = uuidv4();
    try {
      await OrderModel.create({
        orderId,
        user: session.userId || 'guest',
        phoneNumber: session.phoneNumber,
        total,
        paid: false,
        items: cart.map(item => ({ ...item }))
      });
    } catch (err) {
      console.error('❌ Failed to save order to MongoDB:', err);
    }
    if (typeof orders !== 'undefined') {
      orders[orderId] = {
        user: session.userId || 'guest',
        phoneNumber: session.phoneNumber,
        total,
        paid: false,
        items: cart.map(item => ({ ...item }))
      };
    }
    const paymentLink = `http://localhost:3001/api/pay/dummy/${orderId}`;
    session.cart = [];
    return `${formatWhatsAppBold('💳 Checkout')}\n\nYour total is ${formatWhatsAppBold(`$${total}`)}.\n\n${formatWhatsAppItalic('Click the link below to complete your payment:')}\n${formatMonospace(paymentLink)}\n\n${formatWhatsAppItalic('Once payment is confirmed, you\'ll receive a digital receipt!')}`;
  }

  private getErrorMessage(): string {
    return `${formatWhatsAppBold('❌ Something went wrong')}\n\n${formatWhatsAppItalic('I encountered an error processing your request. Please try again or type "help" for support.')}`;
  }

  private getOnboardingFAQs(): string {
    return `${formatWhatsAppBold('❓ Frequently Asked Questions (FAQs)')}\n\n${formatWhatsAppBold('About CommerceBridge:')}\nCommerceBridge helps small businesses like yours sell online easily — right inside WhatsApp! We provide digital storefronts, automated orders, and easy payment options to streamline your sales.\n\n${formatWhatsAppBold('1. How do I create an account?')}\n- Just type ${formatWhatsAppItalic('create account')} or ${formatWhatsAppItalic('signup')} and follow the link!\n\n${formatWhatsAppBold('2. Is CommerceBridge free to use?')}\n- Yes, creating an account and browsing is free.\n\n${formatWhatsAppBold('3. How do I contact support?')}\n- Reply with ${formatWhatsAppItalic('4')} or ${formatWhatsAppItalic('Contact Support')} at any time.\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }

  private getOnboardingSupport(): string {
    return `${formatWhatsAppBold('🛟 Contact Support')}\n\n${formatWhatsAppItalic('Our team is here to help!')}\n\n• For urgent issues, reply with your question and a human agent will respond soon.\n• For common questions, check our ${formatWhatsAppItalic('FAQs')} (type ${formatWhatsAppItalic('3')}).\n\n${formatWhatsAppItalic('Type "back" to return to the main menu.')}`;
  }
}