import mongoose from 'mongoose';
import { UserModel } from '../models';
import { CartModel } from '../models/cart';
import { unknownUserService } from '../services/unknown-user-service';
import { CartItem, UserPreferences, UserSession } from '../types';

export class ChatSession {
  private sessions: Map<string, UserSession> = new Map();

  async getSession(phoneNumber: string, firstMessage?: string): Promise<UserSession> {
    // Normalize phone number
    phoneNumber = phoneNumber.replace(/@c\.us$/, '');
    // Debug log: phone number being searched
    // console.log('[SessionManager] Looking for user with phoneNumber:', phoneNumber);
    // Check if session exists
    if (this.sessions.has(phoneNumber)) {
      const session = this.sessions.get(phoneNumber)!;
      session.lastActivity = new Date();
      return session;
    }

    // Check if user exists in MongoDB
    let needsAccount = false;
    let userType: 'customer' | 'seller' | 'unknown' = 'unknown';
    let cartItems: CartItem[] | undefined;
    try {
      const user = await UserModel.findOne({ phoneNumber });
      // console.log('[SessionManager] User found in DB:', user);
      needsAccount = !user;
      if (user) {
        userType = user.userType; // set userType from DB
        // --- Load cart from DB for registered user ---
        const dbCart = await CartModel.findOne({ userId: user._id, isActive: true });
        cartItems = dbCart ? dbCart.items.map(item => ({
          productId: item.productId.toString(),
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          addedAt: item.addedAt
        })) : [];
      } else if (firstMessage) {
        // Save unknown user data on first message
        try {
          await unknownUserService.createOrUpdateUnknownUser({
            phoneNumber,
            firstMessage,
            userAgent: 'WhatsApp Web',
            deviceInfo: 'WhatsApp'
          });
          console.log(`📝 Saved unknown user data for ${phoneNumber}`);
        } catch (err) {
          console.error('❌ Failed to save unknown user data:', err);
        }
      }
    } catch (err) {
      console.error('❌ Failed to check user existence in MongoDB:', err);
    }

    // Create new session
    const newSession: UserSession = {
      userId: this.generateUserId(),
      phoneNumber,
      userType, // use value from DB if available
      currentState: 'welcome',
      context: {},
      lastActivity: new Date(),
      isActive: true,
      cart: typeof cartItems !== 'undefined' ? cartItems : [],
      orderHistory: [],
      preferences: {
        language: 'en',
        currency: 'USD',
        notifications: true
      },
      needsAccount
    };

    this.sessions.set(phoneNumber, newSession);
    console.log(`📝 Created new session for ${phoneNumber} (needsAccount: ${needsAccount}, userType: ${userType})`);
    return newSession;
  }

  // Force session refresh after account creation
  async refreshSessionFromDB(phoneNumber: string): Promise<UserSession> {
    phoneNumber = phoneNumber.replace(/@c\.us$/, '');
    try {
      const user = await UserModel.findOne({ phoneNumber });
      console.log('[SessionManager] [Refresh] User found in DB:', user);
      let userType: 'customer' | 'seller' | 'unknown' = 'unknown';
      let needsAccount = !user;
      if (user) {
        userType = user.userType;
      }
      const refreshedSession: UserSession = {
        userId: this.generateUserId(),
        phoneNumber,
        userType,
        currentState: 'welcome',
        context: {},
        lastActivity: new Date(),
        isActive: true,
        cart: [],
        orderHistory: [],
        preferences: {
          language: 'en',
          currency: 'USD',
          notifications: true
        },
        needsAccount
      };
      this.sessions.set(phoneNumber, refreshedSession);
      console.log(`[SessionManager] Refreshed session for ${phoneNumber} (needsAccount: ${needsAccount}, userType: ${userType})`);
      return refreshedSession;
    } catch (err) {
      console.error('❌ Failed to refresh session from DB:', err);
      return await this.getSession(phoneNumber);
    }
  }

  async updateSession(phoneNumber: string, session: UserSession): Promise<void> {
    // Normalize phone number
    phoneNumber = phoneNumber.replace(/@c\.us$/, '');
    session.lastActivity = new Date();
    this.sessions.set(phoneNumber, session);
    console.log(`✅ Session updated for ${phoneNumber}. needsAccount: ${session.needsAccount}`);
  }

  async setUserType(phoneNumber: string, userType: 'customer' | 'seller'): Promise<void> {
    const session = await this.getSession(phoneNumber);
    session.userType = userType;
    await this.updateSession(phoneNumber, session);
  }

  async setState(phoneNumber: string, state: string): Promise<void> {
    const session = await this.getSession(phoneNumber);
    session.currentState = state;
    await this.updateSession(phoneNumber, session);
  }

