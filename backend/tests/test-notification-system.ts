// Test script for the notification system
import axios from 'axios';
import {
  NotificationData,
  NotificationResponse,
  BulkNotificationResponse,
  UserNotificationsResponse,
  NotificationStats,
  UnknownUserStats,
  ConversionAnalytics
} from '../src/types';

const BASE_URL = 'http://localhost:3001/api';

async function testNotificationSystem(): Promise<void> {
  console.log('🧪 Testing Notification System...\n');

  try {
    // Test 1: Create a notification for a specific user
    console.log('📝 Test 1: Create notification for specific user');
    const notificationData1: NotificationData = {
      phoneNumber: '+1234567890',
      userType: 'customer',
      title: 'Welcome to CommerceBridge!',
      message: 'Thank you for joining our platform. Start shopping now!',
      type: 'success',
      category: 'system'
    };
    
    const notification1 = await axios.post<NotificationResponse>(`${BASE_URL}/notifications`, notificationData1);
    console.log('✅ Created notification:', notification1.data._id);
    console.log('---\n');

    // Test 2: Create notification for all customers
    console.log('📝 Test 2: Create notification for all customers');
    const notificationData2: Omit<NotificationData, 'phoneNumber' | 'userType'> = {
      title: 'New Products Available!',
      message: 'Check out our latest arrivals with amazing discounts.',
      type: 'promotional',
      category: 'promotional'
    };
    
    const notification2 = await axios.post<BulkNotificationResponse>(`${BASE_URL}/notifications/user-type/customer`, notificationData2);
    console.log('✅ Created notifications for customers:', notification2.data.count);
    console.log('---\n');

    // Test 3: Create notification for all sellers
    console.log('📝 Test 3: Create notification for all sellers');
    const notificationData3: Omit<NotificationData, 'phoneNumber' | 'userType'> = {
      title: 'Sales Analytics Update',
      message: 'Your monthly sales report is ready. Check your performance!',
      type: 'info',
      category: 'system'
    };
    
    const notification3 = await axios.post<BulkNotificationResponse>(`${BASE_URL}/notifications/user-type/seller`, notificationData3);
    console.log('✅ Created notifications for sellers:', notification3.data.count);
    console.log('---\n');

    // Test 4: Create general notification for all users
    console.log('📝 Test 4: Create general notification for all users');
    const notificationData4: Omit<NotificationData, 'phoneNumber' | 'userType'> & { scheduledFor: Date } = {
      title: 'System Maintenance Notice',
      message: 'We will be performing scheduled maintenance on Sunday at 2 AM. Service may be temporarily unavailable.',
      type: 'warning',
      category: 'system',
      scheduledFor: new Date(Date.now() + 60000) // 1 minute from now
    };
    
    const notification4 = await axios.post<BulkNotificationResponse>(`${BASE_URL}/notifications/general`, notificationData4);
    console.log('✅ Created general notifications:', notification4.data.count);
    console.log('---\n');

    // Test 5: Get user notifications
    console.log('📝 Test 5: Get user notifications');
    const userNotifications = await axios.get<UserNotificationsResponse>(`${BASE_URL}/notifications/user/+1234567890`);
    console.log('✅ User notifications:', userNotifications.data.notifications.length);
    console.log('✅ Unread count:', userNotifications.data.unreadCount);
    console.log('---\n');

    // Test 6: Get notification stats
    console.log('📝 Test 6: Get notification stats');
    const stats = await axios.get<NotificationStats>(`${BASE_URL}/notifications/user/+1234567890/stats`);
    console.log('✅ Notification stats:', stats.data);
    console.log('---\n');

    // Test 7: Get unknown user stats
    console.log('📝 Test 7: Get unknown user stats');
    const unknownStats = await axios.get<UnknownUserStats>(`${BASE_URL}/notifications/unknown-users/stats`);
    console.log('✅ Unknown user stats:', unknownStats.data);
    console.log('---\n');

    // Test 8: Get conversion analytics
    console.log('📝 Test 8: Get conversion analytics');
    const analytics = await axios.get<ConversionAnalytics>(`${BASE_URL}/notifications/unknown-users/analytics`);
    console.log('✅ Conversion analytics:', analytics.data);
    console.log('---\n');

    // Test 9: Mark notification as read
    if (userNotifications.data.notifications.length > 0) {
      console.log('📝 Test 9: Mark notification as read');
      const notificationId = userNotifications.data.notifications[0]._id;
      await axios.put(`${BASE_URL}/notifications/${notificationId}/read`);
      console.log('✅ Marked notification as read');
      console.log('---\n');
    }

    // Test 10: Mark all notifications as read
    console.log('📝 Test 10: Mark all notifications as read');
    await axios.put(`${BASE_URL}/notifications/user/+1234567890/read-all`);
    console.log('✅ Marked all notifications as read');
    console.log('---\n');

    console.log('✅ All notification system tests completed successfully!');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Test failed:', error.response?.data || error.message);
    } else {
      console.error('❌ Test failed:', error);
    }
  }
}

// Run the test
testNotificationSystem(); 