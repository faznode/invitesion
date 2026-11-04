/** WCAG 2.x relative luminance and contrast ratio for opaque `#rrggbb` colours. */

const HEX = /^#[0-9a-f]{6}$/i;

export function relativeLuminance(hex: string): number {
  if (!HEX.test(hex)) throw new Error(`Expected an opaque #rrggbb colour, got ${hex}`);
  const [r, g, b] = [1, 3, 5].map((offset) => {
    const channel = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** AA thresholds: 4.5:1 for body text, 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold) and UI glyphs. */
export const WCAG_AA = { text: 4.5, large: 3 } as const;
