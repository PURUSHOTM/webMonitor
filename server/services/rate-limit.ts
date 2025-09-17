import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

// In-memory cache for rate limits to reduce database queries
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

// Default rate limits for different user tiers
const RATE_LIMITS = {
  // Free tier limits
  free: {
    // General endpoints
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
    },
    // High-frequency endpoints
    frequent: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // 200 requests per window
    },
    // Resource-intensive endpoints
    intensive: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // 50 requests per window
    },
    // Critical endpoints (email, SMS)
    critical: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per window
    }
  },
  // Paid tier limits (more generous)
  paid: {
    // General endpoints
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per window
    },
    // High-frequency endpoints
    frequent: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 2000, // 2000 requests per window
    },
    // Resource-intensive endpoints
    intensive: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // 500 requests per window
    },
    // Critical endpoints (email, SMS)
    critical: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // 50 requests per window
    }
  }
};

// Function to determine user tier (simplified for now)
// In a real implementation, this would check the user's subscription status
async function getUserTier(userId: string): Promise<"free" | "paid"> {
  // For now, all users are free tier
  // This could be extended to check user's subscription status in the database
  return "free";
}

// Express middleware for rate limiting
export function rateLimit(options: { 
  endpoint?: string; 
  category?: "general" | "frequent" | "intensive" | "critical";
  tier?: "free" | "paid";
  max?: number;
  windowMs?: number;
} = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting for non-authenticated requests
    if (!req.user) {
      return next();
    }

    const userId = (req.user as any).id;
    const endpoint = options.endpoint || req.path;
    const category = options.category || "general";
    
    // Determine user tier
    const userTier = options.tier || await getUserTier(userId);
    
    // Get limits based on tier and category
    const limits = options.windowMs && options.max 
      ? { windowMs: options.windowMs, max: options.max }
      : RATE_LIMITS[userTier][category];
    
    const key = `${userId}:${endpoint}`;
    const now = Date.now();
    
    // Check in-memory cache first
    const cached = rateLimitCache.get(key);
    if (cached && cached.resetTime > now) {
      if (cached.count >= limits.max) {
        return res.status(429).json({
          error: "Too Many Requests",
          message: "You have exceeded your rate limit. Please try again later.",
          limit: limits.max,
          remaining: 0,
          reset: new Date(cached.resetTime).toISOString()
        });
      }
      // Update cache
      rateLimitCache.set(key, { count: cached.count + 1, resetTime: cached.resetTime });
      res.set({
        "X-RateLimit-Limit": limits.max,
        "X-RateLimit-Remaining": limits.max - (cached.count + 1),
        "X-RateLimit-Reset": new Date(cached.resetTime).toISOString()
      });
      return next();
    }

    // Check database
    try {
      const result = await db
        .select()
        .from(schema.rateLimits)
        .where(
          and(
            eq(schema.rateLimits.userId, userId),
            eq(schema.rateLimits.endpoint, endpoint)
          )
        )
        .limit(1);

      const rateLimit = result[0];

      if (rateLimit) {
        // Check if the window has expired
        if (rateLimit.resetTime.getTime() <= now) {
          // Reset the counter
          await db
            .update(schema.rateLimits)
            .set({ count: 1, resetTime: new Date(now + limits.windowMs) })
            .where(
              and(
                eq(schema.rateLimits.userId, userId),
                eq(schema.rateLimits.endpoint, endpoint)
              )
            );
          
          // Update cache
          rateLimitCache.set(key, { count: 1, resetTime: now + limits.windowMs });
          res.set({
            "X-RateLimit-Limit": limits.max,
            "X-RateLimit-Remaining": limits.max - 1,
            "X-RateLimit-Reset": new Date(now + limits.windowMs).toISOString()
          });
          return next();
        } else if (rateLimit.count >= limits.max) {
          // Update cache
          rateLimitCache.set(key, { count: rateLimit.count, resetTime: rateLimit.resetTime.getTime() });
          return res.status(429).json({
            error: "Too Many Requests",
            message: "You have exceeded your rate limit. Please try again later.",
            limit: limits.max,
            remaining: 0,
            reset: rateLimit.resetTime.toISOString()
          });
        } else {
          // Increment the counter
          const newCount = rateLimit.count + 1;
          await db
            .update(schema.rateLimits)
            .set({ count: newCount })
            .where(
              and(
                eq(schema.rateLimits.userId, userId),
                eq(schema.rateLimits.endpoint, endpoint)
              )
            );
          
          // Update cache
          rateLimitCache.set(key, { count: newCount, resetTime: rateLimit.resetTime.getTime() });
          res.set({
            "X-RateLimit-Limit": limits.max,
            "X-RateLimit-Remaining": limits.max - newCount,
            "X-RateLimit-Reset": rateLimit.resetTime.toISOString()
          });
          return next();
        }
      } else {
        // Create new rate limit entry
        await db.insert(schema.rateLimits).values({
          userId,
          endpoint,
          count: 1,
          resetTime: new Date(now + limits.windowMs),
        });
        
        // Update cache
        rateLimitCache.set(key, { count: 1, resetTime: now + limits.windowMs });
        res.set({
          "X-RateLimit-Limit": limits.max,
          "X-RateLimit-Remaining": limits.max - 1,
          "X-RateLimit-Reset": new Date(now + limits.windowMs).toISOString()
        });
        return next();
      }
    } catch (error) {
      console.error("Rate limit check failed:", error);
      // Fail open - don't block requests if rate limiting fails
      return next();
    }
  };
}