export type MarketingCategory = 'event-types' | 'features' | 'resources';
export type MarketingHighlight = { title: string; text: string };
export type MarketingPage = {
  title: string;
  slug: string;
  eyebrow: string;
  summary: string;
  highlights: readonly MarketingHighlight[];
};

/**
 * Category-level fallbacks. Only the long-tail pages that have no hand-written
 * copy below use these; every page reachable from the navbar has its own copy.
 */
const fallbacks: Record<MarketingCategory, { eyebrow: string; summary: string; highlights: readonly MarketingHighlight[] }> = {
  'event-types': {
    eyebrow: 'JENIS ACARA',
    summary: 'Rancang alur undangan, registrasi, komunikasi, dan pengalaman tamu yang sesuai dengan karakter acara ini.',
    highlights: [
      { title: 'Registrasi yang fleksibel', text: 'Bentuk formulir RSVP mengikuti kebutuhan acara — kehadiran, pendamping, hingga pertanyaan khusus.' },
      { title: 'Komunikasi tamu terarah', text: 'Sebar tautan personal via WhatsApp atau email sehingga setiap tamu menerima informasi yang relevan.' },
      { title: 'Insight kehadiran real-time', text: 'Pantau siapa yang sudah membuka undangan dan mengonfirmasi kehadiran langsung dari dashboard.' },
    ],
  },
  features: {
    eyebrow: 'FITUR INVITESION',
    summary: 'Satukan pekerjaan tim dan perjalanan tamu dalam satu workspace acara yang rapi dan mudah digunakan.',
    highlights: [
      { title: 'Konfigurasi sesuai kebutuhan', text: 'Aktifkan hanya bagian yang acara kamu perlukan, tanpa fitur yang mengganggu.' },
      { title: 'Data acara terpusat', text: 'Tamu, konfirmasi, dan komunikasi tersimpan dalam satu tempat, bukan tersebar di banyak aplikasi.' },
      { title: 'Pengalaman tamu konsisten', text: 'Dari undangan sampai hari-H, tamu merasakan alur yang mulus dan profesional.' },
    ],
  },
  resources: {
    eyebrow: 'RESOURCE & COMPANY',
    summary: 'Temukan panduan, dukungan, kepercayaan, dan informasi perusahaan untuk menjalankan acara dengan tenang.',
    highlights: [
      { title: 'Panduan praktis', text: 'Langkah-langkah jelas untuk memaksimalkan setiap fitur Invitesion.' },
      { title: 'Dukungan yang mudah dijangkau', text: 'Tim kami siap membantu lewat email dan WhatsApp saat kamu membutuhkannya.' },
      { title: 'Informasi transparan', text: 'Kebijakan, harga, dan keamanan data dijelaskan terbuka tanpa jargon.' },
    ],
  },
};

/**
 * Hand-written copy per slug. Every page linked from the navbar and footer
 * must have an entry here so no two categories read the same.
 */
