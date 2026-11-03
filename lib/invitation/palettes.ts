/**
 * Guest-page palettes. Class strings stay literal so Tailwind generates them; the link-preview image (B-010) reads the
 * same hex values through `paletteHex()`, so the WhatsApp preview and the page never drift apart.
 * Every paletteId used by lib/invitation/templates.ts is registered here.
 */
export type PaletteClasses = { bg: string; ink: string; accent: string; soft: string };

const palettes: Record<string, PaletteClasses> = {
  ivory: { bg: 'bg-[#faf7f2]', ink: 'text-[#3f3a34]', accent: 'text-[#a1743c]', soft: 'bg-[#f1e9dd]' },
  'rose-gold': { bg: 'bg-[#fdf6f4]', ink: 'text-[#453437]', accent: 'text-[#b76e79]', soft: 'bg-[#f7e4e3]' },
  confetti: { bg: 'bg-[#fef8f3]', ink: 'text-[#3b3340]', accent: 'text-[#e2653f]', soft: 'bg-[#fde5d6]' },
  sage: { bg: 'bg-[#f5f8f4]', ink: 'text-[#34403a]', accent: 'text-[#5f7d63]', soft: 'bg-[#e3ede2]' },
  sand: { bg: 'bg-[#faf7f0]', ink: 'text-[#403a30]', accent: 'text-[#9a7a4f]', soft: 'bg-[#efe6d5]' },
  slate: { bg: 'bg-[#f6f7f9]', ink: 'text-[#2b3138]', accent: 'text-[#3f6fa8]', soft: 'bg-[#e5eaf1]' },
  midnight: { bg: 'bg-[#101526]', ink: 'text-[#e8e9f2]', accent: 'text-[#d3b16a]', soft: 'bg-[#1c2338]' },
  terracotta: { bg: 'bg-[#faf3ee]', ink: 'text-[#41332c]', accent: 'text-[#bd5f34]', soft: 'bg-[#f3e0d3]' },
  orchid: { bg: 'bg-[#faf6fb]', ink: 'text-[#3d3242]', accent: 'text-[#8e5a9e]', soft: 'bg-[#efe0f2]' },
  emerald: { bg: 'bg-[#f2f7f4]', ink: 'text-[#22352b]', accent: 'text-[#1f6f50]', soft: 'bg-[#dcebe2]' },
  dusk: { bg: 'bg-[#f6f4f9]', ink: 'text-[#33303f]', accent: 'text-[#6a5acd]', soft: 'bg-[#e6e1f2]' },
  mocha: { bg: 'bg-[#f9f5f1]', ink: 'text-[#3c332c]', accent: 'text-[#8a6248]', soft: 'bg-[#eee2d7]' },
  ocean: { bg: 'bg-[#f3f8fa]', ink: 'text-[#27353d]', accent: 'text-[#2a7f9e]', soft: 'bg-[#dcedf2]' },
  blossom: { bg: 'bg-[#fdf5f6]', ink: 'text-[#43333a]', accent: 'text-[#d26d85]', soft: 'bg-[#f8e2e7]' },
  'gold-noir': { bg: 'bg-[#171310]', ink: 'text-[#f1e9dc]', accent: 'text-[#caa353]', soft: 'bg-[#262019]' },
  lavender: { bg: 'bg-[#f8f6fc]', ink: 'text-[#3a3547]', accent: 'text-[#7d6bb3]', soft: 'bg-[#ebe5f6]' },
  mint: { bg: 'bg-[#f3faf6]', ink: 'text-[#2c3b33]', accent: 'text-[#3e8e6b]', soft: 'bg-[#def0e6]' },
  sunshine: { bg: 'bg-[#fffaf0]', ink: 'text-[#3f3626]', accent: 'text-[#d98e04]', soft: 'bg-[#fdedcb]' },
};

export const paletteIds = Object.keys(palettes);

export function palette(id?: string | null): PaletteClasses {
  return palettes[id ?? ''] ?? palettes.ivory;
}

const hexOf = (className: string) => className.match(/#[0-9a-f]{6}/i)?.[0] ?? '#000000';

export function paletteHex(id?: string | null): PaletteClasses {
  const classes = palette(id);
  return { bg: hexOf(classes.bg), ink: hexOf(classes.ink), accent: hexOf(classes.accent), soft: hexOf(classes.soft) };
}
