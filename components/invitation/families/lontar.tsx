import { Fragment } from 'react';
import { InvitationIcon } from '@/components/invitation/icons';
import { Countdown } from '@/components/invitation/countdown';
import {
  CalendarLinks,
  CeremonyProfileBody,
  PortraitsBody,
  EventFacts,
  CorporateMark,
  GuestbookBlock,
  MapLink,
  PROGRAMME_HEADINGS,
  ProgrammeBody,
  programmeSections,
  ReadOnlyNotice,
  RsvpBlock,
  SHARE_HEADING,
  ShareBody,
  SwitchedOffNotices,
} from '@/components/invitation/guest-blocks';
import type { GuestPageProps, GuestView } from '@/components/invitation/guest-view';

type Tone = GuestView['tone'];

/**
 * Lontar (B-030, brief `templates/_briefs/lontar.md`): a programme-led page for formal and corporate events. The cover
 * reads like a letter (event, who invites, addressee, opening words) around one palm-leaf band, two punched holes on a
 * binding cord drawn in CSS, that carries the date, time and venue. The programme follows the cover before any other
 * section; the events with address and map come after it. Left-aligned, motion level 0, no translucent surfaces, and a
 * cover photo is framed beside the band, never under text.
 */
export function LontarLayout({ props, view }: { props: GuestPageProps; view: GuestView }) {
  const { invitation, config, guest, readOnly } = props;
  const { tone, formatDate, formatTime, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, gallery, organiser } = view;
  const card = `rounded-2xl border ${tone.line} ${tone.card}`;
  const date = formatDate(primaryEvent?.startAt);
  const start = formatTime(primaryEvent?.startAt);
  const end = formatTime(primaryEvent?.endAt);
  const photo = view.coverImageSrc;
  // S17-L1: the band and the photo are independent. A saved photo sits beside the band when both exist and is framed on
  // its own otherwise, so an invitation without date, time or venue still shows it.
  const band = Boolean(date || start || primaryEvent?.venueName);

  return (
    <main className={`min-h-screen ${tone.bg} ${tone.ink}`} style={tone.style}>
      <header className="mx-auto w-full max-w-2xl px-5 pb-4 pt-12 sm:pt-20">
        <CorporateMark view={view} align="start" className="mb-6" />
        {config.theme?.cover?.headline && <p className={`text-xs font-semibold uppercase tracking-[0.25em] ${tone.accent}`}>{config.theme.cover.headline}</p>}
        <h1 className="mt-4 font-serif text-4xl leading-tight text-balance [overflow-wrap:anywhere] sm:text-6xl">
          {names?.length
            ? names.filter(Boolean).map((name, index) => (
                <Fragment key={name ?? index}>
                  {index > 0 && <span className={tone.accent}> &amp; </span>}
                  <span dir="auto">{name}</span>
                </Fragment>
              ))
            : config.settings?.title || 'Undangan'}
        </h1>
        {organiser && (
          <p dir="auto" className={`mt-4 text-xs font-semibold uppercase tracking-[0.2em] ${tone.muted} [overflow-wrap:anywhere]`}>
            {organiser}
          </p>
        )}

        {(band || photo) && (
          <div className={`mt-8 grid gap-4 ${band && photo ? 'sm:grid-cols-[1fr_13rem]' : ''}`}>
            {band && (
              <div className={`relative rounded-3xl ${tone.soft} px-6 pb-6 pt-11`}>
                <Binding tone={tone} />
                {date && <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${tone.muted}`}>{date}</p>}
                {start && <p className="mt-2 font-serif text-3xl leading-tight">{start}</p>}
                {end && <p className={`text-sm ${tone.muted}`}>sampai {end}</p>}
                {primaryEvent?.venueName && (
                  <p dir="auto" className="mt-3 text-sm font-medium [overflow-wrap:anywhere]">
                    {primaryEvent.venueName}
                  </p>
                )}
              </div>
            )}
            {photo && (
              // A lone photo is bounded by its width: the unlayered `img { max-width: 100% }` in app/globals.css overrides every
              // max-w-* utility on an image (S18-E1).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt=""
                aria-hidden
                className={`aspect-[4/3] w-full rounded-3xl border ${tone.line} object-cover ${band ? 'sm:aspect-auto sm:h-full' : 'sm:w-96'}`}
              />
            )}
          </div>
        )}

        {guest && (
          <div className="mt-10">
            <p className={`text-xs uppercase tracking-widest ${tone.muted}`}>Kepada Yth.</p>
            <p dir="auto" className="mt-1 font-serif text-2xl [overflow-wrap:anywhere]">
              {guest.name}
            </p>
          </div>
        )}
        {config.greetings?.enabled !== false && (config.greetings?.prayer || config.settings?.openingCopy) && (
          <div className="mt-6 max-w-prose">
            {config.greetings?.prayer && <p className={`font-serif text-lg leading-relaxed text-pretty ${tone.accent}`}>{config.greetings.prayer}</p>}
            {config.settings?.openingCopy && <p className="mt-2 text-sm leading-7 text-pretty">{config.settings.openingCopy}</p>}
          </div>
        )}
      </header>

      {readOnly && <ReadOnlyNotice className="mx-auto max-w-2xl px-5 pt-6" />}
      <SwitchedOffNotices props={props} view={view} className="mx-auto max-w-2xl px-5 pt-6" />

      {view.portraits && (
        <LeafSection tone={tone} title={view.portraits.heading}>
          <PortraitsBody view={view} frame="leaf" align="start" />
        </LeafSection>
      )}

      {view.ceremonyProfile && (
        <LeafSection tone={tone} title={view.ceremonyProfile.heading}>
          <CeremonyProfileBody view={view} cardClassName={card} frame="leaf" align="start" />
        </LeafSection>
      )}

      {programmeSections(view).map((id) => (
        <LeafSection key={id} tone={tone} title={PROGRAMME_HEADINGS[id]}>
          <ProgrammeBody id={id} view={view} cardClassName={card} />
        </LeafSection>
      ))}

      {events.length > 0 && (
        <LeafSection tone={tone} title="Waktu & Tempat">
          {showCountdown && primaryEvent && (
            <Countdown target={primaryStartMs} initialNow={renderedAt} eventTitle={primaryEvent.title} boxClassName={card} labelClassName={tone.muted} />
          )}
          <div className="mt-8 flex flex-col gap-4">
            {events.map((event, index) => (
              <article key={`${event.title}-${index}`} className={`${card} p-5`}>
                <h3 dir="auto" className="font-serif text-xl text-balance [overflow-wrap:anywhere]">
                  {event.title}
                </h3>
                <EventFacts event={event} view={view} className="mt-3 space-y-2 text-sm" />
                {event.note && <p className={`mt-3 text-sm ${tone.muted}`}>{event.note}</p>}
                <MapLink event={event} view={view} className="mt-4" />
              </article>
            ))}
          </div>
          <CalendarLinks view={view} slug={invitation.slug} className="mt-8 flex flex-col items-start gap-3 sm:flex-row" />
        </LeafSection>
      )}

      {config.quote?.enabled && config.quote.text && (
        <LeafSection tone={tone}>
          <figure className="flex gap-4">
            <InvitationIcon name="quote" className={`h-6 w-6 shrink-0 ${tone.accent}`} />
            <div>
              <blockquote className="font-serif text-xl leading-8 text-pretty">{config.quote.text}</blockquote>
              {config.quote.author && <figcaption className={`mt-3 text-xs uppercase tracking-widest ${tone.muted}`}>{config.quote.author}</figcaption>}
            </div>
          </figure>
        </LeafSection>
      )}

      {config.story?.enabled && config.story.items?.length ? (
        <LeafSection tone={tone} title="Cerita">
          <ol className="mt-8 flex flex-col gap-6">
            {config.story.items.map((item, index) => (
              <li key={index} className="sm:grid sm:grid-cols-[7rem_1fr] sm:gap-4">
                {item.date ? <p className={`text-xs font-semibold uppercase tracking-widest ${tone.accent} sm:pt-1.5`}>{item.date}</p> : <span aria-hidden className="hidden sm:block" />}
                <div>
                  {item.title && <h3 className="font-serif text-xl text-balance">{item.title}</h3>}
                  {item.body && <p className="mt-1 text-sm leading-7 text-pretty">{item.body}</p>}
                </div>
              </li>
            ))}
          </ol>
        </LeafSection>
      ) : null}

      {gallery.length > 0 && (
        <LeafSection tone={tone} title="Galeri">
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((asset) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={asset.id} src={asset.url} alt="" loading="lazy" className={`aspect-square w-full rounded-2xl border ${tone.line} object-cover`} />
            ))}
          </div>
        </LeafSection>
      )}

      {config.streaming?.enabled && config.streaming.url && (
        <LeafSection tone={tone} title="Siaran Langsung">
          <a
            href={config.streaming.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-6 text-sm font-semibold ${tone.accent}`}
          >
            <InvitationIcon name="radio" className="h-4 w-4" />
            Tonton siaran
          </a>
        </LeafSection>
      )}

      {view.share && (
        <LeafSection tone={tone} title={SHARE_HEADING}>
          <ShareBody view={view} align="start" />
        </LeafSection>
      )}

      {config.gift?.enabled && config.gift.accounts?.length ? (
        <LeafSection tone={tone} title="Hadiah">
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {config.gift.accounts.map((account, index) => (
              <article key={index} className={`${card} p-5`}>
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
        </LeafSection>
      ) : null}

      {/* RSVP — only a recognised guest can respond, and only while the invitation is active. */}
      {view.rsvpShown && (
        <LeafSection tone={tone} title="Konfirmasi Kehadiran">
          <RsvpBlock
            props={props}
            view={view}
            formClassName={`mt-8 space-y-5 ${card} p-6`}
            fallbackClassName={`mt-8 ${card} p-6 text-sm ${tone.muted}`}
          />
        </LeafSection>
      )}

      {view.guestbookShown && (
        <LeafSection tone={tone} title={config.guestbook?.heading || 'Ucapan & Doa'}>
          {config.guestbook?.prompt && <p className={`mt-2 text-sm ${tone.muted}`}>{config.guestbook.prompt}</p>}
          <GuestbookBlock props={props} view={view} formClassName={`mt-8 space-y-4 ${card} p-6`} messageClassName={`${card} p-5`} />
        </LeafSection>
      )}

      <footer className={`mx-auto max-w-2xl px-5 pb-12 pt-4 text-xs ${tone.muted}`}>
        <p>Undangan digital oleh Invitesion</p>
      </footer>
    </main>
  );
}

/** Each section opens like the next leaf of a bundle: a hairline across the column, then the title. */
function LeafSection({ tone, title, children }: { tone: Tone; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-5 py-8 sm:py-12">
      <div className={`border-t ${tone.line} pt-8`}>
        {title && <h2 className="font-serif text-3xl text-balance">{title}</h2>}
        {children}
      </div>
    </section>
  );
}

/**
 * Two punched holes, each with its cord leaving through the top edge (decorative). A cord drawn across the band read as
 * a range slider at 1280 px (s15 review L2), so each cord only runs from its hole to the edge.
 */
function Binding({ tone }: { tone: Tone }) {
  return (
    <span aria-hidden className="absolute inset-x-0 top-5 block">
      {['left-[20%]', 'right-[20%]'].map((side) => (
        <span key={side} className={`absolute ${side} top-0 block`}>
          <span className={`absolute -top-5 left-0 block h-5 w-px -translate-x-1/2 ${tone.lineFill}`} />
          <span className={`absolute left-0 top-0 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border ${tone.line} ${tone.bg}`} />
        </span>
      ))}
    </span>
  );
}
