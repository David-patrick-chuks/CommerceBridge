import { whatsappBot } from '../index';
import { NotificationModel } from '../models/notification';
import { UnknownUserModel } from '../models/unknown-user';
import { UserModel } from '../models/user';
import { NotificationDocument, UnknownUserDocument, UserDocument } from '../types/models.types';

export interface CreateNotificationRequest {
  phoneNumber?: string;
  userType: 'customer' | 'seller' | 'unknown' | 'general';
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'promotional';
  category?: 'order' | 'payment' | 'product' | 'system' | 'promotional' | 'support';
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  sent: number;
  pending: number;
}

export class NotificationService {
  /**
   * Create a notification for specific user or user type
   */
  async createNotification(request: CreateNotificationRequest): Promise<NotificationDocument> {
    const notification = new NotificationModel({
      phoneNumber: request.phoneNumber || 'general',
      userType: request.userType,
      title: request.title,
      message: request.message,
      type: request.type || 'info',
      category: request.category || 'system',
      scheduledFor: request.scheduledFor,
      expiresAt: request.expiresAt,
      metadata: request.metadata,
    });

    return await notification.save();
  }

  /**
   * Create notification for all users of a specific type
   */
  async createNotificationForUserType(
    userType: 'customer' | 'seller' | 'unknown',
    title: string,
    message: string,
    options?: Partial<CreateNotificationRequest>
  ): Promise<NotificationDocument[]> {
    const notifications: NotificationDocument[] = [];
    
    // Get all phone numbers for the user type
    let phoneNumbers: string[] = [];
    
    if (userType === 'unknown') {
      const unknownUsers = await UnknownUserModel.find({ isConverted: false });
      phoneNumbers = unknownUsers.map((user: UnknownUserDocument) => user.phoneNumber);
    } else {
      const users = await UserModel.find({ userType });
      phoneNumbers = users.map((user: UserDocument) => user.phoneNumber);
    }

    // Create notification for each phone number
    for (const phoneNumber of phoneNumbers) {
      const notification = await this.createNotification({
        phoneNumber,
        userType,
        title,
        message,
        ...options
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Create general notification for all users
   */
  async createGeneralNotification(
    title: string,
    message: string,
    options?: Partial<CreateNotificationRequest>
  ): Promise<NotificationDocument[]> {
    const notifications: NotificationDocument[] = [];
    
    // Get all phone numbers from both users and unknown users
    const users = await UserModel.find({});
    const unknownUsers = await UnknownUserModel.find({ isConverted: false });
    
    const allPhoneNumbers = [
      ...users.map((user: UserDocument) => user.phoneNumber),
      ...unknownUsers.map((user: UnknownUserDocument) => user.phoneNumber)
    ];

    // Create notification for each phone number
    for (const phoneNumber of allPhoneNumbers) {
      const notification = await this.createNotification({
        phoneNumber,
        userType: 'general',
        title,
        message,
        ...options
      });
      notifications.push(notification);
    }

    return notifications;
  }

  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(
    phoneNumber: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationDocument[]> {
    return await NotificationModel.find({
      phoneNumber: { $in: [phoneNumber, 'general'] }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset);
  }

  /**
   * Get unread notifications count for a user
   */
  async getUnreadCount(phoneNumber: string): Promise<number> {
    return await NotificationModel.countDocuments({
      phoneNumber: { $in: [phoneNumber, 'general'] },
      isRead: false
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(notificationId, {
      isRead: true,
      readAt: new Date()
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(phoneNumber: string): Promise<void> {
    await NotificationModel.updateMany(
      {
        phoneNumber: { $in: [phoneNumber, 'general'] },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
  }

  /**
   * Send pending notifications via WhatsApp
   */
  async sendPendingNotifications(): Promise<void> {
    const pendingNotifications = await NotificationModel.find({
      isSent: false,
      scheduledFor: { $lte: new Date() },
      expiresAt: { $gt: new Date() }
    });

    for (const notification of pendingNotifications) {
      try {
        await this.sendNotificationViaWhatsApp(notification);
        
        // Mark as sent
        await NotificationModel.findByIdAndUpdate(notification._id, {
          isSent: true,
          sentAt: new Date()
        });
      } catch (error) {
        console.error(`❌ Failed to send notification ${notification._id}:`, error);
      }
    }
  }

  /**
   * Send notification via WhatsApp
   */
  private async sendNotificationViaWhatsApp(notification: NotificationDocument): Promise<void> {
    if (notification.phoneNumber === 'general') {
      return; // Skip general notifications in this method
    }

    const formattedMessage = this.formatNotificationForWhatsApp(notification);
    await whatsappBot.sendMessage(notification.phoneNumber, formattedMessage);
  }

  /**
   * Format notification for WhatsApp display
   */
  private formatNotificationForWhatsApp(notification: NotificationDocument): string {
    const emoji = this.getNotificationEmoji(notification.type);
    const formattedTitle = `*${notification.title}*`;
    const formattedMessage = notification.message;
    
    return `${emoji} ${formattedTitle}\n\n${formattedMessage}`;
  }

  /**
   * Get emoji for notification type
   */
  private getNotificationEmoji(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'promotional': return '🎉';
      default: return 'ℹ️';
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(phoneNumber?: string): Promise<NotificationStats> {
    const filter = phoneNumber ? { phoneNumber: { $in: [phoneNumber, 'general'] } } : {};
    
    const [total, unread, sent, pending] = await Promise.all([
      NotificationModel.countDocuments(filter),
      NotificationModel.countDocuments({ ...filter, isRead: false }),
      NotificationModel.countDocuments({ ...filter, isSent: true }),
      NotificationModel.countDocuments({ 
        ...filter, 
        isSent: false, 
        scheduledFor: { $lte: new Date() } 
      })
    ]);

    return { total, unread, sent, pending };
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    await NotificationModel.deleteMany({
      expiresAt: { $lt: new Date() }
    });
  }

  /**
   * Get notification templates for different user types
   */
  getNotificationTemplates() {
    return {
      customer: {
        welcome: {
          title: 'Welcome to CommerceBridge!',
          message: 'Start shopping with our amazing products. Browse, search, and order everything you need right here in WhatsApp!',
          type: 'success' as const
        },
        orderConfirmation: {
          title: 'Order Confirmed!',
          message: 'Your order has been confirmed and is being processed. You\'ll receive updates on your order status.',
          type: 'success' as const
        },
        paymentSuccess: {
          title: 'Payment Successful!',
          message: 'Your payment has been processed successfully. Your order is now confirmed!',
          type: 'success' as const
        },
        orderShipped: {
          title: 'Order Shipped!',
          message: 'Your order has been shipped and is on its way to you. Track your delivery status here.',
          type: 'info' as const
        }
      },
      seller: {
        welcome: {
          title: 'Welcome to CommerceBridge Seller!',
          message: 'Start selling your products to customers worldwide. Upload products, manage orders, and grow your business!',
          type: 'success' as const
        },
        newOrder: {
          title: 'New Order Received!',
          message: 'You have received a new order. Please process it within 24 hours.',
          type: 'info' as const
        },
        paymentReceived: {
          title: 'Payment Received!',
          message: 'Payment for your order has been received. Your commission will be processed.',
          type: 'success' as const
        },
        lowStock: {
          title: 'Low Stock Alert!',
          message: 'One of your products is running low on stock. Please update your inventory.',
          type: 'warning' as const
        }
      },
      unknown: {
        welcome: {
          title: 'Welcome to CommerceBridge!',
          message: 'Join our WhatsApp-first e-commerce platform. Create an account to start shopping or selling!',
          type: 'info' as const
        },
        reminder: {
          title: 'Complete Your Account Setup',
          message: 'Don\'t miss out! Create your CommerceBridge account to access all features.',
          type: 'promotional' as const
        }
      },
      general: {
        maintenance: {
          title: 'Scheduled Maintenance',
          message: 'We\'ll be performing scheduled maintenance. Service may be temporarily unavailable.',
          type: 'warning' as const
        },
        newFeatures: {
          title: 'New Features Available!',
          message: 'Check out our latest features and improvements to enhance your experience.',
          type: 'info' as const
        },
        promotion: {
          title: 'Special Offer!',
          message: 'Limited time offer! Get amazing discounts on selected products.',
          type: 'promotional' as const
        }
      }
    };
  }
}

export const notificationService = new NotificationService(); 