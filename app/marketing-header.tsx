'use client';
import Link from 'next/link';
import { Wordmark } from '@/components/brand/wordmark';
import { ArrowRight, BarChart3, BookOpen, Building2, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, Contact, Heart, LayoutTemplate, Mail, Menu, MessageCircle, PartyPopper, QrCode, ShieldCheck, Sparkles, TicketCheck, Users, X, BriefcaseBusiness, HandHeart, Globe2, BadgeCheck, Utensils, Newspaper, Star, Landmark, Handshake, CreditCard, Megaphone, ChartNoAxesCombined, Rocket, Cloud } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import styles from './home.module.css';
import { marketingHref, marketingIndexPaths, type MarketingCategory } from './marketing-registry';

type MenuName = 'events' | 'features' | 'resources';
type Item = { title: string; note?: string; href: string; icon: React.ComponentType<{ size?: number }> };
type Group = { title: string; items: Item[] };
type Callout = { label: string; title: string; text: string; href: string };
type Panel = { groups: Group[]; callout?: Callout; feature?: Callout };
type Menu = { title: string; tabs?: string[]; panels: Panel[] };
const link = (category: MarketingCategory, title: string, icon: Item['icon'], _legacyHref?: string, note?: string): Item => ({ title, icon, href: marketingHref(category, title), note });
const menus: Record<MenuName, Menu> = {
 events: { title:'Jenis Acara', tabs:['By Event Type','By Industry','Personal Events'], panels:[
  { groups:[
   {title:'VIP & BRAND',items:[link('event-types', 'Client & VIP events',Star),link('event-types', 'Customer appreciation',PartyPopper),link('event-types', 'Employee appreciation',BadgeCheck),link('event-types', 'Brand activations',Sparkles),link('event-types', 'Product launches',Rocket)]},
   {title:'CORPORATE & CONFERENCES',items:[link('event-types', 'Conferences',Building2),link('event-types', 'Summits & forums',Megaphone),link('event-types', 'Tradeshows & expos',LayoutTemplate),link('event-types', 'Sales kickoffs',ChartNoAxesCombined),link('event-types', 'Workshops & classes',BookOpen)]},
   {title:'MARKETING & INTERNAL',items:[link('event-types', 'Field marketing',Globe2),link('event-types', 'Networking events',Users),link('event-types', 'Internal meetings & trainings',Contact),link('event-types', 'Team building & offsites',Users),link('event-types', 'Investor & shareholder',BarChart3),link('event-types', 'Holiday parties',PartyPopper)]},
   {title:'FUNDRAISING & TICKETED',items:[link('event-types', 'Galas & benefit dinners',Utensils),link('event-types', 'Donor stewardship',HandHeart),link('event-types', 'Shows & performances',TicketCheck),link('event-types', 'Community events',Heart)]}
  ]},
  { groups:[
   {title:'BUSINESS & FINANCE',items:[link('event-types', 'Enterprise',Building2),link('event-types', 'Businesses',BriefcaseBusiness),link('event-types', 'Financial services',Landmark),link('event-types', 'Agencies',Megaphone)]},
   {title:'MISSION-DRIVEN',items:[link('event-types', 'Nonprofits & foundations',Heart),link('event-types', 'Healthcare',BarChart3),link('event-types', 'Associations & membership',Users),link('event-types', 'Government & NGO',Landmark)]},
   {title:'EDUCATION & FAITH',items:[link('event-types', 'Higher education',BookOpen),link('event-types', 'K–12 schools',Building2),link('event-types', 'Independent schools',LayoutTemplate),link('event-types', 'Religious organizations',Landmark)]},
   {title:'VENUES & MEDIA',items:[link('event-types', 'Hospitality & venues',Building2),link('event-types', 'Bars & restaurants',Utensils),link('event-types', 'Real estate',Handshake),link('event-types', 'Media & publishing',Newspaper)]}
  ]},
  { groups:[
   {title:'WEDDINGS',items:[link('event-types', 'Weddings',Heart,'/?event=wedding#fitur'),link('event-types', 'Wedding anniversaries',Heart),link('event-types', 'Bridal showers',PartyPopper)]},
   {title:'MILESTONES',items:[link('event-types', 'Birthdays',PartyPopper,'/?event=birthday#fitur'),link('event-types', 'Anniversary parties',Sparkles),link('event-types', 'Reunions',Users),link('event-types', 'Graduations',BookOpen)]},
   {title:'FAITH & CULTURAL',items:[link('event-types', 'Aqiqah & Khitanan',Sparkles,'/?event=aqiqah#fitur'),link('event-types', 'Syukuran',CalendarDays,'/?event=tasyakuran#fitur'),link('event-types', 'Baby showers',Heart),link('event-types', 'Gender reveals',Sparkles)]},
   {title:'CELEBRATIONS',items:[link('event-types', 'Holiday gatherings',Sparkles),link('event-types', 'Retirement parties',PartyPopper),link('event-types', 'Celebrations of life',Heart)]}
  ], feature:{label:'BUAT MOMEN JADI RAPI',title:'Invitesion, dibuat personal.',text:'Undangan, RSVP, dan pengelolaan tamu dalam satu ruang untuk setiap perayaan.',href:'/sign-up'} }
 ]},
 features:{title:'Fitur',tabs:['Forms, Registration & AI','Ticketing & Payments','Guest Management','Websites & Invitations','Check-in & Insights','Integrations'],panels:[
  {groups:[{title:'FORM & REGISTRATION',items:[link('features', 'Event registration',CheckCircle2,'/#fitur','Form khusus untuk setiap acara'),link('features', 'Online RSVPs',Mail,'/#fitur','Konfirmasi yang fleksibel'),link('features', 'Form builder',LayoutTemplate,'/#fitur','Pertanyaan dan alur custom'),link('features', 'Embeddable forms',QrCode,'/#fitur','Pasang RSVP di website')]}]},
  {groups:[{title:'TICKETING & PAYMENT',items:[link('features', 'Event ticketing',TicketCheck,'/#fitur','Registrasi berbayar yang rapi'),link('features', 'Donations',HandHeart,'/#fitur','Donasi saat checkout'),link('features', 'Appointment scheduling',CalendarDays,'/#fitur','Booking berdasarkan slot'),link('features', 'Payment processing',CreditCard,'/#fitur','Pembayaran aman')]}]},
  {groups:[{title:'GUEST MANAGEMENT',items:[link('features', 'Guest list management',Users,'/#fitur','Tamu, plus-one, dan seating'),link('features', 'Seating charts',LayoutTemplate,'/#fitur','Pengaturan meja yang mudah'),link('features', 'Menu & dietary',Utensils,'/#fitur','Pilihan menu dan alergi'),link('features', 'Contact tagging',TicketCheck,'/#fitur','Segmentasi untuk follow-up'),link('features', 'Email communications',MessageCircle,'/#cara-kerja','Undangan, reminder, broadcast')]}]},
  {groups:[{title:'WEBSITE & INVITATION',items:[link('features', 'Event website builder',LayoutTemplate,'/#fitur','Halaman acara yang personal'),link('features', 'Online invitations',Mail,'/#fitur','Email dan link yang branded'),link('features', 'QR code RSVPs',QrCode,'/#fitur','RSVP sekali scan'),link('features', 'Guest list app',Users,'/#fitur','Daftar tamu real-time'),link('features', 'Multi-language',Globe2,'/#fitur','Halaman yang localized')]}]},
  {groups:[{title:'CHECK-IN & INSIGHTS',items:[link('features', 'Event check-in app',QrCode,'/#cara-kerja','Scan, cari, dan pantau'),link('features', 'Badge printing',BadgeCheck,'/#cara-kerja','Cetak saat kedatangan'),link('features', 'Live attendance',BarChart3,'/#cara-kerja','Siapa hadir dan kapan'),link('features', 'Analytics & reporting',ChartNoAxesCombined,'/#cara-kerja','Insight dan export')]}]},
  {groups:[{title:'CRM & SALES',items:[link('features', 'Salesforce',Cloud,'/#cara-kerja','Sync leads & ROI'),link('features', 'HubSpot',Handshake,'/#cara-kerja','Nurture dan segmentasi')]},{title:'PAYMENTS & ANALYTICS',items:[link('features', 'Stripe',CreditCard,'/#cara-kerja','Tiket dan donasi'),link('features', 'Google Analytics',BarChart3,'/#cara-kerja','Traffic dan conversion')]},{title:'AUTOMATION & CUSTOM',items:[link('features', 'Zapier',Sparkles,'/#cara-kerja','Workflow lintas aplikasi'),link('features', 'API & export',QrCode,'/#cara-kerja','Terhubung ke stack tim')]}],feature:{label:'INVITESION WORKSPACE',title:'Satu data, satu alur.',text:'Hubungkan semua detail acara agar tim dan tamu bergerak selaras.',href:marketingIndexPaths.features}}
 ]},
 resources:{title:'Resource',tabs:['Customer Stories','Tools & Trust','Sales & Support','Company'],panels:[
  {groups:[{title:'CUSTOMER STORIES',items:[link('resources', 'Case studies',Star,'/resources','Cara tim memakai Invitesion'),link('resources', 'Event spotlights',Sparkles,'/resources','Cerita dari acara nyata'),link('resources', 'Reviews',BadgeCheck,'/resources','Ulasan dan rating')]}],callout:{label:'PANDUAN INVITESION',title:'Rencanakan acara lebih tenang.',text:'Temukan checklist, template, dan panduan untuk mengelola respons tamu.',href:'/resources'}},
  {groups:[{title:'TOOLS & TRUST',items:[link('resources', 'Privacy & security',ShieldCheck,'/resources','Cara kami menjaga data'),link('resources', 'Event ROI calculator',BriefcaseBusiness,'/resources','Nilai dari setiap acara')]}],callout:{label:'PANDUAN INVITESION',title:'Rencanakan acara lebih tenang.',text:'Temukan checklist, template, dan panduan untuk mengelola respons tamu.',href:'/resources'}},
  {groups:[{title:'SALES & SUPPORT',items:[link('resources', 'Sales',Contact,'/resources','Bicara kebutuhan acara'),link('resources', 'Help Center',CircleHelp,'/resources','Panduan dan tutorial'),link('resources', 'Community forum',MessageCircle,'/resources','Tanya, jawab, belajar'),link('resources', 'Press & Blog',Newspaper,'/resources','Berita dan tips acara'),link('resources', 'FAQ',CircleHelp,'/resources#faq','Jawaban cepat')]}],callout:{label:'PANDUAN INVITESION',title:'Rencanakan acara lebih tenang.',text:'Temukan checklist, template, dan panduan untuk mengelola respons tamu.',href:'/resources'}},
  {groups:[{title:'COMPANY',items:[link('resources', 'Contact',Mail,'mailto:hello@vienne.id','Hubungi kami'),link('resources', 'App status',BarChart3,'/resources','Status layanan'),link('resources', 'Careers',BriefcaseBusiness,'/resources','Bergabung dengan tim'),link('resources', 'Affiliates',Megaphone,'/resources','Program partner')]}],callout:{label:'PANDUAN INVITESION',title:'Rencanakan acara lebih tenang.',text:'Temukan checklist, template, dan panduan untuk mengelola respons tamu.',href:'/resources'}}
 ]}
};
const panelCallouts: Record<'events'|'features',Callout[]> = {
 events:[
  {label:'ACARA PROFESIONAL',title:'Rancang pengalaman yang terasa utuh.',text:'Satukan registrasi, komunikasi, dan detail tamu untuk acara bisnis yang lebih terarah.',href:marketingIndexPaths.features},
  {label:'UNTUK SETIAP TIM',title:'Alur acara yang mengikuti kebutuhan Anda.',text:'Susun pengalaman tamu yang relevan untuk organisasi, venue, dan komunitas Anda.',href:marketingIndexPaths.features},
  {label:'MOMEN PERSONAL',title:'Invitesion, dibuat personal.',text:'Undangan, RSVP, dan pengelolaan tamu dalam satu ruang untuk setiap perayaan.',href:'/sign-up'}],
 features:[
  {label:'FORM FLEKSIBEL',title:'Tanyakan hanya yang Anda perlukan.',text:'Bangun alur registrasi yang jelas untuk setiap acara.',href:marketingIndexPaths.features},
  {label:'TRANSAKSI ACARA',title:'Kelola akses dan pembayaran lebih rapi.',text:'Atur tiket, donasi, dan jadwal dalam pengalaman yang terhubung.',href:marketingIndexPaths.features},
  {label:'DATA TAMU',title:'Kenali dan layani setiap tamu.',text:'Kelola respons, kebutuhan, tempat duduk, dan komunikasi tanpa data terpencar.',href:marketingIndexPaths.features},
  {label:'IDENTITAS ACARA',title:'Satu halaman untuk cerita Anda.',text:'Bagikan undangan yang konsisten, mudah diakses, dan terasa personal.',href:marketingIndexPaths.features},
  {label:'HARI ACARA',title:'Sambut tamu dengan informasi yang siap.',text:'Percepat check-in dan pahami kehadiran dari data acara yang sama.',href:marketingIndexPaths.features},
  {label:'INVITESION WORKSPACE',title:'Satu data, satu alur.',text:'Hubungkan detail acara dengan workspace tim agar pekerjaan tetap selaras.',href:marketingIndexPaths.features}]
};
const utilityLabels: Record<MenuName,string> = {events:'Lihat semua jenis acara',features:'Lihat semua fitur',resources:'Buka pusat resource'};
const utilityHrefs: Record<MenuName,string> = {events:marketingIndexPaths['event-types'],features:marketingIndexPaths.features,resources:marketingIndexPaths.resources};