  async addToContext(phoneNumber: string, key: string, value: any): Promise<void> {
    const session = await this.getSession(phoneNumber);
    session.context[key] = value;
    await this.updateSession(phoneNumber, session);
  }

  async getContext(phoneNumber: string, key: string): Promise<any> {
    const session = await this.getSession(phoneNumber);
    return session.context[key];
  }

  async addToCart(phoneNumber: string, item: CartItem): Promise<void> {
    const session = await this.getSession(phoneNumber);
    if (!session.cart) session.cart = [];
    // Check if item already exists in cart
    const existingItemIndex = session.cart.findIndex(cartItem => cartItem.productId === item.productId);
    if (existingItemIndex >= 0) {
      // Update quantity
      session.cart[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      session.cart.push(item);
    }
    await this.updateSession(phoneNumber, session);
    // --- Persist to DB for registered users ---
    if (session.userType !== 'unknown') {
      const user = await UserModel.findOne({ phoneNumber });
      if (user) {
        let dbCart = await CartModel.findOne({ userId: user._id, isActive: true });
        if (!dbCart) {
          dbCart = new CartModel({
            userId: user._id,
            phoneNumber,
            items: [],
            total: 0,
            itemCount: 0,
            isActive: true
          });
        }
        // Update or add item
        const dbItemIndex = dbCart.items.findIndex(i => i.productId.toString() === item.productId.toString());
        if (dbItemIndex >= 0) {
          dbCart.items[dbItemIndex].quantity += item.quantity;
        } else {
          // Convert productId to ObjectId for DB
          dbCart.items.push({
            productId: new mongoose.Types.ObjectId(item.productId),
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            addedAt: new Date()
          });
        }
        await dbCart.save();
      }
    }
  }

  async removeFromCart(phoneNumber: string, productId: string): Promise<void> {
    const session = await this.getSession(phoneNumber);
    if (session.cart) {
      session.cart = session.cart.filter(item => item.productId !== productId);
      await this.updateSession(phoneNumber, session);
      // --- Persist to DB for registered users ---
      if (session.userType !== 'unknown') {
        const user = await UserModel.findOne({ phoneNumber });
        if (user) {
          let dbCart = await CartModel.findOne({ userId: user._id, isActive: true });
          if (dbCart) {
            dbCart.items = dbCart.items.filter(item => item.productId.toString() !== productId.toString());
            await dbCart.save();
          }
        }
      }
    }
  }

  async getCart(phoneNumber: string): Promise<CartItem[]> {
    const session = await this.getSession(phoneNumber);
    return session.cart || [];
  }

  async clearCart(phoneNumber: string): Promise<void> {
    const session = await this.getSession(phoneNumber);
    session.cart = [];
    await this.updateSession(phoneNumber, session);
    // --- Persist to DB for registered users ---
    if (session.userType !== 'unknown') {
      const user = await UserModel.findOne({ phoneNumber });
      if (user) {
        let dbCart = await CartModel.findOne({ userId: user._id, isActive: true });
        if (dbCart) {
          dbCart.items = [];
          await dbCart.save();
        }
      }
    }
  }

  async addToOrderHistory(phoneNumber: string, orderId: string): Promise<void> {
    const session = await this.getSession(phoneNumber);
    if (!session.orderHistory) session.orderHistory = [];
    session.orderHistory.push(orderId);
    await this.updateSession(phoneNumber, session);
  }

  async getOrderHistory(phoneNumber: string): Promise<string[]> {
    const session = await this.getSession(phoneNumber);
    return session.orderHistory || [];
  }

  async updatePreferences(phoneNumber: string, preferences: Partial<UserPreferences>): Promise<void> {
    const session = await this.getSession(phoneNumber);
    if (!session.preferences) {
      session.preferences = { language: 'en', currency: 'USD', notifications: true };
    }
    session.preferences = {
      language: preferences.language ?? session.preferences.language,
      currency: preferences.currency ?? session.preferences.currency,
      notifications: preferences.notifications ?? session.preferences.notifications
    };
    await this.updateSession(phoneNumber, session);
  }

  async deactivateSession(phoneNumber: string): Promise<void> {
    const session = await this.getSession(phoneNumber);
    session.isActive = false;
    await this.updateSession(phoneNumber, session);
  }

  async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [phoneNumber, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
      
      if (timeSinceLastActivity > inactiveThreshold) {
        this.sessions.delete(phoneNumber);
        console.log(`🧹 Cleaned up inactive session for ${phoneNumber}`);
      }
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get all active sessions (for admin purposes)
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  // Get session count
  getSessionCount(): number {
    return this.sessions.size;
  }
} 

export const chatSession = new ChatSession(); 