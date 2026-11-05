<!-- SUMMARY (first 7 lines — greppable) -->
# guest-management.md — Guest, Slug, RSVP, Import
> WHAT: Manage tamu, slug anti-collision, URL unik per-tamu, RSVP, import CSV.
> STATUS: LIVE (design)
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (guests, guest_messages, analytics_events)
> GREP: guest, tamu, slug, url, rsvp, csv, import, tracking, collision, token, link_token, attending_count, calendar, og
> UPDATED: 2026-11-05 (s19: id acara tetap, konfirmasi per acara, ringkasan jawaban host, D-036; s18: pertanyaan custom host + editor, D-034/D-035, ringkasan RSVP dashboard E-033; s17: B-027 MAYBE status, headcount hint; s09: B-007 attending_count, B-011 opt-in token + 404, B-008/B-010 side routes)

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
- **Ringkasan RSVP di dashboard** (E-033, s18; `rsvpSummary()` di `lib/invitation/rsvp-rules.ts`): beranda dashboard dan halaman tamu memakai satu ringkasan yang sama. Isinya total tamu, hadir beserta jumlah orang (jumlah `attending_count` dari jawaban hadir), mungkin, tidak hadir, dan belum menjawab. Jawaban hadir dari sebelum B-007 yang tidak punya jumlah ditampilkan sebagai "tanpa jumlah", tidak ditebak dari jatah kursi. "Mungkin" dan "tidak hadir" tidak pernah menambah jumlah orang.
- Real-time muncul di customer panel. Export CSV (kolom `attending_count` di akhir; sel yang diawali `= + - @`, tab, CR dinetralkan dengan `'`, B-006).
- **Pertanyaan custom host** (B-027 slice 2b; kode s17, diterima end-to-end s18; D-034, D-035): diajukan di form RSVP bila `registrationForm.enabled`, ada minimal satu pertanyaan, RSVP masih terbuka, dan flag `RSVP_QUESTIONS` on (`FLAG_RSVP_QUESTIONS=off` = rollback; jawaban tersimpan tetap ada). Jawaban disimpan di `guests.rsvp_answers` dalam UPDATE yang sama dengan status dan jumlah hadir. "Wajib" hanya untuk jawaban hadir; pertanyaan bersyarat hanya dihitung bila syaratnya terpenuhi pada jawaban yang dikirim (jawabannya dibuang bila tidak); pertanyaan yang tidak mungkin berlaku (siklus, sumber hilang, syarat tanpa pilihan yang cocok) tidak ditampilkan. Menolak menghapus semua jawaban; jawaban tidak pernah masuk analytics. Batas jawaban: teks 500, teks panjang 2.000 (baris baru dihitung satu karakter, disimpan sebagai LF), angka bulat 0–100.000, pilihan hanya dari opsi host. Export CSV: satu kolom per pertanyaan saat ini, dinetralkan (B-006), juga saat form dimatikan. Config tersimpan yang tidak lolos aturan sekarang (D-035): pertanyaan yang tidak terbaca atau id-nya ganda hanya menghilangkan dirinya sendiri, bukan seluruh form. Pertanyaan yang syaratnya merujuk pertanyaan yang sudah dihapus tetap tersimpan, tidak ditanyakan ke tamu (termasuk turunannya), tetap punya kolom dan jawaban di export, dan ditandai di editor sampai host memilih sumber lagi. Kondisi itu tidak memblokir penyimpanan bagian lain maupun penerbitan.
- **Konfirmasi per acara** (B-027 slice 2c, s19, D-036): host menyalakan "Konfirmasi per acara" (`rsvp.perEvent`) dan undangan punya minimal dua acara, flag `RSVP_PER_EVENT` on (`off` = form tunggal seperti sebelumnya, kolom tidak disentuh). Tamu memilih hadir / tidak hadir / mungkin (mungkin hanya bila flag-nya on) dan jumlah orang untuk tiap acara, lalu satu tombol "Kirim konfirmasi". Setiap acara wajib dijawab; form lama (dibuka sebelum acara ditambah atau sebelum fitur dinyalakan) ditolak dengan menyebut acaranya. Status keseluruhan: hadir bila ada acara yang hadir, kalau tidak mungkin bila ada yang mungkin, kalau tidak tidak hadir; jumlah hadir keseluruhan = jumlah terbesar di satu acara. Jawaban disimpan per id acara di `guests.rsvp_event_answers` dalam UPDATE yang sama; urutan atau nama acara yang diubah tidak memindahkan jawaban. Jawaban untuk acara yang dihapus tetap tersimpan tetapi tidak dihitung atau diekspor. Jawaban tunggal (saat fitur mati) mengganti jawaban per acara. Export: dua kolom per acara (status, jumlah hadir).
- **Id acara tetap** (s19, D-036): setiap acara punya `id` yang ikut saat diedit atau diurutkan ulang (tombol naik / turun di editor); acara baru mendapat id acak baru, tidak pernah id acara yang sudah dihapus. Config lama mendapat `ev-<urutan>` sekali (migrasi data 0013 dan pembacaan memakai aturan yang sama).
- **Ringkasan jawaban untuk host** (E-036, s19): halaman tamu per undangan menampilkan kehadiran per acara, ringkasan tiap pertanyaan (jumlah per pilihan termasuk nol, pilihan lama yang masih punya jawaban, dijawab / belum dijawab, total angka) dan "Jawaban tamu" per baris tamu. Yang belum menjawab tidak pernah dihitung sebagai pilihan apa pun; pertanyaan dengan sumber syarat yang terhapus ditandai tidak ditanyakan, jawabannya tetap tampil.
- **Editor pertanyaan** (panel kelola → modul registrasi, E-031): kata-kata pertanyaan, jenis jawaban, wajib untuk yang hadir, pilihan jawaban, syarat pada pertanyaan pilihan **di atasnya** (jadi siklus tidak bisa dibuat), urutan, hapus. Menghapus atau mengganti jenis sumber, atau menghapus pilihan yang dipakai syarat, ikut menghapus syarat turunannya dan memberi tahu host. Daftar dicek dengan schema API sebelum dikirim. Batas registrasi, kapasitas, pendamping dan pesan konfirmasi masih tersimpan saja (belum tampil atau berlaku di undangan); batas waktu yang berlaku untuk tamu adalah batas RSVP. Per-event answers belum ada (butuh id acara yang stabil, slice 2c).
- Halaman tamu: hitung mundur + "Simpan ke Google Calendar" / file `.ics` untuk acara pertama yang belum lewat (B-008, `FLAG_GUEST_CALENDAR`, default on).

## Import guest
- CSV/Excel: kolom nama, phone, category. Generate slug + qr_code otomatis saat import.
- Handle collision saat bulk import (angka append).

## Guest book
- `guest_messages`. Customer bisa hide/moderate (is_hidden).

## Expired (12 bulan)
- Undangan READ-ONLY: tamu masih bisa lihat, RSVP + guestbook NUTUP. Data tamu disimpan.
