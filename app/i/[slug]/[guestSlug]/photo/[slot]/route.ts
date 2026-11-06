import { serveGuestChildPhoto } from '@/lib/invitation/child-photo-delivery';
import { findGuestByLinkSegment, loadPublishedInvitationSummary } from '@/lib/invitation/public';
import { getStorage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ slug: string; guestSlug: string; slot: string }> };

/** A child's photo for one personal guest link; the access contract is `serveGuestChildPhoto` (E-047, D-040). */
export async function GET(_req: Request, { params }: Ctx) {
  return serveGuestChildPhoto(await params, {
    loadPublished: loadPublishedInvitationSummary,
    findGuest: findGuestByLinkSegment,
    storage: getStorage(),
  });
}
