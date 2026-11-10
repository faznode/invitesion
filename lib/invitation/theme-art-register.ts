import type { ThemeArtPoolKey } from './theme-art';

/**
 * G-016: self-hosted theme art that replaces the runtime Unsplash hotlinks of `theme-art.ts`, one mood pool at a time.
 *
 * Origin: every asset is original. Each was generated for this repository with the v0 image tool on 2026-11-10 from a
 * text prompt alone (no input image, no reference photograph, no third-party material; the prompt is kept per entry),
 * reviewed as a contact sheet, cropped to its reviewed box (`crop`, which drops the bars the generator left around a
 * portrait composition), cut to the catalog card's 4:5 and written as WebP by the session 43 derivation script.
 * Licence basis: the one the harness samples already record for generated art (`own-work`, provenance `generated`,
 * author Invitesion, no attribution required). The 1024 px originals are not kept in the repository; `sourceSha256`,
 * the prompt and the crop trace every derivative back to its original.
 *
 * Coverage (session 43): the marble, gold and night pools, which serve 26 of the 64 catalog templates. Every other
 * pool keeps its remote photos until its own assets ship (`REMOTE_THEME_ART_POOLS` names them). Template-owned art,
 * never invitation content (ADR-O01): host uploads and the protected `/media/` path are separate.
 *
 * Rollback: drop a pool's entries (or empty the array). `buildThemeArtRegistry([])` reproduces the pre-G-016 output
 * exactly, which `tests/g016-theme-art.test.ts` pins with a fingerprint of all 64 templates.
 */

export type ThemeArtFile = {
  /** Public path under `public/`, served same-origin. */
  path: string;
  width: number;
  height: number;
  bytes: number;
  sha256: string;
};

export type ThemeArtAsset = {
  id: string;
  pool: ThemeArtPoolKey;
  /** The generator prompt, verbatim. */
  prompt: string;
  /** SHA-256 of the generated original (1024 × 1024 PNG). */
  sourceSha256: string;
  /** The reviewed box `[left, top, right, bottom]` in the original, before the 4:5 cut. */
  crop: readonly [number, number, number, number];
  /** `cover` for the preview background, `card` for the catalog card, `gallery` for the preview gallery. */
  files: { cover: ThemeArtFile; card: ThemeArtFile; gallery: ThemeArtFile };
};

export const THEME_ART_PROVENANCE = {
  license: 'own-work',
  provenance: 'generated',
  author: 'Invitesion',
  attribution: 'none required',
  generator: 'v0 image tool, text prompt only (no input image)',
  created: '2026-11-10',
  derivation: 'crop to the reviewed box, centred 4:5 cut, Lanczos resize, WebP quality 78 method 6 (Pillow)',
  review: 'Agent self-review (ADR-O09) as contact sheets and on the catalog card; owner review pending',
} as const;

/** Widths of the derivatives (height = width × 5 / 4); a crop narrower than a width keeps its own width. */
export const THEME_ART_WIDTHS = { cover: 960, card: 480, gallery: 720 } as const;

