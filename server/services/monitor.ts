import axios from 'axios';
import cron from 'node-cron';
import { storage } from '../storage';
import { sendEmail, generateDowntimeEmail, generateUptimeRestoredEmail } from './email';
import { sendSMS } from './sms';

interface MonitoringCheck {
  websiteId: string;
  url: string;
  isUp: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

class MonitorService {
  private isRunning = false;
  private websiteStates = new Map<string, boolean>(); // Track previous state for notifications
  
  async checkWebsite(url: string): Promise<{ isUp: boolean; statusCode?: number; responseTime?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(url, {
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 500, // Consider 4xx as "up" but 5xx as "down"
      });
      
      const responseTime = Date.now() - startTime;
      const isUp = response.status >= 200 && response.status < 500;
      
      return {
        isUp,
        statusCode: response.status,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      if (error.response) {
        // Server responded with error status
        return {
          isUp: error.response.status < 500,
          statusCode: error.response.status,
          responseTime,
          error: `HTTP ${error.response.status}: ${error.response.statusText}`,
        };
      } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        // Connection issues
        return {
          isUp: false,
          responseTime,
          error: `Connection failed: ${error.message}`,
        };
      } else {
        // Other errors
        return {
          isUp: false,
          responseTime,
          error: error.message,
        };
      }
    }
  }

  async checkAllWebsites(): Promise<MonitoringCheck[]> {
    const websites = await storage.getWebsites();
    const checks: MonitoringCheck[] = [];

    for (const website of websites) {
      const result = await this.checkWebsite(website.url);
      
      checks.push({
        websiteId: website.id,
        url: website.url,
        isUp: result.isUp,
        statusCode: result.statusCode,
        responseTime: result.responseTime,
        error: result.error,
      });

      // Store monitoring result
      await storage.createMonitoringResult({
        websiteId: website.id,
        statusCode: result.statusCode || null,
        responseTime: result.responseTime || null,
        isUp: result.isUp,
        error: result.error || null,
      });

      // Check for state changes and send notifications
      await this.handleStateChange(website, result.isUp, result.error);
    }

    return checks;
  }

  private async handleStateChange(website: any, isCurrentlyUp: boolean, error?: string) {
    const previousState = this.websiteStates.get(website.id);
    
    // If this is the first check, just store the state
    if (previousState === undefined) {
      this.websiteStates.set(website.id, isCurrentlyUp);
      return;
    }

    // State changed from up to down
    if (previousState && !isCurrentlyUp && website.enableNotifications) {
      const notification = await storage.createNotification({
        websiteId: website.id,
        type: 'down',
        message: `${website.name} is down`,
        emailSent: false,
        smsSent: false,
      });

      // Get notification settings
      const emailEnabledSetting = await storage.getSetting('email.enableNotifications');
      const smsEnabledSetting = await storage.getSetting('sms.enableNotifications');
      const smsCriticalOnlySetting = await storage.getSetting('sms.enableCriticalOnly');
      const notificationEmailSetting = await storage.getSetting('email.notificationEmail');
      const smsNumberSetting = await storage.getSetting('sms.phoneNumber');
      const fromEmailSetting = await storage.getSetting('email.fromEmail');
      
      // Send email notification if enabled
      if (emailEnabledSetting?.value !== 'false') {
        const emailContent = generateDowntimeEmail(website.name, website.url, error);
        const emailSent = await sendEmail({
          to: notificationEmailSetting?.value || process.env.NOTIFICATION_EMAIL || 'admin@example.com',
          from: fromEmailSetting?.value || process.env.FROM_EMAIL || 'notifications@webmonitor.com',
          ...emailContent,
        });

        if (emailSent) {
          await storage.markNotificationEmailSent(notification.id);
        }
      }
      
      // Send SMS notification if enabled and phone number configured
      if (smsEnabledSetting?.value === 'true' && smsNumberSetting?.value) {
        const smsSent = await sendSMS({
          to: smsNumberSetting.value,
          body: `🚨 ALERT: ${website.name} is down. URL: ${website.url}${error ? ` Error: ${error}` : ''}`,
        });
        
        if (smsSent) {
          await storage.markNotificationSmsSent(notification.id);
        }
      }
    }

    // State changed from down to up
    if (!previousState && isCurrentlyUp && website.enableNotifications) {
      const notification = await storage.createNotification({
        websiteId: website.id,
        type: 'up',
        message: `${website.name} is back online`,
        emailSent: false,
        smsSent: false,
      });

      // Get notification settings
      const emailEnabledSetting = await storage.getSetting('email.enableNotifications');
      const smsEnabledSetting = await storage.getSetting('sms.enableNotifications');
      const smsCriticalOnlySetting = await storage.getSetting('sms.enableCriticalOnly');
      const notificationEmailSetting = await storage.getSetting('email.notificationEmail');
      const smsNumberSetting = await storage.getSetting('sms.phoneNumber');
      const fromEmailSetting = await storage.getSetting('email.fromEmail');

      // Send email notification if enabled
      if (emailEnabledSetting?.value !== 'false') {
        const emailContent = generateUptimeRestoredEmail(website.name, website.url);
        const emailSent = await sendEmail({
          to: notificationEmailSetting?.value || process.env.NOTIFICATION_EMAIL || 'admin@example.com',
          from: fromEmailSetting?.value || process.env.FROM_EMAIL || 'notifications@webmonitor.com',
          ...emailContent,
        });

        if (emailSent) {
          await storage.markNotificationEmailSent(notification.id);
        }
      }
      
      // Send SMS notification if enabled, phone number configured, and not critical-only mode
      // For "up" events, only send if critical-only mode is disabled
      if (smsEnabledSetting?.value === 'true' && smsNumberSetting?.value && smsCriticalOnlySetting?.value !== 'true') {
        const smsSent = await sendSMS({
          to: smsNumberSetting.value,
          body: `✅ RECOVERY: ${website.name} is back online! URL: ${website.url}`,
        });
        
        if (smsSent) {
          await storage.markNotificationSmsSent(notification.id);
        }
      }
    }

    // Update stored state
    this.websiteStates.set(website.id, isCurrentlyUp);
  }

  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Run checks every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkAllWebsites();
      } catch (error) {
        console.error('Error during monitoring check:', error);
      }
    });

    console.log('Website monitoring started');
  }

  stopMonitoring() {
    this.isRunning = false;
    console.log('Website monitoring stopped');
  }

  async runSingleCheck() {
    return await this.checkAllWebsites();
  }
}

export const monitorService = new MonitorService();