const focusableSelector = 'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
function trapFocus(event: ReactKeyboardEvent<HTMLElement>, container: HTMLElement | null) {
 if (event.key !== 'Tab' || !container) return;
 const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
 if (!focusable.length) { event.preventDefault(); container.focus(); return; }
 const first=focusable[0], last=focusable[focusable.length-1], active=document.activeElement;
 if (event.shiftKey && (active===first || !container.contains(active))) { event.preventDefault(); last.focus(); }
 else if (!event.shiftKey && (active===last || !container.contains(active))) { event.preventDefault(); first.focus(); }
}

function MegaPanel({name,close}:{name:MenuName;close:()=>void}) {
 const menu=menus[name], tabs=menu.tabs??[]; const [tab,setTab]=useState(0); const panel=menu.panels[Math.min(tab,menu.panels.length-1)];
 const callout=panel.callout??(name!=='resources'?panelCallouts[name][tab]:undefined);
 const dialogRef=useRef<HTMLDivElement>(null); const tabRefs=useRef<(HTMLButtonElement|null)[]>([]);
 useEffect(()=>{setTab(0);tabRefs.current=[]},[name]);
 useEffect(()=>{requestAnimationFrame(()=>tabs.length?tabRefs.current[0]?.focus():dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus())},[name,tabs.length]);
 const onTabKeyDown=(event:ReactKeyboardEvent<HTMLButtonElement>,index:number)=>{let next:number|undefined;if(event.key==='ArrowRight')next=(index+1)%tabs.length;else if(event.key==='ArrowLeft')next=(index-1+tabs.length)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();setTab(next);tabRefs.current[next]?.focus()}};
 const onDialogKeyDown=(event:ReactKeyboardEvent<HTMLDivElement>)=>{if(event.key==='Escape'){event.preventDefault();close();return}trapFocus(event,dialogRef.current)};
 return <div ref={dialogRef} id={`mega-${name}`} className={styles.megaPanel} role="dialog" aria-modal="true" aria-label={`Menu ${menu.title}`} tabIndex={-1} onKeyDown={onDialogKeyDown}><div className={styles.megaInner}>
  <div className={styles.megaLayout}>
   {tabs.length>0&&<aside className={styles.megaRail}><div className={styles.megaTabs} role="tablist" aria-label={`Kategori ${menu.title}`}>{tabs.map((label,i)=><button ref={element=>{tabRefs.current[i]=element}} key={label} id={`${name}-tab-${i}`} role="tab" aria-selected={i===tab} aria-controls={`${name}-panel-${i}`} tabIndex={i===tab?0:-1} className={i===tab?styles.tabActive:''} onClick={()=>setTab(i)} onMouseEnter={()=>setTab(i)} onFocus={()=>setTab(i)} onKeyDown={event=>onTabKeyDown(event,i)}>{label}<span aria-hidden="true">›</span></button>)}</div></aside>}
   <div className={styles.megaContent}><div id={`${name}-panel-${tab}`} {...(tabs.length?{role:'tabpanel','aria-labelledby':`${name}-tab-${tab}`}:{})} className={`${styles.megaBody} ${panel.feature?styles.hasFeature:''}`}>
    <div className={`${styles.megaGroups} ${panel.groups.length===1?styles.compactGroups:''}`}>{panel.groups.map(g=><section key={g.title}><h3>{g.title}</h3><div className={styles.groupLinks}>{g.items.map(({title,note,href,icon:Icon})=><Link key={title} href={href} onClick={close} className={styles.megaLink}><span className={styles.megaIcon}><Icon size={19}/></span><span><strong>{title}</strong>{note&&<small>{note}</small>}</span></Link>)}</div></section>)}</div>
    {callout&&<div className={styles.megaCallout}><span className={styles.calloutIcon}><Sparkles size={19}/></span><div><b>{callout.label}</b><p><strong>{callout.title}</strong> {callout.text}</p></div><Link href={callout.href} onClick={close}>Pelajari <ArrowRight size={15}/></Link></div>}
   </div></div>
  </div><div className={styles.megaUtility}><span>Dirancang untuk momen yang penting</span><Link href={utilityHrefs[name]} onClick={close}>{utilityLabels[name]} <ArrowRight size={16}/></Link><Link href="/sign-up" className={styles.utilityCta} onClick={close}>Buat event <ArrowRight size={15}/></Link></div>
 </div></div>
}

