import type { NextConfig } from 'next';

/**
 * Baseline security headers.
 *
 * There were none. The public invitation pages render customer-controlled
 * content and are shared as links to hundreds of people, which is precisely the
 * surface where these earn their keep.
 *
 * Deliberately NOT including a full `Content-Security-Policy` here. A useful CSP
 * for this app needs per-request nonces for Next's inline bootstrap scripts,
 * which belongs in middleware, not in a static header list. Shipping a
 * permissive `script-src 'unsafe-inline'` policy would look like protection
 * while providing close to none, so the honest state is: not yet done, tracked
 * as B6 in docs/AUDIT-2026-07-27.md. `/media` already sets its own strict
 * sandbox policy, which is where untrusted bytes actually are.
 */
const securityHeaders = [
  // No MIME sniffing anywhere, not just on /media.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Clickjacking: nothing here is meant to be framed by another origin.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Guest URLs are personal and contain a guest slug; never leak the full path
  // to third parties via Referer.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // No feature this product uses needs these.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Force HTTPS once seen. Harmless on localhost, which browsers exempt.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    clientSegmentCache: true,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
