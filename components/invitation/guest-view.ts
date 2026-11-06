import { isFlagOn } from '@/lib/flags';
import { safeAudioSrc } from '@/lib/invitation/audio-url';
import { calendarEventsFromConfig } from '@/lib/invitation/calendar';
import { ceremonyProfileOf } from '@/lib/invitation/ceremony-profile';
import { corporateMarkOf } from '@/lib/invitation/corporate-mark';
import type { DetailConfig } from '@/lib/invitation/detail-config';
import { guestAudience, visibleEvents, type EventAudience } from '@/lib/invitation/event-eligibility';
import { eventDateParts, formatEventDate, formatEventTime } from '@/lib/invitation/event-time';
import { invitationDisplayName, invitationHeadline } from '@/lib/invitation/headline';
import { guestLinkSegment } from '@/lib/invitation/guest-link';
import { safeImageSrc } from '@/lib/invitation/image-url';
import { palette } from '@/lib/invitation/palettes';
import { birthdayPortrait, ceremonyPortrait, childPhotoSlotOf, childPhotoSrcFor, couplePortraits } from '@/lib/invitation/portraits';
import { guestChildPhotoPath } from '@/lib/invitation/public-path';
import { programmeOf } from '@/lib/invitation/programme';
import { answerField, askableQuestions, conditionText, isMultiChoice, readStoredAnswers, rsvpQuestionsOf } from '@/lib/invitation/rsvp-questions';
import { eventCountField, eventStatusField, perEventRsvpEvents, readEventAnswers } from '@/lib/invitation/rsvp-events';
import { rsvpDeadlinePassed } from '@/lib/invitation/rsvp-rules';
import { shareOf } from '@/lib/invitation/share';
import type { Guest, Invitation, MediaAsset } from '@/lib/db/schema';

/** A listed wish; `hostReply` is the host's answer (R-04), rendered under it. */
export type GuestMessage = { id: number; name: string; message: string; createdAt: Date; hostReply?: string | null };

export type GuestPageProps = {
  invitation: Invitation;
  config: DetailConfig;
  guest: Guest | null;
  media: MediaAsset[];
  /** The most recent page of guestbook messages, oldest first. */
  messages: GuestMessage[];
  /** Total visible messages, so a capped list can say what it is hiding. */
  totalMessages?: number;
  hiddenMessageCount?: number;
  readOnly: boolean;
  /**
   * Outcome of the last submit (`?rsvp=`, `?wish=`); `rsvpq` names the question an `rsvp=answers` refusal is about and
   * `rsvpe` the event an `rsvp=events` refusal is about (D-036).
   */
  /**
   * Notices after a form post: `rsvpr` / `wishr` = seconds until a limit's window ends, `rsvpk` / `wishk` = the key a
   * retry must reuse.
   */
  status: { rsvp?: string; wish?: string; rsvpq?: string; rsvpe?: string; rsvpr?: string; rsvpk?: string; wishr?: string; wishk?: string };
  /** The host's own preview (`/preview/[id]`): every event is shown, invite-only ones included (D-037). */
  preview?: boolean;
  /**
   * R-03: a key minted for this rendering of the RSVP form and sent back with it, so a double submit writes once
   * (`Idempotency-Key` on the Rust writer). Only the personal guest page mints one; without it the form has no key.
   */
  rsvpKey?: string;
  /** R-04: the same for the wish form, so a double submit stores one wish. */
  wishKey?: string;
};

/**
 * What every layout derives from the stored config, computed once so the legacy layout and each design family (B-030)
 * show the same data: dates in the event's own zone, the countdown rule, the calendar entry and who may respond.
 */
