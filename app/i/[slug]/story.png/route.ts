import { inviteShareAvailable } from '@/lib/invitation/invite-share';
import { loadPublishedInvitationSummary } from '@/lib/invitation/public';
import { storyImageResponse } from '@/lib/invitation/story-image';

export const dynamic = 'force-dynamic';

/**
 * G-035 (I-16): the 1080×1920 Status / Story image of a published invitation, offered by its guest page's share actions
 * under the same rule (`inviteShareAvailable`): a draft, an expired or hidden invitation, the legacy layout and guest
 * sharing switched off all answer 404. One image per invitation, never per guest (`story-image.tsx`).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await loadPublishedInvitationSummary(slug);
  if (!summary || !inviteShareAvailable(summary.invitation, summary.config)) return new Response('Not found', { status: 404 });
  return storyImageResponse(summary.invitation.eventType, summary.config);
}
