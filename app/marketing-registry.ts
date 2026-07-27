export type MarketingCategory = 'event-types' | 'features' | 'resources';
export type MarketingPage = { title: string; slug: string; eyebrow: string; summary: string; highlights: readonly string[] };

const descriptions: Record<MarketingCategory, { eyebrow: string; summary: string; highlights: readonly string[] }> = {
  'event-types': { eyebrow: 'JENIS ACARA', summary: 'Rancang alur undangan, registrasi, komunikasi, dan pengalaman tamu yang sesuai dengan karakter acara ini.', highlights: ['Registrasi yang fleksibel', 'Komunikasi tamu terarah', 'Insight kehadiran real-time'] },
  features: { eyebrow: 'FITUR INVITESION', summary: 'Satukan pekerjaan tim dan perjalanan tamu dalam satu workspace acara yang rapi dan mudah digunakan.', highlights: ['Konfigurasi sesuai kebutuhan', 'Data acara terpusat', 'Pengalaman tamu konsisten'] },
  resources: { eyebrow: 'RESOURCE & COMPANY', summary: 'Temukan panduan, dukungan, kepercayaan, dan informasi perusahaan untuk menjalankan acara dengan tenang.', highlights: ['Panduan praktis', 'Dukungan yang mudah dijangkau', 'Informasi transparan'] },
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
  if (category === 'resources' && title === 'Contact') return 'mailto:hello@vienne.id';
  return `${marketingIndexPaths[category]}/${slugifyMarketingTitle(title)}`;
}
const makePages = (category: MarketingCategory) => titleRegistry[category].map(title => ({ title, slug: slugifyMarketingTitle(title), ...descriptions[category] }));
export const marketingPages: Record<MarketingCategory, readonly MarketingPage[]> = {
  'event-types': makePages('event-types'),
  features: makePages('features'),
  resources: makePages('resources'),
};
export function getMarketingPage(category: MarketingCategory, slug: string) { return marketingPages[category].find(page => page.slug === slug); }
