import { notificationService } from './notification-service';
import { unknownUserService } from './unknown-user-service';

export class SchedulerService {
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start all scheduled tasks
   */
  startScheduledTasks(): void {
    console.log('🕐 Starting scheduled tasks...');

    // Send pending notifications every 5 minutes
    this.intervals.push(
      setInterval(async () => {
        try {
          await notificationService.sendPendingNotifications();
        } catch (error) {
          console.error('❌ Failed to send pending notifications:', error);
        }
      }, 5 * 60 * 1000) // 5 minutes
    );

    // Clean up expired notifications every hour
    this.intervals.push(
      setInterval(async () => {
        try {
          await notificationService.cleanupExpiredNotifications();
        } catch (error) {
          console.error('❌ Failed to cleanup expired notifications:', error);
        }
      }, 60 * 60 * 1000) // 1 hour
    );

    // Send reminder notifications to unconverted users every 24 hours
    this.intervals.push(
      setInterval(async () => {
        try {
          await unknownUserService.sendReminderNotifications();
        } catch (error) {
          console.error('❌ Failed to send reminder notifications:', error);
        }
      }, 24 * 60 * 60 * 1000) // 24 hours
    );

    // Clean up old unknown user records every week
    this.intervals.push(
      setInterval(async () => {
        try {
          await unknownUserService.cleanupOldRecords(90); // 90 days
        } catch (error) {
          console.error('❌ Failed to cleanup old unknown user records:', error);
        }
      }, 7 * 24 * 60 * 60 * 1000) // 7 days
    );

    console.log('✅ Scheduled tasks started');
  }

  /**
   * Stop all scheduled tasks
   */
  stopScheduledTasks(): void {
    console.log('🛑 Stopping scheduled tasks...');
    
    this.intervals.forEach(interval => {
      clearInterval(interval);
    });
    
    this.intervals = [];
    console.log('✅ Scheduled tasks stopped');
  }

  /**
   * Manually trigger pending notifications
   */
  async triggerPendingNotifications(): Promise<void> {
    try {
      await notificationService.sendPendingNotifications();
      console.log('✅ Manually triggered pending notifications');
    } catch (error) {
      console.error('❌ Failed to trigger pending notifications:', error);
      throw error;
    }
  }

  /**
   * Manually trigger reminder notifications
   */
  async triggerReminderNotifications(): Promise<void> {
    try {
      await unknownUserService.sendReminderNotifications();
      console.log('✅ Manually triggered reminder notifications');
    } catch (error) {
      console.error('❌ Failed to trigger reminder notifications:', error);
      throw error;
    }
  }

  /**
   * Manually trigger cleanup tasks
   */
  async triggerCleanupTasks(): Promise<void> {
    try {
      await Promise.all([
        notificationService.cleanupExpiredNotifications(),
        unknownUserService.cleanupOldRecords(90)
      ]);
      console.log('✅ Manually triggered cleanup tasks');
    } catch (error) {
      console.error('❌ Failed to trigger cleanup tasks:', error);
      throw error;
    }
  }
}

export const schedulerService = new SchedulerService(); 