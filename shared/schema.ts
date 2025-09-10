import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const websites = pgTable("websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  url: text("url").notNull(),
  checkInterval: integer("check_interval").notNull().default(5), // minutes
  enableNotifications: boolean("enable_notifications").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const monitoringResults = pgTable("monitoring_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull(),
  statusCode: integer("status_code"),
  responseTime: integer("response_time"), // milliseconds
  isUp: boolean("is_up").notNull(),
  error: text("error"),
  checkedAt: timestamp("checked_at").notNull().default(sql`now()`),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull(),
  type: text("type").notNull(), // 'down' | 'up' | 'slow'
  message: text("message").notNull(),
  emailSent: boolean("email_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdAt: true,
});

export const insertMonitoringResultSchema = createInsertSchema(monitoringResults).omit({
  id: true,
  checkedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type Website = typeof websites.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type MonitoringResult = typeof monitoringResults.$inferSelect;
export type InsertMonitoringResult = z.infer<typeof insertMonitoringResultSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
