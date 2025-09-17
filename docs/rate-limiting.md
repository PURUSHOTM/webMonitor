# Rate Limiting Implementation

This document explains the rate limiting implementation in the SiteWatch application.

## Overview

The rate limiting system is designed to prevent abuse of the API, especially by free users. It implements different limits based on user tiers and endpoint categories.

## Implementation Details

### Rate Limit Categories

1. **General** - For standard operations (default)
   - Free tier: 100 requests per 15 minutes
   - Paid tier: 1000 requests per 15 minutes

2. **Frequent** - For high-frequency read operations
   - Free tier: 200 requests per 15 minutes
   - Paid tier: 2000 requests per 15 minutes

3. **Intensive** - For resource-intensive operations (create, update, delete)
   - Free tier: 50 requests per 15 minutes
   - Paid tier: 500 requests per 15 minutes

4. **Critical** - For operations that send external communications (email, SMS)
   - Free tier: 10 requests per 15 minutes
   - Paid tier: 50 requests per 15 minutes

### Database Schema

Rate limit information is stored in the `rate_limits` table:

```sql
CREATE TABLE IF NOT EXISTS rate_limits (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL,
  endpoint text NOT NULL,
  count integer NOT NULL DEFAULT 0,
  reset_time timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
```

### Middleware Usage

The rate limiting middleware can be applied to any route:

```javascript
import { rateLimit } from "./services/rate-limit";

// Using default category (general)
app.get("/api/resource", ensureAuth, rateLimit(), (req, res) => { ... });

// Using specific category
app.get("/api/frequent-resource", ensureAuth, rateLimit({ category: "frequent" }), (req, res) => { ... });

// Custom limits
app.get("/api/custom-resource", ensureAuth, rateLimit({ max: 1000, windowMs: 60000 }), (req, res) => { ... });
```

### Response Headers

The middleware adds the following headers to responses:
- `X-RateLimit-Limit`: The maximum number of requests allowed in the current window
- `X-RateLimit-Remaining`: The number of requests remaining in the current window
- `X-RateLimit-Reset`: The time when the current window resets (ISO 8601 format)

### Error Response

When a rate limit is exceeded, the API returns a 429 status code with the following JSON:

```json
{
  "error": "Too Many Requests",
  "message": "You have exceeded your rate limit. Please try again later.",
  "limit": 100,
  "remaining": 0,
  "reset": "2023-01-01T12:00:00.000Z"
}
```

## Current Implementation

Rate limiting has been applied to all authenticated API endpoints in `routes.ts` with appropriate categories based on the operation type:

- Read operations (GET): "frequent" category
- Write operations (POST, PUT, DELETE): "intensive" category
- Critical operations (test email/SMS): "critical" category
- Settings operations: "general" category

## Future Enhancements

1. Implement user tier detection based on subscription status
2. Add global rate limits in addition to per-user limits
3. Add IP-based rate limiting for unauthenticated endpoints
4. Implement rate limit bursting capabilities
5. Add rate limit analytics dashboard