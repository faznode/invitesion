import { Fragment } from 'react';
import { InvitationIcon } from '@/components/invitation/icons';
import { Countdown } from '@/components/invitation/countdown';
import {
  CalendarLinks,
  CeremonyProfileBody,
  PortraitsBody,
  EventFacts,
  CorporateLogo,
  CorporateMark,
  CoverEyebrow,
  GuestbookBlock,
  MapLink,
  PROGRAMME_HEADINGS,
  ProgrammeBody,
  programmeSections,
  type ProgrammeSectionId,
  ReadOnlyNotice,
  RsvpBlock,
  SHARE_HEADING,
  ShareBody,
  SwitchedOffNotices,
} from '@/components/invitation/guest-blocks';
import type { GuestPageProps, GuestView } from '@/components/invitation/guest-view';

type Tone = GuestView['tone'];

/** Kartu's small-caps eyebrow above every section title, here for the B-029 programme sections. */
const PROGRAMME_LABELS: Record<ProgrammeSectionId, string> = { about: 'Sekilas', agenda: 'Jadwal', speakers: 'Narasumber', info: 'Sebelum datang' };

/**
 * Kartu (B-030): an asymmetric stack of printed cards. The cover is a card on an offset backing card with a dashed date
 * stamp; each event is a ticket whose date stub is torn off along a perforation. Left-aligned throughout. Motion level 0.
 */
