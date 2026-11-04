import { CalendarDays, CalendarPlus, Clock3, MapPin } from 'lucide-react';
import { googleCalendarUrl } from '@/lib/invitation/calendar';
import { guestLinkSegment } from '@/lib/invitation/guest-link';
import { invitationCalendarPath } from '@/lib/invitation/public-path';
import { rsvpDefaultCount } from '@/lib/invitation/rsvp-rules';
import { submitGuestMessage, submitRsvp } from '@/app/i/[slug]/actions';
import type { GuestPageProps, GuestView, InvitationEvent } from '@/components/invitation/guest-view';

/**
 * Behaviour shared by every guest-page layout (legacy and the B-030 families). Layouts own composition and framing;
 * the forms, notices and calendar links stay one implementation, so identity from the guest link, the guest-count
 * limit and the status messages cannot drift between layouts. Markup is the legacy page's, unchanged.
 */

export function Notice({ kind, children }: { kind: 'success' | 'error'; children: React.ReactNode }) {
  return kind === 'success' ? (
    <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
      {children}
    </p>
  ) : (
    <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
      {children}
    </p>
  );
}

export function ReadOnlyNotice({ className = 'mx-auto max-w-xl px-6' }: { className?: string }) {
  return (
    <p className={className}>
      <span className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
        Undangan ini sudah melewati masa aktif. Kamu masih bisa melihat detailnya, tetapi RSVP dan buku tamu sudah ditutup.
      </span>
    </p>
  );
}

