<!-- SUMMARY (first 7 lines — greppable) -->
# 01-executive-summary.md — Invitesion masterplan in two pages (English + Bahasa Indonesia)
> WHAT: Thesis, evidence confidence, key findings, decisions, P0, 90-day sequence and owner dependencies; the same content in English and Bahasa Indonesia.
> STATUS: FINAL v1 (session 09, 2026-11-03), baseline `64678cf`. Implementation progress after this date: `../_handoff/IMPLEMENTATION-LOG.md`.
> OWNER: Research agent (Architect role)
> DEPS: 02–13 in this folder; ../07-ideation/README.md (thesis); ../08-backend-rust-plan/README.md (verdict)
> GREP: executive summary, ringkasan eksekutif, thesis, P0, 90 days, decisions, dependencies
> UPDATED: 2026-11-03

## English

**Thesis.** Invitesion should be the invitation every guest can open and every family can trust: light on any phone, honest about prices and religious text, private by default, and complete through the event day. Competitors win on catalog volume, done-for-you service or art direction; none of the measured ones matches our guest-page weight and speed in the lab (311 KiB vs 2,404–7,192 KiB medians at cold load; C-INV-005 limits apply: lab only, no middleware).

**Confidence.** Fifteen Tier-A competitors have dossiers except Sitemu (14/15). Strict Wave 1 is **not met**: Indoinvite, PALEO and Satu Momen have no eligible guest-page captures (no safe public demo). Planning proceeds under **ADR-W1**, a reduced-confidence exception. Feature conclusions for level-C competitors rest on public claims. No traffic, revenue or production data exists; none is assumed.

**What we found in our product (code-verified at `64678cf`).** Strong basics (escaped guest data, ownership checks, payment engineering, light guest page), but trust-breaking defects: invitations created from the catalog start empty (strict schema rejects template `art`); marketing shows "Rp0 / GRATIS" while checkout charges Rp 149k / 299k; three presets carry Qur'an translations of unknown provenance; times print in the server's zone with a hard-coded "WIB"; the editor's preview link is a 404; CSV export allows formula injection; an RSVP overwrites the host's seat allowance; unknown guest links answer 200; view counts double under concurrency.

**Architecture verdict (measured, ADR-A1).** Keep Next.js; no Rust service now. In a matched lab spike (two rounds) the product page costs ≈ 27–30 ms server CPU per view; the same server with one data load and minimal HTML needs ≈ 4 ms (≈ 6.7–7× the throughput). Loading the data once instead of twice cuts database CPU per view by about a third but leaves server CPU unchanged, so ≈ 85–90 % of the cost is rendering the full template. Rust is cheaper still (≈ 0.3 ms) but then Postgres is the bottleneck, and it cannot render our React templates. The fix is caching the invitation-level render inside Next.js plus one data load (B-014), and atomic view tracking (B-017a).

**P0 (12 items, dependency order).** B-001 catalog presets survive · B-002 prices from one source · B-003 no unverified religious text + verified corpus scaffold · B-004 event time zones (WIB/WITA/WIT) · B-005 editor preview link · B-006 CSV formula neutralisation · B-007 RSVP keeps the allowance · B-008 countdown + add-to-calendar · B-009 cover + music + pause · B-010 per-invitation OG image · B-011 opaque guest links + 404 for unknown guests · B-012 template harness with tier budgets.

**90 days (two-week sprints).** 1 trust fixes (B-001…B-007, B-017a) → 2 guest table stakes I (B-008, B-010, B-012, B-014, B-015, B-016) → 3 cover, music, profiles, gift block, memorial preset → 4 host tools (opaque links, rate limits, wa.me, import, follow-up lists) → 5 day-of QR pass and greeting screen, live preview → 6 template system v2 with the three dogfood templates, indexes, image pipeline, CI, payments readiness.

**What the owner must supply (never invented here).** Hosting and database regions/plans; real Clerk keys; traffic or analytics access; final prices or a free-tier decision; a PJP (payment) contract; an approved, sourced religious-text corpus; legal review of retention, privacy notice and gift money.

## Bahasa Indonesia

**Tesis.** Invitesion harus menjadi undangan yang bisa dibuka setiap tamu dan dipercaya setiap keluarga: ringan di ponsel apa pun, jujur soal harga dan teks keagamaan, menjaga privasi sejak awal, dan tuntas sampai hari-H. Kompetitor unggul di jumlah katalog, layanan "dibuatkan admin", atau arah seni; tidak satu pun yang terukur menyamai bobot dan kecepatan halaman tamu kita di lab (311 KiB vs median 2.404–7.192 KiB saat muat awal; batasan C-INV-005 berlaku: hanya lab, tanpa middleware).