const handWritten: Record<string, { summary: string; highlights: readonly MarketingHighlight[] }> = {
  // ── Event types ──────────────────────────────────────────────────────
  weddings: {
    summary: 'Undangan pernikahan digital yang elegan: love story, galeri prewedding, detail akad dan resepsi, RSVP plus-one, sampai amplop digital — semua dalam satu tautan personal.',
    highlights: [
      { title: 'Love story & galeri prewedding', text: 'Ceritakan perjalanan kalian lewat timeline, foto, dan video yang tampil mengikuti tema premium pilihan.' },
      { title: 'RSVP dengan plus-one', text: 'Tamu mengonfirmasi kehadiran dan jumlah pendamping lewat tautan pribadinya, hasilnya langsung masuk dashboard.' },
      { title: 'Amplop digital & ucapan', text: 'Terima doa, ucapan, dan hadiah cashless langsung dari halaman undangan tanpa repot mencatat manual.' },
    ],
  },
  'wedding-anniversaries': {
    summary: 'Rayakan tahun-tahun kebersamaan dengan undangan yang hangat — galeri kenangan, agenda syukuran, dan konfirmasi kehadiran keluarga serta sahabat.',
    highlights: [
      { title: 'Galeri kenangan', text: 'Tampilkan foto perjalanan pernikahan dari tahun ke tahun sebagai cerita pembuka undangan.' },
      { title: 'Acara intim, daftar tamu rapi', text: 'Undang keluarga dan sahabat terdekat dengan tautan personal dan daftar tamu yang terkontrol.' },
      { title: 'Konfirmasi tanpa ribet', text: 'Cukup satu klik bagi tamu untuk memberi kabar hadir, hasilnya terlihat real-time.' },
    ],
  },
  'bridal-showers': {
    summary: 'Kejutan manis sebelum hari-H: undangan bridal shower dengan tema playful, privasi terjaga, dan koordinasi panitia yang gampang.',
    highlights: [
      { title: 'Tema playful & feminin', text: 'Pilih tampilan ceria yang cocok untuk pesta lajang, lengkap dengan hitung mundur menuju acara.' },
      { title: 'Privasi terjaga', text: 'Halaman hanya bisa diakses lewat tautan undangan — aman untuk acara kejutan.' },
      { title: 'Koordinasi panitia mudah', text: 'Pantau siapa yang sudah konfirmasi supaya games dan konsumsi bisa disiapkan pas.' },
    ],
  },
  birthdays: {
    summary: 'Dari ulang tahun anak sampai pesta dewasa — undangan digital dengan hitung mundur, lokasi, dan RSVP yang gampang diisi siapa pun.',
    highlights: [
      { title: 'Tema untuk segala usia', text: 'Koleksi tema ceria untuk anak hingga elegan untuk perayaan dewasa.' },
      { title: 'Hitung mundur hari-H', text: 'Bangun antusiasme tamu dengan countdown otomatis di halaman undangan.' },
      { title: 'RSVP super sederhana', text: 'Orang tua atau teman cukup membuka tautan dan menekan satu tombol untuk konfirmasi.' },
    ],
  },
  'aqiqah-and-khitanan': {
    summary: 'Sampaikan kabar bahagia keluarga dengan undangan bernuansa islami — informasi acara, doa, dan konfirmasi kehadiran keluarga besar dalam satu halaman.',
    highlights: [
      { title: 'Nuansa islami yang khidmat', text: 'Tema dengan kaligrafi dan ornamen yang sesuai untuk momen aqiqah dan khitanan.' },
      { title: 'Informasi lengkap untuk keluarga', text: 'Cantumkan waktu, lokasi, dan susunan acara agar keluarga besar tidak salah jadwal.' },
      { title: 'Konfirmasi lintas generasi', text: 'Tautan cukup dibuka dari WhatsApp — mudah bahkan untuk anggota keluarga yang jarang pakai aplikasi.' },
    ],
  },
  'baby-showers': {
    summary: 'Umumkan kedatangan si kecil dengan halaman yang menggemaskan — cerita singkat, galeri, dan RSVP untuk orang-orang terdekat.',
    highlights: [
      { title: 'Pengumuman yang personal', text: 'Tulis cerita menanti si kecil dan tampilkan foto maternity dengan tema lembut.' },
      { title: 'Daftar tamu terdekat', text: 'Acara kecil tetap butuh kepastian — lihat siapa saja yang datang sebelum hari-H.' },
      { title: 'Bagikan sekali klik', text: 'Kirim tautan lewat WhatsApp ke grup keluarga dan sahabat tanpa cetak apa pun.' },
    ],
  },
  reunions: {
    summary: 'Kumpulkan kembali teman lama: sebar satu tautan ke grup alumni, data kehadiran lintas kota terkumpul sendiri, lengkap dengan iuran acara.',
    highlights: [
      { title: 'Satu tautan untuk semua alumni', text: 'Bagikan ke grup WhatsApp angkatan dan biarkan setiap orang mengisi kehadirannya sendiri.' },
      { title: 'Data hadir lintas kota', text: 'Lihat siapa datang dari mana untuk mengatur rundown dan konsumsi dengan tepat.' },
      { title: 'Iuran & pembayaran', text: 'Kumpulkan kontribusi acara langsung dari halaman undangan, tercatat otomatis.' },
    ],
  },
  graduations: {
    summary: 'Rayakan kelulusan dengan halaman yang membanggakan — momen perjalanan studi, detail seremoni, dan undangan untuk keluarga serta sahabat.',
    highlights: [
      { title: 'Cerita perjalanan studi', text: 'Tampilkan galeri dari hari pertama sampai sidang sebagai pembuka undangan wisuda.' },
      { title: 'Detail acara yang jelas', text: 'Waktu seremoni, lokasi, dan dress code tersampaikan rapi ke semua tamu.' },
      { title: 'Undang tanpa batas jarak', text: 'Keluarga di luar kota tetap bisa memberi ucapan langsung dari halaman.' },
    ],
  },
  'holiday-gatherings': {
    summary: 'Halal bihalal, natal keluarga, atau kumpul akhir tahun — satu halaman untuk agenda, lokasi, dan konfirmasi cepat seluruh keluarga.',
    highlights: [
      { title: 'Cocok untuk semua perayaan', text: 'Tema hangat untuk halal bihalal, natal, tahun baru, hingga arisan keluarga.' },
      { title: 'Agenda & lokasi jelas', text: 'Peta dan susunan acara tersedia di satu tempat, tidak tenggelam di chat grup.' },
      { title: 'Konfirmasi kilat', text: 'Anggota keluarga cukup sekali klik untuk memberi kabar hadir atau berhalangan.' },
    ],
  },

  // ── Features ─────────────────────────────────────────────────────────
  'online-invitations': {
    summary: 'Buat undangan digital yang bisa dibuka di perangkat mana pun — pilih tema, isi detail acara, dan sebar dalam hitungan menit.',
    highlights: [
      { title: 'Tema premium siap pakai', text: 'Puluhan desain untuk pernikahan hingga acara komunitas, tinggal ganti isi.' },
      { title: 'Musik & animasi pembuka', text: 'Beri kesan pertama yang berkesan dengan animasi masuk dan musik latar.' },
      { title: 'Tautan personal per tamu', text: 'Setiap tamu menerima tautan dengan namanya sendiri — terasa diundang, bukan di-broadcast.' },
    ],
  },
  'event-website-builder': {
    summary: 'Susun halaman acara lengkap tanpa koding — agenda, lokasi, galeri, countdown, dan FAQ dalam satu situs kecil yang rapi.',
    highlights: [
      { title: 'Blok konten fleksibel', text: 'Aktifkan hanya bagian yang acara kamu butuhkan, dari love story sampai dress code.' },
      { title: 'Tampil sempurna di ponsel', text: 'Mayoritas tamu membuka lewat WhatsApp — semua tema dioptimalkan untuk layar kecil.' },
      { title: 'Perubahan langsung tayang', text: 'Ubah jam atau lokasi kapan saja, semua tamu otomatis melihat versi terbaru.' },
    ],
  },
  'multi-language': {
    summary: 'Tamu dari mana saja tetap paham — halaman undangan dan antarmuka tersedia dalam Bahasa Indonesia dan Inggris.',
    highlights: [
      { title: 'Deteksi bahasa otomatis', text: 'Halaman menyesuaikan bahasa perangkat tamu, tanpa perlu memilih manual.' },
      { title: 'Kontrol penuh di tangan kamu', text: 'Kunci salah satu bahasa bila ingin seluruh tamu melihat versi yang sama.' },
      { title: 'Konsisten di seluruh halaman', text: 'Dari undangan sampai form RSVP, tidak ada campuran dua bahasa di satu layar.' },
    ],
  },
  'online-rsvps': {
    summary: 'Kumpulkan kepastian hadir tanpa menagih satu-satu — tamu konfirmasi lewat tautannya, hasilnya masuk dashboard detik itu juga.',
    highlights: [
      { title: 'Form yang bisa diatur', text: 'Tanya jumlah pendamping, preferensi makanan, atau pertanyaan khusus lainnya.' },
      { title: 'Pengingat otomatis', text: 'Tamu yang belum menjawab bisa diingatkan tanpa membuat canggung.' },
      { title: 'Rekap real-time', text: 'Angka hadir, ragu, dan berhalangan selalu terkini untuk keputusan katering dan kursi.' },
    ],
  },
  'guest-list-management': {
    summary: 'Semua tamu dalam satu daftar yang hidup — status undangan, konfirmasi, dan catatan khusus tanpa spreadsheet berantakan.',
    highlights: [
      { title: 'Impor & kelompokkan tamu', text: 'Susun tamu per rombongan keluarga, kantor, atau komunitas agar mudah dipantau.' },
      { title: 'Status per tamu', text: 'Lihat siapa yang sudah membuka undangan, membalas, atau perlu di-follow-up.' },
      { title: 'Catatan & tag khusus', text: 'Tandai VIP, alergi makanan, atau kebutuhan khusus langsung di profil tamu.' },
    ],
  },
  'qr-code-rsvps': {
    summary: 'Setiap tamu mendapat QR unik untuk check-in di lokasi — antrean masuk cepat dan data kehadiran akurat.',
    highlights: [
      { title: 'QR unik per tamu', text: 'Kode dibuat otomatis dari daftar tamu dan tidak bisa dipakai dua kali.' },
      { title: 'Check-in hitungan detik', text: 'Pindai dari ponsel panitia mana pun, tanpa alat khusus.' },
      { title: 'Data hadir aktual', text: 'Bandingkan konfirmasi dengan kehadiran nyata untuk laporan pasca-acara.' },
    ],
  },
  'email-communications': {
    summary: 'Kirim pengumuman, pengingat, dan ucapan terima kasih yang selaras dengan tema undangan — langsung dari Invitesion.',
    highlights: [
      { title: 'Template selaras tema', text: 'Email mengikuti identitas visual undangan sehingga terasa satu rangkaian.' },
      { title: 'Kirim ke segmen tertentu', text: 'Sasar hanya tamu yang belum RSVP atau rombongan tertentu.' },
      { title: 'Terukur', text: 'Lihat email mana yang dibuka agar follow-up tepat sasaran.' },
    ],
  },
  'payment-processing': {
    summary: 'Terima pembayaran dan hadiah langsung dari halaman acara — amplop digital, iuran reuni, atau kontribusi lainnya.',
    highlights: [
      { title: 'Amplop digital', text: 'Tamu mengirim hadiah cashless dengan ucapan, tercatat otomatis atas nama pengirim.' },
      { title: 'Metode pembayaran lokal', text: 'Transfer bank dan e-wallet populer di Indonesia didukung.' },
      { title: 'Rekap dana transparan', text: 'Semua transaksi terkumpul dalam satu laporan yang mudah diunduh.' },
    ],
  },
  'analytics-and-reporting': {
    summary: 'Pahami perjalanan tamu dari undangan dibuka sampai hadir di lokasi — semua angka penting dalam satu dashboard.',
    highlights: [
      { title: 'Statistik pembukaan', text: 'Ketahui berapa tamu yang sudah melihat undangan dan kapan.' },
      { title: 'Funnel RSVP', text: 'Lihat di titik mana tamu berhenti agar bisa di-follow-up.' },
      { title: 'Ekspor sekali klik', text: 'Unduh data tamu dan kehadiran untuk laporan panitia.' },
    ],
  },

  // ── Resources ────────────────────────────────────────────────────────
  'help-center': {
    summary: 'Panduan langkah demi langkah untuk setiap fitur Invitesion — dari membuat undangan pertama sampai rekap pasca-acara.',
    highlights: [
      { title: 'Panduan memulai', text: 'Ikuti tutorial singkat untuk menerbitkan undangan pertamamu dalam hitungan menit.' },
      { title: 'Artikel per fitur', text: 'Penjelasan mendalam untuk RSVP, daftar tamu, pembayaran, dan lainnya.' },
      { title: 'Tim yang bisa dihubungi', text: 'Buntu? Tim kami siap membantu lewat email dan WhatsApp.' },
    ],
  },
  faq: {
    summary: 'Jawaban cepat untuk pertanyaan yang paling sering diajukan tentang harga, masa aktif, tema, dan pembayaran.',
    highlights: [
      { title: 'Harga & masa aktif', text: 'Sekali bayar per undangan dan aktif 12 bulan penuh — detailnya dijawab di sini.' },
      { title: 'Tema & kustomisasi', text: 'Apa saja yang bisa diubah di tiap paket, dijelaskan tanpa jargon.' },
      { title: 'Pembayaran & refund', text: 'Metode yang didukung dan kebijakan pengembalian dana.' },
    ],
  },
  'privacy-and-security': {
    summary: 'Data acara dan tamu adalah milikmu — pelajari cara Invitesion menyimpan, melindungi, dan tidak pernah menjual data.',
    highlights: [
      { title: 'Data terenkripsi', text: 'Komunikasi dan penyimpanan data dilindungi enkripsi standar industri.' },
      { title: 'Akses terkontrol', text: 'Halaman undangan hanya dapat dibuka melalui tautan yang kamu sebarkan.' },
      { title: 'Tanpa jual data', text: 'Data tamu tidak pernah dibagikan atau dijual ke pihak ketiga.' },
    ],
  },
};

