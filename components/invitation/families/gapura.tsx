import { Fragment } from 'react';
import { Gift, Quote as QuoteIcon, Radio } from 'lucide-react';
import { Countdown } from '@/components/invitation/countdown';
import { CalendarLinks, EventFacts, GuestbookBlock, MapLink, ReadOnlyNotice, RsvpBlock } from '@/components/invitation/guest-blocks';
import type { GuestPageProps, GuestView } from '@/components/invitation/guest-view';

type Tone = GuestView['tone'];

/**
 * Gapura (B-030): symmetric and ceremonial. The cover sits inside a double gate arch, and event cards, gifts and forms
 * repeat the arch; a small diamond marks every section. Motion level 1: ornaments, date and guest block rise in once
 * (`inv-rise`, off under prefers-reduced-motion); the names never animate, so they paint first.
 */
export function GapuraLayout({ props, view }: { props: GuestPageProps; view: GuestView }) {
  const { invitation, config, guest, readOnly } = props;
  const { tone, formatDate, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, gallery } = view;
  const arch = `rounded-t-[3rem] rounded-b-2xl ${tone.card} shadow-sm`;

  return (
    <main className={`min-h-screen ${tone.bg} ${tone.ink}`} style={tone.style}>
      <header className="flex min-h-[90vh] flex-col items-center justify-center px-5 py-14 text-center">
        <div className={`w-full max-w-sm rounded-t-full border ${tone.line} p-2`}>
          <div className={`relative overflow-hidden rounded-t-full border ${tone.accentLine} px-6 pb-12 pt-20`}>
            {config.theme?.cover?.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.theme.cover.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-20" />
            )}
            <div className="relative flex flex-col items-center">
              <Diamond tone={tone} className="inv-rise" />
              {config.theme?.cover?.headline && (
                <p className={`inv-rise mt-6 text-xs uppercase tracking-[0.3em] ${tone.accent}`}>{config.theme.cover.headline}</p>
              )}
              <h1 className="mt-6 font-serif text-4xl leading-tight text-balance [overflow-wrap:anywhere] sm:text-5xl">
                {names?.length
                  ? names.filter(Boolean).map((name, index) => (
                      <Fragment key={name ?? index}>
                        {index > 0 && <AmpersandRule tone={tone} />}
                        <span className="block" dir="auto">
                          {name}
                        </span>
                      </Fragment>
                    ))
                  : config.settings?.title || 'Undangan'}
              </h1>
              {primaryEvent?.startAt && <p className={`inv-rise mt-8 text-sm tracking-wide ${tone.accent}`}>{formatDate(primaryEvent.startAt)}</p>}
            </div>
          </div>
        </div>

        {guest && (
          <div className={`inv-rise mt-6 w-full max-w-sm rounded-2xl ${tone.soft} px-6 py-4`}>
            <p className={`text-xs uppercase tracking-widest ${tone.muted}`}>Kepada Yth.</p>
            <p className="mt-1 font-serif text-xl [overflow-wrap:anywhere]" dir="auto">
              {guest.name}
            </p>
          </div>
        )}
      </header>

      {readOnly && <ReadOnlyNotice className="mx-auto max-w-lg px-6" />}

      {config.greetings?.enabled !== false && (config.greetings?.prayer || config.settings?.openingCopy) && (
        <ArchSection tone={tone}>
          {config.greetings?.prayer && <p className={`font-serif text-xl leading-relaxed text-balance ${tone.accent}`}>{config.greetings.prayer}</p>}
          {config.settings?.openingCopy && <p className="mt-4 text-sm leading-7 text-pretty">{config.settings.openingCopy}</p>}
        </ArchSection>
      )}

      {config.quote?.enabled && config.quote.text && (
        <ArchSection tone={tone}>
          <QuoteIcon className={`mx-auto h-6 w-6 ${tone.accent}`} aria-hidden />
          <blockquote className="mt-4 font-serif text-xl leading-8 text-pretty">{config.quote.text}</blockquote>
          {config.quote.author && <cite className={`mt-3 block text-xs uppercase not-italic tracking-widest ${tone.muted}`}>{config.quote.author}</cite>}
        </ArchSection>
      )}

      {events.length > 0 && (
        <ArchSection tone={tone} title="Rangkaian Acara">
          {showCountdown && primaryEvent && (
            <Countdown
              target={primaryStartMs}
              initialNow={renderedAt}
              eventTitle={primaryEvent.title}
              boxClassName={`rounded-t-3xl ${tone.soft}`}
              labelClassName={tone.muted}
            />
          )}
          <div className="mt-10 flex flex-col gap-6">
            {events.map((event, index) => (
              <article key={`${event.title}-${index}`} className={`${arch} px-6 pb-8 pt-10`}>
                <Diamond tone={tone} />
                <h3 className="mt-4 font-serif text-2xl text-balance">{event.title}</h3>
                <EventFacts
                  event={event}
                  view={view}
                  className="mt-5 flex flex-col items-center gap-2 text-sm"
                  rowClassName="flex items-center justify-center gap-2"
                  venueRowClassName="flex max-w-xs items-start justify-center gap-2"
                />
                {event.note && <p className={`mt-4 text-sm ${tone.muted}`}>{event.note}</p>}
                <MapLink event={event} view={view} />
              </article>
            ))}
          </div>
          <CalendarLinks view={view} slug={invitation.slug} />
        </ArchSection>
      )}

      {config.story?.enabled && config.story.items?.length ? (
        <ArchSection tone={tone} title="Cerita Kami">
          <ol className="mt-10 flex flex-col items-center">
            {config.story.items.map((item, index) => (
              <li key={index} className="flex flex-col items-center">
                {index > 0 && <span aria-hidden className={`my-6 block h-10 w-px ${tone.lineFill}`} />}
                {item.date && <p className={`text-xs uppercase tracking-widest ${tone.accent}`}>{item.date}</p>}
                {item.title && <h3 className="mt-2 font-serif text-xl text-balance">{item.title}</h3>}
                {item.body && <p className="mt-2 max-w-md text-sm leading-7 text-pretty">{item.body}</p>}
              </li>
            ))}
          </ol>
        </ArchSection>
      ) : null}

      {gallery.length > 0 && (
        <ArchSection tone={tone} title="Galeri">
          <div className="mt-10 grid grid-cols-2 gap-3">
            {gallery.map((asset) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={asset.id} src={asset.url} alt="" className="aspect-[3/4] w-full rounded-t-full object-cover" loading="lazy" />
            ))}
          </div>
        </ArchSection>
      )}

      {config.streaming?.enabled && config.streaming.url && (
        <ArchSection tone={tone} title="Siaran Langsung">
          <Radio className={`mx-auto mt-6 h-6 w-6 ${tone.accent}`} aria-hidden />
          <a
            href={config.streaming.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-6 inline-flex min-h-11 items-center rounded-full border border-current px-6 text-sm font-semibold ${tone.accent}`}
          >
            Tonton siaran
          </a>
        </ArchSection>
      )}

      {config.gift?.enabled && config.gift.accounts?.length ? (
        <ArchSection tone={tone} title="Tanda Kasih">
          <Gift className={`mx-auto mt-6 h-6 w-6 ${tone.accent}`} aria-hidden />
          <div className="mt-8 flex flex-col gap-4">
            {config.gift.accounts.map((account, index) => (
              <article key={index} className={`${arch} px-6 pb-6 pt-9`}>
                <p className={`text-xs uppercase tracking-widest ${tone.muted}`}>{account.label}</p>
                {account.number && <p className="mt-2 font-mono text-lg tracking-wide [overflow-wrap:anywhere]">{account.number}</p>}
                {account.holder && <p className={`mt-1 text-sm ${tone.muted}`}>a.n. {account.holder}</p>}
                {account.note && <p className={`mt-2 text-sm ${tone.muted}`}>{account.note}</p>}
              </article>
            ))}
          </div>
        </ArchSection>
      ) : null}

      {/* RSVP — only a recognised guest can respond, and only while the invitation is active. */}
      {config.rsvp?.enabled !== false && (
        <ArchSection tone={tone} title="Konfirmasi Kehadiran">
          <RsvpBlock
            props={props}
            view={view}
            formClassName={`mt-8 space-y-5 ${arch} p-6 pt-10 text-left`}
            fallbackClassName={`mt-8 ${arch} border border-dashed ${tone.line} px-6 pb-6 pt-10 text-sm ${tone.muted}`}
          />
        </ArchSection>
      )}

      {config.guestbook?.enabled !== false && (
        <ArchSection tone={tone} title={config.guestbook?.heading || 'Ucapan & Doa'}>
          {config.guestbook?.prompt && <p className={`mt-3 text-sm ${tone.muted}`}>{config.guestbook.prompt}</p>}
          <GuestbookBlock
            props={props}
            view={view}
            formClassName={`mt-8 space-y-4 ${arch} p-6 pt-10 text-left`}
            messageClassName={`rounded-2xl ${tone.card} p-5 text-left shadow-sm`}
          />
        </ArchSection>
      )}

      <footer className={`flex flex-col items-center gap-4 px-6 pb-12 pt-4 text-center text-xs ${tone.muted}`}>
        <Diamond tone={tone} />
        <p>Undangan digital oleh Invitesion</p>
      </footer>
    </main>
  );
}

function ArchSection({ tone, title, children }: { tone: Tone; title?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-lg px-6 py-14 text-center sm:py-20">
      {title && (
        <>
          <Diamond tone={tone} />
          <h2 className={`mt-4 font-serif text-3xl text-balance ${tone.accent}`}>{title}</h2>
        </>
      )}
      {children}
    </section>
  );
}

function Diamond({ tone, className = '' }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={`mx-auto block size-2 rotate-45 ${tone.accentFill} ${className}`} />;
}

function AmpersandRule({ tone }: { tone: Tone }) {
  return (
    <span className={`my-3 flex items-center justify-center gap-3 text-2xl ${tone.accent}`}>
      <span aria-hidden className={`h-px w-10 ${tone.accentFill}`} />
      &amp;
      <span aria-hidden className={`h-px w-10 ${tone.accentFill}`} />
    </span>
  );
}
