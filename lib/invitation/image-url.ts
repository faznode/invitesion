/**
 * Image sources a host can put on an invitation. An upload is stored by `lib/storage` and served from this origin at
 * `/media/<key>` (`mediaUrl`); anything else is an absolute URL typed into a field. The detail schema and the guest page
 * share these rules, so an image the editor has just uploaded is neither refused on save nor dropped on render.
 */

// Exactly the keys `invitationMediaKey` and `avatarKey` produce (`<id>/<24 hex>.<ext>`, optionally under `avatars/`)
// with the extensions `ALLOWED_IMAGE_EXT` stores, so no `..`, `//`, query or other path can pass as an upload.
const UPLOADED_MEDIA_PATH = /^\/media\/(?:avatars\/)?\d{1,15}\/[0-9a-f]{24}\.(?:png|jpg|webp|gif)$/;

export function isUploadedMediaPath(value: string): boolean {
  return UPLOADED_MEDIA_PATH.test(value);
}

/** Anything `new URL()` parses without a base, which is what zod's `.url()` accepts. */
export function isAbsoluteUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * The value as an `<img src>` a guest page may request: an upload path or an http(s) URL. A stored value can also be
 * any other scheme `new URL()` parses (`javascript:`, `data:`, `blob:`, `file:`); those render nothing.
 */
export function safeImageSrc(value?: string): string | undefined {
  if (!value) return undefined;
  if (isUploadedMediaPath(value)) return value;
  if (!isAbsoluteUrl(value)) return undefined;
  const { protocol, href } = new URL(value);
  return protocol === 'https:' || protocol === 'http:' ? href : undefined;
}