const eventTypesTitles = [
  'Client & VIP events',
  'Customer appreciation',
  'Employee appreciation',
  'Brand activations',
  'Product launches',
  'Conferences',
  'Summits & forums',
  'Tradeshows & expos',
  'Sales kickoffs',
  'Workshops & classes',
  'Field marketing',
  'Networking events',
  'Internal meetings & trainings',
  'Team building & offsites',
  'Investor & shareholder',
  'Holiday parties',
  'Galas & benefit dinners',
  'Donor stewardship',
  'Shows & performances',
  'Community events',
  'Enterprise',
  'Businesses',
  'Financial services',
  'Agencies',
  'Nonprofits & foundations',
  'Healthcare',
  'Associations & membership',
  'Government & NGO',
  'Higher education',
  'K–12 schools',
  'Independent schools',
  'Religious organizations',
  'Hospitality & venues',
  'Bars & restaurants',
  'Real estate',
  'Media & publishing',
  'Weddings',
  'Wedding anniversaries',
  'Bridal showers',
  'Birthdays',
  'Anniversary parties',
  'Reunions',
  'Graduations',
  'Aqiqah & Khitanan',
  'Syukuran',
  'Baby showers',
  'Gender reveals',
  'Holiday gatherings',
  'Retirement parties',
  'Celebrations of life',
] as const;

