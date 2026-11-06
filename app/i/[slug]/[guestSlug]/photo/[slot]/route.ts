import { findGuestByLinkSegment, loadPublishedInvitationSummary } from '@/lib/invitation/public';
import { childPhotoUpload, type ChildPhotoSlot } from '@/lib/invitation/portraits';
import { InvalidKeyError, getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string; guestSlug: string; slot: string }> };

const SLOTS: readonly ChildPhotoSlot[] = ['celebrant', 'honouree'];

/**
 * E-047 (s22): a child's photo for one personal guest link. The same audience as the page that shows it (D-038): a
 * published invitation, a guest link that resolves under the B-011 rule, the host's switch on, an upload of ours. All of
 * it is checked on every request, so switching the photo off or deleting the guest ends access at once; the response
 * is never stored by a shared cache. What this does not do: the stored object keeps its `/media/<key>` URL for the
 * host's editor and preview, so anyone who already holds that URL (pages served before E-047 carried it) can still
 * fetch it, and earlier responses may sit in browser caches for up to a year. A new upload gets a new key.
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { slug, guestSlug, slot } = await params;
  if (!SLOTS.includes(slot as ChildPhotoSlot)) return notFound();

  const summary = await loadPublishedInvitationSummary(slug);
  if (!summary) return notFound();
  const guest = await findGuestByLinkSegment(summary.invitation.id, guestSlug);
  if (!guest) return notFound();

  const upload = childPhotoUpload(summary.invitation.eventType, summary.config, slot as ChildPhotoSlot);
  if (!upload) return notFound();

  let object;
  try {
    object = await getStorage().read(upload.slice('/media/'.length));
  } catch (error) {
    if (error instanceof InvalidKeyError) return notFound();
    throw error;
  }
  if (!object || object.contentType === 'application/octet-stream') return notFound();

  const headers: Record<string, string> = {
    'content-type': object.contentType,
    'cache-control': 'private, no-store',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'; sandbox; style-src 'unsafe-inline'",
    'x-robots-tag': 'noindex',
  };
  if (object.size > 0) headers['content-length'] = String(object.size);
  return new Response(object.body, { status: 200, headers });
}

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'cache-control': 'private, no-store' } });
}