export function buildGuestView({ invitation, config, guest, media, readOnly, preview = false }: GuestPageProps) {
  const tone = palette(config.theme?.paletteId);
  // Event-local wall clock with WIB / WITA / WIT from the saved offset, whatever zone the server runs in (B-004).
  const eventZone = config.eventOperations?.timezone;
  const formatDate = (value?: string) => formatEventDate(value, eventZone);
  const formatTime = (value?: string) => formatEventTime(value, eventZone);
  const dateParts = (value?: string) => eventDateParts(value, eventZone);
  const names = invitationHeadline(invitation.eventType, config);
  // D-037: the events this page may show. A guest sees open events and the invite-only ones they are invited to; a page
  // without a guest link sees open events only; the host's preview sees all. Countdown, calendar entry and the per-event
  // form below all start from this list, so an event a guest may not see never reaches their page in any form.
  const inviteOnlyOn = isFlagOn('INVITE_ONLY_EVENTS');
  const audience: EventAudience = preview ? { kind: 'owner' } : guestAudience(guest);
  const events = visibleEvents(config.events, audience, inviteOnlyOn);
  const primaryEvent = events[0];
  // B-008: countdown and save-the-date only for a future primary event; the calendar file only exists once published.
  const renderedAt = Date.now();
  const primaryStartMs = primaryEvent?.startAt ? Date.parse(primaryEvent.startAt) : Number.NaN;
  const showCountdown = isFlagOn('GUEST_CALENDAR') && Number.isFinite(primaryStartMs) && primaryStartMs > renderedAt;
  const primaryCalendarEvent =
    showCountdown && primaryEvent && invitation.status === 'PUBLISHED'
      ? calendarEventsFromConfig({ slug: invitation.slug, displayName: invitationDisplayName(invitation.eventType, config), events: [primaryEvent] })[0]
      : undefined;
  const gallery = config.gallery?.enabled !== false ? media.filter((asset) => asset.type === 'photo') : [];
  const canRespond = Boolean(guest) && !readOnly;
  // B-027: the host's RSVP deadline closes the RSVP form only (the guestbook stays open); the action applies the same
  // rule to every POST, so a page rendered before the deadline cannot write after it.
  const rsvpDeadline = config.rsvp?.deadline;
  const rsvpClosedByDeadline = rsvpDeadlinePassed(rsvpDeadline, renderedAt);
  // Shown only when the rule reads the same value, so the page never announces a deadline the action would not enforce.
  const deadlineParts = rsvpDeadline && Number.isFinite(Date.parse(rsvpDeadline)) ? [formatDate(rsvpDeadline), formatTime(rsvpDeadline)] : [];
  const rsvpDeadlineText = deadlineParts.length === 2 && deadlineParts.every(Boolean) ? deadlineParts.join(', ') : undefined;
  const canRsvp = canRespond && !rsvpClosedByDeadline;
  // B-027: the "maybe" choice follows the same flag the action checks, so the form never offers an answer it would refuse.
  const rsvpMaybe = isFlagOn('RSVP_MAYBE');
  // B-027 (D-034): the host's questions in the RSVP form, by the flag and rules the action applies. Each carries the
  // guest's stored answer, so a returning guest sees what they sent and can change it.
  // S18-Q3: a question that can never apply (a cycle, or a condition no option can meet) is not shown at all.
  const questionList = isFlagOn('RSVP_QUESTIONS')
    ? askableQuestions(rsvpQuestionsOf({ enabled: config.registrationForm?.enabled, customQuestions: config.registrationForm?.customQuestions }))
    : [];
  // B-027 slice 2c (D-036): one answer per event, by the flag and switch the action reads, keyed by the durable event id.
  // D-037: over the listed events this guest is invited to; with fewer than two the single answer stands for them.
  const askedEvents = visibleEvents(perEventRsvpEvents({ perEvent: config.rsvp?.perEvent, events: config.events }, isFlagOn('RSVP_PER_EVENT')), audience, inviteOnlyOn);
  const rsvpEventList = askedEvents.length >= 2 ? askedEvents : [];
  const storedEventAnswers = readEventAnswers(guest?.rsvpEventAnswers);
  const rsvpEvents = rsvpEventList.map((event) => ({
    id: event.id,
    title: event.title,
    details: [formatDate(event.startAt), formatTime(event.startAt), event.venueName].filter(Boolean).join(' · '),
    statusField: eventStatusField(event.id),
    countField: eventCountField(event.id),
    stored: storedEventAnswers[event.id],
  }));
  const questionsById = new Map(questionList.map((question) => [question.id, question]));
  const storedAnswers = readStoredAnswers(guest?.rsvpAnswers);
  const rsvpQuestions = questionList.map((question) => ({
    ...question,
    field: answerField(question.id),
    // HTML can require only an unconditional question with one answer; the action checks the rest ("hadir" only). With
    // per-event answers the overall status is known only to the action, so the browser requires none.
    nativeRequired: question.required && !question.conditional && !isMultiChoice(question) && rsvpEvents.length === 0,
    condition: conditionText(question, questionsById),
    stored: storedAnswers[question.id],
  }));
  // The host's section switches, read once: layouts render a section only while it is shown, and a refusal for a section
  // switched off after the guest's page was rendered is announced by `SwitchedOffNotices` instead.
  const rsvpShown = config.rsvp?.enabled !== false;
  const guestbookShown = config.guestbook?.enabled !== false;
  // R-04 (D-044): a hosts-only guestbook shows the form and no list; a moderated one tells the guest that a wish waits for
  // the host. The writers and the loader apply the same switches (`guestbookRules`).
  const wishesListed = config.guestbook?.visibility !== 'host';
  const wishesModerated = config.guestbook?.moderation === true;
  // A stored cover can be any absolute URL the schema has ever accepted; the page requests only an upload path or an
  // http(s) URL, the same rule as the organiser's logo (E-022). Every layout reads this, never the stored value.
  const coverImageSrc = safeImageSrc(config.theme?.cover?.imageUrl);
  // Small text drawn over a cover photo sits on an opaque page-colour chip: accent tokens clear AA on bg itself, but a
  // dark region of a 20–25 % photo can pull them to 2.8:1 (B-016, tests/palette-contrast.test.ts). No photo, no change.
  // Block-level so the chip never shares a line with the inline guest card that follows it (s15 review F6).
  const coverText = (classes: string) => (coverImageSrc ? `${classes} mx-auto block w-fit rounded-2xl ${tone.bg} px-3 py-1` : classes);
  // B-029: who invites. The corporate headline is the event name, so the organisation is shown beside it when both are
  // filled; without an event name the organisation already is the headline and is not repeated.
  const eventName = invitation.eventType === 'corporate' ? config.corporateProfile?.eventName?.trim() : undefined;
  const organisation = config.corporateProfile?.organizationName?.trim();
  const organiser = eventName && organisation && organisation !== eventName ? organisation : undefined;
  // B-029: the programme a corporate host typed, render-when-filled. Corporate invitations only, like the headline, so a
  // profile left from another event type never reaches the page; layouts read `programme`, never the stored profile.
  const programme =
    invitation.eventType === 'corporate'
      ? programmeOf({
          description: config.corporateProfile?.description,
          agenda: config.corporateProfile?.agenda,
          speakers: config.corporateProfile?.speakers,
          dressCode: config.corporateProfile?.dressCode,
          contactName: config.corporateProfile?.contactName,
          contactPhone: config.corporateProfile?.contactPhone,
          contactEmail: config.corporateProfile?.contactEmail,
        })
      : null;
  // B-029: the organiser's logo and the event category, corporate invitations only and render-when-filled (S16-L6).
  const corporateMark =
    invitation.eventType === 'corporate'
      ? corporateMarkOf({
          logoUrl: config.corporateProfile?.logoUrl,
          eventCategory: config.corporateProfile?.eventCategory,
          organisation,
        })
      : null;

  // D-038: person photos. Children's photos (aqiqah, khitanan, a birthday celebrant) need the host's switch and a personal
  // link or the host's preview; the couple's and a tasyakuran honouree's show once uploaded. Field by field, as below.
  const portraitAudience = { personalLink: Boolean(guest), preview };
  // E-047 / D-040: a child's uploaded photo reaches a personal-link page only as `/i/<slug>/<guest>/photo/<slot>`, which
  // re-checks the link and the host's switch per request and is `private, no-store`; the storage path never appears in
  // the page's markup or RSC payload. The host's own preview keeps the stored path (`/media/protected/…` is served to the
  // owner's session only). An upload of another invitation, or an avatar, is dropped (`childPhotoSrcFor`).
  const childSlot = childPhotoSlotOf(invitation.eventType);
  const childSrc = (src: string) =>
    childPhotoSrcFor(src, {
      invitationId: invitation.id,
      preview,
      guestPhotoPath: guest && !preview && childSlot ? guestChildPhotoPath(invitation.slug, guestLinkSegment(guest), childSlot) : undefined,
    });
  const storedPortraits =
    invitation.eventType === 'wedding'
      ? couplePortraits({
          bride: {
            fullName: config.couple?.bride?.fullName,
            nickName: config.couple?.bride?.nickName,
            parents: config.couple?.bride?.parents,
            order: config.couple?.bride?.order,
            photoUrl: config.couple?.bride?.photoUrl,
          },
          groom: {
            fullName: config.couple?.groom?.fullName,
            nickName: config.couple?.groom?.nickName,
            parents: config.couple?.groom?.parents,
            order: config.couple?.groom?.order,
            photoUrl: config.couple?.groom?.photoUrl,
          },
          displayOrder: config.couple?.displayOrder,
        })
      : invitation.eventType === 'birthday'
        ? birthdayPortrait(
            {
              fullName: config.birthdayPerson?.fullName,
              nickName: config.birthdayPerson?.nickName,
              photoUrl: config.birthdayPerson?.photoUrl,
              showPhoto: config.birthdayPerson?.showPhoto,
            },
            portraitAudience,
          )
        : null;
  const celebrants =
    childSlot === 'celebrant' && storedPortraits
      ? storedPortraits.people.flatMap((person) => {
          const src = childSrc(person.src);
          return src ? [{ ...person, src }] : [];
        })
      : [];
  const portraits =
    childSlot === 'celebrant' && storedPortraits ? (celebrants.length ? { ...storedPortraits, people: celebrants } : null) : storedPortraits;
  const storedHonoureePortrait = ceremonyPortrait(
    invitation.eventType,
    {
      honoureeName: config.ceremonyProfile?.honoureeName,
      nickName: config.ceremonyProfile?.nickName,
      photoUrl: config.ceremonyProfile?.photoUrl,
      showPhoto: config.ceremonyProfile?.showPhoto,
    },
    portraitAudience,
  );
  const honoureeSrc = childSlot === 'honouree' && storedHonoureePortrait ? childSrc(storedHonoureePortrait.src) : undefined;
  const honoureePortrait =
    childSlot === 'honouree' && storedHonoureePortrait ? (honoureeSrc ? { ...storedHonoureePortrait, src: honoureeSrc } : null) : storedHonoureePortrait;

  // B-029: the ceremony profile (aqiqah, khitanan, tasyakuran), render-when-filled; each type keeps only the fields its
  // editor tab offers. Passed field by field, like the programme, so the content contract sees exactly what is read.
  const ceremonyProfile = ceremonyProfileOf(invitation.eventType, {
    honoureeName: config.ceremonyProfile?.honoureeName,
    nickName: config.ceremonyProfile?.nickName,
    parents: config.ceremonyProfile?.parents,
    fatherName: config.ceremonyProfile?.fatherName,
    motherName: config.ceremonyProfile?.motherName,
    birthDate: config.ceremonyProfile?.birthDate,
    birthTime: config.ceremonyProfile?.birthTime,
    birthPlace: config.ceremonyProfile?.birthPlace,
    age: config.ceremonyProfile?.age,
    ceremonyNote: config.ceremonyProfile?.ceremonyNote,
    gender: config.ceremonyProfile?.gender,
    birthWeight: config.ceremonyProfile?.birthWeight,
    birthLength: config.ceremonyProfile?.birthLength,
    childOrder: config.ceremonyProfile?.childOrder,
    nameMeaning: config.ceremonyProfile?.nameMeaning,
    prayer: config.ceremonyProfile?.prayer,
    school: config.ceremonyProfile?.school,
    circumcisionDate: config.ceremonyProfile?.circumcisionDate,
    recoveryNote: config.ceremonyProfile?.recoveryNote,
    thanksgivingCategory: config.ceremonyProfile?.thanksgivingCategory,
    thanksgivingTitle: config.ceremonyProfile?.thanksgivingTitle,
    achievement: config.ceremonyProfile?.achievement,
  }, honoureePortrait);
  // B-029: the wedding hashtag and filter link; the editor offers this module for weddings only.
  const share =
    invitation.eventType === 'wedding'
      ? shareOf({ enabled: config.instagramStory?.enabled, hashtag: config.instagramStory?.hashtag, filterUrl: config.instagramStory?.filterUrl })
      : null;

  // S22-K2 (s23r): a corporate headline is an event title (or the organisation), longer than the names the families'
  // display sizes were drawn for; families set it a step smaller so it does not wrap the greeting off the first screen.
  const headlineKind: 'people' | 'event' = invitation.eventType === 'corporate' ? 'event' : 'people';

  // B-009 (D-045): the host's background music. Only a playable source counts: every wedding preset stores
  // `music: { enabled: true }` without a URL, and that renders nothing. `autoplay` unset means "play when the guest opens
  // the invitation" (the editor's default), which is what the cover gate is for; `false` keeps only the music control.
  const musicSrc = isFlagOn('GUEST_MUSIC') && config.music?.enabled === true ? safeAudioSrc(config.music?.assetUrl) : undefined;
  const music = musicSrc ? { src: musicSrc, title: config.music?.title?.trim() || undefined, playOnOpen: config.music?.autoplay !== false } : null;

  return {
    headlineKind,
    music,
    tone, formatDate, formatTime, dateParts, names, events, primaryEvent, renderedAt, primaryStartMs, showCountdown, primaryCalendarEvent, gallery,
    canRespond, canRsvp, rsvpMaybe, rsvpQuestions, rsvpEvents, rsvpDeadlineText, rsvpClosedByDeadline, rsvpShown, guestbookShown, wishesListed, wishesModerated, coverImageSrc, coverText, programme,
    organiser, corporateMark, ceremonyProfile, share, portraits,
  };
}

export type GuestView = ReturnType<typeof buildGuestView>;
export type InvitationEvent = GuestView['events'][number];