export function EventFacts({
  event,
  view,
  className = 'mt-4 space-y-2 text-sm',
  rowClassName = 'flex items-center gap-2',
  venueRowClassName = 'flex items-start gap-2',
}: {
  event: InvitationEvent;
  view: GuestView;
  className?: string;
  rowClassName?: string;
  venueRowClassName?: string;
}) {
  const { tone, formatDate, formatTime } = view;
  return (
    <dl className={className}>
      {formatDate(event.startAt) && (
        <div className={rowClassName}>
          <CalendarDays className={`h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
          <dd>{formatDate(event.startAt)}</dd>
        </div>
      )}
      {formatTime(event.startAt) && (
        <div className={rowClassName}>
          <Clock3 className={`h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
          <dd>
            {formatTime(event.startAt)}
            {formatTime(event.endAt) ? ` – ${formatTime(event.endAt)}` : ''}
          </dd>
        </div>
      )}
      {(event.venueName || event.address) && (
        <div className={venueRowClassName}>
          <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
          <dd>
            {event.venueName && <span className="block font-medium">{event.venueName}</span>}
            {event.address && <span className={`block ${tone.muted}`}>{event.address}</span>}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function MapLink({ event, view, className = 'mt-5' }: { event: InvitationEvent; view: GuestView; className?: string }) {
  if (!event.mapUrl) return null;
  return (
    <a
      href={event.mapUrl}
      target="_blank"
      rel="noreferrer"
      className={`${className} inline-flex min-h-11 items-center rounded-full border border-current px-5 text-xs font-semibold ${view.tone.accent}`}
    >
      Lihat lokasi
    </a>
  );
}

export function CalendarLinks({
  view,
  slug,
  className = 'mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center',
}: {
  view: GuestView;
  slug: string;
  className?: string;
}) {
  const { tone, showCountdown, primaryCalendarEvent } = view;
  if (!showCountdown || !primaryCalendarEvent) return null;
  return (
    <div className={className}>
      <a
        href={googleCalendarUrl(primaryCalendarEvent)}
        target="_blank"
        rel="noreferrer"
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-5 text-xs font-semibold ${tone.accent}`}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden />
        Simpan ke Google Calendar
      </a>
      <a
        href={invitationCalendarPath(slug)}
        download
        className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-current px-5 text-xs font-semibold ${tone.accent}`}
      >
        <CalendarPlus className="h-4 w-4" aria-hidden />
        Unduh kalender (.ics)
      </a>
    </div>
  );
}

/**
 * B-029: the programme a corporate host typed (`view.programme`), each section only when filled, in one fixed order
 * after the event list. Layouts own the section frame and heading; rows, link rules and order stay here. Host text is
 * isolated for bidirectional scripts and wraps instead of overflowing at 360 px.
 */
export const PROGRAMME_HEADINGS = {
  about: 'Tentang Acara',
  agenda: 'Susunan Acara',
  speakers: 'Pembicara',
  info: 'Informasi Tamu',
} as const;

export type ProgrammeSectionId = keyof typeof PROGRAMME_HEADINGS;

export function programmeSections(view: GuestView): ProgrammeSectionId[] {
  const { programme } = view;
  if (!programme) return [];
  const filled: Record<ProgrammeSectionId, boolean> = {
    about: Boolean(programme.description),
    agenda: programme.agenda.length > 0,
    speakers: programme.speakers.length > 0,
    info: Boolean(programme.dressCode || programme.contact),
  };
  return (Object.keys(PROGRAMME_HEADINGS) as ProgrammeSectionId[]).filter((id) => filled[id]);
}

const HOST_TEXT = '[overflow-wrap:anywhere]';

export function ProgrammeBody({ id, view, cardClassName }: { id: ProgrammeSectionId; view: GuestView; cardClassName: string }) {
  const { programme, tone } = view;
  if (!programme) return null;

  if (id === 'about') {
    return (
      <p dir="auto" className={`mt-6 whitespace-pre-line text-sm leading-7 ${HOST_TEXT}`}>
        {programme.description}
      </p>
    );
  }

  // One card with divided rows: 30 rows as 30 cards took ≈ 3,100 px at 360 px (s15 review F1); from 640 px the time
  // gets its own column so a guest scans times down one edge.
  if (id === 'agenda') {
    return (
      <ol className={`mt-8 ${cardClassName} px-5`}>
        {programme.agenda.map((row, index) => (
          <li key={index} className={`py-4 sm:grid sm:grid-cols-[7rem_1fr] sm:gap-4 sm:text-left ${index > 0 ? `border-t ${tone.line}` : ''}`}>
            {row.time ? (
              <p dir="auto" className={`text-xs font-semibold uppercase tracking-widest ${tone.accent} sm:pt-1 ${HOST_TEXT}`}>
                {row.time}
              </p>
            ) : (
              <span aria-hidden className="hidden sm:block" />
            )}
            <div className="min-w-0">
              <p dir="auto" className={`${row.time ? 'mt-1 sm:mt-0 ' : ''}font-medium leading-snug ${HOST_TEXT}`}>
                {row.title}
              </p>
              {row.speaker && (
                <p dir="auto" className={`mt-1 text-sm ${tone.muted} ${HOST_TEXT}`}>
                  {row.speaker}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (id === 'speakers') {
    return (
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {programme.speakers.map((speaker, index) => (
          <li key={index} className={`${cardClassName} p-5`}>
            <p dir="auto" className={`font-medium leading-snug ${HOST_TEXT}`}>
              {speaker.name}
            </p>
            {speaker.role && (
              <p dir="auto" className={`mt-1 text-sm ${tone.muted} ${HOST_TEXT}`}>
                {speaker.role}
              </p>
            )}
            {speaker.org && (
              <p dir="auto" className={`text-sm ${tone.muted} ${HOST_TEXT}`}>
                {speaker.org}
              </p>
            )}
          </li>
        ))}
      </ul>
    );
  }

  const { dressCode, contact } = programme;
  const link = `inline-flex min-h-11 items-center font-semibold underline underline-offset-4 ${tone.accent} ${HOST_TEXT}`;
  const contactValue = (value: { label: string; href?: string }) =>
    value.href ? (
      <a href={value.href} className={link}>
        {value.label}
      </a>
    ) : (
      <span dir="auto" className={HOST_TEXT}>
        {value.label}
      </span>
    );
  return (
    <dl className={`mt-8 flex flex-col gap-5 ${cardClassName} p-5 text-sm`}>
      {dressCode && (
        <div>
          <dt className={`text-xs uppercase tracking-widest ${tone.muted}`}>Dress code</dt>
          <dd dir="auto" className={`mt-1 font-medium ${HOST_TEXT}`}>
            {dressCode}
          </dd>
        </div>
      )}
      {contact && (
        <div>
          <dt className={`text-xs uppercase tracking-widest ${tone.muted}`}>Narahubung</dt>
          {contact.name && (
            <dd dir="auto" className={`mt-1 font-medium ${HOST_TEXT}`}>
              {contact.name}
            </dd>
          )}
          {contact.phone && <dd>{contactValue(contact.phone)}</dd>}
          {contact.email && <dd>{contactValue(contact.email)}</dd>}
        </div>
      )}
    </dl>
  );
}

/** RSVP: status notices, then the form for a recognised guest of an active invitation, otherwise an explanation. */
export function RsvpBlock({
  props,
  view,
  formClassName,
  fallbackClassName,
}: {
  props: GuestPageProps;
  view: GuestView;
  formClassName: string;
  fallbackClassName: string;
}) {
  const { invitation, guest, readOnly, status } = props;
  const { tone, canRespond } = view;
  return (
    <>
      {status.rsvp === 'saved' && <Notice kind="success">Terima kasih, konfirmasimu sudah kami terima.</Notice>}
      {status.rsvp === 'invalid' && <Notice kind="error">Pilihan kehadiran tidak dikenali. Silakan coba lagi.</Notice>}

      {canRespond && guest ? (
        <form action={submitRsvp} className={formClassName}>
          <input type="hidden" name="slug" value={invitation.slug} />
          <input type="hidden" name="guestSlug" value={guestLinkSegment(guest)} />

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Nama</span>
            {/* Prefilled and locked: identity comes from the guest link, not user input. */}
            <input
              value={guest.name}
              disabled
              readOnly
              aria-describedby="rsvp-name-hint"
              className={`h-11 w-full rounded-lg border ${tone.line} ${tone.soft} px-3 text-sm`}
            />
            <span id="rsvp-name-hint" className={`block text-xs ${tone.muted}`}>
              Nama diambil dari undangan personalmu.
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Jumlah yang hadir</span>
            <input
              name="guestCount"
              type="number"
              min={1}
              max={guest.guestCount || 1}
              defaultValue={rsvpDefaultCount(guest)}
              className={`h-11 w-full rounded-lg border ${tone.line} ${tone.field} px-3 text-sm`}
            />
            <span className={`block text-xs ${tone.muted}`}>Maksimal {guest.guestCount || 1} orang untuk undangan ini.</span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              name="status"
              value="CONFIRMED"
              className="min-h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Ya, saya hadir
            </button>
            <button
              type="submit"
              name="status"
              value="DECLINED"
              className={`min-h-11 rounded-lg border ${tone.line} ${tone.field} px-4 text-sm font-semibold transition ${tone.hoverSoft}`}
            >
              Maaf, belum bisa
            </button>
          </div>

          {guest.rsvpStatus !== 'PENDING' && (
            <p className={`text-center text-xs ${tone.muted}`}>
              Jawaban terakhirmu: {guest.rsvpStatus === 'CONFIRMED' ? 'hadir' : 'tidak hadir'}. Kamu masih bisa mengubahnya.
            </p>
          )}
        </form>
      ) : (
        <p className={fallbackClassName}>
          {readOnly
            ? 'RSVP untuk undangan ini sudah ditutup.'
            : 'Konfirmasi kehadiran tersedia melalui tautan undangan personal yang dikirimkan kepadamu.'}
        </p>
      )}
    </>
  );
}

/** Guestbook: status notices, the form for a recognised guest, then the capped list of wishes. */
export function GuestbookBlock({
  props,
  view,
  formClassName,
  messageClassName,
  listClassName = 'mt-8 space-y-3',
}: {
  props: GuestPageProps;
  view: GuestView;
  formClassName: string;
  messageClassName: string;
  listClassName?: string;
}) {
  const { invitation, guest, messages, status, totalMessages = messages.length, hiddenMessageCount = 0 } = props;
  const { tone, canRespond } = view;
  return (
    <>
      {status.wish === 'saved' && <Notice kind="success">Terima kasih atas ucapanmu.</Notice>}
      {status.wish === 'invalid' && <Notice kind="error">Ucapan tidak boleh kosong.</Notice>}

      {canRespond && guest && (
        <form action={submitGuestMessage} className={formClassName}>
          <input type="hidden" name="slug" value={invitation.slug} />
          <input type="hidden" name="guestSlug" value={guestLinkSegment(guest)} />
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold">Ucapan dari {guest.name}</span>
            <textarea
              name="message"
              rows={4}
              required
              maxLength={1000}
              className={`w-full rounded-lg border ${tone.line} ${tone.field} p-3 text-sm ${tone.placeholder}`}
              placeholder="Tulis doa dan ucapan terbaikmu…"
            />
          </label>
          <button type="submit" className={`min-h-11 w-full rounded-lg border border-current px-4 text-sm font-semibold ${tone.accent}`}>
            Kirim ucapan
          </button>
        </form>
      )}

      <div className={listClassName}>
        {hiddenMessageCount > 0 && (
          // The list is capped for payload reasons. Saying so is better than
          // letting a guest assume the earlier wishes were lost.
          <p className={`text-center text-sm ${tone.muted}`}>
            Menampilkan {messages.length} ucapan terbaru dari {totalMessages}.
          </p>
        )}
        {messages.map((message) => (
          <article key={message.id} className={messageClassName}>
            <p className="font-semibold">{message.name}</p>
            <p className="mt-2 text-sm leading-7">{message.message}</p>
          </article>
        ))}
        {!messages.length && <p className={`text-center text-sm ${tone.muted}`}>Belum ada ucapan. Jadilah yang pertama.</p>}
      </div>
    </>
  );
}
