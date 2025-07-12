/**
 * @fileoverview Notification system types and interfaces for CommerceBridge
 * 
 * This module defines all TypeScript interfaces and types related to the notification system,
 * including data structures for creating notifications, API responses, and analytics.
 * 
 * @author CommerceBridge Team
 * @version 1.0.0
 */

/**
 * Data structure for creating a new notification
 * 
 * @interface NotificationData
 * @description Represents the data required to create a notification
 * 
 * @example
 * ```typescript
 * const notificationData: NotificationData = {
 *   phoneNumber: '+1234567890',
 *   userType: 'customer',
 *   title: 'Welcome to CommerceBridge!',
 *   message: 'Thank you for joining our platform.',
 *   type: 'success',
 *   category: 'system'
 * };
 * ```
 */
export interface NotificationData {
  /** 
   * Phone number of the recipient (optional for general notifications)
   * @example '+1234567890'
   */
  phoneNumber?: string;
  
  /** 
   * Type of user to receive the notification
   * @example 'customer' | 'seller' | 'unknown'
   */
  userType?: 'customer' | 'seller' | 'unknown';
  
  /** 
   * Short, descriptive title for the notification
   * @example 'Order Confirmed'
   */
  title: string;
  
  /** 
   * Detailed message content of the notification
   * @example 'Your order #12345 has been confirmed and is being processed.'
   */
  message: string;
  
  /** 
   * Visual type/category of the notification for UI styling
   * @example 'success' | 'error' | 'warning' | 'info' | 'promotional'
   */
  type: 'success' | 'error' | 'warning' | 'info' | 'promotional';
  
  /** 
   * Business category for organizing and filtering notifications
   * @example 'system' | 'promotional' | 'order' | 'payment' | 'support'
   */
  category: 'system' | 'promotional' | 'order' | 'payment' | 'support';
  
  /** 
   * Optional scheduled time for delayed notification delivery
   * @example new Date('2024-01-15T09:00:00Z')
   */
  scheduledFor?: Date;
}

/**
 * Complete notification object as returned by the API
 * 
 * @interface NotificationResponse
 * @description Represents a notification with all its properties including database fields
 * 
 * @example
 * ```typescript
 * const notification: NotificationResponse = {
 *   _id: '507f1f77bcf86cd799439011',
 *   phoneNumber: '+1234567890',
 *   userType: 'customer',
 *   title: 'Welcome!',
 *   message: 'Thanks for joining!',
 *   type: 'success',
 *   category: 'system',
 *   isRead: false,
 *   createdAt: '2024-01-15T09:00:00.000Z',
 *   updatedAt: '2024-01-15T09:00:00.000Z'
 * };
 * ```
 */
export interface NotificationResponse {
  /** 
   * Unique MongoDB ObjectId of the notification
   * @example '507f1f77bcf86cd799439011'
   */
  _id: string;
  
  /** 
   * Phone number of the notification recipient
   * @example '+1234567890'
   */
  phoneNumber: string;
  
  /** 
   * Type of user who received the notification
   * @example 'customer'
   */
  userType: string;
  
  /** 
   * Notification title
   * @example 'Order Confirmed'
   */
  title: string;
  
  /** 
   * Notification message content
   * @example 'Your order has been confirmed.'
   */
  message: string;
  
  /** 
   * Visual type of the notification
   * @example 'success'
   */
  type: string;
  
  /** 
   * Business category of the notification
   * @example 'order'
   */
  category: string;
  
  /** 
   * Whether the user has read this notification
   * @example false
   */
  isRead: boolean;
  
  /** 
   * ISO timestamp when the notification was created
   * @example '2024-01-15T09:00:00.000Z'
   */
  createdAt: string;
  
  /** 
   * ISO timestamp when the notification was last updated
   * @example '2024-01-15T09:00:00.000Z'
   */
  updatedAt: string;
}

/**
 * Response structure for bulk notification operations
 * 
 * @interface BulkNotificationResponse
 * @description Returned when creating notifications for multiple users
 * 
 * @example
 * ```typescript
 * const bulkResponse: BulkNotificationResponse = {
 *   count: 5,
 *   notifications: [/* array of NotificationResponse objects *\/]
 * };
 * ```
 */
export interface BulkNotificationResponse {
  /** 
   * Number of notifications created in the bulk operation
   * @example 5
   */
  count: number;
  
  /** 
   * Array of created notification objects
   * @example [/* NotificationResponse objects *\/]
   */
  notifications: NotificationResponse[];
}

