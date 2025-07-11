import { Request, Response } from 'express';
import { notificationService } from '../services/notification-service';
import { unknownUserService } from '../services/unknown-user-service';

export const getUserNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const notifications = await notificationService.getUserNotifications(
      phoneNumber,
      Number(limit),
      Number(offset)
    );
    
    const unreadCount = await notificationService.getUnreadCount(phoneNumber);
    
    res.json({
      notifications,
      unreadCount,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('❌ Failed to get user notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    
    await notificationService.markAsRead(notificationId);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('❌ Failed to mark notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.params;
    
    await notificationService.markAllAsRead(phoneNumber);
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('❌ Failed to mark all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
};

export const getNotificationStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.params;
    
    const stats = await notificationService.getNotificationStats(phoneNumber);
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to get notification stats:', error);
    res.status(500).json({ error: 'Failed to get notification stats' });
  }
};

export const createNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notificationData = req.body;
    
    const notification = await notificationService.createNotification(notificationData);
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

export const createNotificationForUserType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userType } = req.params;
    const { title, message, ...options } = req.body;
    
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }
    
    const notifications = await notificationService.createNotificationForUserType(
      userType as 'customer' | 'seller' | 'unknown',
      title,
      message,
      options
    );
    
    res.status(201).json({
      message: `Created ${notifications.length} notifications for ${userType} users`,
      count: notifications.length
    });
  } catch (error) {
    console.error('❌ Failed to create notifications for user type:', error);
    res.status(500).json({ error: 'Failed to create notifications' });
  }
};

export const createGeneralNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, message, ...options } = req.body;
    
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message are required' });
      return;
    }
    
    const notifications = await notificationService.createGeneralNotification(
      title,
      message,
      options
    );
    
    res.status(201).json({
      message: `Created ${notifications.length} general notifications`,
      count: notifications.length
    });
  } catch (error) {
    console.error('❌ Failed to create general notification:', error);
    res.status(500).json({ error: 'Failed to create general notification' });
  }
};

export const getUnknownUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await unknownUserService.getUnknownUserStats();
    
    res.json(stats);
  } catch (error) {
    console.error('❌ Failed to get unknown user stats:', error);
    res.status(500).json({ error: 'Failed to get unknown user stats' });
  }
};

export const getUnknownUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 20, offset = 0, includeConverted = false } = req.query;
    
    const users = await unknownUserService.getUnknownUsers(
      Number(limit),
      Number(offset),
      includeConverted === 'true'
    );
    
    res.json({
      users,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: users.length
      }
    });
  } catch (error) {
    console.error('❌ Failed to get unknown users:', error);
    res.status(500).json({ error: 'Failed to get unknown users' });
  }
};

export const getConversionAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const analytics = await unknownUserService.getConversionAnalytics();
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ Failed to get conversion analytics:', error);
    res.status(500).json({ error: 'Failed to get conversion analytics' });
  }
};

export const sendReminderNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    await unknownUserService.sendReminderNotifications();
    
    res.json({ message: 'Reminder notifications sent successfully' });
  } catch (error) {
    console.error('❌ Failed to send reminder notifications:', error);
    res.status(500).json({ error: 'Failed to send reminder notifications' });
  }
}; 