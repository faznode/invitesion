import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, CircleCheck, MapPin, Play, Sparkles } from 'lucide-react';
import MarketingHeader from './marketing-header';
import styles from './home.module.css';
import { getMarketingCopy } from './marketing-copy';
import { getLocale } from '@/lib/locale-server';

type Copy = ReturnType<typeof getMarketingCopy>;

const featureStyles = ['pink', 'lavender', 'peach', 'ink'] as const;
const featureIcons = ['✦', '◌', '⌁', '▦'] as const;

function ProductPreview({ copy }: { copy: Copy }) {
  return (
    <div className={styles.productStage} aria-label={copy.previewAria}>
      <div className={styles.eventCanvas}>
        <div className={styles.canvasTop}>
          <span>invitesion<span>.</span></span>
          <small>{copy.previewBrief}</small>
        </div>
        <div className={styles.canvasGrid}>
          <section>
            <small>{copy.previewDate}</small>
            <h3 className={styles.serifDisplay}>{copy.previewTitle[0]}<br/><em>{copy.previewTitle[1]}</em></h3>
            <p>{copy.previewBody}</p>
            <div className={styles.canvasPeople}>
              {['RA','NS','BW','+84'].map(x => <span key={x}>{x}</span>)}
            </div>
          </section>
          <aside>
            <div>
              <CalendarDays size={18}/>
              <span><small>{copy.previewTime}</small><b>16.30 WIB</b></span>
            </div>
            <div>
              <MapPin size={18}/>
              <span><small>{copy.previewPlace}</small><b>Serambi Kota</b></span>
            </div>
            <div>
              <CircleCheck size={18}/>
              <span><small>{copy.previewRsvp}</small><b>{copy.previewRsvpValue}</b></span>
            </div>
          </aside>
        </div>
        <div className={styles.canvasTimeline}>
          <span className={styles.done}>{copy.previewSteps[0]}</span>
          <i/>
          <span className={styles.done}>{copy.previewSteps[1]}</span>
          <i/>
          <span>{copy.previewSteps[2]}</span>
        </div>
      </div>
      <div className={styles.floatTag}>
        <span className={styles.liveDot}/> {copy.previewTag}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const copy = getMarketingCopy(await getLocale());
  return (
    <main className={styles.site}>
      <MarketingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className={styles.hero} id="produk">
        <div className={styles.heroCopy}>
          <div className={styles.trustPill}>
            <span aria-hidden="true">💍</span>
            {copy.heroPill}
          </div>
          <h1 className={styles.heroHeading}>
            <em className={styles.serifDisplay}>{copy.heroTitleMark}</em>
            {copy.heroTitleAfter}
          </h1>
          <p>{copy.heroBody}</p>
          <div className={styles.heroActions}>
            <Link href="/sign-up" className={styles.primaryBtn}>
              {copy.heroPrimary} <ArrowRight size={17}/>
            </Link>
            <a href="#cara-kerja" className={styles.secondaryBtn}>
              <Play size={15} fill="currentColor"/> {copy.heroSecondary}
            </a>
          </div>
          <small className={styles.heroNote}>
            <Check size={14}/> {copy.heroNote}
          </small>
        </div>
        <ProductPreview copy={copy}/>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────────── */}
      <section className={styles.trustBar} aria-label="Keunggulan platform">
        {copy.trustBarItems.map(item => (
          <div key={item.text} className={styles.trustBarItem}>
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </section>

      {/* ── Intro ────────────────────────────────────────────────────────── */}
      <section className={styles.intro} id="fitur">
        <div>
          <small className={styles.eyebrow}>{copy.introEyebrow}</small>
          <h2 className={styles.serifH2}>{copy.introTitle}</h2>
        </div>
        <p>{copy.introBody}</p>
      </section>

      {/* ── Feature grid ─────────────────────────────────────────────────── */}
      <section className={styles.featureGrid}>
        {copy.features.map((f, i) => (
          <article
            className={`${styles.featureCard} ${styles[featureStyles[i]]}`}
            key={f.title}
          >
            <div className={styles.featureIcon}>{featureIcons[i]}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
            <a href="#cara-kerja">{copy.featureLink} <ArrowRight size={15}/></a>
          </article>
        ))}
      </section>

      {/* ── Workflow / Guest experience ───────────────────────────────────── */}
      <section className={styles.workflow} id="cara-kerja">
        <div className={styles.workflowVisual}>
          <div className={styles.phoneMock}>
            <div className={styles.phoneHead}>
              <span>invitesion.</span><span>⋯</span>
            </div>
            <div className={styles.phoneHero}>
              <small>{copy.phoneWedding}</small>
              <b className={styles.serifDisplay}>{copy.previewTitle[0]}<br/><i>{copy.previewTitle[1]}</i></b>
              <span>18 · 10 · 26</span>
            </div>
            <div className={styles.phoneSection}>
              <small>{copy.phoneConfirm}</small>
              <strong>{copy.phoneQuestion}</strong>
              <button type="button">{copy.phoneYes} <Check size={14}/></button>
              <button type="button" className={styles.mutedButton}>{copy.phoneNo}</button>
            </div>
          </div>
          <div className={styles.phoneBadge}>
            <CircleCheck size={16}/> {copy.phoneSaved}
          </div>
        </div>
        <div className={styles.workflowCopy}>
          <small className={styles.eyebrow}>{copy.guestEyebrow}</small>
          <h2 className={styles.serifH2}>{copy.guestTitle}</h2>
          <p>{copy.guestBody}</p>
          <ul>
            {copy.guestPoints.map(point => (
              <li key={point}><Check size={17}/> {point}</li>
            ))}
          </ul>
          <Link href="/sign-up" className={styles.textLink}>
            {copy.guestCta} <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className={styles.pricingSection} id="harga">
        <div className={styles.pricingSectionHead}>
          <small className={styles.eyebrow}>{copy.pricingEyebrow}</small>
          <h2 className={styles.serifH2}>{copy.pricingTitle}</h2>
          <p>{copy.pricingBody}</p>
        </div>
        <div className={styles.pricingCards}>
          {/* Free */}
          <div className={styles.pricingCard}>
            <small>{copy.pricingBadge}</small>
            <h3>{copy.pricingPlan}</h3>
            <div className={styles.pricingPrice}>
              <strong>Rp0</strong>
            </div>
            <p>{copy.pricingPlanBody}</p>
            <ul>
              {copy.pricingIncluded.map(item => (
                <li key={item}><Check size={16}/>{item}</li>
              ))}
            </ul>
            <Link href="/sign-up" className={styles.pricingCtaOutline}>
              {copy.tierCtaFree} <ArrowRight size={16}/>
            </Link>
          </div>
          {/* Standard */}
          <div className={styles.pricingCard}>
            <small>{copy.tierStandardLabel}</small>
            <h3>{copy.tierStandardDesc}</h3>
            <div className={styles.pricingPrice}>
              <strong>{copy.tierStandardPrice}</strong>
              <span>{copy.tierStandardPer}</span>
            </div>
            <p>&nbsp;</p>
            <ul>
              {copy.tierStandardItems.map(item => (
                <li key={item}><Check size={16}/>{item}</li>
              ))}
            </ul>
            <Link href="/sign-up" className={styles.pricingCtaOutline}>
              {copy.tierCta} <ArrowRight size={16}/>
            </Link>
          </div>
          {/* Premium */}
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <small>{copy.tierPremiumLabel}</small>
            <h3>{copy.tierPremiumDesc}</h3>
            <div className={styles.pricingPrice}>
              <strong>{copy.tierPremiumPrice}</strong>
              <span>{copy.tierPremiumPer}</span>
            </div>
            <p>&nbsp;</p>
            <ul>
              {copy.tierPremiumItems.map(item => (
                <li key={item}><Check size={16}/>{item}</li>
              ))}
            </ul>
            <Link href="/sign-up" className={styles.pricingCtaPrimary}>
              {copy.tierCta} <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
        <p className={styles.pricingNote}>{copy.pricingNote}</p>
      </section>

      {/* ── Roadmap ──────────────────────────────────────────────────────── */}
      <section className={styles.roadmap}>
        <div className={styles.roadmapHead}>
          <small className={styles.eyebrow}>{copy.roadmapEyebrow}</small>
          <h2 className={styles.serifH2}>{copy.roadmapTitle}</h2>
          <p>{copy.roadmapBody}</p>
        </div>
        <div className={styles.roadmapGrid}>
          {copy.roadmapItems.map((r, i) => (
            <div key={r}>
              <span>0{i + 1}</span>
              <b>{r}</b>
              <em>{copy.roadmapSoon}</em>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className={styles.cta} id="mulai">
        <div>
          <Sparkles size={20}/>
          <h2 className={styles.serifH2}>{copy.ctaTitle}</h2>
          <p>{copy.ctaBody}</p>
        </div>
        <Link href="/sign-up" className={styles.ctaButton}>
          {copy.ctaButton} <ArrowRight size={17}/>
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Link href="/" className={styles.logo}>invitesion<span>.</span></Link>
            <p>{copy.footerTagline}</p>
          </div>
          <nav className={styles.footerLinks} aria-label="Footer navigation">
            <div>
              <b>Produk</b>
              <a href="#produk">{copy.footerProduct}</a>
              <a href="#fitur">{copy.footerFeatures}</a>
              <a href="#cara-kerja">{copy.footerHow}</a>
              <Link href="/pricing">{copy.footerPricing}</Link>
            </div>
            <div>
              <b>Akun</b>
              <Link href="/sign-in">{copy.footerSignIn}</Link>
              <Link href="/sign-up">Daftar gratis</Link>
            </div>
            <div>
              <b>Perusahaan</b>
              <a href="mailto:hello@invitesion.id">{copy.footerContact}</a>
              <a href="/privacy">{copy.footerPrivacy}</a>
            </div>
          </nav>
        </div>
        <div className={styles.footerBottom}>
          <span>© 2026 Invitesion. Dibuat dengan ❤️ di Indonesia.</span>
        </div>
      </footer>

      {/* ── Floating WhatsApp ─────────────────────────────────────────────── */}
      <a
        href="https://wa.me/6281234567890?text=Halo%20Invitesion,%20saya%20ingin%20tahu%20lebih%20lanjut"
        className={styles.waFloat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi kami via WhatsApp"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>Hubungi kami</span>
      </a>
    </main>
  );
}
