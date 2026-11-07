import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * B-024 (I-01, D-056): the guest pass, a signed token in the QR on the guest's personal pass page.
 *
 * Token: `IVP1.` + base64url(pass id (16 bytes) ‖ expiry (u32 big-endian, unix seconds) ‖ the first 16 bytes of
 * HMAC-SHA256(secret, "invitesion.guest-pass.v1" ‖ 0x00 ‖ pass id ‖ expiry)), 53 characters. The pass id is the guest
 * row's random `pass_id`, never the guest id. Reading checks the shape, then the MAC against every accepted secret
 * (`GUEST_PASS_SECRET`, and `GUEST_PASS_SECRET_PREVIOUS` during a rotation), then the expiry, so a forged token never
 * learns whether it would have expired. The Rust writer holds the same rules (`services/api/src/roster/pass.rs`); both
 * run the vectors in `contracts/vectors/guest-pass.json` (`scripts/api/guest-pass-vectors.ts`). Pure: no I/O, no env.
 */

export const GUEST_PASS_PREFIX = 'IVP1.';
export const PASS_ID_PATTERN = /^[0-9a-f]{32}$/;
export const GUEST_PASS_TOKEN_LENGTH = GUEST_PASS_PREFIX.length + 48;
export const MIN_PASS_SECRET_BYTES = 32;
/** A pass stays valid two days after the last event ends (or starts, when no end is set). */
export const PASS_GRACE_SECONDS = 2 * 86_400;
/** Without a dated event, 30 days from the next UTC midnight, so the QR stays the same all day. */
export const PASS_UNDATED_SECONDS = 30 * 86_400;
/** A scan queued offline keeps its own time for up to a day; anything older or in the future is stored as "now". */
export const SCAN_MAX_AGE_SECONDS = 86_400;
export const MAX_SCANS_PER_BATCH = 50;
export const MAX_TOKEN_CHARS = 200;

const MAC_LABEL = 'invitesion.guest-pass.v1';
const MAC_BYTES = 16;
const BODY_PATTERN = /^[A-Za-z0-9_-]{48}$/;
const SCANNED_AT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:[0-5]\d(\.\d{1,3})?Z$/;
const LOOKUP_LABEL = 'invitesion.pass-lookup.v1|';

export type PassRead =
  | { kind: 'valid'; passId: string; expiresAt: number }
  | { kind: 'expired'; passId: string; expiresAt: number }
  | { kind: 'invalid' };

function macOf(secret: Uint8Array, passId: Buffer, expiry: Buffer): Buffer {
  return createHmac('sha256', secret).update(MAC_LABEL).update(Buffer.from([0])).update(passId).update(expiry).digest().subarray(0, MAC_BYTES);
}

export function signGuestPass(secret: Uint8Array, passId: string, expiresAt: number): string {
  if (!PASS_ID_PATTERN.test(passId)) throw new Error('guest pass: the pass id is 32 lowercase hex characters');
  if (!Number.isInteger(expiresAt) || expiresAt < 0 || expiresAt > 0xffff_ffff) throw new Error('guest pass: the expiry is unix seconds in 32 bits');
  const id = Buffer.from(passId, 'hex');
  const expiry = Buffer.alloc(4);
  expiry.writeUInt32BE(expiresAt);
  return GUEST_PASS_PREFIX + Buffer.concat([id, expiry, macOf(secret, id, expiry)]).toString('base64url');
}

export function readGuestPass(token: unknown, secrets: readonly Uint8Array[], nowSeconds: number): PassRead {
  if (typeof token !== 'string' || token.length !== GUEST_PASS_TOKEN_LENGTH || !token.startsWith(GUEST_PASS_PREFIX)) return { kind: 'invalid' };
  const body = token.slice(GUEST_PASS_PREFIX.length);
  if (!BODY_PATTERN.test(body)) return { kind: 'invalid' };
  const bytes = Buffer.from(body, 'base64url');
  const id = bytes.subarray(0, 16);
  const expiry = bytes.subarray(16, 20);
  const mac = bytes.subarray(20);
  if (!secrets.some((secret) => timingSafeEqual(macOf(secret, id, expiry), mac))) return { kind: 'invalid' };
  const passId = id.toString('hex');
  const expiresAt = expiry.readUInt32BE();
  return nowSeconds > expiresAt ? { kind: 'expired', passId, expiresAt } : { kind: 'valid', passId, expiresAt };
}

