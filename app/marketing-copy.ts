import type { Locale } from '@/lib/i18n';

export const marketingCopy = {
  id: {
    // ── Hero ──────────────────────────────────────────────────────────────────
    heroPill: 'Untuk pasangan, keluarga & penyelenggara acara di Indonesia',
    heroTitleBefore: '',
    heroTitleMark: 'Undangan pernikahan',
    heroTitleAfter: ' yang terasa hidup.',
    heroBody:
      'Pilih tema, tulis cerita kalian, sebar ke WhatsApp — dan pantau siapa yang hadir secara real-time. Semua dari satu tempat, tanpa ribet.',
    heroPrimary: 'Buat undangan gratis',
    heroSecondary: 'Lihat cara kerja',
    heroNote: 'Tanpa kartu kredit · Siap dalam hitungan menit',

    // ── Trust bar (jujur, bukan logo palsu) ───────────────────────────────────
    trustBarItems: [
      { icon: '🇮🇩', text: 'Dibuat di Indonesia' },
      { icon: '💳', text: 'Bayar sekali per undangan' },
      { icon: '📅', text: 'Aktif 12 bulan penuh' },
    ],

    // ── Intro ─────────────────────────────────────────────────────────────────
    introEyebrow: 'PLATFORM UNDANGAN',
    introTitle: 'Dari undangan pertama sampai tamu pulang.',
    introBody:
      'Invitesion bukan sekadar halaman undangan. Ini ruang kerja untuk membuat momen kalian terasa lebih terencana, lebih personal, dan lebih mudah dikelola.',

    // ── Features (hanya fitur yang benar-benar ada) ───────────────────────────
    featureLink: 'Pelajari fitur',
    features: [
      {
        title: 'Halaman Undangan',
        text: 'Pilih tema premium, tulis cerita kalian, tambah agenda, lokasi, galeri foto, dan countdown hari-H.',
      },
      {
        title: 'RSVP & Form Tamu',
        text: 'Kumpulkan konfirmasi kehadiran, plus-one, dan pertanyaan khusus dalam satu alur yang rapi.',
      },
      {
        title: 'Manajemen Tamu',
        text: 'Kelola daftar tamu, lihat status RSVP, dan kirim tautan personal via WhatsApp ke setiap tamu.',
      },
      {
        title: 'Tema Premium',
        text: 'Koleksi tema pernikahan eksklusif — Romantis, Minimalis, Modern, hingga Tradisional.',
      },
    ],

    // ── Guest experience ──────────────────────────────────────────────────────
    guestEyebrow: 'PENGALAMAN TAMU',
    guestTitle: 'Semudah membuka tautan. Senyaman memberi kabar.',
    guestBody:
      'Tamu tidak perlu membuat akun. Mereka cukup membuka tautan personal, mengisi respons, dan semua jawabannya langsung masuk ke dashboard kalian.',
    guestPoints: [
      'Tautan unik untuk setiap tamu',
      'RSVP, plus-one & pesan untuk pasangan',
      'Sebar langsung via WhatsApp',
    ],
    guestCta: 'Buat undangan pertama',

    // ── Pricing ───────────────────────────────────────────────────────────────
    pricingEyebrow: 'HARGA INVITESION',
    pricingTitle: 'Bayar sekali. Aktif 12 bulan.',
    pricingBody:
      'Tidak ada langganan bulanan. Pilih tema yang paling cocok, bayar satu kali, dan undangan kalian aktif selama satu tahun penuh.',
    pricingBadge: 'GRATIS',
    pricingPlan: 'Mulai tanpa biaya',
    pricingPlanBody:
      'Semua yang dibutuhkan untuk membuat halaman undangan dan mengelola respons tamu.',
    pricingIncluded: [
      'Halaman undangan personal',
      'RSVP dan daftar tamu',
      'Agenda, lokasi & galeri',
      'Tautan tamu yang bisa dibagikan',
    ],
    pricingCta: 'Coba gratis',
    pricingNote:
      'Untuk kebutuhan acara khusus, hubungi tim Invitesion setelah event kalian dibuat.',

    // Pricing tiers (real prices)
    tierStandardLabel: 'STANDARD',
    tierStandardPrice: 'Rp149.000',
    tierStandardPer: 'per undangan · aktif 12 bulan',
    tierStandardDesc: 'Satu tema pilihan, lengkap dengan semua fitur inti.',
    tierStandardItems: [
      'Semua fitur gratis',
      '1 tema premium pilihan',
      'Musik latar & animasi masuk',
      'Galeri foto & video',
      'Amplop digital (ucapan & hadiah)',
    ],
    tierPremiumLabel: 'PREMIUM',
    tierPremiumPrice: 'Rp299.000',
    tierPremiumPer: 'per undangan · aktif 12 bulan',
    tierPremiumDesc: 'Akses semua tema + ganti tema kapan saja.',
    tierPremiumItems: [
      'Semua fitur Standard',
      'Akses semua tema premium',
      'Ganti tema kapan saja',
      'Love story & sesi acara',
      'Prioritas dukungan',
    ],
    tierCta: 'Mulai sekarang',
    tierCtaFree: 'Coba gratis dulu',

    // ── Roadmap ───────────────────────────────────────────────────────────────
    roadmapEyebrow: 'DAN TERUS BERKEMBANG',
    roadmapTitle: 'Semakin lengkap, tanpa kehilangan kesederhanaannya.',
    roadmapBody:
      'Fitur berikutnya sedang disiapkan untuk membantu lebih banyak bagian dari hari istimewa kalian.',
    roadmapItems: [
      'WhatsApp blast reminder',
      'Seating chart drag-and-drop',
      'QR check-in tamu',
      'Analytics & export tamu',
      'Multi-event workspace',
      'Amplop & kado cashless',
    ],
    roadmapSoon: 'Segera hadir',

    // ── CTA ───────────────────────────────────────────────────────────────────
    ctaTitle: 'Hari istimewa kalian layak dirayakan dengan indah.',
    ctaBody: 'Mulai gratis. Upgrade ke tema premium kapan pun kalian siap.',
    ctaButton: 'Buat undangan gratis',

    // ── Footer ────────────────────────────────────────────────────────────────
    footerTagline: 'Undangan digital yang membantu kabar baik sampai dengan baik.',
    footerProduct: 'Produk',
    footerFeatures: 'Fitur',
    footerHow: 'Cara kerja',
    footerPricing: 'Harga',
    footerSignIn: 'Masuk',
    footerContact: 'Kontak',
    footerPrivacy: 'Kebijakan Privasi',

    // ── Product preview (hero visual) ─────────────────────────────────────────
    previewBrief: 'UNDANGAN · 2026',
    previewDate: 'SABTU, 18 OKTOBER',
    previewTitle: ['Nadya', '& Arga'],
    previewBody: 'Dengan penuh syukur, kami mengundang kehadiran Bapak/Ibu/Saudara/i di hari bahagia kami.',
    previewTime: 'WAKTU',
    previewPlace: 'TEMPAT',
    previewRsvp: 'RSVP',
    previewRsvpValue: '84 terkonfirmasi',
    previewSteps: ['Undangan', 'RSVP', 'Hari-H'],
    previewTag: 'Live · Semua tersambung',
    previewAria: 'Pratinjau undangan digital Invitesion',
    phoneWedding: 'THE WEDDING OF',
    phoneConfirm: 'Konfirmasi kehadiran',
    phoneQuestion: 'Apakah kamu bisa hadir?',
    phoneYes: 'Ya, saya hadir ✓',
    phoneNo: 'Maaf, belum bisa',
    phoneSaved: 'RSVP tersimpan',
  },

  en: {
    heroPill: 'For couples, families & event organisers',
    heroTitleBefore: '',
    heroTitleMark: 'Wedding invitations',
    heroTitleAfter: ' that feel alive.',
    heroBody:
      'Pick a theme, write your story, share to WhatsApp — and watch RSVPs come in real time. All from one place, without the hassle.',
    heroPrimary: 'Create free invitation',
    heroSecondary: 'See how it works',
    heroNote: 'No credit card · Ready in minutes',
    trustBarItems: [
      { icon: '🇮🇩', text: 'Made in Indonesia' },
      { icon: '💳', text: 'One-time payment per invitation' },
      { icon: '📅', text: 'Active for 12 full months' },
    ],
    introEyebrow: 'INVITATION PLATFORM',
    introTitle: 'From the first invitation to the last guest home.',
    introBody:
      'Invitesion is more than an invitation page. It is a workspace that makes your event feel better planned, more personal, and easier to manage.',
    featureLink: 'Explore feature',
    features: [
      {
        title: 'Invitation Page',
        text: 'Choose a premium theme, write your story, add schedule, venue, photo gallery, and a countdown to the big day.',
      },
      {
        title: 'RSVP & Guest Forms',
        text: 'Collect confirmations, plus-ones, and custom questions in one clean flow.',
      },
      {
        title: 'Guest Management',
        text: 'Manage your guest list, track RSVP status, and send personal WhatsApp links to each guest.',
      },
      {
        title: 'Premium Themes',
        text: 'An exclusive collection of wedding themes — Romantic, Minimalist, Modern, and Traditional.',
      },
    ],
    guestEyebrow: 'GUEST EXPERIENCE',
    guestTitle: 'As easy as opening a link. As comfortable as replying.',
    guestBody:
      'Guests never need an account. They open their personal link, fill in their response, and every answer lands straight in your dashboard.',
    guestPoints: [
      'Unique link for every guest',
      'RSVP, plus-ones & a message for the couple',
      'Share directly via WhatsApp',
    ],
    guestCta: 'Create your first invitation',
    pricingEyebrow: 'INVITESION PRICING',
    pricingTitle: 'Pay once. Active for 12 months.',
    pricingBody:
      'No monthly subscription. Pick the theme that fits, pay once, and your invitation stays live for a full year.',
    pricingBadge: 'FREE',
    pricingPlan: 'Start at no cost',
    pricingPlanBody: 'Everything you need to set up an invitation page and manage guest responses.',
    pricingIncluded: [
      'Personal invitation page',
      'RSVP and guest list',
      'Schedule, venue & gallery',
      'Shareable guest links',
    ],
    pricingCta: 'Try it free',
    pricingNote: 'For specialised event needs, talk to the Invitesion team once your event is created.',
    tierStandardLabel: 'STANDARD',
    tierStandardPrice: 'IDR 149,000',
    tierStandardPer: 'per invitation · active 12 months',
    tierStandardDesc: 'One chosen theme, full feature set.',
    tierStandardItems: [
      'All free features',
      '1 premium theme of your choice',
      'Background music & entrance animation',
      'Photo & video gallery',
      'Digital envelope (wishes & gifts)',
    ],
    tierPremiumLabel: 'PREMIUM',
    tierPremiumPrice: 'IDR 299,000',
    tierPremiumPer: 'per invitation · active 12 months',
    tierPremiumDesc: 'All themes unlocked + switch anytime.',
    tierPremiumItems: [
      'All Standard features',
      'Access to all premium themes',
      'Switch themes anytime',
      'Love story & event sessions',
      'Priority support',
    ],
    tierCta: 'Get started',
    tierCtaFree: 'Try free first',
    roadmapEyebrow: 'AND STILL GROWING',
    roadmapTitle: 'More complete, without losing its simplicity.',
    roadmapBody: 'The next features are on their way to help with even more of your special day.',
    roadmapItems: [
      'WhatsApp blast reminders',
      'Drag-and-drop seating chart',
      'Guest QR check-in',
      'Analytics & guest export',
      'Multi-event workspace',
      'Cashless envelope & gifts',
    ],
    roadmapSoon: 'Coming soon',
    ctaTitle: 'Your special day deserves to be celebrated beautifully.',
    ctaBody: 'Start free. Upgrade to a premium theme whenever you are ready.',
    ctaButton: 'Create free invitation',
    footerTagline: 'The invitation platform that helps good news arrive well.',
    footerProduct: 'Product',
    footerFeatures: 'Features',
    footerHow: 'How it works',
    footerPricing: 'Pricing',
    footerSignIn: 'Sign in',
    footerContact: 'Contact',
    footerPrivacy: 'Privacy Policy',
    previewBrief: 'INVITATION · 2026',
    previewDate: 'SATURDAY, 18 OCTOBER',
    previewTitle: ['Nadya', '& Arga'],
    previewBody: 'With gratitude, we invite you to share in our joy on our wedding day.',
    previewTime: 'TIME',
    previewPlace: 'VENUE',
    previewRsvp: 'RSVP',
    previewRsvpValue: '84 confirmed',
    previewSteps: ['Invitation', 'RSVP', 'Wedding day'],
    previewTag: 'Live · Everything connected',
    previewAria: 'Invitesion digital invitation preview',
    phoneWedding: 'THE WEDDING OF',
    phoneConfirm: 'Confirm attendance',
    phoneQuestion: 'Can you make it?',
    phoneYes: 'Yes, I will be there ✓',
    phoneNo: 'Sorry, I cannot',
    phoneSaved: 'RSVP saved',
  },
} as const satisfies Record<Locale, unknown>;

export function getMarketingCopy(locale: Locale) {
  return marketingCopy[locale];
}
