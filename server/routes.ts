import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { monitorService } from "./services/monitor";
import { insertWebsiteSchema } from "@shared/schema";
import { ensureAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start monitoring service
  monitorService.startMonitoring();

  // Website routes (user-scoped)
  app.get("/api/websites", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const websites = await storage.getWebsitesByUser(userId);
      res.json(websites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch websites" });
    }
  });

  app.post("/api/websites", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertWebsiteSchema.parse(req.body);
      const website = await storage.createWebsiteForUser(userId, validatedData);
      res.status(201).json(website);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/websites/:id", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const website = await storage.getWebsiteForUser(req.params.id, userId);
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website" });
    }
  });

  app.put("/api/websites/:id", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertWebsiteSchema.parse(req.body);
      const website = await storage.updateWebsiteForUser(req.params.id, userId, validatedData);
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.json(website);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/websites/:id", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const deleted = await storage.deleteWebsiteForUser(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete website" });
    }
  });

  // Monitoring results routes (user-scoped)
  app.get("/api/monitoring-results", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const websiteId = req.query.websiteId as string | undefined;
      if (websiteId) {
        const website = await storage.getWebsiteForUser(websiteId, userId);
        if (!website) return res.status(404).json({ error: "Website not found" });
        const results = await storage.getMonitoringResults(websiteId);
        return res.json(results);
      }
      const latest = await storage.getLatestMonitoringResultsForUser(userId);
      res.json(latest);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monitoring results" });
    }
  });

  app.get("/api/monitoring-results/latest", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const results = await storage.getLatestMonitoringResultsForUser(userId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest monitoring results" });
    }
  });

  app.get("/api/websites/:id/monitoring-results", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const website = await storage.getWebsiteForUser(req.params.id, userId);
      if (!website) return res.status(404).json({ error: "Website not found" });
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const results = await storage.getMonitoringResultsForWebsite(req.params.id, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website monitoring results" });
    }
  });

  // Notifications routes (user-scoped)
  app.get("/api/notifications", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notifications = await storage.getNotificationsForUser(userId, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Dashboard statistics (user-scoped)
  app.get("/api/dashboard/stats", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const websites = await storage.getWebsitesByUser(userId);
      const latestResults = await storage.getLatestMonitoringResultsForUser(userId);
      const notifications = await storage.getNotificationsForUser(userId, 100);

      const websitesOnline = latestResults.filter(result => result.isUp).length;
      const totalWebsites = websites.length;

      const validResponseTimes = latestResults
        .filter(result => result.responseTime && result.isUp)
        .map(result => result.responseTime!);
      const avgResponseTime = validResponseTimes.length > 0
        ? Math.round(validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length)
        : 0;

      const uptimePromises = websites.map(async (website) => {
        const results = await storage.getMonitoringResultsForWebsite(website.id, 100);
        if (results.length === 0) return 100;
        const upCount = results.filter(result => result.isUp).length;
        return (upCount / results.length) * 100;
      });

      const uptimePercentages = await Promise.all(uptimePromises);
      const avgUptime = uptimePercentages.length > 0
        ? uptimePercentages.reduce((sum, uptime) => sum + uptime, 0) / uptimePercentages.length
        : 100;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentIncidents = notifications.filter(
        notification => notification.type === 'down' &&
        new Date(notification.createdAt) > sevenDaysAgo
      ).length;

      res.json({
        websitesOnline,
        totalWebsites,
        avgResponseTime,
        uptimePercentage: Math.round(avgUptime * 10) / 10,
        incidentCount: recentIncidents,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Manual monitoring trigger - return only user's website results
  app.post("/api/monitoring/check", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const results = await monitorService.runSingleCheck();
      const userWebsites = new Set((await storage.getWebsitesByUser(userId)).map(w => w.id));
      const filtered = results.filter((r) => userWebsites.has(r.websiteId));
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to run monitoring check" });
    }
  });

  // Clear notifications (user-scoped)
  app.delete("/api/notifications", ensureAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.clearNotificationsForUser(userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear notifications" });
    }
  });

  // Settings endpoints (global app settings, still require auth)
  app.get("/api/settings", ensureAuth, async (_req, res) => {
    try {
      const settings = await storage.getSettings();
      const settingsObject: Record<string, string> = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });
      res.json(settingsObject);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings/email", ensureAuth, async (req, res) => {
    try {
      const { enableNotifications, fromEmail, notificationEmail } = req.body;

      await storage.setSetting('email.enableNotifications', enableNotifications?.toString() || 'true');
      await storage.setSetting('email.fromEmail', fromEmail || 'notifications@webmonitor.com');
      await storage.setSetting('email.notificationEmail', notificationEmail || 'admin@example.com');

      res.json({ success: true, message: "Email settings saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save email settings" });
    }
  });

  app.put("/api/settings/monitoring", ensureAuth, async (req, res) => {
    try {
      const { defaultCheckInterval, enableSlowResponseAlerts, slowResponseThreshold, retryAttempts } = req.body;

      await storage.setSetting('monitoring.defaultCheckInterval', defaultCheckInterval?.toString() || '5');
      await storage.setSetting('monitoring.enableSlowResponseAlerts', enableSlowResponseAlerts?.toString() || 'false');
      await storage.setSetting('monitoring.slowResponseThreshold', slowResponseThreshold?.toString() || '3000');
      await storage.setSetting('monitoring.retryAttempts', retryAttempts?.toString() || '3');

      res.json({ success: true, message: "Monitoring settings saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save monitoring settings" });
    }
  });

  app.put("/api/settings/sms", ensureAuth, async (req, res) => {
    try {
      const { enableNotifications, phoneNumber, enableCriticalOnly } = req.body;

      await storage.setSetting('sms.enableNotifications', enableNotifications?.toString() || 'false');
      await storage.setSetting('sms.phoneNumber', phoneNumber || '');
      await storage.setSetting('sms.enableCriticalOnly', enableCriticalOnly?.toString() || 'false');

      res.json({ success: true, message: "SMS settings saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save SMS settings" });
    }
  });

  // Appearance settings
  app.put("/api/settings/appearance", ensureAuth, async (req, res) => {
    try {
      const { theme, compactMode, showAdvancedMetrics } = req.body;

      await storage.setSetting('appearance.theme', theme || 'system');
      await storage.setSetting('appearance.compactMode', (compactMode !== undefined ? compactMode : false).toString());
      await storage.setSetting('appearance.showAdvancedMetrics', (showAdvancedMetrics !== undefined ? showAdvancedMetrics : false).toString());

      res.json({ success: true, message: "Appearance settings saved successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save appearance settings" });
    }
  });

  app.post("/api/settings/test-email", ensureAuth, async (req, res) => {
    try {
      const { sendEmail } = await import("./services/email.js");

      const notificationEmailSetting = await storage.getSetting('email.notificationEmail');
      const fromEmailSetting = await storage.getSetting('email.fromEmail');

      const toEmail = notificationEmailSetting?.value || process.env.NOTIFICATION_EMAIL || "admin@example.com";
      const fromEmail = fromEmailSetting?.value || process.env.FROM_EMAIL || "notifications@webmonitor.com";

      const success = await sendEmail({
        to: toEmail,
        from: fromEmail,
        subject: "Test Email from WebMonitor Pro",
        text: "This is a test email to verify your email configuration is working properly.",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Test Email</h2>
            <p>This is a test email to verify your email configuration is working properly.</p>
            <p>If you received this email, your WebMonitor Pro email notifications are set up correctly!</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `,
      });

      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(400).json({
          error: "Email configuration issue",
          message: "Unable to send test email. Please check your SendGrid API key and email settings."
        });
      }
    } catch (error: any) {
      console.error('Test email error:', error);

      if (error.code === 401 || error.message?.includes('Unauthorized')) {
        res.status(400).json({
          error: "Authentication failed",
          message: "SendGrid API key is invalid or missing. Please check your API key configuration."
        });
      } else if (error.code === 403 || error.message?.includes('Forbidden')) {
        res.status(400).json({
          error: "Permission denied",
          message: "SendGrid API key doesn't have permission to send emails."
        });
      } else {
        res.status(400).json({
          error: "Email service error",
          message: "Unable to send test email. Please check your email configuration."
        });
      }
    }
  });

  app.post("/api/settings/test-sms", ensureAuth, async (req, res) => {
    try {
      const { sendSMS } = await import("./services/sms.js");

      const phoneNumberSetting = await storage.getSetting('sms.phoneNumber');

      const phoneNumber = phoneNumberSetting?.value;
      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number not configured" });
      }

      const success = await sendSMS({
        to: phoneNumber,
        body: "Test SMS from WebMonitor Pro - Your SMS notifications are working correctly!"
      });

      if (success) {
        res.json({
          success: true,
          message: `Test SMS sent successfully to ${phoneNumber}`
        });
      } else {
        res.json({
          success: false,
          message: "Failed to send test SMS. Please check your Twilio configuration."
        });
      }

    } catch (error) {
      console.error("Test SMS error:", error);
      res.status(500).json({ error: "Failed to send test SMS" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
