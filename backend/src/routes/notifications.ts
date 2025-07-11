import { Router } from 'express';
import {
  createGeneralNotification,
  createNotification,
  createNotificationForUserType,
  getConversionAnalytics,
  getNotificationStats,
  getUnknownUserStats,
  getUnknownUsers,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  sendReminderNotifications
} from '../controllers/notification-controller';

const router = Router();

// User notification routes
router.get('/user/:phoneNumber', getUserNotifications);
router.get('/user/:phoneNumber/stats', getNotificationStats);
router.put('/:notificationId/read', markNotificationAsRead);
router.put('/user/:phoneNumber/read-all', markAllNotificationsAsRead);

// Admin notification creation routes
router.post('/', createNotification);
router.post('/user-type/:userType', createNotificationForUserType);
router.post('/general', createGeneralNotification);

// Unknown user management routes
router.get('/unknown-users', getUnknownUsers);
router.get('/unknown-users/stats', getUnknownUserStats);
router.get('/unknown-users/analytics', getConversionAnalytics);
router.post('/unknown-users/send-reminders', sendReminderNotifications);

export default router; 