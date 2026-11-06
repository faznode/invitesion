import { getUser } from '@/lib/db/queries';
import { apiError } from '@/lib/api/respond';
import { requireOwnedInvitation, OwnershipError } from '@/lib/invitation/service';
import { invitationMediaKey, protectedInvitationMediaKey, saveImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';
// Node runtime: the local driver writes to the filesystem, which Edge has not.
export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'Sign in required');
  if (user.role === 'ADMIN') return apiError(403, 'FORBIDDEN', 'Customer session required');

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) return apiError(400, 'BAD_REQUEST', 'Invalid invitation id');

  // Ownership is settled before any bytes are read or stored.
  try {
    await requireOwnedInvitation(id, user.id);
  } catch (err) {
    if (err instanceof OwnershipError) return apiError(404, 'NOT_FOUND', 'Invitation not found');
    throw err;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return apiError(400, 'BAD_REQUEST', 'Body must be multipart/form-data');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return apiError(400, 'NO_FILE', 'Field "file" is required');
  if (file.size > MAX_BYTES) return apiError(413, 'FILE_TOO_LARGE', 'Max file size is 5MB');

  // D-040: a child's photo is stored under `protected/`, which `/media` serves to this invitation's owner only.
  const purpose = form.get('purpose');
  if (purpose !== null && purpose !== 'child-photo') return apiError(400, 'BAD_REQUEST', 'Unknown upload purpose');
  const keyFor = purpose === 'child-photo' ? protectedInvitationMediaKey : invitationMediaKey;

  // Type allowlisting, size re-check and magic-byte sniffing all live in
  // `saveImage`, so every upload path applies the same rules.
  const url = await saveImage((ext) => keyFor(id, ext), file, MAX_BYTES);
  if (!url) {
    return apiError(415, 'UNSUPPORTED_TYPE', 'Only PNG, JPG, WEBP, or GIF images up to 5MB are allowed');
  }

  return Response.json({ data: { url } }, { status: 201 });
}
