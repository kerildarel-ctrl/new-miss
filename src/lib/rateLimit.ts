/**
 * Simple in-memory rate limiter for Netlify serverless functions.
 * Uses a sliding window per IP address.
 * Works without Redis — resets on cold start (acceptable for serverless).
 */

interface RateEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateEntry>();

// Cleanup old entries every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now - entry.windowStart > 60_000) store.delete(key);
    });
  }, 5 * 60_000);
}

/**
 * @param ip       - Client IP address
 * @param limit    - Max requests per window
 * @param windowMs - Window size in milliseconds (default: 60s)
 * @returns { allowed, remaining, resetAt }
 */
export function checkRateLimit(
  ip: string,
  limit: number = 5,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count <= limit;
  return { allowed, remaining, resetAt: entry.windowStart + windowMs };
}

/**
 * Extract real client IP from request headers (Netlify / Cloudflare compatible)
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}
