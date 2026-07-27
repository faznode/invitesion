<!-- SUMMARY (first 7 lines — greppable) -->
# guest-management.md — Guest, Slug, RSVP, Import
> WHAT: Manage tamu, slug anti-collision, URL unik per-tamu, RSVP, import CSV.
> STATUS: LIVE (design)
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (guests, guest_messages, analytics_events)
> GREP: guest, tamu, slug, url, rsvp, csv, import, tracking, collision
> UPDATED: 2026-07-14

## URL unik per-tamu (differentiator utama)
Format: `/i/:invitationSlug/:guestSlug` → `invitation.com/i/wedding-andi/budi-santoso`
- guestSlug = slugify(nama) → "Budi Santoso" jadi "budi-santoso".
- **Slug polos, TANPA token.** Scope tamu = orang terdekat, risiko share/tebak kecil (keputusan whyme).
- **Anti-collision:** kalau slug sudah ada di undangan yang sama → auto-append `-2`, `-3`. Contoh dua "Budi Santoso" → `budi-santoso` & `budi-santoso-2`.
- `UNIQUE(invitation_id, slug)`. Slug unik PER-UNDANGAN, bukan global.

## Personalisasi & tracking
- Tamu buka link → nama auto-fill di undangan, RSVP form pre-filled (nama disabled).
- Log `opened_at` + increment `opened_count` (tracking per-tamu — kompetitor gak punya).
- Semua event (VIEW/RSVP/GUESTBOOK/CHECKIN) → `analytics_events`.

## RSVP
- Status: PENDING|CONFIRMED|DECLINED + guest_count.
- Real-time muncul di customer panel. Export ke Excel.

## Import guest
- CSV/Excel: kolom nama, phone, category. Generate slug + qr_code otomatis saat import.
- Handle collision saat bulk import (angka append).

## Guest book
- `guest_messages`. Customer bisa hide/moderate (is_hidden).

## Expired (12 bulan)
- Undangan READ-ONLY: tamu masih bisa lihat, RSVP + guestbook NUTUP. Data tamu disimpan.
