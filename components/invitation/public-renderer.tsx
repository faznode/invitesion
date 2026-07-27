import { CalendarDays, Clock3, Gift, MapPin, Quote as QuoteIcon, Radio } from 'lucide-react';
import type { DetailConfig } from '@/lib/invitation/detail-config';
import type { Guest, Invitation, MediaAsset } from '@/lib/db/schema';
import { submitGuestMessage, submitRsvp } from '@/app/i/[slug]/actions';

type Message = { id: number; name: string; message: string; createdAt: Date };

type Props = {
  invitation: Invitation;
  config: DetailConfig;
  guest: Guest | null;
  media: MediaAsset[];
  /** The most recent page of guestbook messages, oldest first. */
  messages: Message[];
  /** Total visible messages, so a capped list can say what it is hiding. */
  totalMessages?: number;
  hiddenMessageCount?: number;
  readOnly: boolean;
  status: { rsvp?: string; wish?: string };
};

/**
 * Deterministic config -> HTML renderer.
 *
 * Every section is driven by the stored config, never by free-form generated
 * markup (handoff 1.3). The guest name is injected from the guests table, so a
 * single config serves every guest of an invitation.
 */

const palettes: Record<string, { bg: string; ink: string; accent: string; soft: string }> = {
  ivory: { bg: 'bg-[#faf7f2]', ink: 'text-[#3f3a34]', accent: 'text-[#a1743c]', soft: 'bg-[#f1e9dd]' },
  'rose-gold': { bg: 'bg-[#fdf6f4]', ink: 'text-[#453437]', accent: 'text-[#b76e79]', soft: 'bg-[#f7e4e3]' },
  confetti: { bg: 'bg-[#fef8f3]', ink: 'text-[#3b3340]', accent: 'text-[#e2653f]', soft: 'bg-[#fde5d6]' },
  sage: { bg: 'bg-[#f5f8f4]', ink: 'text-[#34403a]', accent: 'text-[#5f7d63]', soft: 'bg-[#e3ede2]' },
  sand: { bg: 'bg-[#faf7f0]', ink: 'text-[#403a30]', accent: 'text-[#9a7a4f]', soft: 'bg-[#efe6d5]' },
  slate: { bg: 'bg-[#f6f7f9]', ink: 'text-[#2b3138]', accent: 'text-[#3f6fa8]', soft: 'bg-[#e5eaf1]' },
  // Catalog palettes — every paletteId used by lib/invitation/templates.ts is registered here.
  midnight: { bg: 'bg-[#101526]', ink: 'text-[#e8e9f2]', accent: 'text-[#d3b16a]', soft: 'bg-[#1c2338]' },
  terracotta: { bg: 'bg-[#faf3ee]', ink: 'text-[#41332c]', accent: 'text-[#bd5f34]', soft: 'bg-[#f3e0d3]' },
  orchid: { bg: 'bg-[#faf6fb]', ink: 'text-[#3d3242]', accent: 'text-[#8e5a9e]', soft: 'bg-[#efe0f2]' },
  emerald: { bg: 'bg-[#f2f7f4]', ink: 'text-[#22352b]', accent: 'text-[#1f6f50]', soft: 'bg-[#dcebe2]' },
  dusk: { bg: 'bg-[#f6f4f9]', ink: 'text-[#33303f]', accent: 'text-[#6a5acd]', soft: 'bg-[#e6e1f2]' },
  mocha: { bg: 'bg-[#f9f5f1]', ink: 'text-[#3c332c]', accent: 'text-[#8a6248]', soft: 'bg-[#eee2d7]' },
  ocean: { bg: 'bg-[#f3f8fa]', ink: 'text-[#27353d]', accent: 'text-[#2a7f9e]', soft: 'bg-[#dcedf2]' },
  blossom: { bg: 'bg-[#fdf5f6]', ink: 'text-[#43333a]', accent: 'text-[#d26d85]', soft: 'bg-[#f8e2e7]' },
  'gold-noir': { bg: 'bg-[#171310]', ink: 'text-[#f1e9dc]', accent: 'text-[#caa353]', soft: 'bg-[#262019]' },
  lavender: { bg: 'bg-[#f8f6fc]', ink: 'text-[#3a3547]', accent: 'text-[#7d6bb3]', soft: 'bg-[#ebe5f6]' },
  mint: { bg: 'bg-[#f3faf6]', ink: 'text-[#2c3b33]', accent: 'text-[#3e8e6b]', soft: 'bg-[#def0e6]' },
  sunshine: { bg: 'bg-[#fffaf0]', ink: 'text-[#3f3626]', accent: 'text-[#d98e04]', soft: 'bg-[#fdedcb]' },
};