/** When a pass issued now expires: two days after the latest event time, else 30 days from the next UTC midnight. */
export function passExpiresAt(events: readonly { startAt?: string | null; endAt?: string | null }[], issuedAtSeconds: number): number {
  const times = events.flatMap((event) =>
    [event.startAt, event.endAt].flatMap((value) => {
      const ms = value ? Date.parse(value) : Number.NaN;
      return Number.isFinite(ms) ? [Math.floor(ms / 1000)] : [];
    }),
  );
  const expiry = times.length ? Math.max(...times) + PASS_GRACE_SECONDS : Math.ceil(issuedAtSeconds / 86_400) * 86_400 + PASS_UNDATED_SECONDS;
  return Math.min(Math.max(expiry, 0), 0xffff_ffff);
}

/** The time a scan is stored with: its own time when it is a strict UTC timestamp within the last day, else now. */
export function checkInTime(scannedAt: unknown, now: Date): Date {
  if (typeof scannedAt !== 'string' || !SCANNED_AT_PATTERN.test(scannedAt)) return now;
  const ms = Date.parse(scannedAt);
  // Date.parse rolls impossible dates over (30 February, 24:00); the Rust writer refuses them, and so does this.
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 19) !== scannedAt.slice(0, 19)) return now;
  return new Date(Math.min(now.getTime(), Math.max(now.getTime() - SCAN_MAX_AGE_SECONDS * 1000, ms)));
}

/** The invitation's opt-in, read from the stored config exactly as the Rust writer reads it. */
export function passCheckInEnabled(config: unknown): boolean {
  const settings = config && typeof config === 'object' ? (config as Record<string, unknown>).checkInSettings : undefined;
  return Boolean(settings && typeof settings === 'object' && (settings as Record<string, unknown>).enabled === true);
}

/** Whether the scanner offers the manual fallback: unless the host turned manual check-in off or requires the QR. */
export function passManualAllowed(config: unknown): boolean {
  const settings = config && typeof config === 'object' ? (config as Record<string, unknown>).checkInSettings : undefined;
  if (!settings || typeof settings !== 'object') return true;
  const { allowManual, requireQr } = settings as Record<string, unknown>;
  return allowManual !== false && requireQr !== true;
}

/**
 * What the scanner page holds per guest to show a name while offline: a one-way key of the pass id, never the pass id
 * itself, so the page cannot be turned into passes. The scanner derives the same key from a scanned token (SHA-256 in
 * the browser; `passLookupKeyFromToken` below is its server twin, used by the tests).
 */
export function passLookupKey(passId: string): string {
  return createHash('sha256').update(LOOKUP_LABEL + passId).digest('base64url').slice(0, 22);
}

export function passIdOfToken(token: string): string | null {
  if (token.length !== GUEST_PASS_TOKEN_LENGTH || !token.startsWith(GUEST_PASS_PREFIX)) return null;
  const body = token.slice(GUEST_PASS_PREFIX.length);
  return BODY_PATTERN.test(body) ? Buffer.from(body, 'base64url').subarray(0, 16).toString('hex') : null;
}

export function passLookupKeyFromToken(token: string): string | null {
  const passId = passIdOfToken(token);
  return passId ? passLookupKey(passId) : null;
}

type Env = Record<string, string | undefined>;

function secretOf(env: Env, name: string): Buffer | null {
  const value = env[name]?.trim();
  return value && Buffer.byteLength(value) >= MIN_PASS_SECRET_BYTES ? Buffer.from(value) : null;
}

/** The secret new passes are signed with, or null (passes are then not shown). */
export function passSigningSecret(env: Env = process.env): Buffer | null {
  return secretOf(env, 'GUEST_PASS_SECRET');
}

/** Every secret a pass may be signed with: the current one, then the previous one during a rotation. */
export function passVerifySecrets(env: Env = process.env): Buffer[] {
  return ['GUEST_PASS_SECRET', 'GUEST_PASS_SECRET_PREVIOUS'].flatMap((name) => secretOf(env, name) ?? []);
}
