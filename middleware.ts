import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAdminEntryPath } from '@/lib/env';
import { resolveLocale } from '@/lib/i18n';

const customerRoot = '/dashboard';
const adminRoot = '/admin';

/**
 * Rebuilds the browser-visible origin for a redirect.
 *
 * The port needs care. Blanking it whenever `x-forwarded-host` is present is
 * wrong twice over: a forwarded host may name a non-default port explicitly
 * (`example.com:8443`), and the Next dev server sets `x-forwarded-host` to a
 * bare hostname — so every redirect to /sign-in dropped :3000 and pointed the
 * browser at port 80, where nothing is listening.
 *
 * The rule: an explicit port in the header wins; otherwise a real proxy
 * (identified by `x-forwarded-proto`) means the scheme's default port and the
 * port is dropped; otherwise the request's own port is kept.
 */
function publicUrlFrom(request: NextRequest) {
  const publicUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedHost) {
    const [host, port] = forwardedHost.split(':');
    publicUrl.hostname = host;
    if (port) publicUrl.port = port;
    else if (forwardedProto) publicUrl.port = '';
  }
  if (forwardedProto) publicUrl.protocol = `${forwardedProto}:`;
  return publicUrl;
}

/**
 * Enforce or observe. See the nonce comment below for why this starts as
 * report-only. Set `CSP_ENFORCE=true` once reports are clean.
 */
const CSP_REPORT_ONLY = process.env.CSP_ENFORCE !== 'true';

function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    // `strict-dynamic` lets a nonced loader pull in the chunks it needs without
    // enumerating every hashed filename. The http/https fallbacks are ignored by
    // browsers that understand strict-dynamic and keep older ones working.
    // Clerk loads its own script and talks to its API, so both are named.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http:`,
    // Tailwind and the invitation themes set inline styles; nonces do not reach
    // style attributes, so this stays permissive and is a known limitation.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.clerk.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
    // Clerk renders its bot-protection challenge in a frame.
    "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * Plain prefix test, not Clerk's `createRouteMatcher`.
 *
 * That helper is deprecated, and Clerk's reasoning is worth keeping: middleware
 * path matching can diverge from how Next.js actually routes a request, so a
 * pattern that looks like it covers a route may not. Their guidance is to check
 * at the resource.
 *
 * This application already does that — every dashboard page resolves `getUser()`
 * and redirects when it is null, and ownership is enforced by
 * `requireOwnedInvitation` at the query. The check below is defence in depth and
 * a nicer redirect, never the only gate. Keeping it as a literal prefix removes
 * the deprecated API without pretending the pattern is the security boundary.
 */
function isCustomerRoute(pathname: string) {
  return pathname === customerRoot || pathname.startsWith(`${customerRoot}/`);
}

/**
 * Session handling is Clerk's; everything else here is still ours.
 *
 * `clerkMiddleware` only establishes who is signed in. The three things this
 * middleware did before that Clerk has no opinion about are unchanged:
 * locale resolution, the per-request CSP nonce, and the private admin entry.
 *
 * Note what is NOT delegated: the admin gate still runs against our own
 * database role (see `lib/auth/clerk-user.ts`). Clerk decides *who you are*,
 * this application decides *what you may do*.
 */
export default clerkMiddleware(async (getAuth, request) => {
  const { pathname } = request.nextUrl;
  const privateAdminEntry = getAdminEntryPath();

  // Legacy customer URLs must never surface a raw browser 404. Preserve any
  // known child path, otherwise return the canonical customer dashboard.
  if (pathname === `${customerRoot}/customer` || pathname.startsWith(`${customerRoot}/customer/`)) {
    const legacyChild = pathname.slice(`${customerRoot}/customer`.length);
    const supportedChild = ['/invitations', '/guests', '/templates'].includes(legacyChild);
    const redirectUrl = publicUrlFrom(request);
    redirectUrl.pathname = supportedChild ? `${customerRoot}${legacyChild}` : customerRoot;
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  const isPrivateAdminRoute = Boolean(
    privateAdminEntry &&
      (pathname === `${adminRoot}/${privateAdminEntry}` ||
        pathname.startsWith(`${adminRoot}/${privateAdminEntry}/`)),
  );
  // Unmatched admin paths fall through to the app router's not-found UI. The
  // admin layout still rejects a guessed entry server-side; this only avoids a
  // raw web-server 404.
  const isPrivateAdminLogin = pathname === `${adminRoot}/${privateAdminEntry}/login`;
  const isProtectedRoute =
    isCustomerRoute(pathname) || (isPrivateAdminRoute && !isPrivateAdminLogin);

  if (isProtectedRoute) {
    const { userId } = await getAuth();
    if (!userId) {
      const signIn = publicUrlFrom(request);
      signIn.pathname = '/sign-in';
      signIn.search = '';
      return NextResponse.redirect(signIn);
    }
  }

  // Do not let an old cookie pick a conflicting language. Geo is first, then
  // browser locale, then Indonesian. The resolved value is passed downstream.
  const country = request.headers.get('x-vercel-ip-country') ?? request.headers.get('cf-ipcountry');
  const locale = resolveLocale(country, request.headers.get('accept-language'));
  // Brand-neutral header names on purpose. These once carried the old product
  // name, which meant a rebrand reached into the wire protocol between
  // middleware and server components for no reason. Named after what they carry.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-app-locale', locale);

  // Per-request CSP nonce.
  //
  // A useful policy for this app cannot live in `next.config.ts`: Next injects
  // inline bootstrap scripts, so a static policy would need `unsafe-inline`,
  // which permits exactly the injection CSP exists to stop.
  //
  // Report-only until the app has been observed under it: an enforcing policy
  // that blocks a legitimate script would break the page for real customers,
  // and a broken checkout is worse than an unexercised header.
  const nonce = crypto.randomUUID().replace(/-/g, '');
  const policy = contentSecurityPolicy(nonce);
  const headerName = CSP_REPORT_ONLY
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  /*
   * The policy goes on the REQUEST headers as well as the response, and that is
   * not redundant.
   *
   * Next reads the nonce out of the `Content-Security-Policy` request header and
   * applies it to the framework's own inline bootstrap scripts. Setting it only
   * on the response — as this did — meant those scripts never received a nonce.
   * Report-only hid the consequence: nothing was blocked, so it looked fine.
   * The first person to set `CSP_ENFORCE=true` would have got a blank page,
   * because `strict-dynamic` discards the `https:` fallback and the un-nonced
   * bootstrap would be refused.
   *
   * A previous custom `x-vienne-nonce` header was removed rather than renamed:
   * nothing read it, and a header that looks like it wires up the nonce while
   * doing nothing is worse than no header at all.
   */
  requestHeaders.set(headerName, policy);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set(headerName, policy);
  res.cookies.set('locale', locale, { sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/' });

  if (isProtectedRoute) {
    res.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
  }

  return res;
});

export const config = {
  matcher: [
    // Everything except static assets, and always the API routes so Clerk can
    // establish a session for them too.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)$).*)',
    '/(api|trpc)(.*)',
  ],
  runtime: 'nodejs',
};