export const THEME_ART_REGISTER = [
  {
    id: "gold-01",
    pool: "gold",
    prompt: "Draped champagne-gold silk fabric with soft flowing folds, warm studio light, elegant close-up textile photograph with calm smooth areas, portrait orientation. No objects, no people, no text, no logos.",
    sourceSha256: "c0f3ef36713c8bc1d6e15442662aa6b9e283289cddc863c5c163dd855d6e5eb1",
    crop: [183, 0, 841, 1024],
    files: {
      cover: { path: "/theme-art/gold-01-cover.webp", width: 658, height: 822, bytes: 21798, sha256: "aaa9a6c4f514d631fb13f3dd2d798012545f820870431dc848764226ac2c06cc" },
      card: { path: "/theme-art/gold-01-card.webp", width: 480, height: 600, bytes: 12704, sha256: "03784968152a1aff046f6e45dd3866cad845c6670d047e1466b2fdb21e9c31d6" },
      gallery: { path: "/theme-art/gold-01-cover.webp", width: 658, height: 822, bytes: 21798, sha256: "aaa9a6c4f514d631fb13f3dd2d798012545f820870431dc848764226ac2c06cc" },
    },
  },
  {
    id: "gold-02",
    pool: "gold",
    prompt: "Brushed gold leaf panel with a subtle embossed fan and sunburst geometric pattern in the corners, warm low-key lighting, luxurious but quiet, calm center, portrait orientation, close-up texture photograph. No objects, no people, no text, no logos.",
    sourceSha256: "b95ed3098ace7014386c1ce1876d1ed0f63784d51a12aacb130413611bcc1cf3",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/gold-02-cover.webp", width: 819, height: 1023, bytes: 43212, sha256: "37e57d743ef8bde460d3d518fb158dc1d54cd11384f1df64fe3506acbbcb6487" },
      card: { path: "/theme-art/gold-02-card.webp", width: 480, height: 600, bytes: 18026, sha256: "be0eae79e8a8c180ec1b0e42502cc2e65ff92b8bf9298b1de92a59acbc59bfa0" },
      gallery: { path: "/theme-art/gold-02-gallery.webp", width: 720, height: 900, bytes: 34910, sha256: "94aff340aa9e95d25974cc735d917ad4292b839bfddba872446355fc6fc0952c" },
    },
  },
  {
    id: "gold-03",
    pool: "gold",
    prompt: "Softly crumpled warm gold foil texture with gentle glints, shallow depth of field so most of it is a smooth soft blur, abstract close-up, portrait orientation. No objects, no people, no text, no logos.",
    sourceSha256: "5790bcb9e2f1e1f9ab02059b06c6bc6b5f35d0600fe92752f4207ff02ee401db",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/gold-03-cover.webp", width: 819, height: 1023, bytes: 19734, sha256: "44489c290bf067faf86ab9b1ac95eb1db3f32ea89bef4e84e5f7504e47a763ee" },
      card: { path: "/theme-art/gold-03-card.webp", width: 480, height: 600, bytes: 10320, sha256: "65bc3e9eb731b02fed57995a633eed83f267dc939ccbaf2b97cdf793455a037c" },
      gallery: { path: "/theme-art/gold-03-gallery.webp", width: 720, height: 900, bytes: 16808, sha256: "29e369bdd0b75987c4d9228f113221af936c4aa20da9c3dae0727216c7d647b6" },
    },
  },
  {
    id: "gold-04",
    pool: "gold",
    prompt: "Deep dark velvet backdrop with a soft scatter of small warm golden bokeh lights drifting across the upper part, elegant evening mood, calm dark lower half, portrait orientation, photograph. No objects, no people, no text, no logos.",
    sourceSha256: "5fddcd4cf2a3c40831929bd110666b75162593616afb70700745135717b7d220",
    crop: [183, 0, 841, 1024],
    files: {
      cover: { path: "/theme-art/gold-04-cover.webp", width: 658, height: 822, bytes: 12478, sha256: "c070274a391edfc671133700e27e714967e96d651a1a33eeb1b57c34b2223c81" },
      card: { path: "/theme-art/gold-04-card.webp", width: 480, height: 600, bytes: 8638, sha256: "1c5d714469686e6e3f94756ac430150e192f41c5286f0219e802faf314dd7119" },
      gallery: { path: "/theme-art/gold-04-cover.webp", width: 658, height: 822, bytes: 12478, sha256: "c070274a391edfc671133700e27e714967e96d651a1a33eeb1b57c34b2223c81" },
    },
  },
  {
    id: "gold-05",
    pool: "gold",
    prompt: "Gold thread embroidery of a simple repeating geometric lattice on deep navy fabric, soft raking side light showing the stitch texture, close-up textile photograph, portrait orientation. No objects, no people, no text, no logos.",
    sourceSha256: "90f5d7d15b64e8eccfbd6b808dd9b9b254ae2155aaff42283644581c8b515755",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/gold-05-cover.webp", width: 819, height: 1023, bytes: 87194, sha256: "97e20f2e3ecd550ead19a91d20e9812d82a9ad669e5530f4f66ed80725146803" },
      card: { path: "/theme-art/gold-05-card.webp", width: 480, height: 600, bytes: 44946, sha256: "db87519d441992b7a79872ef8071c09623e70db1409e4dba437fc74e3aedbc89" },
      gallery: { path: "/theme-art/gold-05-gallery.webp", width: 720, height: 900, bytes: 73744, sha256: "08ded93ddc261f30a1719a78f7d1f34c5f701373b4e84d4e3eb93239b5211894" },
    },
  },
  {
    id: "marble-01",
    pool: "marble",
    prompt: "Close-up photograph of a polished white marble surface with soft grey veins running diagonally from the top left corner, even diffuse daylight, calm and mostly empty center, fine natural stone texture, portrait orientation. No objects, no people, no text, no logos.",
    sourceSha256: "e631789ffca72a5be603722952aa1264a51ce1f7f797818292b1e89b86fd8893",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/marble-01-cover.webp", width: 819, height: 1023, bytes: 9048, sha256: "e9002793b0ff949a79bddb63b227cd3c713d81ba62fbdc61a058fc3f16cf234a" },
      card: { path: "/theme-art/marble-01-card.webp", width: 480, height: 600, bytes: 4102, sha256: "6cf3ad25e185bd4e7934c4a8a131cd8b546caa908b31666e1bab18131e20300f" },
      gallery: { path: "/theme-art/marble-01-gallery.webp", width: 720, height: 900, bytes: 7424, sha256: "389b4c518d6205f9cbd833fe88b891d53eca180b1dc8bba5e70fadeeda5b7fef" },
    },
  },
  {
    id: "marble-02",
    pool: "marble",
    prompt: "White marble slab with fine warm grey and faint gold veining near the edges, soft window light falling from the left, minimal composition with a wide quiet area in the middle, portrait orientation, architectural interior detail photograph. No objects, no people, no text, no logos.",
    sourceSha256: "91062190013dfe3892ae487eeb25fc928d2bef304cac29000ed629175877ee69",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/marble-02-cover.webp", width: 819, height: 1023, bytes: 9686, sha256: "0ffcda8b100db1706294f402e8b292490d246d316eab56f8ce3c1f014eaa7499" },
      card: { path: "/theme-art/marble-02-card.webp", width: 480, height: 600, bytes: 4288, sha256: "25e7dd0239e22856e76c6b529a61a1b39db6e3bb68fdd674ccc58381d6053e81" },
      gallery: { path: "/theme-art/marble-02-gallery.webp", width: 720, height: 900, bytes: 7934, sha256: "e05f3c02d5873541dce168ab31329fdc894cf7e9af7f2f5a81984bc45a9234f5" },
    },
  },
  {
    id: "marble-03",
    pool: "marble",
    prompt: "A smooth white plaster and marble wall with the soft shadow of a rounded arch cast across it by late afternoon sun, minimal architectural photograph, gentle warm and cool tones, large calm empty area, portrait orientation. No people, no furniture, no text, no logos.",
    sourceSha256: "64acdd2eca29c7e50f1b6fc73969ca4f3eed9327d1af3d0a22efb99393917173",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/marble-03-cover.webp", width: 819, height: 1023, bytes: 8206, sha256: "a2061aa9c1d8398ed13dd5d68a89240286315e76200359dd75c8279a52b609c0" },
      card: { path: "/theme-art/marble-03-card.webp", width: 480, height: 600, bytes: 3594, sha256: "82c0eff4e2fa844f14a6cb19ba986e544a94443b7669edf5548eb545ed7c67e9" },
      gallery: { path: "/theme-art/marble-03-gallery.webp", width: 720, height: 900, bytes: 6692, sha256: "560c45c1237ec8a7473ade366f243ba5fd960ca83051a28c39a2f8af485e45b1" },
    },
  },
  {
    id: "marble-04",
    pool: "marble",
    prompt: "Pale beige travertine stone wall with subtle horizontal layers and small natural pores, soft morning light grazing the surface, minimal and calm, portrait orientation, close architectural texture photograph. No people, no objects, no text, no logos.",
    sourceSha256: "d378593aee5d21d3086552702d914184ebff19e09d646e330c049a9138cf587a",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/marble-04-cover.webp", width: 819, height: 1023, bytes: 84426, sha256: "ddfc074571e01374f53f6b6ca413215576b86969823fca2608823716192dfe11" },
      card: { path: "/theme-art/marble-04-card.webp", width: 480, height: 600, bytes: 31296, sha256: "c47a750f4d944080ecca705ebb815473c1b00f49409bed6238513d7aea25a3e9" },
      gallery: { path: "/theme-art/marble-04-gallery.webp", width: 720, height: 900, bytes: 67178, sha256: "f704c218072f6805ab5a53bededac8b9988e3a0142d955bb3dcf6fc6edf28683" },
    },
  },
  {
    id: "marble-05",
    pool: "marble",
    prompt: "Two low white marble steps at the foot of a plain smooth stone wall, soft daylight from above, quiet minimal architectural photograph with a large empty wall area in the upper two thirds, neutral cream and grey tones, portrait orientation. No people, no plants, no text, no logos.",
    sourceSha256: "20f86654a37e36180a2d724055f1d311a77400e8a6ece964399375885815bb2c",
    crop: [183, 0, 841, 1024],
    files: {
      cover: { path: "/theme-art/marble-05-cover.webp", width: 658, height: 822, bytes: 7390, sha256: "ba558f1f8af93c957a1a6def06e1dd5547fee50f2f2a78902666f8b62b518030" },
      card: { path: "/theme-art/marble-05-card.webp", width: 480, height: 600, bytes: 4194, sha256: "ab40d1dde6ed5f5649b7fa028072032b53fbc5791c5e050d4025caf431c0ee62" },
      gallery: { path: "/theme-art/marble-05-cover.webp", width: 658, height: 822, bytes: 7390, sha256: "ba558f1f8af93c957a1a6def06e1dd5547fee50f2f2a78902666f8b62b518030" },
    },
  },
  {
    id: "marble-06",
    pool: "marble",
    prompt: "Macro photograph of smooth white marble with soft blue-grey veins and a faint warm reflection of light, shallow depth of field so the far part softly blurs, calm and elegant, portrait orientation. No objects, no people, no text, no logos.",
    sourceSha256: "16f23fee94ed0dd9010c880f8e2e9f86d2940db0107cab825e55ab8a43bb081a",
    crop: [0, 0, 1024, 1024],
    files: {
      cover: { path: "/theme-art/marble-06-cover.webp", width: 819, height: 1023, bytes: 11190, sha256: "8a3f9a67803dff74bbc66f12b254a228db59cd8057d23c45dc8bd7032b79afc7" },
      card: { path: "/theme-art/marble-06-card.webp", width: 480, height: 600, bytes: 5494, sha256: "834d188dee2128e798ba3449de23be2c3df50c615cb1e5eb41893b5ac2b2d206" },
      gallery: { path: "/theme-art/marble-06-gallery.webp", width: 720, height: 900, bytes: 9392, sha256: "f3224e86049f997f5c0d59d7aacd8686d843c971cca5804ffa984481da8ce775" },
    },
  },
  {
    id: "night-01",
    pool: "night",
    prompt: "Full moon low over a calm sea at night, a soft path of moonlight on the water, deep blue sky with faint stars, long exposure, minimal and serene, portrait orientation, landscape photograph. No people, no boats, no buildings, no text, no logos.",
    sourceSha256: "68b56e7162dc4cdde755de6b74b852e046a02a99869c8683f1187ba0584a0f83",
    crop: [212, 0, 812, 965],
    files: {
      cover: { path: "/theme-art/night-01-cover.webp", width: 600, height: 750, bytes: 7372, sha256: "9991a818f6d53254225bcd0bbb460f567e112c0acbad0d332b3ef7f9b44c3bd4" },
      card: { path: "/theme-art/night-01-card.webp", width: 480, height: 600, bytes: 4952, sha256: "3ba3173ee1d881433c30674c48d7848d7fd04a62a3d723649b6347a67adffb1b" },
      gallery: { path: "/theme-art/night-01-cover.webp", width: 600, height: 750, bytes: 7372, sha256: "9991a818f6d53254225bcd0bbb460f567e112c0acbad0d332b3ef7f9b44c3bd4" },
    },
  },
  {
    id: "night-02",
    pool: "night",
    prompt: "Thin crescent moon in a clear deep indigo night sky with softly scattered stars, the dark silhouettes of palm fronds along the bottom edge, quiet and calm, portrait orientation, photograph. No people, no buildings, no text, no logos.",
    sourceSha256: "14e1ce5539c42386105184bdc656f9ea11653ad65eab96f23dc9b3081c948286",
    crop: [183, 0, 841, 1024],
    files: {
      cover: { path: "/theme-art/night-02-cover.webp", width: 658, height: 822, bytes: 25392, sha256: "aac32c32fbbac916e77880480d27234d9ac0ff0fdae442ab82cd36cde9262de6" },
      card: { path: "/theme-art/night-02-card.webp", width: 480, height: 600, bytes: 14306, sha256: "e6c3b47f3ed6506201543cc0be4a31494f3776ce3a111beb1a10afb1c1e7c8d5" },
      gallery: { path: "/theme-art/night-02-cover.webp", width: 658, height: 822, bytes: 25392, sha256: "aac32c32fbbac916e77880480d27234d9ac0ff0fdae442ab82cd36cde9262de6" },
    },
  },
  {
    id: "night-03",
    pool: "night",
    prompt: "Starry night sky over gentle dark rolling hills, a faint soft band of the Milky Way, deep blue and violet-black tones, calm, portrait orientation, astrophotography. No people, no buildings, no roads, no text, no logos.",
    sourceSha256: "ce8f8136645c54abf181abf81d3f2e20cae8f636712d191893bfc8da3efcbb61",
    crop: [183, 0, 841, 1024],
    files: {
      cover: { path: "/theme-art/night-03-cover.webp", width: 658, height: 822, bytes: 44822, sha256: "c2c4386daa3f13b1625e8f62143d5a4f5fe62a3cf36ca9a4d8aa12a8ae504603" },
      card: { path: "/theme-art/night-03-card.webp", width: 480, height: 600, bytes: 22648, sha256: "53754bef5485a557c0ca903c3aec5aca522b7f080b55a5c4df765f15aeb85a4f" },
      gallery: { path: "/theme-art/night-03-cover.webp", width: 658, height: 822, bytes: 44822, sha256: "c2c4386daa3f13b1625e8f62143d5a4f5fe62a3cf36ca9a4d8aa12a8ae504603" },
    },
  },
] as const satisfies readonly ThemeArtAsset[];

