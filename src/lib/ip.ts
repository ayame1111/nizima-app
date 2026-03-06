import { headers } from 'next/headers';

/**
 * Utility function to reliably extract IP address from request headers.
 * Handles various proxy scenarios (Cloudflare, Vercel, Nginx, etc.)
 */
export async function getIp(): Promise<string> {
  const headersList = await headers();
  
  // Standard proxy headers
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    // The first IP in the list is the client's original IP
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Cloudflare specific
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }

  // Vercel specific (if applicable)
  const vercelForwardedFor = headersList.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.trim();
  }

  // Fallback
  return 'unknown';
}
