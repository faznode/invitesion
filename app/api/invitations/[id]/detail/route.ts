import { getUser } from '@/lib/db/queries';
import { apiError, parseId, validationError } from '@/lib/api/respond';
import { detailConfigSchema } from '@/lib/invitation/detail-config';
import { getDetailConfig, updateDetailConfig, MediaReferenceError, OwnershipError, ThemeEntitlementError } from '@/lib/invitation/service';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'Sign in required');
  if (user.role === 'ADMIN') return apiError(403, 'FORBIDDEN', 'Customer session required');

  const id = parseId((await params).id);
  if (!id) return apiError(400, 'BAD_REQUEST', 'Invalid invitation id');

  try {
    const config = await getDetailConfig(id, user.id);
    return Response.json({ data: config });
  } catch (err) {
    if (err instanceof OwnershipError) return apiError(404, 'NOT_FOUND', 'Invitation not found');
    throw err;
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  const user = await getUser();
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'Sign in required');
  if (user.role === 'ADMIN') return apiError(403, 'FORBIDDEN', 'Customer session required');

  const id = parseId((await params).id);
  if (!id) return apiError(400, 'BAD_REQUEST', 'Invalid invitation id');

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, 'BAD_REQUEST', 'Body must be valid JSON');
  }

  const parsed = detailConfigSchema.partial().safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const config = await updateDetailConfig(id, user.id, parsed.data);
    return Response.json({ data: config });
  } catch (err) {
    if (err instanceof OwnershipError) return apiError(404, 'NOT_FOUND', 'Invitation not found');
    // D-040: field paths only, never the stored values.
    if (err instanceof MediaReferenceError) return apiError(400, 'INVALID_MEDIA', `Image not allowed here: ${err.issues.map((issue) => issue.path).join(', ')}`);
    // B-041: paths and reasons only; the package decides, never the request.
    if (err instanceof ThemeEntitlementError) return apiError(403, 'THEME_NOT_ENTITLED', 'Theme not included in this invitation', err.issues);
    throw err;
  }
}