function palette(id?: string) {
  return palettes[id ?? ''] ?? palettes.ivory;
}

/** The headline pair/person differs per event type; config keeps them separate. */
function headlineFor(invitation: Invitation, config: DetailConfig) {
  switch (invitation.eventType) {
    case 'wedding': {
      const bride = config.couple?.bride?.nickName || config.couple?.bride?.fullName;
      const groom = config.couple?.groom?.nickName || config.couple?.groom?.fullName;
      if (!bride && !groom) return null;
      return config.couple?.displayOrder === 'groom-first' ? [groom, bride] : [bride, groom];
    }
    case 'birthday':
      return [config.birthdayPerson?.nickName || config.birthdayPerson?.fullName].filter(Boolean) as string[];
    case 'corporate':
      return [config.corporateProfile?.eventName || config.corporateProfile?.organizationName].filter(Boolean) as string[];
    default:
      return [config.ceremonyProfile?.nickName || config.ceremonyProfile?.honoureeName].filter(Boolean) as string[];
  }
}

function formatDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-xl px-6 py-12 sm:py-16 ${className}`}>{children}</section>;
}

function Heading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return <h2 className={`text-center font-serif text-2xl ${accent}`}>{children}</h2>;
}

export function PublicInvitationRenderer({
  invitation,
  config,
  guest,
  media,
  messages,
  totalMessages = messages.length,
  hiddenMessageCount = 0,
  readOnly,
  status,
}: Props) {
  const tone = palette(config.theme?.paletteId);
  const names = headlineFor(invitation, config);
  const events = config.events ?? [];
  const primaryEvent = events[0];
  const gallery = config.gallery?.enabled !== false ? media.filter((asset) => asset.type === 'photo') : [];
  const canRespond = Boolean(guest) && !readOnly;

  return (
    <main className={`min-h-screen ${tone.bg} ${tone.ink}`}>
      {/* Cover */}
      <header className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
        {config.theme?.cover?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={config.theme.cover.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative">
          {config.theme?.cover?.headline && <p className={`text-xs uppercase tracking-[0.3em] ${tone.accent}`}>{config.theme.cover.headline}</p>}
          {names?.length ? (
            <h1 className="mt-6 font-serif text-4xl leading-tight sm:text-5xl">
              {names.filter(Boolean).map((name, index) => (
                <span key={name ?? index} className="block">
                  {index > 0 && <span className={`my-2 block text-2xl ${tone.accent}`}>&</span>}
                  {name}
                </span>
              ))}
            </h1>
          ) : (
            <h1 className="mt-6 font-serif text-4xl sm:text-5xl">{config.settings?.title || 'Undangan'}</h1>
          )}
          {primaryEvent?.startAt && <p className={`mt-6 text-sm tracking-wide ${tone.accent}`}>{formatDate(primaryEvent.startAt)}</p>}

          {guest && (
            <div className={`mt-10 inline-block rounded-2xl ${tone.soft} px-6 py-4`}>
              <p className="text-xs uppercase tracking-widest opacity-70">Kepada Yth.</p>
              <p className="mt-1 font-serif text-xl">{guest.name}</p>
            </div>
          )}
        </div>
      </header>

      {readOnly && (
        <p className="mx-auto max-w-xl px-6">
          <span className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            Undangan ini sudah melewati masa aktif. Kamu masih bisa melihat detailnya, tetapi RSVP dan buku tamu sudah ditutup.
          </span>
        </p>
      )}

      {config.greetings?.enabled !== false && (config.greetings?.prayer || config.settings?.openingCopy) && (
        <Section className="text-center">
          {config.greetings?.prayer && <p className={`font-serif text-lg ${tone.accent}`}>{config.greetings.prayer}</p>}
          {config.settings?.openingCopy && <p className="mt-4 text-sm leading-7 opacity-80">{config.settings.openingCopy}</p>}
        </Section>
      )}

      {config.quote?.enabled && config.quote.text && (
        <Section className="text-center">
          <QuoteIcon className={`mx-auto h-6 w-6 ${tone.accent}`} aria-hidden />
          <blockquote className="mt-4 font-serif text-lg leading-8">{config.quote.text}</blockquote>
          {config.quote.author && <cite className="mt-3 block text-xs uppercase tracking-widest opacity-60">{config.quote.author}</cite>}
        </Section>
      )}

      {events.length > 0 && (
        <Section>
          <Heading accent={tone.accent}>Rangkaian Acara</Heading>
          <div className="mt-8 space-y-4">
            {events.map((event, index) => (
              <article key={`${event.title}-${index}`} className="rounded-2xl bg-white/70 p-6 shadow-sm">
                <h3 className="font-serif text-xl">{event.title}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  {formatDate(event.startAt) && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
                      <dd>{formatDate(event.startAt)}</dd>
                    </div>
                  )}
                  {formatTime(event.startAt) && (
                    <div className="flex items-center gap-2">
                      <Clock3 className={`h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
                      <dd>
                        {formatTime(event.startAt)}
                        {formatTime(event.endAt) ? ` – ${formatTime(event.endAt)}` : ''}
                      </dd>
                    </div>
                  )}
                  {(event.venueName || event.address) && (
                    <div className="flex items-start gap-2">
                      <MapPin className={`mt-0.5 h-4 w-4 shrink-0 ${tone.accent}`} aria-hidden />
                      <dd>
                        {event.venueName && <span className="block font-medium">{event.venueName}</span>}
                        {event.address && <span className="block opacity-75">{event.address}</span>}
                      </dd>
                    </div>
                  )}
                </dl>
                {event.note && <p className="mt-4 text-sm opacity-75">{event.note}</p>}
                {event.mapUrl && (
                  <a
                    href={event.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-5 inline-flex min-h-11 items-center rounded-full border border-current px-5 text-xs font-semibold ${tone.accent}`}
                  >
                    Lihat lokasi
                  </a>
                )}
              </article>
            ))}
          </div>
        </Section>
      )}

      {config.story?.enabled && config.story.items?.length ? (
        <Section>
          <Heading accent={tone.accent}>Cerita Kami</Heading>
          <ol className="mt-8 space-y-6">
            {config.story.items.map((item, index) => (
              <li key={index} className="rounded-2xl bg-white/70 p-6 shadow-sm">
                {item.date && <p className={`text-xs uppercase tracking-widest ${tone.accent}`}>{item.date}</p>}
                {item.title && <h3 className="mt-2 font-serif text-lg">{item.title}</h3>}
                {item.body && <p className="mt-2 text-sm leading-7 opacity-80">{item.body}</p>}
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {gallery.length > 0 && (
        <Section>
          <Heading accent={tone.accent}>Galeri</Heading>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {gallery.map((asset) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={asset.id} src={asset.url} alt="" className="aspect-square w-full rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        </Section>
      )}

      {config.streaming?.enabled && config.streaming.url && (
        <Section className="text-center">
          <Radio className={`mx-auto h-6 w-6 ${tone.accent}`} aria-hidden />
          <Heading accent={tone.accent}>Siaran Langsung</Heading>
          <a
            href={config.streaming.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-6 inline-flex min-h-11 items-center rounded-full border border-current px-6 text-sm font-semibold ${tone.accent}`}
          >
            Tonton siaran
          </a>
        </Section>
      )}

      {config.gift?.enabled && config.gift.accounts?.length ? (
        <Section>
          <Gift className={`mx-auto h-6 w-6 ${tone.accent}`} aria-hidden />
          <Heading accent={tone.accent}>Hadiah</Heading>
          <div className="mt-8 space-y-3">
            {config.gift.accounts.map((account, index) => (
              <article key={index} className="rounded-2xl bg-white/70 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-widest opacity-60">{account.label}</p>
                {account.number && <p className="mt-2 font-mono text-base">{account.number}</p>}
                {account.holder && <p className="mt-1 text-sm opacity-75">a.n. {account.holder}</p>}
                {account.note && <p className="mt-2 text-sm opacity-70">{account.note}</p>}
              </article>
            ))}
          </div>
        </Section>
      ) : null}

      {/* RSVP — only a recognised guest can respond, and only while the invitation is active. */}
      {config.rsvp?.enabled !== false && (
        <Section>
          <Heading accent={tone.accent}>Konfirmasi Kehadiran</Heading>
          {status.rsvp === 'saved' && (
            <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              Terima kasih, konfirmasimu sudah kami terima.
            </p>
          )}
          {status.rsvp === 'invalid' && (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              Pilihan kehadiran tidak dikenali. Silakan coba lagi.
            </p>
          )}

          {canRespond && guest ? (
            <form action={submitRsvp} className="mt-8 space-y-5 rounded-2xl bg-white/70 p-6 shadow-sm">
              <input type="hidden" name="slug" value={invitation.slug} />
              <input type="hidden" name="guestSlug" value={guest.slug} />

              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Nama</span>
                {/* Prefilled and locked: identity comes from the guest link, not user input. */}
                <input
                  value={guest.name}
                  disabled
                  readOnly
                  aria-describedby="rsvp-name-hint"
                  className="h-11 w-full rounded-lg border border-black/10 bg-black/5 px-3 text-sm"
                />
                <span id="rsvp-name-hint" className="block text-xs opacity-60">
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
                  defaultValue={guest.guestCount || 1}
                  className="h-11 w-full rounded-lg border border-black/10 bg-white px-3 text-sm"
                />
                <span className="block text-xs opacity-60">Maksimal {guest.guestCount || 1} orang untuk undangan ini.</span>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  name="status"
                  value="CONFIRMED"
                  className="min-h-11 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Ya, saya hadir
                </button>
                <button
                  type="submit"
                  name="status"
                  value="DECLINED"
                  className="min-h-11 rounded-lg border border-black/15 bg-white px-4 text-sm font-semibold transition hover:bg-black/5"
                >
                  Maaf, belum bisa
                </button>
              </div>

              {guest.rsvpStatus !== 'PENDING' && (
                <p className="text-center text-xs opacity-70">
                  Jawaban terakhirmu: {guest.rsvpStatus === 'CONFIRMED' ? 'hadir' : 'tidak hadir'}. Kamu masih bisa mengubahnya.
                </p>
              )}
            </form>
          ) : (
            <p className="mt-8 rounded-2xl border border-dashed border-black/15 bg-white/60 p-6 text-center text-sm opacity-75">
              {readOnly
                ? 'RSVP untuk undangan ini sudah ditutup.'
                : 'Konfirmasi kehadiran tersedia melalui tautan undangan personal yang dikirimkan kepadamu.'}
            </p>
          )}
        </Section>
      )}

      {config.guestbook?.enabled !== false && (
        <Section>
          <Heading accent={tone.accent}>{config.guestbook?.heading || 'Ucapan & Doa'}</Heading>
          {config.guestbook?.prompt && <p className="mt-3 text-center text-sm opacity-70">{config.guestbook.prompt}</p>}

          {status.wish === 'saved' && (
            <p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
              Terima kasih atas ucapanmu.
            </p>
          )}
          {status.wish === 'invalid' && (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              Ucapan tidak boleh kosong.
            </p>
          )}

          {canRespond && guest && (
            <form action={submitGuestMessage} className="mt-8 space-y-4 rounded-2xl bg-white/70 p-6 shadow-sm">
              <input type="hidden" name="slug" value={invitation.slug} />
              <input type="hidden" name="guestSlug" value={guest.slug} />
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold">Ucapan dari {guest.name}</span>
                <textarea
                  name="message"
                  rows={4}
                  required
                  maxLength={1000}
                  className="w-full rounded-lg border border-black/10 bg-white p-3 text-sm"
                  placeholder="Tulis doa dan ucapan terbaikmu…"
                />
              </label>
              <button type="submit" className={`min-h-11 w-full rounded-lg border border-current px-4 text-sm font-semibold ${tone.accent}`}>
                Kirim ucapan
              </button>
            </form>
          )}

          <div className="mt-8 space-y-3">
            {hiddenMessageCount > 0 && (
              // The list is capped for payload reasons. Saying so is better than
              // letting a guest assume the earlier wishes were lost.
              <p className="text-center text-sm opacity-60">
                Menampilkan {messages.length} ucapan terbaru dari {totalMessages}.
              </p>
            )}
            {messages.map((message) => (
              <article key={message.id} className="rounded-2xl bg-white/70 p-5 shadow-sm">
                <p className="font-semibold">{message.name}</p>
                <p className="mt-2 text-sm leading-7 opacity-80">{message.message}</p>
              </article>
            ))}
            {!messages.length && <p className="text-center text-sm opacity-60">Belum ada ucapan. Jadilah yang pertama.</p>}
          </div>
        </Section>
      )}

      <footer className="px-6 pb-12 pt-4 text-center text-xs opacity-50">
        <p>Undangan digital oleh Invitesion</p>
      </footer>
    </main>
  );
}
