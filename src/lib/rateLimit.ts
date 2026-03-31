// Simple in-memory rate limiter for API routes
// For production with serverless, consider using Upstash Redis

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store rate limit data in memory
// Note: This will reset on serverless cold starts, which is acceptable for basic abuse prevention
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP

// Clean up expired entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean every minute

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export function checkRateLimit(identifier: string): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // If no entry or entry expired, create new one
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    
    return {
      allowed: true,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
      limit: MAX_REQUESTS_PER_WINDOW,
    };
  }

  // Increment count
  entry.count++;
  
  const allowed = entry.count <= MAX_REQUESTS_PER_WINDOW;
  
  return {
    allowed,
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - entry.count),
    resetTime: entry.resetTime,
    limit: MAX_REQUESTS_PER_WINDOW,
  };
}

// Helper to extract client IP from request headers
export function getClientIp(headers: Headers): string {
  // Check various headers for the client IP
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Vercel-specific header
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }
  
  // Fallback
  return 'unknown';
}

// Helper to add rate limit headers to response
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}
