import { UnknownUserModel } from '../models/unknown-user';
import { UnknownUserDocument } from '../types/models.types';

export interface CreateUnknownUserRequest {
  phoneNumber: string;
  firstMessage: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
}

export interface UnknownUserStats {
  total: number;
  converted: number;
  conversionRate: number;
  recentActivity: number;
}

export class UnknownUserService {
  /**
   * Create or update unknown user record
   */
  async createOrUpdateUnknownUser(request: CreateUnknownUserRequest): Promise<UnknownUserDocument> {
    const { phoneNumber, firstMessage, userAgent, deviceInfo, location } = request;
    
    // Check if unknown user already exists
    let unknownUser = await UnknownUserModel.findOne({ phoneNumber });
    
    if (unknownUser) {
      // Update existing record
      unknownUser.messageCount += 1;
      unknownUser.lastMessageTime = new Date();
      if (userAgent) unknownUser.userAgent = userAgent;
      if (deviceInfo) unknownUser.deviceInfo = deviceInfo;
      if (location) unknownUser.location = location;
      
      return await unknownUser.save();
    } else {
      // Create new unknown user record
      const newUnknownUser = new UnknownUserModel({
        phoneNumber,
        firstMessage,
        firstMessageTime: new Date(),
        lastMessageTime: new Date(),
        messageCount: 1,
        userAgent,
        deviceInfo,
        location,
        isConverted: false
      });
      
      return await newUnknownUser.save();
    }
  }

  /**
   * Mark unknown user as converted when they create an account
   */
  async markAsConverted(
    phoneNumber: string, 
    convertedTo: 'customer' | 'seller'
  ): Promise<void> {
    await UnknownUserModel.findOneAndUpdate(
      { phoneNumber },
      {
        isConverted: true,
        convertedTo,
        convertedAt: new Date()
      }
    );
  }

  /**
   * Get unknown user by phone number
   */
  async getUnknownUser(phoneNumber: string): Promise<UnknownUserDocument | null> {
    return await UnknownUserModel.findOne({ phoneNumber });
  }

  /**
   * Get all unknown users with pagination
   */
  async getUnknownUsers(
    limit: number = 20,
    offset: number = 0,
    includeConverted: boolean = false
  ): Promise<UnknownUserDocument[]> {
    const filter = includeConverted ? {} : { isConverted: false };
    
    return await UnknownUserModel.find(filter)
      .sort({ lastMessageTime: -1 })
      .limit(limit)
      .skip(offset);
  }

  /**
   * Get unknown users who haven't converted yet
   */
  async getUnconvertedUsers(limit: number = 50): Promise<UnknownUserDocument[]> {
    return await UnknownUserModel.find({ isConverted: false })
      .sort({ lastMessageTime: -1 })
      .limit(limit);
  }

  /**
   * Get recently active unknown users
   */
  async getRecentlyActiveUsers(hours: number = 24): Promise<UnknownUserDocument[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await UnknownUserModel.find({
      isConverted: false,
      lastMessageTime: { $gte: cutoffTime }
    }).sort({ lastMessageTime: -1 });
  }

  /**
   * Get unknown user statistics
   */
  async getUnknownUserStats(): Promise<UnknownUserStats> {
    const [total, converted, recentActivity] = await Promise.all([
      UnknownUserModel.countDocuments({}),
      UnknownUserModel.countDocuments({ isConverted: true }),
      UnknownUserModel.countDocuments({
        isConverted: false,
        lastMessageTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      converted,
      conversionRate: Math.round(conversionRate * 100) / 100,
      recentActivity
    };
  }

  /**
   * Clean up old unknown user records
   */
  async cleanupOldRecords(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    await UnknownUserModel.deleteMany({
      lastMessageTime: { $lt: cutoffDate },
      isConverted: false
    });
  }

  /**
   * Get conversion analytics
   */
  async getConversionAnalytics(): Promise<{
    dailyConversions: Array<{ date: string; count: number }>;
    conversionByType: { customer: number; seller: number };
    averageTimeToConversion: number;
  }> {
    // Get daily conversions for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const conversions = await UnknownUserModel.find({
      isConverted: true,
      convertedAt: { $gte: thirtyDaysAgo }
    });

    // Group by date
    const dailyConversions: Record<string, number> = {};
    conversions.forEach((conversion: UnknownUserDocument) => {
      const date = conversion.convertedAt!.toISOString().split('T')[0];
      dailyConversions[date] = (dailyConversions[date] || 0) + 1;
    });

    // Convert to array format
    const dailyConversionsArray = Object.entries(dailyConversions).map(([date, count]) => ({
      date,
      count
    }));

    // Get conversion by type
    const conversionByType = {
      customer: await UnknownUserModel.countDocuments({ convertedTo: 'customer' }),
      seller: await UnknownUserModel.countDocuments({ convertedTo: 'seller' })
    };

    // Calculate average time to conversion
    const conversionTimes = conversions
      .filter((c: UnknownUserDocument) => c.convertedAt && c.firstMessageTime)
      .map((c: UnknownUserDocument) => c.convertedAt!.getTime() - c.firstMessageTime.getTime());

    const averageTimeToConversion = conversionTimes.length > 0 
      ? conversionTimes.reduce((sum: number, time: number) => sum + time, 0) / conversionTimes.length
      : 0;

    return {
      dailyConversions: dailyConversionsArray,
      conversionByType,
      averageTimeToConversion: Math.round(averageTimeToConversion / (1000 * 60 * 60 * 24)) // Convert to days
    };
  }

  /**
   * Send reminder notifications to unconverted users
   */
  async sendReminderNotifications(): Promise<void> {
    // Get users who haven't converted and haven't been active in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const inactiveUsers = await UnknownUserModel.find({
      isConverted: false,
      lastMessageTime: { $lt: sevenDaysAgo }
    });

    // Import notification service here to avoid circular dependency
    const { notificationService } = await import('./notification-service');
    
    for (const user of inactiveUsers) {
      await notificationService.createNotification({
        phoneNumber: user.phoneNumber,
        userType: 'unknown',
        title: 'Complete Your Account Setup',
        message: 'Don\'t miss out on amazing products! Create your CommerceBridge account to start shopping or selling.',
        type: 'promotional',
        category: 'promotional'
      });
    }
  }
}

export const unknownUserService = new UnknownUserService(); 