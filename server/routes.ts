import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { monitorService } from "./services/monitor";
import { insertWebsiteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Start monitoring service
  monitorService.startMonitoring();

  // Website routes
  app.get("/api/websites", async (req, res) => {
    try {
      const websites = await storage.getWebsites();
      res.json(websites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch websites" });
    }
  });

  app.post("/api/websites", async (req, res) => {
    try {
      const validatedData = insertWebsiteSchema.parse(req.body);
      const website = await storage.createWebsite(validatedData);
      res.status(201).json(website);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/websites/:id", async (req, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website" });
    }
  });

  app.delete("/api/websites/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWebsite(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Website not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete website" });
    }
  });

  // Monitoring results routes
  app.get("/api/monitoring-results", async (req, res) => {
    try {
      const websiteId = req.query.websiteId as string;
      const results = await storage.getMonitoringResults(websiteId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monitoring results" });
    }
  });

  app.get("/api/monitoring-results/latest", async (req, res) => {
    try {
      const results = await storage.getLatestMonitoringResults();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest monitoring results" });
    }
  });

  app.get("/api/websites/:id/monitoring-results", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const results = await storage.getMonitoringResultsForWebsite(req.params.id, limit);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch website monitoring results" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notifications = await storage.getNotifications(limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const websites = await storage.getWebsites();
      const latestResults = await storage.getLatestMonitoringResults();
      const notifications = await storage.getNotifications(100);

      const websitesOnline = latestResults.filter(result => result.isUp).length;
      const totalWebsites = websites.length;
      
      // Calculate average response time
      const validResponseTimes = latestResults
        .filter(result => result.responseTime && result.isUp)
        .map(result => result.responseTime!);
      const avgResponseTime = validResponseTimes.length > 0 
        ? Math.round(validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length)
        : 0;

      // Calculate uptime percentage (last 100 results per website)
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

      // Count incidents in last 7 days
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

  // Manual monitoring trigger
  app.post("/api/monitoring/check", async (req, res) => {
    try {
      const results = await monitorService.runSingleCheck();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to run monitoring check" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