**Tingkat keyakinan.** Lima belas kompetitor Tier-A sudah punya dosir kecuali Sitemu (14/15). Wave 1 versi ketat **belum terpenuhi**: Indoinvite, PALEO, dan Satu Momen tidak punya tangkapan halaman tamu yang memenuhi syarat (tidak ada demo publik yang aman). Perencanaan berjalan dengan **ADR-W1**, pengecualian dengan keyakinan lebih rendah. Kesimpulan fitur untuk kompetitor level C bersandar pada klaim publik. Tidak ada data trafik, pendapatan, atau produksi; tidak ada yang diasumsikan.

**Temuan pada produk kita (diverifikasi di kode `64678cf`).** Fondasinya kuat (data tamu di-escape, cek kepemilikan, rekayasa pembayaran, halaman tamu ringan), tetapi ada cacat yang merusak kepercayaan: undangan yang dibuat dari katalog mulai kosong (skema ketat menolak `art` milik template); halaman pemasaran menampilkan "Rp0 / GRATIS" padahal checkout menagih Rp149 rb / 299 rb; tiga preset memuat terjemahan Al-Qur'an tanpa sumber jelas; jam acara dicetak dengan zona waktu server dan label "WIB" yang di-hardcode; tautan pratinjau di editor 404; ekspor CSV membuka celah injeksi rumus; RSVP menimpa jatah kursi yang ditetapkan tuan rumah; tautan tamu yang tidak dikenal tetap menjawab 200; hitungan "dibuka" bisa ganda saat akses bersamaan.

**Putusan arsitektur (terukur, ADR-A1).** Tetap di Next.js; belum perlu layanan Rust. Dalam uji beban lab yang setara (dua putaran), halaman produk butuh ≈ 27–30 ms CPU server per kunjungan; server yang sama dengan satu kali muat data dan HTML minimal hanya ≈ 4 ms (throughput ≈ 6,7–7×). Memuat data sekali, bukan dua kali, memangkas CPU database per kunjungan sekitar sepertiga tetapi tidak mengubah CPU server, jadi ≈ 85–90 % biayanya ada pada perenderan template secara penuh. Rust lebih hemat lagi (≈ 0,3 ms), tetapi lalu Postgres yang menjadi leher botol, dan Rust tidak bisa merender template React kita. Solusinya meng-cache hasil render tingkat undangan di dalam Next.js ditambah satu kali muat data (B-014), serta pencatatan kunjungan yang atomik (B-017a).

**P0 (12 butir, urut dependensi).** B-001 preset katalog tetap terbawa · B-002 harga dari satu sumber · B-003 tanpa teks keagamaan yang belum terverifikasi + kerangka korpus terverifikasi · B-004 zona waktu acara (WIB/WITA/WIT) · B-005 tautan pratinjau editor · B-006 netralisasi rumus di CSV · B-007 RSVP tidak menimpa jatah kursi · B-008 hitung mundur + simpan ke kalender · B-009 sampul + musik + tombol jeda · B-010 gambar OG per undangan · B-011 tautan tamu acak + 404 untuk tamu tak dikenal · B-012 harness template dengan anggaran per tier.

**90 hari (sprint dua minggu).** 1 perbaikan kepercayaan (B-001…B-007, B-017a) → 2 kebutuhan dasar tamu I (B-008, B-010, B-012, B-014, B-015, B-016) → 3 sampul, musik, profil, blok hadiah, preset duka → 4 alat tuan rumah (tautan acak, batas laju, wa.me, impor, daftar tindak lanjut) → 5 QR tamu dan layar sapa hari-H, pratinjau langsung → 6 sistem template v2 dengan tiga template dogfood, indeks, pipeline gambar, CI, kesiapan pembayaran.

**Yang harus disediakan pemilik (tidak dikarang di sini).** Region dan paket hosting serta database; kunci Clerk asli; akses trafik atau analitik; harga final atau keputusan tier gratis; kontrak PJP (pembayaran); korpus teks keagamaan yang disetujui dan bersumber; tinjauan hukum soal retensi data, pemberitahuan privasi, dan dana hadiah.
