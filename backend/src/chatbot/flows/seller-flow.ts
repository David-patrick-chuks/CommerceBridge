import { UserSession } from '../../types/session.types';
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
      return this.getSellerHelp();
    } else {
      return `${formatWhatsAppBold("I didn't understand.")} Please choose from the menu:\n\n${this.sellerMenu}`;
    }
  }

  handleAddingProduct(messageText: string, session: UserSession): string {
    return `${formatWhatsAppBold('📦 Product Added Successfully!')}\n\nYour product has been uploaded to the catalog.\n\n${formatWhatsAppItalic('Type "back" to return to seller menu.')}`;
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

  private getSellerHelp(): string {
    return `${formatWhatsAppBold('🆘 Seller Support')}\n\n${formatWhatsAppItalic('Need help? Here\'s what I can assist with:')}\n\n• Product upload issues\n• Order management\n• Payment processing\n• Account settings\n• General inquiries\n\n${formatWhatsAppItalic('Type your question or "back" to return to menu.')}`;
  }

  getSellerMenu(): string {
    return this.sellerMenu;
  }
} 