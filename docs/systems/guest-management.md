<!-- SUMMARY (first 7 lines — greppable) -->
# guest-management.md — Guest, Slug, RSVP, Import
> WHAT: Manage tamu, slug anti-collision, URL unik per-tamu, RSVP, import CSV.
> STATUS: LIVE (design)
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (guests, guest_messages, analytics_events)
> GREP: guest, tamu, slug, url, rsvp, csv, import, tracking, collision, token, link_token, attending_count, calendar, og
> UPDATED: 2026-11-05 (s17: B-027 MAYBE status, headcount hint; s09: B-007 attending_count, B-011 opt-in token + 404, B-008/B-010 side routes)

## URL unik per-tamu (differentiator utama)
Format: `/i/:invitationSlug/:guestSlug` → `invitation.com/i/wedding-andi/budi-santoso`
- guestSlug = slugify(nama) → "Budi Santoso" jadi "budi-santoso".
- **Slug polos, TANPA token.** Scope tamu = orang terdekat, risiko share/tebak kecil (keputusan whyme). **Tetap default.**
- **Opsional (B-011, 2026-11-03):** `FLAG_OPAQUE_GUEST_LINKS=on` → tamu BARU dapat `guests.link_token` (22 karakter base64url, 128 bit) dan link-nya `/i/:invitationSlug/:token`. Default `off` karena keputusan di atas; menyalakannya = keputusan owner. Aturan resolusi segmen terakhir (`lib/invitation/guest-link.ts`, dipakai halaman DAN server action): token cocok → tamu itu; kalau tidak, slug milik tamu yang **tidak punya token** (link lama tetap jalan); selain itu → **404**. Tamu bertoken tidak bisa dibuka lewat slug-nya.
- Link salah (tamu/undangan tidak ada, draft) menjawab **HTTP 404** (sebelumnya 200 + teks "tidak ditemukan"): halaman `/i/**` keluar dari partial prerendering (`experimental_ppr = false`, `next.config` `ppr: 'incremental'`).
- **Anti-collision:** kalau slug sudah ada di undangan yang sama → auto-append `-2`, `-3`. Contoh dua "Budi Santoso" → `budi-santoso` & `budi-santoso-2`.
- `UNIQUE(invitation_id, slug)`. Slug unik PER-UNDANGAN, bukan global. `UNIQUE(link_token)` global (null boleh banyak).
- Route samping per undangan (bukan per tamu, tanpa data tamu): `/i/:slug/calendar.ics` (B-008) dan `/i/:slug/og.png` (B-010, gambar pratinjau WhatsApp). Segmennya mengandung titik, yang tidak pernah ada di slug tamu, jadi tidak bisa menutupi halaman tamu.

## Personalisasi & tracking
- Tamu buka link → nama auto-fill di undangan, RSVP form pre-filled (nama disabled).
- Log `opened_at` + increment `opened_count` (tracking per-tamu — kompetitor gak punya).
- Semua event (VIEW/RSVP/GUESTBOOK/CHECKIN) → `analytics_events`.

## RSVP
- Status: PENDING|CONFIRMED|DECLINED|MAYBE. MAYBE (B-027, s17) di belakang flag `RSVP_MAYBE` (default on; `FLAG_RSVP_MAYBE=off` menyembunyikan pilihan "Mungkin hadir" dan action menolaknya, jawaban MAYBE yang tersimpan tetap terbaca); dihitung terpisah di dashboard tamu dan diekspor dengan status sendiri. `guest_count` = jatah kursi dari host (RSVP **tidak pernah** mengubahnya); `attending_count` = jumlah yang hadir menurut tamu (0 kalau menolak, null = belum menjawab / jawaban sebelum B-007 / MAYBE, jadi "mungkin" tidak pernah masuk hitungan kursi). Jawaban di-clamp ke 1…`guest_count`.
- Form RSVP menjelaskan bahwa jumlah tamu hanya dicatat untuk jawaban hadir ("Jumlah ini dicatat untuk jawaban hadir", s17 temuan R2): MAYBE menyimpan `attending_count` kosong, DECLINED menyimpan 0.
- Real-time muncul di customer panel. Export CSV (kolom `attending_count` di akhir; sel yang diawali `= + - @`, tab, CR dinetralkan dengan `'`, B-006).
- Halaman tamu: hitung mundur + "Simpan ke Google Calendar" / file `.ics` untuk acara pertama yang belum lewat (B-008, `FLAG_GUEST_CALENDAR`, default on).

## Import guest
- CSV/Excel: kolom nama, phone, category. Generate slug + qr_code otomatis saat import.
- Handle collision saat bulk import (angka append).

## Guest book
- `guest_messages`. Customer bisa hide/moderate (is_hidden).

## Expired (12 bulan)
- Undangan READ-ONLY: tamu masih bisa lihat, RSVP + guestbook NUTUP. Data tamu disimpan.
