import { Fragment } from 'react';
import { Gift, Quote as QuoteIcon, Radio } from 'lucide-react';
import { Countdown } from '@/components/invitation/countdown';
import {
  CalendarLinks,
  EventFacts,
  CorporateMark,
  GuestbookBlock,
  MapLink,
  PROGRAMME_HEADINGS,
  ProgrammeBody,
  programmeSections,
  ReadOnlyNotice,
  RsvpBlock,
} from '@/components/invitation/guest-blocks';
import type { GuestPageProps, GuestView } from '@/components/invitation/guest-view';

type Tone = GuestView['tone'];
type Band = { key: string; node: React.ReactNode };

/**
 * Riang (B-030): for birthdays, thanksgivings, aqiqah, khitanan and company events. A bunting row opens a tinted
 * cover with the date as a calendar tile; the sections below alternate between plain and tinted full-width bands, so
 * the rhythm holds whichever sections the host turned on. Motion level 1 (`inv-rise`, off under reduced motion).
 */
export function RiangLayout({ props, view }: { props: GuestPageProps; view: GuestView }) {
  const { invitation, config, guest, readOnly } = props;
  const { tone, formatTime, dateParts, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, gallery, organiser } = view;
  const tile = dateParts(primaryEvent?.startAt);
  const startTime = formatTime(primaryEvent?.startAt);
  const block = `rounded-3xl border ${tone.line} ${tone.card} shadow-sm`;
  const chip = `rounded-full border ${tone.line} ${tone.card} px-4 py-2`;
  const bands: Band[] = [];

  if (events.length > 0) {
    bands.push({
      key: 'events',
      node: (
        <>
          <BandHeading tone={tone}>Acara</BandHeading>
          {showCountdown && primaryEvent && (
            <Countdown target={primaryStartMs} initialNow={renderedAt} eventTitle={primaryEvent.title} boxClassName={block} labelClassName={tone.muted} />
          )}
          <div className={`mt-8 grid gap-4 ${events.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {events.map((event, index) => {
              const parts = dateParts(event.startAt);
              return (
                <article key={`${event.title}-${index}`} className={`${block} p-6`}>
                  <div className="flex items-start gap-4">
                    {parts && (
                      <p className={`shrink-0 rounded-2xl ${tone.soft} px-3 py-2 text-center`}>
                        <span className={`block font-serif text-3xl leading-none ${tone.accent}`}>{parts.day}</span>
                        <span className={`block text-xs uppercase tracking-widest ${tone.muted}`}>{parts.monthShort}</span>
                      </p>
                    )}
                    <h3 className="font-serif text-2xl leading-tight text-balance">{event.title}</h3>
                  </div>
                  <EventFacts event={event} view={view} />
                  {event.note && <p className={`mt-4 text-sm ${tone.muted}`}>{event.note}</p>}
                  <MapLink event={event} view={view} />
                </article>
              );
            })}
          </div>
          <CalendarLinks view={view} slug={invitation.slug} className="mt-8 flex flex-col items-start gap-3 sm:flex-row" />
        </>
      ),
    });
  }

  for (const id of programmeSections(view)) {
    bands.push({
      key: `programme-${id}`,
      node: (
        <>
          <BandHeading tone={tone}>{PROGRAMME_HEADINGS[id]}</BandHeading>
          <ProgrammeBody id={id} view={view} cardClassName={block} />
        </>
      ),
    });
  }

  if (config.greetings?.enabled !== false && (config.greetings?.prayer || config.settings?.openingCopy)) {
    bands.push({
      key: 'greeting',
      node: (
        <div className="text-center">
          {config.greetings?.prayer && <p className={`font-serif text-2xl leading-snug text-balance ${tone.accent}`}>{config.greetings.prayer}</p>}
          {config.settings?.openingCopy && <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-pretty">{config.settings.openingCopy}</p>}
        </div>
      ),
    });
  }

  if (config.quote?.enabled && config.quote.text) {
    bands.push({
      key: 'quote',
      node: (
        <figure className="text-center">
          <QuoteIcon className={`mx-auto h-8 w-8 ${tone.accent}`} aria-hidden />
          <blockquote className="mx-auto mt-4 max-w-xl font-serif text-2xl leading-snug text-balance">{config.quote.text}</blockquote>
          {config.quote.author && <figcaption className={`mt-4 text-xs uppercase tracking-widest ${tone.muted}`}>{config.quote.author}</figcaption>}
        </figure>
      ),
    });
  }

  if (config.story?.enabled && config.story.items?.length) {
    bands.push({
      key: 'story',
      node: (
        <>
          <BandHeading tone={tone}>Cerita</BandHeading>
          <ol className="mt-8 flex flex-col gap-6">
            {config.story.items.map((item, index) => (
              <li key={index} className="flex gap-4">
                <span aria-hidden className={`mt-1.5 block size-3 shrink-0 rounded-full ${tone.accentFill}`} />
                <div>
                  {item.date && <p className={`text-xs font-semibold uppercase tracking-widest ${tone.accent}`}>{item.date}</p>}
                  {item.title && <h3 className="mt-1 font-serif text-xl text-balance">{item.title}</h3>}
                  {item.body && <p className="mt-1 text-sm leading-7 text-pretty">{item.body}</p>}
                </div>
              </li>
            ))}
          </ol>
        </>
      ),
    });
  }

  if (gallery.length > 0) {
    bands.push({
      key: 'gallery',
      node: (
        <>
          <BandHeading tone={tone}>Galeri</BandHeading>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.map((asset) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={asset.id} src={asset.url} alt="" className="aspect-square w-full rounded-3xl object-cover" loading="lazy" />
            ))}
          </div>
        </>
      ),
    });
  }

  if (config.streaming?.enabled && config.streaming.url) {
    bands.push({
      key: 'streaming',
      node: (
        <>
          <BandHeading tone={tone}>Siaran Langsung</BandHeading>
          <a
            href={config.streaming.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-6 text-sm font-semibold ${tone.accent}`}
          >
            <Radio className="h-4 w-4" aria-hidden />
            Tonton siaran
          </a>
        </>
      ),
    });
  }

  if (config.gift?.enabled && config.gift.accounts?.length) {
    bands.push({
      key: 'gift',
      node: (
        <>
          <BandHeading tone={tone}>Kado</BandHeading>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {config.gift.accounts.map((account, index) => (
              <article key={index} className={`${block} p-6`}>
                <div className="flex items-center gap-2">
                  <Gift className={`h-5 w-5 shrink-0 ${tone.accent}`} aria-hidden />
                  <p className={`text-xs font-semibold uppercase tracking-widest ${tone.muted}`}>{account.label}</p>
                </div>
                {account.number && <p className="mt-3 font-mono text-xl tracking-wide [overflow-wrap:anywhere]">{account.number}</p>}
                {account.holder && <p className={`mt-1 text-sm ${tone.muted}`}>a.n. {account.holder}</p>}
                {account.note && <p className={`mt-2 text-sm ${tone.muted}`}>{account.note}</p>}
              </article>
            ))}
          </div>
        </>
      ),
    });
  }

  // RSVP — only a recognised guest can respond, and only while the invitation is active.
  if (config.rsvp?.enabled !== false) {
    bands.push({
      key: 'rsvp',
      node: (
        <>
          <BandHeading tone={tone}>Konfirmasi Kehadiran</BandHeading>
          <RsvpBlock
            props={props}
            view={view}
            formClassName={`mt-8 space-y-5 ${block} p-6`}
            fallbackClassName={`mt-8 ${block} p-6 text-sm ${tone.muted}`}
          />
        </>
      ),
    });
  }

  if (config.guestbook?.enabled !== false) {
    bands.push({
      key: 'guestbook',
      node: (
        <>
          <BandHeading tone={tone}>{config.guestbook?.heading || 'Ucapan & Doa'}</BandHeading>
          {config.guestbook?.prompt && <p className={`mt-4 text-sm ${tone.muted}`}>{config.guestbook.prompt}</p>}
          <GuestbookBlock props={props} view={view} formClassName={`mt-8 space-y-4 ${block} p-6`} messageClassName={`${block} p-5`} />
        </>
      ),
    });
  }

  return (
    <main className={`min-h-screen ${tone.bg} ${tone.ink}`} style={tone.style}>
      <header className={`overflow-hidden ${tone.soft} px-5 pb-14 pt-6 text-center`}>
        <Bunting tone={tone} />
        {config.theme?.cover?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.theme.cover.imageUrl} alt="" aria-hidden className={`mx-auto mt-10 aspect-square w-36 rounded-full border-4 ${tone.line} object-cover`} />
        )}
        <CorporateMark view={view} align="center" className="mt-10" />
        <p className={`inv-rise mt-10 text-sm font-semibold uppercase tracking-[0.2em] ${tone.accent}`}>{config.theme?.cover?.headline || 'Kamu diundang'}</p>
        <h1 className="mx-auto mt-4 max-w-2xl font-serif text-5xl leading-none text-balance [overflow-wrap:anywhere] sm:text-7xl">
          {names?.length
            ? names.filter(Boolean).map((name, index) => (
                <Fragment key={name ?? index}>
                  {index > 0 && <span className={`mx-3 ${tone.accent}`}>&amp;</span>}
                  <span dir="auto">{name}</span>
                </Fragment>
              ))
            : config.settings?.title || 'Undangan'}
        </h1>
        {organiser && (
          <p dir="auto" className={`mx-auto mt-4 max-w-xl text-sm ${tone.muted} [overflow-wrap:anywhere]`}>
            {organiser}
          </p>
        )}
        {tile && (
          <div className="inv-rise mt-10 flex flex-wrap items-center justify-center gap-4">
            <p className={`${block} px-6 py-4`}>
              <span className={`block text-xs uppercase tracking-widest ${tone.muted}`}>{tile.weekday}</span>
              <span className={`block font-serif text-6xl leading-none ${tone.accent}`}>{tile.day}</span>
              <span className="mt-1 block text-sm font-semibold">
                {tile.month} {tile.year}
              </span>
            </p>
            {(startTime || primaryEvent?.venueName) && (
              <ul className="flex max-w-60 flex-col items-center gap-2 text-center text-sm sm:items-start sm:text-left">
                {startTime && <li className={chip}>{startTime}</li>}
                {primaryEvent?.venueName && <li className={chip}>{primaryEvent.venueName}</li>}
              </ul>
            )}
          </div>
        )}
        {guest && (
          <p className={`inv-rise mx-auto mt-10 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 ${chip} py-3 text-sm`}>
            <span className={tone.muted}>Untuk</span>
            <bdi className="font-semibold [overflow-wrap:anywhere]">{guest.name}</bdi>
          </p>
        )}
      </header>

      {readOnly && <ReadOnlyNotice className="mx-auto max-w-2xl px-5 pt-8" />}

      {bands.map((band, index) => (
        <section key={band.key} className={index % 2 === 1 ? tone.soft : undefined}>
          <div className="mx-auto w-full max-w-2xl px-5 py-14 sm:py-20">{band.node}</div>
        </section>
      ))}

      <footer className={`px-5 pb-12 pt-8 text-center text-xs ${tone.muted}`}>
        <p>Undangan digital oleh Invitesion</p>
      </footer>
    </main>
  );
}

function BandHeading({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-4xl text-balance sm:text-5xl">{children}</h2>
      <span aria-hidden className={`mt-3 block h-1.5 w-14 rounded-full ${tone.accentFill}`} />
    </div>
  );
}

/** Umbul-umbul: a string of alternating pennants, CSS only. */
function Bunting({ tone }: { tone: Tone }) {
  return (
    <div aria-hidden className="mx-auto max-w-lg">
      <span className={`block h-px w-full ${tone.lineFill}`} />
      <span className="flex justify-between px-2">
        {Array.from({ length: 13 }, (_, index) => (
          <span key={index} className={`block h-5 w-4 [clip-path:polygon(0_0,100%_0,50%_100%)] ${index % 2 ? tone.accentFill : tone.inkFill}`} />
        ))}
      </span>
    </div>
  );
}
