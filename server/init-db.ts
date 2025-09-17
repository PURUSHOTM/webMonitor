import { rawSql } from "./db";

export async function initDatabase() {
  // Enable required extensions
  await rawSql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

  // Users table
  await rawSql`
    CREATE TABLE IF NOT EXISTS users (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      password_salt text NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Websites table
  await rawSql`
    CREATE TABLE IF NOT EXISTS websites (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar,
      name text NOT NULL,
      url text NOT NULL,
      check_interval integer NOT NULL DEFAULT 5,
      enable_notifications boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Backfill schema changes if table existed before
  await rawSql`ALTER TABLE websites ADD COLUMN IF NOT EXISTS user_id varchar`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_websites_user_id ON websites(user_id)`;

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

  // Rate limits table
  await rawSql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id varchar NOT NULL,
      endpoint text NOT NULL,
      count integer NOT NULL DEFAULT 0,
      reset_time timestamp NOT NULL,
      created_at timestamp NOT NULL DEFAULT now()
    )
  `;

  // Indexes to improve queries
  await rawSql`CREATE INDEX IF NOT EXISTS idx_monitoring_results_website_id ON monitoring_results(website_id)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_notifications_website_id ON notifications(website_id)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_monitoring_results_checked_at ON monitoring_results(checked_at)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON rate_limits(user_id)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON rate_limits(endpoint)`;
  await rawSql`CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time)`;
}