export default function MarketingHeader(){
 const[open,setOpen]=useState<MenuName|null>(null); const[mobile,setMobile]=useState(false);
 const desktopTriggers=useRef<Record<MenuName,HTMLButtonElement|null>>({events:null,features:null,resources:null});
 const activeDesktopTrigger=useRef<HTMLButtonElement|null>(null); const mobileToggleRef=useRef<HTMLButtonElement>(null); const mobileDrawerRef=useRef<HTMLDivElement>(null);
 const keyboardNavigation=useRef(false);
 const closeDesktop=useCallback(()=>{setOpen(null);if(keyboardNavigation.current)requestAnimationFrame(()=>activeDesktopTrigger.current?.focus())},[]);
 const closeMobile=useCallback(()=>{setMobile(false);if(keyboardNavigation.current)requestAnimationFrame(()=>mobileToggleRef.current?.focus())},[]);
 const closeAll=useCallback(()=>{if(open)closeDesktop();if(mobile)closeMobile()},[open,mobile,closeDesktop,closeMobile]);
 useEffect(()=>{if(!mobile||!keyboardNavigation.current)return;const drawer=mobileDrawerRef.current;drawer?.querySelector<HTMLElement>(focusableSelector)?.focus()},[mobile]);
 useEffect(()=>{const previous=document.body.style.overflow;const locked=Boolean(open)||mobile;document.body.style.overflow=locked?'hidden':previous;return()=>{document.body.style.overflow=previous}},[open,mobile]);
 return <header className={styles.marketingHeader} onPointerDownCapture={()=>{keyboardNavigation.current=false}} onKeyDownCapture={()=>{keyboardNavigation.current=true}}><div className={styles.nav}><Wordmark onClick={closeAll} /><nav className={styles.desktopNav} aria-label="Navigasi utama">{(['events','features','resources']as MenuName[]).map(n=><button ref={element=>{desktopTriggers.current[n]=element}} key={n} className={open===n?styles.navActive:''} aria-expanded={open===n} aria-controls={`mega-${n}`} onClick={()=>{activeDesktopTrigger.current=desktopTriggers.current[n];if(open===n)closeDesktop();else setOpen(n)}}>{menus[n].title}<ChevronDown size={15}/></button>)}<Link href="/pricing" onClick={closeAll}>Harga</Link></nav><div className={styles.navRight}><Link href="/sign-in" className={styles.login}>Masuk</Link><Link href="/sign-up" className={styles.outlineBtn}>Coba gratis</Link><button ref={mobileToggleRef} className={styles.mobileToggle} aria-label={mobile?'Tutup navigasi':'Buka navigasi'} aria-expanded={mobile} aria-controls="mobile-navigation" onClick={()=>{if(mobile)closeMobile();else{setOpen(null);setMobile(true)}}}>{mobile?<X size={21}/>:<Menu size={21}/>}</button></div></div>{open&&<><button className={styles.megaBackdrop} aria-label="Tutup menu" onClick={closeDesktop}/><MegaPanel name={open} close={closeDesktop}/></>}{mobile&&<div ref={mobileDrawerRef} id="mobile-navigation" className={styles.mobileDrawer} role="dialog" aria-modal="true" aria-label="Navigasi seluler" tabIndex={-1} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();closeMobile();return}trapFocus(event,mobileDrawerRef.current)}}>{(Object.keys(menus)as MenuName[]).map(n=><details key={n} className={styles.mobileGroup}><summary>{menus[n].title}<ChevronDown size={16}/></summary><div>{menus[n].panels.flatMap(p=>p.groups.flatMap(g=>g.items)).map(({title,href,icon:Icon},i)=><Link key={`${title}-${i}`} href={href} onClick={closeMobile}><Icon size={17}/><span>{title}</span></Link>)}</div></details>)}<Link href="/pricing" className={styles.mobilePrice} onClick={closeMobile}>Harga <ArrowRight size={16}/></Link><div className={styles.mobileActions}><Link href="/sign-in" onClick={closeMobile}>Masuk</Link><Link href="/sign-up" onClick={closeMobile}>Coba gratis</Link></div></div>}</header>;
}
