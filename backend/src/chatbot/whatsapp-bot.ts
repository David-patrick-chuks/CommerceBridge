import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import qrcode from 'qrcode';
import { Client, Message, MessageMedia, RemoteAuth } from 'whatsapp-web.js';
import { MongoStore } from 'wwebjs-mongo';
import { ConversationFlow } from './conversation-flow';
import { MessageHandler } from './message-handler';
import { ChatSession } from './session-manager';

export interface BotStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  lastActivity: Date;
  sessionInfo?: any;
}

export class WhatsAppBot extends EventEmitter {
  private client: Client;
  private sessionManager: ChatSession;
  private messageHandler: MessageHandler;
  private conversationFlow: ConversationFlow;
  private status: BotStatus;
  private qrCodeData?: string;
  private store: any;

  constructor() {
    super();
    
    // Initialize MongoDB store for RemoteAuth
    this.store = new MongoStore({ mongoose: mongoose });
    
    this.client = new Client({
      authStrategy: new RemoteAuth({
        store: this.store,
        backupSyncIntervalMs: 300000, // 5 minutes
        clientId: 'commerce-bridge-bot'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.sessionManager = new ChatSession();
    this.messageHandler = new MessageHandler();
    this.conversationFlow = new ConversationFlow();
    
    this.status = {
      isConnected: false,
      isReady: false,
      lastActivity: new Date()
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // QR Code generation
    this.client.on('qr', async (qr: string) => {
      console.log('📱 QR Code received, generating...');
      try {
        this.qrCodeData = await qrcode.toDataURL(qr);
        this.status.qrCode = this.qrCodeData;
        this.emit('qr', this.qrCodeData);
        console.log('✅ QR Code generated successfully');
      } catch (error) {
        console.error('❌ Failed to generate QR code:', error);
      }
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('✅ WhatsApp client is ready!');
      this.status.isReady = true;
      this.status.isConnected = true;
      this.status.lastActivity = new Date();
      this.emit('ready');
    });

    // Client authenticated
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp client authenticated');
      this.status.isConnected = true;
      this.emit('authenticated');
    });

    // Client disconnected
    this.client.on('disconnected', (reason: string) => {
      console.log('❌ WhatsApp client disconnected:', reason);
      this.status.isConnected = false;
      this.status.isReady = false;
      this.emit('disconnected', reason);
    });

    // Message received
    this.client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(message);
    });

    // Message acknowledged
    this.client.on('message_ack', (message: Message, ack: number) => {
      console.log(`📨 Message ${message.id._serialized} acknowledged with status: ${ack}`);
    });

    // Error handling
    this.client.on('auth_failure', (error: any) => {
      console.error('❌ WhatsApp authentication failed:', error);
      this.emit('auth_failure', error);
    });
  }

  private async handleIncomingMessage(message: Message): Promise<void> {
    try {
      // Skip messages from self
      if (message.fromMe) return;

      // Update last activity
      this.status.lastActivity = new Date();

      console.log(`📨 Received message from ${message.from}: ${message.body}`);

      // Get or create session for this user
      const session = await this.sessionManager.getSession(message.from);
      
      // Handle the message based on conversation flow
      const response = await this.conversationFlow.processMessage(message, session, this.client);
      
      // Send response
      if (response) {
        await this.sendMessage(message.from, response);
      }

      // Update session
      await this.sessionManager.updateSession(message.from, session);

    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
      await this.sendErrorMessage(message.from);
    }
  }

  public async sendMessage(to: string, content: string | MessageMedia): Promise<void> {
    try {
      if (typeof content === 'string') {
        await this.client.sendMessage(to, content);
      } else {
        await this.client.sendMessage(to, content);
      }
      console.log(`📤 Message sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  }

  public async sendImage(to: string, imagePath: string, caption?: string): Promise<void> {
    try {
      const media = MessageMedia.fromFilePath(imagePath);
      await this.client.sendMessage(to, media, { caption });
      console.log(`📤 Image sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending image:', error);
      throw error;
    }
  }

  public async sendDigitalReceipt(to: string, orderData: any): Promise<void> {
    try {
      // Generate receipt image
      const receiptImagePath = await this.generateReceiptImage(orderData);
      
      // Send receipt image
      await this.sendImage(to, receiptImagePath, 'Your payment receipt');
      
      console.log(`📤 Digital receipt sent to ${to}`);
    } catch (error) {
      console.error('❌ Error sending digital receipt:', error);
      throw error;
    }
  }

  private async generateReceiptImage(orderData: any): Promise<string> {
    // TODO: Implement receipt image generation using canvas
    // This will create a professional-looking receipt image
    throw new Error('Receipt image generation not implemented yet');
  }

  private async sendErrorMessage(to: string): Promise<void> {
    const errorMessage = `Sorry, I encountered an error processing your request. Please try again or contact support if the problem persists.`;
    await this.sendMessage(to, errorMessage);
  }

  public async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing WhatsApp bot...');
      
      // Ensure MongoDB is connected before initializing the bot
      if (mongoose.connection.readyState !== 1) {
        console.log('⏳ Waiting for MongoDB connection...');
        await new Promise<void>((resolve, reject) => {
          mongoose.connection.once('connected', () => resolve());
          mongoose.connection.once('error', reject);
        });
      }
      
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to initialize WhatsApp bot:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      console.log('🛑 Disconnecting WhatsApp bot...');
      await this.client.destroy();
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp bot:', error);
    }
  }

  // RemoteAuth session management methods
  public async sessionExists(sessionName: string): Promise<boolean> {
    try {
      return await this.store.sessionExists({ session: sessionName });
    } catch (error) {
      console.error('❌ Error checking session existence:', error);
      return false;
    }
  }

  public async deleteSession(sessionName: string): Promise<void> {
    try {
      await this.store.delete({ session: sessionName });
      console.log(`🗑️ Deleted session: ${sessionName}`);
    } catch (error) {
      console.error('❌ Error deleting session:', error);
      throw error;
    }
  }

  public async listSessions(): Promise<string[]> {
    try {
      // This is a simplified approach - you might need to implement this based on your store
      console.log('📋 Session listing not implemented for this store type');
      return [];
    } catch (error) {
      console.error('❌ Error listing sessions:', error);
      return [];
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.client.logout();
      console.log('🚪 WhatsApp client logged out');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      throw error;
    }
  }

  public getStatus(): BotStatus {
    return { ...this.status };
  }

  public async getQRCode(): Promise<string | undefined> {
    return this.qrCodeData;
  }

  public isReady(): boolean {
    return this.status.isReady;
  }

  public isConnected(): boolean {
    return this.status.isConnected;
  }
} 