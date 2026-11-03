import type { Tier } from './schema';

/**
 * Tier budgets (masterplan 08 §3). Internal budgets anchored on our own lab page C-INV-005 (311 KiB cold load,
 * LCP 2.53 s); NOT competitor-parity thresholds — benchmark tier aggregates are unfinished, so none are invented.
 * Revisit when eligible tier aggregates or field data exist. A manifest may only tighten these.
 */
export const TIER_BUDGETS: Record<Tier, { coldLoadKiB: number; jsKiB: number; fontsKiB: number; imageKiB: number; audioKiB: number; modelKiB: number; fallbackKiB: number; maxMotion: number }> = {
  basic: { coldLoadKiB: 320, jsKiB: 8, fontsKiB: 120, imageKiB: 200, audioKiB: 0, modelKiB: 0, fallbackKiB: 120, maxMotion: 1 },
  premium: { coldLoadKiB: 380, jsKiB: 20, fontsKiB: 160, imageKiB: 250, audioKiB: 1536, modelKiB: 0, fallbackKiB: 120, maxMotion: 2 },
  signature: { coldLoadKiB: 420, jsKiB: 40, fontsKiB: 160, imageKiB: 250, audioKiB: 1536, modelKiB: 900, fallbackKiB: 120, maxMotion: 3 },
};

export const MAX_FONT_FAMILIES = 2;

/** SPDX ids (plus `own-work`) an asset may carry; fonts are narrower. */
export const LICENSE_ALLOWLIST = ['OFL-1.1', 'Apache-2.0', 'MIT', 'CC0-1.0', 'CC-BY-4.0', 'own-work'];
export const FONT_LICENSES = ['OFL-1.1', 'Apache-2.0'];

/** External origins a template may load from. Empty by design: everything is self-hosted. */
export const EXTERNAL_SCRIPT_ALLOWLIST: string[] = [];

/**
 * Competitor brands and domains from the research shortlist (Tier A + named Tier B). Their appearance in a template
 * file, asset source or originality reference fails the originality gate: we extract structure and measurements from
 * competitors, never assets, wording or references (AGENTS.md "No copying competitors").
 */
export const COMPETITOR_MARKERS = [
  'invitato',
  'katsudoto',
  'enviory',
  'wevitation',
  'viding',
  'indoinvite',
  'satumomen',
  'satu momen',
  'paleo.id',
  'invi.id',
  'barunson',
  'paperlesspost',
  'paperless post',
  'withjoy',
  'rsvpify',
  'partiful',
  'sitemu',
  'weddingku',
  'bridestory',
];

/** Fixture viewports for visual snapshots (brief: 360×800, 390×844, 412×915). */
export const SNAPSHOT_VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
] as const;