const featuresTitles = [
  'Event registration',
  'Online RSVPs',
  'Form builder',
  'Embeddable forms',
  'Event ticketing',
  'Donations',
  'Appointment scheduling',
  'Payment processing',
  'Guest list management',
  'Seating charts',
  'Menu & dietary',
  'Contact tagging',
  'Email communications',
  'Event website builder',
  'Online invitations',
  'QR code RSVPs',
  'Guest list app',
  'Multi-language',
  'Event check-in app',
  'Badge printing',
  'Live attendance',
  'Analytics & reporting',
  'Salesforce',
  'HubSpot',
  'Stripe',
  'Google Analytics',
  'Zapier',
  'API & export',
] as const;

const resourcesTitles = [
  'Case studies',
  'Event spotlights',
  'Reviews',
  'Privacy & security',
  'Event ROI calculator',
  'Sales',
  'Help Center',
  'Community forum',
  'Press & Blog',
  'FAQ',
  'Contact',
  'App status',
  'Careers',
  'Affiliates',
] as const;

const titleRegistry: Record<MarketingCategory, readonly string[]> = { 'event-types': eventTypesTitles, features: featuresTitles, resources: resourcesTitles };
export const marketingIndexPaths: Record<MarketingCategory, string> = { 'event-types': '/event-types', features: '/features', resources: '/resources' };

export function slugifyMarketingTitle(title: string) {
  return title.toLowerCase().replace(/–/g, '-').replace(/&/g, ' and ').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function marketingHref(category: MarketingCategory, title: string) {
  if (category === 'resources' && title === 'Contact') return 'mailto:hello@invitesion.id';
  return `${marketingIndexPaths[category]}/${slugifyMarketingTitle(title)}`;
}
const makePages = (category: MarketingCategory) =>
  titleRegistry[category].map((title) => {
    const slug = slugifyMarketingTitle(title);
    const detail = handWritten[slug];
    return {
      title,
      slug,
      eyebrow: fallbacks[category].eyebrow,
      summary: detail?.summary ?? fallbacks[category].summary,
      highlights: detail?.highlights ?? fallbacks[category].highlights,
    };
  });
export const marketingPages: Record<MarketingCategory, readonly MarketingPage[]> = {
  'event-types': makePages('event-types'),
  features: makePages('features'),
  resources: makePages('resources'),
};
export function getMarketingPage(category: MarketingCategory, slug: string) { return marketingPages[category].find(page => page.slug === slug); }
