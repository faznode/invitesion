import Link from 'next/link';
import { ArrowRight, CalendarDays, Check, CircleCheck, MapPin, Play, Sparkles, Users } from 'lucide-react';
import MarketingHeader from './marketing-header';
import styles from './home.module.css';
import { getMarketingCopy } from './marketing-copy';
import { getLocale } from '@/lib/locale-server';

type Copy = ReturnType<typeof getMarketingCopy>;

// Visual identity per feature card; the words themselves live in marketing-copy.
const featureStyles = ['pink', 'lavender', 'peach', 'ink'] as const;
const featureIcons = ['✦', '◌', '⌁', '▦'] as const;

function ProductPreview({ copy }: { copy: Copy }) {
  return <div className={styles.productStage} aria-label={copy.previewAria}>
    <div className={styles.eventCanvas}><div className={styles.canvasTop}><span>invitesion<span>.</span></span><small>{copy.previewBrief}</small></div><div className={styles.canvasGrid}><section><small>{copy.previewDate}</small><h3>{copy.previewTitle[0]}<br/>{copy.previewTitle[1]}</h3><p>{copy.previewBody}</p><div className={styles.canvasPeople}>{['RA','NS','BW','+42'].map(x=><span key={x}>{x}</span>)}</div></section><aside><div><CalendarDays size={18}/><span><small>{copy.previewTime}</small><b>16.30 WIB</b></span></div><div><MapPin size={18}/><span><small>{copy.previewPlace}</small><b>Serambi Kota</b></span></div><div><CircleCheck size={18}/><span><small>{copy.previewRsvp}</small><b>{copy.previewRsvpValue}</b></span></div></aside></div><div className={styles.canvasTimeline}><span className={styles.done}>{copy.previewSteps[0]}</span><i/><span className={styles.done}>{copy.previewSteps[1]}</span><i/><span>{copy.previewSteps[2]}</span></div></div>
    <div className={styles.floatTag}><span className={styles.liveDot} /> {copy.previewTag}</div>
  </div>;
}

export default async function HomePage() {
  const copy = getMarketingCopy(await getLocale());
  return <main className={styles.site}>
  <MarketingHeader />
  <section className={styles.hero} id="produk"><div className={styles.heroCopy}><div className={styles.trustPill}><span><Users size={14}/></span> {copy.heroPill}</div><h1>{copy.heroTitleBefore}<mark>{copy.heroTitleMark}</mark>{copy.heroTitleAfter}</h1><p>{copy.heroBody}</p><div className={styles.heroActions}><Link href="/sign-up" className={styles.primaryBtn}>{copy.heroPrimary} <ArrowRight size={17}/></Link><a href="#fitur" className={styles.secondaryBtn}><Play size={15} fill="currentColor"/> {copy.heroSecondary}</a></div><small className={styles.heroNote}><Check size={14}/> {copy.heroNote}</small></div><ProductPreview copy={copy} /></section>
  <section className={styles.logoStrip}><span>{copy.logoStrip}</span><div><b>RUMAH</b><b>atelier<span>+</span></b><b>momen.</b><b>keluarga kita</b><b>STUDIO 26</b></div></section>
  <section className={styles.intro} id="fitur"><div><small className={styles.eyebrow}>{copy.introEyebrow}</small><h2>{copy.introTitle}</h2></div><p>{copy.introBody}</p></section>
  <section className={styles.featureGrid}>{copy.features.map((f,i)=><article className={`${styles.featureCard} ${styles[featureStyles[i]]}`} key={f.title}><div className={styles.featureIcon}>{featureIcons[i]}</div><h3>{f.title}</h3><p>{f.text}</p><a href="#cara-kerja">{copy.featureLink} <ArrowRight size={15}/></a></article>)}</section>
  <section className={styles.workflow} id="cara-kerja"><div className={styles.workflowVisual}><div className={styles.phoneMock}><div className={styles.phoneHead}><span>invitesion.</span><span>⋯</span></div><div className={styles.phoneHero}><small>{copy.phoneWedding}</small><b>Nadya<br /><i>&amp;</i> Arga</b><span>14 · 06 · 26</span></div><div className={styles.phoneSection}><small>{copy.phoneConfirm}</small><strong>{copy.phoneQuestion}</strong><button>{copy.phoneYes} <Check size={14}/></button><button className={styles.mutedButton}>{copy.phoneNo}</button></div></div><div className={styles.phoneBadge}><CircleCheck size={16}/> {copy.phoneSaved}</div></div><div className={styles.workflowCopy}><small className={styles.eyebrow}>{copy.guestEyebrow}</small><h2>{copy.guestTitle}</h2><p>{copy.guestBody}</p><ul>{copy.guestPoints.map(point=><li key={point}><Check size={17}/> {point}</li>)}</ul><Link href="/sign-up" className={styles.textLink}>{copy.guestCta} <ArrowRight size={16}/></Link></div></section>
  <section className={styles.roadmap}><div className={styles.roadmapHead}><small className={styles.eyebrow}>{copy.roadmapEyebrow}</small><h2>{copy.roadmapTitle}</h2><p>{copy.roadmapBody}</p></div><div className={styles.roadmapGrid}>{copy.roadmapItems.map((r,i)=><div key={r}><span>0{i+1}</span><b>{r}</b><em>{copy.roadmapSoon}</em></div>)}</div></section>
  <section className={styles.cta} id="harga"><div><Sparkles size={20}/><h2>{copy.ctaTitle}</h2><p>{copy.ctaBody}</p></div><Link href="/sign-up" className={styles.ctaButton}>{copy.ctaButton} <ArrowRight size={17}/></Link></section>
  <footer><Link href="/" className={styles.logo}>invitesion<span>.</span></Link><p>{copy.footerTagline}</p><div><a href="#produk">{copy.footerProduct}</a><a href="#fitur">{copy.footerFeatures}</a><a href="#cara-kerja">{copy.footerHow}</a><Link href="/sign-in">{copy.footerSignIn}</Link><span>© 2026 Invitesion</span></div></footer>
</main>;
}

/* Product-marketing DNA studied from a public RSVPify reference: F6 product hero, N1 utility nav, feature-led long form, Ft3 index. Original Invitesion content and visual system. */
