import { type Website, type InsertWebsite, type MonitoringResult, type InsertMonitoringResult, type Notification, type InsertNotification, type Setting, type InsertSetting } from "@shared/schema";
import { randomUUID } from "crypto";
import { db, schema } from './db';
import { eq, desc, and } from 'drizzle-orm';

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
  clearAllNotifications(): Promise<boolean>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  getSettings(): Promise<Setting[]>;
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

  async clearAllNotifications(): Promise<boolean> {
    this.notifications.clear();
    return true;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Website operations
  async getWebsite(id: string): Promise<Website | undefined> {
    const result = await db.select().from(schema.websites).where(eq(schema.websites.id, id)).limit(1);
    return result[0];
  }

  async getWebsites(): Promise<Website[]> {
    return await db.select().from(schema.websites).orderBy(desc(schema.websites.createdAt));
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const result = await db.insert(schema.websites).values(insertWebsite).returning();
    return result[0];
  }

  async updateWebsite(id: string, updateData: Partial<Website>): Promise<Website | undefined> {
    const result = await db.update(schema.websites)
      .set(updateData)
      .where(eq(schema.websites.id, id))
      .returning();
    return result[0];
  }

  async deleteWebsite(id: string): Promise<boolean> {
    const result = await db.delete(schema.websites).where(eq(schema.websites.id, id));
    return result.rowCount > 0;
  }

  // Monitoring results operations
  async getMonitoringResult(id: string): Promise<MonitoringResult | undefined> {
    const result = await db.select().from(schema.monitoringResults).where(eq(schema.monitoringResults.id, id)).limit(1);
    return result[0];
  }

  async getMonitoringResults(websiteId?: string): Promise<MonitoringResult[]> {
    if (websiteId) {
      return await db.select().from(schema.monitoringResults)
        .where(eq(schema.monitoringResults.websiteId, websiteId))
        .orderBy(desc(schema.monitoringResults.checkedAt));
    }
    return await db.select().from(schema.monitoringResults)
      .orderBy(desc(schema.monitoringResults.checkedAt));
  }

  async createMonitoringResult(insertResult: InsertMonitoringResult): Promise<MonitoringResult> {
    const result = await db.insert(schema.monitoringResults).values(insertResult).returning();
    return result[0];
  }

  async getLatestMonitoringResults(): Promise<MonitoringResult[]> {
    // Get the latest result for each website
    const results = await db.select().from(schema.monitoringResults)
      .orderBy(desc(schema.monitoringResults.checkedAt));
    
    const latestByWebsite = new Map<string, MonitoringResult>();
    
    for (const result of results) {
      if (!latestByWebsite.has(result.websiteId)) {
        latestByWebsite.set(result.websiteId, result);
      }
    }
    
    return Array.from(latestByWebsite.values());
  }

  async getMonitoringResultsForWebsite(websiteId: string, limit = 100): Promise<MonitoringResult[]> {
    return await db.select().from(schema.monitoringResults)
      .where(eq(schema.monitoringResults.websiteId, websiteId))
      .orderBy(desc(schema.monitoringResults.checkedAt))
      .limit(limit);
  }

  // Notification operations
  async getNotifications(limit = 100): Promise<Notification[]> {
    return await db.select().from(schema.notifications)
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const result = await db.insert(schema.notifications).values(insertNotification).returning();
    return result[0];
  }

  async markNotificationEmailSent(id: string): Promise<boolean> {
    const result = await db.update(schema.notifications)
      .set({ emailSent: true })
      .where(eq(schema.notifications.id, id));
    return result.rowCount > 0;
  }

  async clearAllNotifications(): Promise<boolean> {
    await db.delete(schema.notifications);
    return true;
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
    return result[0];
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    
    if (existing) {
      const result = await db.update(schema.settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(schema.settings.key, key))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(schema.settings)
        .values({ key, value })
        .returning();
      return result[0];
    }
  }

  async getSettings(): Promise<Setting[]> {
    return await db.select().from(schema.settings).orderBy(schema.settings.key);
  }
}

export const storage = new DatabaseStorage();