/** A harness manifest asset (`tools/template-harness/schema.ts`), one per distinct file. */
export type ThemeArtManifestAsset = {
  id: string;
  path: string;
  kind: 'image';
  bytes: number;
  width: number;
  height: number;
  license: string;
  source: string;
  author: string;
  provenance: 'generated';
  deferred: false;
};

/**
 * The register in the harness's asset shape, so a catalog manifest (G-062) can declare these files like any template
 * asset. A gallery file identical to its cover is listed once.
 */
export function themeArtManifestAssets(register: readonly ThemeArtAsset[] = THEME_ART_REGISTER): ThemeArtManifestAsset[] {
  const seen = new Set<string>();
  const assets: ThemeArtManifestAsset[] = [];
  for (const entry of register) {
    for (const kind of ['cover', 'card', 'gallery'] as const) {
      const file = entry.files[kind];
      if (seen.has(file.path)) continue;
      seen.add(file.path);
      assets.push({
        id: `${entry.id}-${kind}`,
        path: `public${file.path}`,
        kind: 'image',
        bytes: file.bytes,
        width: file.width,
        height: file.height,
        license: THEME_ART_PROVENANCE.license,
        source: `Generated for this repository (${THEME_ART_PROVENANCE.generator}, ${THEME_ART_PROVENANCE.created}; prompt: ${entry.prompt}), ${THEME_ART_PROVENANCE.derivation}`,
        author: THEME_ART_PROVENANCE.author,
        provenance: THEME_ART_PROVENANCE.provenance,
        deferred: false,
      });
    }
  }
  return assets;
}
