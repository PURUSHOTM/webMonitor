import { type Website, type InsertWebsite, type MonitoringResult, type InsertMonitoringResult, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Website operations
  getWebsite(id: string): Promise<Website | undefined>;
  getWebsites(): Promise<Website[]>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: string, website: Partial<Website>): Promise<Website | undefined>;
  deleteWebsite(id: string): Promise<boolean>;

  // Monitoring results operations
  getMonitoringResult(id: string): Promise<MonitoringResult | undefined>;
  getMonitoringResults(websiteId?: string): Promise<MonitoringResult[]>;
  createMonitoringResult(result: InsertMonitoringResult): Promise<MonitoringResult>;
  getLatestMonitoringResults(): Promise<MonitoringResult[]>;
  getMonitoringResultsForWebsite(websiteId: string, limit?: number): Promise<MonitoringResult[]>;

  // Notification operations
  getNotifications(limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationEmailSent(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private websites: Map<string, Website>;
  private monitoringResults: Map<string, MonitoringResult>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.websites = new Map();
    this.monitoringResults = new Map();
    this.notifications = new Map();
  }

  // Website operations
  async getWebsite(id: string): Promise<Website | undefined> {
    return this.websites.get(id);
  }

  async getWebsites(): Promise<Website[]> {
    return Array.from(this.websites.values());
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const id = randomUUID();
    const website: Website = {
      checkInterval: 5,
      enableNotifications: true,
      ...insertWebsite,
      id,
      createdAt: new Date(),
    };
    this.websites.set(id, website);
    return website;
  }

  async updateWebsite(id: string, updateData: Partial<Website>): Promise<Website | undefined> {
    const website = this.websites.get(id);
    if (!website) return undefined;

    const updatedWebsite = { ...website, ...updateData };
    this.websites.set(id, updatedWebsite);
    return updatedWebsite;
  }

  async deleteWebsite(id: string): Promise<boolean> {
    return this.websites.delete(id);
  }

  // Monitoring results operations
  async getMonitoringResult(id: string): Promise<MonitoringResult | undefined> {
    return this.monitoringResults.get(id);
  }

  async getMonitoringResults(websiteId?: string): Promise<MonitoringResult[]> {
    const results = Array.from(this.monitoringResults.values());
    if (websiteId) {
      return results.filter(result => result.websiteId === websiteId);
    }
    return results.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  }

  async createMonitoringResult(insertResult: InsertMonitoringResult): Promise<MonitoringResult> {
    const id = randomUUID();
    const result: MonitoringResult = {
      ...insertResult,
      error: insertResult.error || null,
      statusCode: insertResult.statusCode || null,
      responseTime: insertResult.responseTime || null,
      id,
      checkedAt: new Date(),
    };
    this.monitoringResults.set(id, result);
    return result;
  }

  async getLatestMonitoringResults(): Promise<MonitoringResult[]> {
    const results = Array.from(this.monitoringResults.values());
    const latestByWebsite = new Map<string, MonitoringResult>();
    
    for (const result of results) {
      const existing = latestByWebsite.get(result.websiteId);
      if (!existing || new Date(result.checkedAt) > new Date(existing.checkedAt)) {
        latestByWebsite.set(result.websiteId, result);
      }
    }
    
    return Array.from(latestByWebsite.values());
  }

  async getMonitoringResultsForWebsite(websiteId: string, limit = 50): Promise<MonitoringResult[]> {
    const results = Array.from(this.monitoringResults.values())
      .filter(result => result.websiteId === websiteId)
      .sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
    
    return limit ? results.slice(0, limit) : results;
  }

  // Notification operations
  async getNotifications(limit = 50): Promise<Notification[]> {
    const notifications = Array.from(this.notifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return limit ? notifications.slice(0, limit) : notifications;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      emailSent: false,
      ...insertNotification,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationEmailSent(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.set(id, { ...notification, emailSent: true });
    return true;
  }
}

export const storage = new MemStorage();
