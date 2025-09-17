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

  // User-scoped website operations
  getWebsitesByUser(userId: string): Promise<Website[]>;
  getWebsiteForUser(id: string, userId: string): Promise<Website | undefined>;
  createWebsiteForUser(userId: string, website: InsertWebsite): Promise<Website>;
  updateWebsiteForUser(id: string, userId: string, website: Partial<Website>): Promise<Website | undefined>;
  deleteWebsiteForUser(id: string, userId: string): Promise<boolean>;

  // Monitoring results operations
  getMonitoringResult(id: string): Promise<MonitoringResult | undefined>;
  getMonitoringResults(websiteId?: string): Promise<MonitoringResult[]>;
  createMonitoringResult(result: InsertMonitoringResult): Promise<MonitoringResult>;
  getLatestMonitoringResults(): Promise<MonitoringResult[]>;
  getLatestMonitoringResultsForUser(userId: string): Promise<MonitoringResult[]>;
  getMonitoringResultsForWebsite(websiteId: string, limit?: number): Promise<MonitoringResult[]>;

  // Notification operations
  getNotifications(limit?: number): Promise<Notification[]>;
  getNotificationsForUser(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationEmailSent(id: string): Promise<boolean>;
  markNotificationSmsSent(id: string): Promise<boolean>;
  clearAllNotifications(): Promise<boolean>;
  clearNotificationsForUser(userId: string): Promise<boolean>;

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
    } as Website;
    this.websites.set(id, website);
    return website;
  }

  async updateWebsite(id: string, updateData: Partial<Website>): Promise<Website | undefined> {
    const website = this.websites.get(id);
    if (!website) return undefined;

    const updatedWebsite = { ...website, ...updateData } as Website;
    this.websites.set(id, updatedWebsite);
    return updatedWebsite;
  }

  async deleteWebsite(id: string): Promise<boolean> {
    return this.websites.delete(id);
  }

  // User-scoped website operations (no-op for memory store)
  async getWebsitesByUser(_userId: string): Promise<Website[]> {
    return this.getWebsites();
  }

  async getWebsiteForUser(id: string, _userId: string): Promise<Website | undefined> {
    return this.getWebsite(id);
  }

  async createWebsiteForUser(_userId: string, website: InsertWebsite): Promise<Website> {
    return this.createWebsite(website);
  }

  async updateWebsiteForUser(id: string, _userId: string, updateData: Partial<Website>): Promise<Website | undefined> {
    return this.updateWebsite(id, updateData);
  }

  async deleteWebsiteForUser(id: string, _userId: string): Promise<boolean> {
    return this.deleteWebsite(id);
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
    } as MonitoringResult;
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

  async getLatestMonitoringResultsForUser(_userId: string): Promise<MonitoringResult[]> {
    return this.getLatestMonitoringResults();
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

  async getNotificationsForUser(_userId: string, limit = 50): Promise<Notification[]> {
    return this.getNotifications(limit);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      emailSent: false,
      smsSent: false,
      ...insertNotification,
      id,
      createdAt: new Date(),
    } as Notification;
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationEmailSent(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.set(id, { ...notification, emailSent: true } as Notification);
    return true;
  }

  async markNotificationSmsSent(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    this.notifications.set(id, { ...notification, smsSent: true } as Notification);
    return true;
  }

  async clearAllNotifications(): Promise<boolean> {
    this.notifications.clear();
    return true;
  }

  async clearNotificationsForUser(_userId: string): Promise<boolean> {
    return this.clearAllNotifications();
  }

  // Settings operations
  async getSetting(_key: string): Promise<Setting | undefined> {
    return undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    return { id: randomUUID(), key, value, updatedAt: new Date() } as unknown as Setting;
  }

  async getSettings(): Promise<Setting[]> {
    return [];
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  private async ensureAndRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const message = (error && (error.message || error.toString())) || '';
      const isMissingRelation = error?.code === '42P01' || /relation ".+" does not exist/.test(message);
      if (isMissingRelation) {
        try {
          const { initDatabase } = await import('./init-db');
          await initDatabase();
          return await fn();
        } catch (innerError) {
          throw innerError;
        }
      }
      throw error;
    }
  }

  // Website operations
  async getWebsite(id: string): Promise<Website | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db.select().from(schema.websites).where(eq(schema.websites.id, id)).limit(1);
      return result[0];
    });
  }

  async getWebsites(): Promise<Website[]> {
    return this.ensureAndRetry(async () => {
      return await db.select().from(schema.websites).orderBy(desc(schema.websites.createdAt));
    });
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    return this.ensureAndRetry(async () => {
      const result = await db.insert(schema.websites).values(insertWebsite).returning();
      return result[0];
    });
  }

  async updateWebsite(id: string, updateData: Partial<Website>): Promise<Website | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db.update(schema.websites)
        .set(updateData)
        .where(eq(schema.websites.id, id))
        .returning();
      return result[0];
    });
  }

  async deleteWebsite(id: string): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      const result = await db.delete(schema.websites).where(eq(schema.websites.id, id));
      return result.rowCount > 0;
    });
  }

  // User-scoped website operations
  async getWebsitesByUser(userId: string): Promise<Website[]> {
    return this.ensureAndRetry(async () => {
      return await db
        .select()
        .from(schema.websites)
        .where(eq(schema.websites.userId, userId))
        .orderBy(desc(schema.websites.createdAt));
    });
  }

  async getWebsiteForUser(id: string, userId: string): Promise<Website | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db
        .select()
        .from(schema.websites)
        .where(and(eq(schema.websites.id, id), eq(schema.websites.userId, userId)))
        .limit(1);
      return result[0];
    });
  }

  async createWebsiteForUser(userId: string, insertWebsite: InsertWebsite): Promise<Website> {
    return this.ensureAndRetry(async () => {
      const result = await db
        .insert(schema.websites)
        .values({ ...insertWebsite, userId })
        .returning();
      return result[0];
    });
  }

  async updateWebsiteForUser(id: string, userId: string, updateData: Partial<Website>): Promise<Website | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db
        .update(schema.websites)
        .set(updateData)
        .where(and(eq(schema.websites.id, id), eq(schema.websites.userId, userId)))
        .returning();
      return result[0];
    });
  }

  async deleteWebsiteForUser(id: string, userId: string): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      const result = await db
        .delete(schema.websites)
        .where(and(eq(schema.websites.id, id), eq(schema.websites.userId, userId)));
      return result.rowCount > 0;
    });
  }

  // Monitoring results operations
  async getMonitoringResult(id: string): Promise<MonitoringResult | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db.select().from(schema.monitoringResults).where(eq(schema.monitoringResults.id, id)).limit(1);
      return result[0];
    });
  }

  async getMonitoringResults(websiteId?: string): Promise<MonitoringResult[]> {
    return this.ensureAndRetry(async () => {
      if (websiteId) {
        return await db.select().from(schema.monitoringResults)
          .where(eq(schema.monitoringResults.websiteId, websiteId))
          .orderBy(desc(schema.monitoringResults.checkedAt));
      }
      return await db.select().from(schema.monitoringResults)
        .orderBy(desc(schema.monitoringResults.checkedAt));
    });
  }

  async createMonitoringResult(insertResult: InsertMonitoringResult): Promise<MonitoringResult> {
    return this.ensureAndRetry(async () => {
      const result = await db.insert(schema.monitoringResults).values(insertResult).returning();
      return result[0];
    });
  }

  async getLatestMonitoringResults(): Promise<MonitoringResult[]> {
    return this.ensureAndRetry(async () => {
      const results = await db
        .select()
        .from(schema.monitoringResults)
        .orderBy(desc(schema.monitoringResults.checkedAt));

      const latestByWebsite = new Map<string, MonitoringResult>();

      for (const result of results) {
        if (!latestByWebsite.has(result.websiteId)) {
          latestByWebsite.set(result.websiteId, result);
        }
      }

      return Array.from(latestByWebsite.values());
    });
  }

  async getLatestMonitoringResultsForUser(userId: string): Promise<MonitoringResult[]> {
    return this.ensureAndRetry(async () => {
      // Get user's website IDs
      const websites = await db
        .select({ id: schema.websites.id })
        .from(schema.websites)
        .where(eq(schema.websites.userId, userId));
      const websiteIds = new Set(websites.map((w) => w.id));

      const results = await db
        .select()
        .from(schema.monitoringResults)
        .orderBy(desc(schema.monitoringResults.checkedAt));

      const latestByWebsite = new Map<string, MonitoringResult>();

      for (const result of results) {
        if (!websiteIds.has(result.websiteId)) continue;
        if (!latestByWebsite.has(result.websiteId)) {
          latestByWebsite.set(result.websiteId, result);
        }
      }

      return Array.from(latestByWebsite.values());
    });
  }

  async getMonitoringResultsForWebsite(websiteId: string, limit = 100): Promise<MonitoringResult[]> {
    return this.ensureAndRetry(async () => {
      return await db.select().from(schema.monitoringResults)
        .where(eq(schema.monitoringResults.websiteId, websiteId))
        .orderBy(desc(schema.monitoringResults.checkedAt))
        .limit(limit);
    });
  }

  // Notification operations
  async getNotifications(limit = 100): Promise<Notification[]> {
    return this.ensureAndRetry(async () => {
      return await db
        .select()
        .from(schema.notifications)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit);
    });
  }

  async getNotificationsForUser(userId: string, limit = 100): Promise<Notification[]> {
    return this.ensureAndRetry(async () => {
      // Get user's website IDs
      const websites = await db
        .select({ id: schema.websites.id })
        .from(schema.websites)
        .where(eq(schema.websites.userId, userId));
      const websiteIds = new Set(websites.map((w) => w.id));

      const all = await db
        .select()
        .from(schema.notifications)
        .orderBy(desc(schema.notifications.createdAt))
        .limit(limit * 5);

      const filtered = all.filter((n) => websiteIds.has(n.websiteId));
      return limit ? filtered.slice(0, limit) : filtered;
    });
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    return this.ensureAndRetry(async () => {
      const result = await db.insert(schema.notifications).values(insertNotification).returning();
      return result[0];
    });
  }

  async markNotificationEmailSent(id: string): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      const result = await db.update(schema.notifications)
        .set({ emailSent: true })
        .where(eq(schema.notifications.id, id));
      return result.rowCount > 0;
    });
  }

  async markNotificationSmsSent(id: string): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      const result = await db.update(schema.notifications)
        .set({ smsSent: true })
        .where(eq(schema.notifications.id, id));
      return result.rowCount > 0;
    });
  }

  async clearAllNotifications(): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      await db.delete(schema.notifications);
      return true;
    });
  }

  async clearNotificationsForUser(userId: string): Promise<boolean> {
    return this.ensureAndRetry(async () => {
      // Get user's website IDs
      const websites = await db
        .select({ id: schema.websites.id })
        .from(schema.websites)
        .where(eq(schema.websites.userId, userId));
      const ids = websites.map((w) => w.id);
      if (ids.length === 0) return true;
      for (const id of ids) {
        await db.delete(schema.notifications).where(eq(schema.notifications.websiteId, id));
      }
      return true;
    });
  }

  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.ensureAndRetry(async () => {
      const result = await db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
      return result[0];
    });
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    return this.ensureAndRetry(async () => {
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
    });
  }

  async getSettings(): Promise<Setting[]> {
    return this.ensureAndRetry(async () => {
      return await db.select().from(schema.settings).orderBy(schema.settings.key);
    });
  }
}

export const storage = new DatabaseStorage();