/**
 * Response structure for user notification queries
 * 
 * @interface UserNotificationsResponse
 * @description Returned when fetching notifications for a specific user
 * 
 * @example
 * ```typescript
 * const userNotifications: UserNotificationsResponse = {
 *   notifications: [/* array of NotificationResponse objects *\/],
 *   unreadCount: 3,
 *   totalCount: 10
 * };
 * ```
 */
export interface UserNotificationsResponse {
  /** 
   * Array of notifications for the user
   * @example [/* NotificationResponse objects *\/]
   */
  notifications: NotificationResponse[];
  
  /** 
   * Number of unread notifications
   * @example 3
   */
  unreadCount: number;
  
  /** 
   * Total number of notifications for the user
   * @example 10
   */
  totalCount: number;
}

/**
 * Statistical data about notifications
 * 
 * @interface NotificationStats
 * @description Provides aggregated statistics about notification activity
 * 
 * @example
 * ```typescript
 * const stats: NotificationStats = {
 *   total: 100,
 *   read: 75,
 *   unread: 25,
 *   byType: { 'success': 50, 'error': 10, 'info': 40 },
 *   byCategory: { 'system': 30, 'order': 40, 'promotional': 30 }
 * };
 * ```
 */
export interface NotificationStats {
  /** 
   * Total number of notifications
   * @example 100
   */
  total: number;
  
  /** 
   * Number of read notifications
   * @example 75
   */
  read: number;
  
  /** 
   * Number of unread notifications
   * @example 25
   */
  unread: number;
  
  /** 
   * Count of notifications grouped by type
   * @example { 'success': 50, 'error': 10, 'info': 40 }
   */
  byType: Record<string, number>;
  
  /** 
   * Count of notifications grouped by category
   * @example { 'system': 30, 'order': 40, 'promotional': 30 }
   */
  byCategory: Record<string, number>;
}

/**
 * Statistics about unknown users in the system
 * 
 * @interface UnknownUserStats
 * @description Provides insights into unknown user engagement and conversion
 * 
 * @example
 * ```typescript
 * const unknownStats: UnknownUserStats = {
 *   totalUnknownUsers: 150,
 *   convertedUsers: 45,
 *   conversionRate: 0.3,
 *   lastActivity: '2024-01-15T09:00:00.000Z'
 * };
 * ```
 */
export interface UnknownUserStats {
  /** 
   * Total number of unknown users in the system
   * @example 150
   */
  totalUnknownUsers: number;
  
  /** 
   * Number of unknown users who have converted to customers/sellers
   * @example 45
   */
  convertedUsers: number;
  
  /** 
   * Conversion rate as a decimal (0.0 to 1.0)
   * @example 0.3
   */
  conversionRate: number;
  
  /** 
   * ISO timestamp of the last activity from unknown users
   * @example '2024-01-15T09:00:00.000Z'
   */
  lastActivity: string;
}

/**
 * Detailed analytics about user conversion patterns
 * 
 * @interface ConversionAnalytics
 * @description Comprehensive analytics for understanding user conversion behavior
 * 
 * @example
 * ```typescript
 * const analytics: ConversionAnalytics = {
 *   totalUnknownUsers: 150,
 *   convertedToCustomer: 30,
 *   convertedToSeller: 15,
 *   conversionRate: 0.3,
 *   averageTimeToConversion: 86400000, // 24 hours in milliseconds
 *   recentConversions: [
 *     {
 *       phoneNumber: '+1234567890',
 *       originalType: 'unknown',
 *       convertedType: 'customer',
 *       convertedAt: '2024-01-15T09:00:00.000Z'
 *     }
 *   ]
 * };
 * ```
 */
export interface ConversionAnalytics {
  /** 
   * Total number of unknown users tracked
   * @example 150
   */
  totalUnknownUsers: number;
  
  /** 
   * Number of users who converted to customers
   * @example 30
   */
  convertedToCustomer: number;
  
  /** 
   * Number of users who converted to sellers
   * @example 15
   */
  convertedToSeller: number;
  
  /** 
   * Overall conversion rate as a decimal
   * @example 0.3
   */
  conversionRate: number;
  
  /** 
   * Average time to conversion in milliseconds
   * @example 86400000 // 24 hours
   */
  averageTimeToConversion: number;
  
  /** 
   * Array of recent conversion events
   * @example [/* conversion events *\/]
   */
  recentConversions: Array<{
    /** 
     * Phone number of the converted user
     * @example '+1234567890'
     */
    phoneNumber: string;
    
    /** 
     * Original user type before conversion
     * @example 'unknown'
     */
    originalType: string;
    
    /** 
     * New user type after conversion
     * @example 'customer'
     */
    convertedType: string;
    
    /** 
     * ISO timestamp when conversion occurred
     * @example '2024-01-15T09:00:00.000Z'
     */
    convertedAt: string;
  }>;
} 