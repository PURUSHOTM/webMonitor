import { rawSql } from "./db";

export async function initDatabase() {
  // Enable required extensions
  await rawSql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  // Websites table
  await rawSql`
    CREATE TABLE IF NOT EXISTS websites (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      url text NOT NULL,
      check_interval integer NOT NULL DEFAULT 5,
      enable_notifications boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Monitoring results table
  await rawSql`
    CREATE TABLE IF NOT EXISTS monitoring_results (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      website_id varchar NOT NULL,
      status_code integer,
      response_time integer,
      is_up boolean NOT NULL,
      error text,
      checked_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Notifications table
  await rawSql`
    CREATE TABLE IF NOT EXISTS notifications (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      website_id varchar NOT NULL,
      type text NOT NULL,
      message text NOT NULL,
      email_sent boolean NOT NULL DEFAULT false,
      sms_sent boolean NOT NULL DEFAULT false,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Settings table
  await rawSql`
    CREATE TABLE IF NOT EXISTS settings (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      key text NOT NULL UNIQUE,
      value text NOT NULL,
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Indexes to improve queries
  await rawSql`CREATE INDEX IF NOT EXISTS idx_monitoring_results_website_id ON monitoring_results(website_id)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_notifications_website_id ON notifications(website_id)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_monitoring_results_checked_at ON monitoring_results(checked_at)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
}