export function KartuLayout({ props, view }: { props: GuestPageProps; view: GuestView }) {
  const { invitation, config, guest, readOnly } = props;
  const { tone, formatDate, dateParts, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, gallery, organiser } = view;
  const stamp = dateParts(primaryEvent?.startAt);
  const card = `rounded-2xl border ${tone.line} ${tone.card} shadow-sm`;
  const mark = view.corporateMark;
  const corporate = Boolean(mark);
  const eventTitle = view.headlineKind === 'event';
  const stampTile = stamp && (
    <p className={`shrink-0 rounded-lg border-2 border-dashed ${tone.accentLine} px-3 py-2 text-center ${tone.accent}`}>
      <span className="block font-serif text-3xl leading-none">{stamp.day}</span>
      <span className="mt-1 block text-xs uppercase tracking-widest">
        {stamp.monthShort} {stamp.year}
      </span>
    </p>
  );

  return (
    <main className={`min-h-screen ${tone.bg} ${tone.ink}`} style={tone.style}>
      <header className="px-5 pb-12 pt-10 sm:pt-16">
        <div className="relative mx-auto max-w-md">
          <div aria-hidden className={`absolute inset-0 translate-x-3 translate-y-3 rounded-2xl ${tone.soft}`} />
          <div className={`relative ${card} p-6 sm:p-8`}>
            {view.coverImageSrc && (
              // S21-K1 (s22): the card is 28rem wide at every desktop size, so a 4:3 photo is always ≈ 287 px tall and the
              // guest name ended at 804–836 px, below the fold of a 1024 × 768, 1280 × 800 or 1366 × 768 viewport. From
              // 640 px the photo keeps 4:3 but is capped at what the viewport leaves after the cover's text with a two-line
              // guest name (≈ 34.5rem, plus a margin: 37rem), never below 11rem (as Gapura's window, E-040). Phones keep
              // the full 4:3 photo (S17-G1 holds at 360 × 800).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={view.coverImageSrc}
                alt=""
                aria-hidden
                className="mb-6 aspect-[4/3] w-full rounded-xl object-cover sm:max-h-[max(11rem,calc(100svh_-_37rem))]"
              />
            )}
            {corporate ? (
              // S22-K2 (s23r): the organiser's logo takes the eyebrow's place beside the stamp, and the category and the
              // cover headline share one eyebrow line below, so the mark costs one row instead of three.
              <>
                <div className="flex items-start justify-between gap-4">
                  {mark?.logo ? <CorporateLogo view={view} align="start" className="min-w-0 flex-1 [--inv-logo-bg:var(--inv-card)]" /> : <span aria-hidden />}
                  {stampTile}
                </div>
                <CoverEyebrow category={mark?.category} headline={config.theme?.cover?.headline || 'Undangan'} tone={tone} align="start" className="mt-5" />
              </>
            ) : (
              <>
                <CorporateMark view={view} align="start" className="mb-6 [--inv-logo-bg:var(--inv-card)]" />
                <div className="flex items-start justify-between gap-4">
                  <p className={`pt-1 text-xs uppercase tracking-[0.25em] ${tone.accent}`}>{config.theme?.cover?.headline || 'Undangan'}</p>
                  {stampTile}
                </div>
              </>
            )}
            <h1
              className={
                eventTitle
                  ? `${corporate ? 'mt-5' : 'mt-10'} font-serif text-4xl leading-[1.1] text-balance [overflow-wrap:anywhere]`
                  : 'mt-10 font-serif text-5xl leading-[1.05] [overflow-wrap:anywhere]'
              }
            >
              {names?.length
                ? names.filter(Boolean).map((name, index) => (
                    <Fragment key={name ?? index}>
                      {index > 0 && <span className={`block text-3xl italic ${tone.accent}`}>&amp;</span>}
                      <span className="block" dir="auto">
                        {name}
                      </span>
                    </Fragment>
                  ))
                : config.settings?.title || 'Undangan'}
            </h1>
            {organiser && (
              <p dir="auto" className={`mt-4 text-sm ${tone.muted} [overflow-wrap:anywhere]`}>
                {organiser}
              </p>
            )}
            {primaryEvent?.startAt && (
              <p className={`mt-6 text-sm ${tone.muted}`}>
                {formatDate(primaryEvent.startAt)}
                {primaryEvent.venueName ? ` · ${primaryEvent.venueName}` : ''}
              </p>
            )}
            {guest && (
              <div className={`mt-8 border-t-2 border-dashed ${tone.line} pt-5`}>
                <p className={`text-xs uppercase tracking-widest ${tone.muted}`}>Kepada Yth.</p>
                <p className="mt-1 font-serif text-2xl [overflow-wrap:anywhere]" dir="auto">
                  {guest.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {readOnly && <ReadOnlyNotice className="mx-auto max-w-xl px-5" />}
      <SwitchedOffNotices props={props} view={view} className="mx-auto max-w-xl px-5" />

      {config.greetings?.enabled !== false && (config.greetings?.prayer || config.settings?.openingCopy) && (
        <CardSection tone={tone}>
          <div className={`${card} p-6`}>
            {config.greetings?.prayer && <p className={`font-serif text-xl leading-relaxed text-pretty ${tone.accent}`}>{config.greetings.prayer}</p>}
            {config.settings?.openingCopy && <p className="mt-3 text-sm leading-7 text-pretty">{config.settings.openingCopy}</p>}
          </div>
        </CardSection>
      )}

      {config.quote?.enabled && config.quote.text && (
        <CardSection tone={tone}>
          <figure className="flex gap-4">
            <InvitationIcon name="quote" className={`h-8 w-8 shrink-0 ${tone.accent}`} />
            <div>
              <blockquote className="font-serif text-xl leading-8 text-pretty">{config.quote.text}</blockquote>
              {config.quote.author && <figcaption className={`mt-3 text-xs uppercase tracking-widest ${tone.muted}`}>{config.quote.author}</figcaption>}
            </div>
          </figure>
        </CardSection>
      )}

      {view.portraits && (
        <CardSection tone={tone} title={view.portraits.heading}>
          <PortraitsBody view={view} frame="card" align="start" />
        </CardSection>
      )}

      {events.length > 0 && (
        <CardSection tone={tone} label="Waktu & tempat" title="Rangkaian Acara">
          {showCountdown && primaryEvent && (
            <Countdown
              target={primaryStartMs}
              initialNow={renderedAt}
              eventTitle={primaryEvent.title}
              boxClassName={`border ${tone.line} ${tone.card}`}
              labelClassName={tone.muted}
            />
          )}
          <div className="mt-8 flex flex-col gap-4">
            {events.map((event, index) => {
              const parts = dateParts(event.startAt);
              return (
                <article key={`${event.title}-${index}`} className={`flex overflow-hidden ${card}`}>
                  <div className={`flex w-20 shrink-0 flex-col items-center justify-center border-r-2 border-dashed ${tone.line} ${tone.soft} px-2 py-5 text-center`}>
                    {parts ? (
                      <>
                        <span className="font-serif text-4xl leading-none">{parts.day}</span>
                        <span className={`mt-1 text-xs uppercase tracking-widest ${tone.muted}`}>{parts.monthShort}</span>
                      </>
                    ) : (
                      <span className={`text-xs uppercase tracking-widest ${tone.muted}`}>Acara</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 p-5">
                    <h3 className="font-serif text-xl text-balance">{event.title}</h3>
                    <EventFacts event={event} view={view} className="mt-3 space-y-2 text-sm" />
                    {event.note && <p className={`mt-3 text-sm ${tone.muted}`}>{event.note}</p>}
                    <MapLink event={event} view={view} className="mt-4" />
                  </div>
                </article>
              );
            })}
          </div>
          <CalendarLinks view={view} slug={invitation.slug} className="mt-8 flex flex-col items-start gap-3 sm:flex-row" />
        </CardSection>
      )}

      {view.ceremonyProfile && (
        <CardSection tone={tone} label="Profil" title={view.ceremonyProfile.heading}>
          <CeremonyProfileBody view={view} cardClassName={card} frame="card" align="start" />
        </CardSection>
      )}

      {programmeSections(view).map((id) => (
        <CardSection key={id} tone={tone} label={PROGRAMME_LABELS[id]} title={PROGRAMME_HEADINGS[id]}>
          <ProgrammeBody id={id} view={view} cardClassName={card} />
        </CardSection>
      ))}

      {config.story?.enabled && config.story.items?.length ? (
        <CardSection tone={tone} label="Perjalanan" title="Cerita Kami">
          <ol className="mt-8 flex flex-col gap-6">
            {config.story.items.map((item, index) => (
              <li key={index} className={`relative ${card} p-5 pt-7`}>
                {item.date && (
                  <p className={`absolute -top-3 left-5 rounded-full border ${tone.line} ${tone.bg} px-3 py-0.5 text-xs ${tone.accent}`}>{item.date}</p>
                )}
                {item.title && <h3 className="font-serif text-xl text-balance">{item.title}</h3>}
                {item.body && <p className="mt-2 text-sm leading-7 text-pretty">{item.body}</p>}
              </li>
            ))}
          </ol>
        </CardSection>
      ) : null}

      {gallery.length > 0 && (
        <CardSection tone={tone} label="Momen" title="Galeri">
          <div className="mt-8 grid grid-cols-2 gap-3">
            {gallery.map((asset, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={asset.id}
                src={asset.url}
                alt=""
                loading="lazy"
                className={`w-full rounded-xl object-cover ${index === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
              />
            ))}
          </div>
        </CardSection>
      )}

      {config.streaming?.enabled && config.streaming.url && (
        <CardSection tone={tone} label="Dari jauh" title="Siaran Langsung">
          <a
            href={config.streaming.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-6 text-sm font-semibold ${tone.accent}`}
          >
            <InvitationIcon name="radio" className="h-4 w-4" />
            Tonton siaran
          </a>
        </CardSection>
      )}

      {view.share && (
        <CardSection tone={tone} label="Media sosial" title={SHARE_HEADING}>
          <ShareBody view={view} align="start" />
        </CardSection>
      )}

      {config.gift?.enabled && config.gift.accounts?.length ? (
        <CardSection tone={tone} label="Tanda kasih" title="Hadiah">
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {config.gift.accounts.map((account, index) => (
              <article key={index} className={`rounded-2xl border-2 border-dashed ${tone.line} ${tone.card} p-5`}>
                <div className="flex items-center gap-2">
                  <InvitationIcon name="gift" className={`h-4 w-4 shrink-0 ${tone.accent}`} />
                  <p className={`text-xs uppercase tracking-widest ${tone.muted}`}>{account.label}</p>
                </div>
                {account.number && <p className="mt-3 font-mono text-lg tracking-wide [overflow-wrap:anywhere]">{account.number}</p>}
                {account.holder && <p className={`mt-1 text-sm ${tone.muted}`}>a.n. {account.holder}</p>}
                {account.note && <p className={`mt-2 text-sm ${tone.muted}`}>{account.note}</p>}
              </article>
            ))}
          </div>
        </CardSection>
      ) : null}

      {/* RSVP — only a recognised guest can respond, and only while the invitation is active. */}
      {view.rsvpShown && (
        <CardSection tone={tone} label="RSVP" title="Konfirmasi Kehadiran">
          <RsvpBlock
            props={props}
            view={view}
            formClassName={`mt-8 space-y-5 ${card} border-t-4 border-t-(--inv-accent) p-6`}
            fallbackClassName={`mt-8 rounded-2xl border-2 border-dashed ${tone.line} ${tone.card} p-6 text-sm ${tone.muted}`}
          />
        </CardSection>
      )}

      {view.guestbookShown && (
        <CardSection tone={tone} label="Buku tamu" title={config.guestbook?.heading || 'Ucapan & Doa'}>
          {config.guestbook?.prompt && <p className={`mt-2 text-sm ${tone.muted}`}>{config.guestbook.prompt}</p>}
          <GuestbookBlock props={props} view={view} formClassName={`mt-8 space-y-4 ${card} p-6`} messageClassName={`${card} p-5`} />
        </CardSection>
      )}

      <footer className={`mx-auto max-w-xl px-5 pb-12 pt-4 text-xs ${tone.muted}`}>
        <p>Undangan digital oleh Invitesion</p>
      </footer>
    </main>
  );
}

function CardSection({ tone, label, title, children }: { tone: Tone; label?: string; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-xl px-5 py-10 sm:py-14">
      {label && <p className={`text-xs uppercase tracking-[0.25em] ${tone.muted}`}>{label}</p>}
      {title && <h2 className="mt-1 font-serif text-3xl text-balance">{title}</h2>}
      {children}
    </section>
  );
}
