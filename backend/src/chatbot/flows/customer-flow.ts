import { v4 as uuidv4 } from 'uuid';
import { OrderModel } from '../../models/order';
import { StaticProduct } from '../../types';
import { CartItem, UserSession } from '../../types/session.types';
import { formatMonospace, formatWhatsAppBold, formatWhatsAppItalic } from '../../utils/text-formatter';

export class CustomerFlow {
  private staticProducts: StaticProduct[] = [
    { id: 1, name: 'Fashion & Clothing', price: 25 },
    { id: 2, name: 'Electronics', price: 120 },
    { id: 3, name: 'Home & Garden', price: 45 },
    { id: 4, name: 'Beauty & Health', price: 30 },
    { id: 5, name: 'Sports & Outdoors', price: 60 }
  ];

  private readonly customerMenu = `${formatWhatsAppBold('🛍️ Customer Menu')}

What would you like to do?

${formatWhatsAppBold('1️⃣ Browse Products')} - See what's available
${formatWhatsAppBold('2️⃣ Search Products')} - Find specific items
${formatWhatsAppBold('3️⃣ View Cart')} - Check your cart
${formatWhatsAppBold('4️⃣ My Orders')} - Track your orders
${formatWhatsAppBold('5️⃣ Help')} - Get support

${formatWhatsAppItalic('Type the number or describe what you need!')}`;

  async handleCustomerMain(messageText: string, session: UserSession): Promise<string> {
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

  async handleProductBrowsing(messageText: string, session: UserSession): Promise<string> {
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
    } else if (messageText.includes('back') || messageText.includes('menu')) {
      session.currentState = 'customer_main';
      return this.customerMenu;
    } else {
      return this.getCartSummary(session);
    }
  }

  handleCheckout(messageText: string, session: UserSession): string {
    if (messageText.includes('confirm') || messageText.includes('yes')) {
      return `${formatWhatsAppBold('💳 Payment Link Generated')}\n\n${formatWhatsAppItalic('Click here to complete your payment:')}\n${formatMonospace('https://paystack.com/pay/order-123')}\n\n${formatWhatsAppItalic('Once payment is confirmed, you\'ll receive a digital receipt!')}`;
    } else if (messageText.includes('cancel') || messageText.includes('no')) {
      session.currentState = 'cart_management';
      return this.getCartSummary(session);
    } else {
      return `${formatWhatsAppBold('💳 Checkout Summary')}\n\n${this.getCartSummary(session)}\n\n${formatWhatsAppItalic('Type *confirm* to proceed with payment or *cancel* to go back.')}`;
    }
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
    cart.forEach((item: CartItem, index: number) => {
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

  private removeFromCart(messageText: string, session: UserSession): string {
    return `${formatWhatsAppBold('🗑️ Removed from Cart')}\n\nItem has been removed from your cart.\n\n${formatWhatsAppItalic('Type "view cart" to see your updated cart or "back" to return to menu.')}`;
  }

  private async initiateCheckout(session: UserSession): Promise<string> {
    const cart = session.cart || [];
    if (cart.length === 0) {
      return `${formatWhatsAppBold('🛒 Your Cart is Empty')}\n\n${formatWhatsAppItalic('Add some products to get started!')}\n\n${formatWhatsAppItalic('Type "back" to return to menu.')}`;
    }
    let total = 0;
    cart.forEach((item: CartItem) => {
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
        items: cart.map((item: CartItem) => ({ ...item }))
      });
    } catch (err) {
      console.error('❌ Failed to save order to MongoDB:', err);
    }
    const paymentLink = `http://localhost:3001/api/pay/dummy/${orderId}`;
    session.cart = [];
    return `${formatWhatsAppBold('💳 Checkout')}\n\nYour total is ${formatWhatsAppBold(`$${total}`)}.\n\n${formatWhatsAppItalic('Click the link below to complete your payment:')}\n${formatMonospace(paymentLink)}\n\n${formatWhatsAppItalic('Once payment is confirmed, you\'ll receive a digital receipt!')}`;
  }

  getCustomerMenu(): string {
    return this.customerMenu;
  }
} 