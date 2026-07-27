import { InvalidKeyError, getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ path: string[] }> };

/**
 * Serves runtime-uploaded media.
 *
 * Bytes come from whichever storage driver is configured — local disk in
 * development, S3-compatible object storage in production — so this route is
 * unchanged by that choice. Key validation lives in the driver layer, which is
 * why traversal handling is a single `InvalidKeyError` catch here rather than
 * per-segment checks that a future call site could forget.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const segments = (await params).path ?? [];
  if (segments.length === 0) return notFound();

  const key = segments.join('/');

  let object;
  try {
    object = await getStorage().read(key);
  } catch (error) {
    if (error instanceof InvalidKeyError) return new Response('Bad request', { status: 400 });
    throw error;
  }
  if (!object) return notFound();
  if (object.contentType === 'application/octet-stream') {
    // Only types this system knowingly stores are servable; anything else would
    // hand the browser a document to sniff.
    return notFound();
  }

  const headers: Record<string, string> = {
    'content-type': object.contentType,
    'cache-control': 'public, max-age=31536000, immutable',
    // Defence in depth for user-supplied bytes served from our own origin:
    // never let the browser re-interpret the type, and strip any scripting or
    // navigation capability if it somehow does.
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox; style-src 'unsafe-inline'",
  };
  if (object.size > 0) headers['content-length'] = String(object.size);

  return new Response(object.body, { status: 200, headers });
}

function notFound() {
  return new Response('Not found', { status: 404 });
}
