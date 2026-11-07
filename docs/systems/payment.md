<!-- SUMMARY (first 7 lines — greppable) -->
# payment.md — Sistem Pembayaran (QRIS lokal + Stripe internasional)
> WHAT: Dua rail pembayaran, webhook idempotent, dan aktivasi undangan setelah bayar.
> STATUS: LIVE (implemented; acquirer QRIS belum dipilih). s26: entitlement tema di sisi server (B-041); s32: ganti tema dalam tier tanpa checkout (B-036)
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (orders, payments, payment_events), lib/payment/*, lib/invitation/theme-entitlement.ts
> GREP: payment, qris, stripe, webhook, idempotent, signature, order, rail, currency, entitlement, palette, B-041, B-036, template_id
> UPDATED: 2026-11-07

> **Perubahan keputusan (2026-07-27, whyme):** Midtrans **tidak dipakai**. Pembayaran lokal
> lewat **QRIS**, internasional lewat **Stripe**. Dokumen ini menggantikan seluruh rancangan
> Midtrans Snap sebelumnya. Kolom `orders.midtrans_order_id` sudah dihapus (migrasi 0004/0005).

## Prinsip inti

**Webhook = SOURCE OF TRUTH. BUKAN redirect browser.** Customer yang bayar lalu langsung menutup
tab tetap harus punya order lunas; customer yang cuma membuka URL sukses tidak boleh punya.
Halaman `?paid=1` tidak pernah dipakai sebagai bukti — status dibaca dari tabel `orders` kita
sendiri.

## Dua rail, dipilih oleh mata uang

| Rail | Untuk | Mata uang | Settlement |
|---|---|---|---|
| **QRIS** | Customer Indonesia | IDR | Tergantung acquirer (lihat di bawah) |
| **Stripe** | Internasional | USD | Webhook `checkout.session.*` |

Rail ditentukan dari **mata uang order**, bukan dari geolokasi IP. Alasannya: harga yang
ditampilkan dan cara menagihnya jadi mustahil berbeda. Mata uang ditentukan dari locale yang
sudah di-resolve, dan locale itu juga yang merender harga.

## QRIS bukan penyedia pembayaran

Ini bagian yang paling sering disalahpahami dan menentukan arsitektur file ini.

QRIS adalah **standar interoperabilitas**, bukan perusahaan pembayaran. Dua kemampuan yang
berbeda:

1. **Menerbitkan QR** — cukup butuh string QRIS merchant sendiri.
2. **Menerima callback settlement otomatis** — butuh **acquirer** (Xendit, DOKU, Flip, Midtrans,
   atau bank). Tidak ada webhook "dari QRIS".

Karena memilih acquirer adalah keputusan komersial, rail-nya ditulis terhadap interface
`QrisAcquirer`. Yang tersedia hari ini:

**`ManualQrisAcquirer`** — mengambil QRIS statis merchant, menyuntikkan nominal persis, dan
menghitung ulang CRC. Hasilnya QR dinamis yang sah: customer tidak bisa salah ketik nominal.
Settlement dikonfirmasi admin di panel Pesanan.

Batasannya dinyatakan di kode, bukan disembunyikan:
- konfirmasi manual → aktivasi berjalan secepat operator;
- tidak ada bukti kriptografis pembayaran, hanya penilaian operator terhadap mutasi rekening.

Keduanya bisa diterima pada volume kecil dan tidak bisa diterima pada skala. Begitu acquirer
dipilih: implementasikan adapternya, set `QRIS_ACQUIRER`, selesai — tidak ada bagian lain sistem
yang berubah.

## Idempotency — dua lapis, keduanya perlu

Provider melakukan retry pada setiap non-2xx, pada timeout, dan kadang tanpa alasan.

1. **`payment_events` UNIQUE(rail, event_id)** — *delivery* yang sama di-retry akan konflik dan
   dilewati. Ini yang menahan badai retry.
2. **Status order, dibaca ulang `FOR UPDATE` di dalam transaksi** — ini yang menahan dua event
   *berbeda* (misalnya webhook dan konfirmasi operator) berlomba melunasi order yang sama.

Semuanya dalam satu transaksi: mencatat event, memindahkan order, menulis baris payment, dan
mengaktifkan undangan. Aplikasi separuh jalan adalah satu-satunya hasil yang tidak punya
pemulihan aman — customer tertagih tanpa dapat apa pun.

## Nominal selalu diverifikasi

Webhook yang terautentikasi hanya membuktikan **siapa pengirimnya**, bukan bahwa isinya sesuai
dengan yang kita minta. `applySettlement` membandingkan nominal yang dilaporkan dengan nominal
order dan melempar `AmountMismatchError` kalau berbeda — order tetap `PENDING` dan butuh manusia.

## Status code menentukan retry

| Situasi | Kode | Alasan |
|---|---|---|
| Signature/timestamp gagal | **400** | Tidak akan pernah jadi valid; suruh berhenti |
| Referensi tidak dikenal | **400** | Retry tidak akan memunculkan order-nya |
| Nominal tidak cocok | **409** | Butuh manusia, jangan di-retry membabi buta |
| Duplikat / sudah final | **200** | Sudah beres |
| Event otentik yang tidak kita proses | **200** | Jangan di-retry selamanya |
| Rail salah konfigurasi / fault | **500** | Silakan retry setelah kita perbaiki |

## Verifikasi signature Stripe

Header `Stripe-Signature: t=<unix>,v1=<hex>`. Payload yang ditandatangani adalah
`${t}.${rawBody}`, HMAC-SHA256 dengan signing secret endpoint.

**Body mentah wajib.** Membaca `.json()` lalu men-serialize ulang mengubah whitespace dan urutan
key sehingga signature gagal — route handler membaca `await request.text()` dan baru mem-parse
setelah verifikasi.

Toleransi timestamp 300 detik menahan replay: tanpa itu, satu signature yang tertangkap tetap
sah selamanya.

Beberapa `v1` sekaligus didukung agar rotasi secret tidak memutus layanan.

## Aktivasi = yang dibeli customer

Publish adalah barangnya. `publishInvitation` menolak undangan tanpa order `PAID`
(`NotPaidError`), dan pengecekan itu ada di **domain**, bukan hanya di tombol — server action
adalah entry point tersendiri, mencapainya tidak butuh merender halaman yang menautkannya.

Publish ulang setelah unpublish tetap gratis: masa aktif sudah dibayar.

## Entitlement tema saat menyimpan (B-041, s26; ganti tema B-036, s32)

Checkout menagih sesuai tier **tema yang dibeli** (`invitations.template_id`, id baris `templates` →
`templates.is_premium`), sedangkan tamu melihat `config.theme.paletteId`. Sejak B-035 (D-053) setiap penulisan
`config` setelah undangan dibuat lewat satu facade (`lib/invitation/content.ts`) ke salah satu penulis konten
(`content-next.ts` atau endpoint Rust), dan keduanya memeriksa setiap perubahan tema di bawah row lock dengan aturan
yang sama (`lib/invitation/theme-entitlement.ts`, vektor `contracts/vectors/content-rules.json`; D-042, D-054):

- **Tier undangan** = Premium jika tema yang dibeli Premium, atau sudah ada order `PAID` ber-tier Premium untuk
  undangan itu; selain itu Standard.
- **Palet Premium** = palet yang tidak dipakai satu pun tema katalog gratis. Palet fallback (`ivory`) selalu Standard,
  karena halaman tanpa palet pun merendernya. Saat ini: `blossom`, `gold-noir`, `midnight`, `orchid`. Palet Premium
  hanya untuk undangan bertier Premium; palet yang tidak terdaftar ditolak.
- **Ganti tema (B-036, D-054):** `theme.templateId` berisi **id katalog** (`templates.ts`, mis. 103), bukan id baris
  `templates`. Host boleh pindah ke tema katalog mana pun dalam tiernya tanpa bayar lagi: tema gratis selalu boleh,
  tema premium/signature hanya untuk tier Premium (`premium-template`); id yang tidak dikenal katalog ditolak
  (`unknown-template`). Ganti tema hanya mengubah config (id katalog dan paletnya); `invitations.template_id` **tidak
  pernah ditulis**, jadi checkout, publish (`hasPaidOrder(id, template_id)`) dan settlement tetap memakai tema yang
  dibeli, dan undangan yang sudah dibayar tetap terbayar. Naik tier menunggu upgrade di U6.
- Yang diperiksa hanya field yang **berubah**. Menyimpan bagian lain dari config lama tidak pernah gagal, dan
  menghapus palet atau tema tidak butuh entitlement.

PATCH `/api/invitations/{id}/detail` menjawab `403 THEME_NOT_ENTITLED` berisi path dan alasan saja, tanpa nilai yang
tersimpan. Penolakan tidak menulis apa pun: config dan riwayat versi tetap.

## Environment

```
QRIS_ACQUIRER=manual
QRIS_STATIC_PAYLOAD=<teks EMVCo mentah di balik QR merchant>
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Stripe menolak start tanpa `STRIPE_WEBHOOK_SECRET`: kita bisa menerima uang dan tidak pernah tahu.

Endpoint webhook: `POST /api/payments/{stripe|qris}/webhook`

## Verifikasi

- `tests/payment.test.ts` — nominal & pembulatan, TLV/CRC QRIS (dicocokkan dengan vektor standar
  `29B1`), signature Stripe termasuk replay dan rotasi secret.
- `npx tsx scripts/verify-payment.ts` — terhadap database sungguhan: aktivasi, retry no-op,
  double-settlement ditolak, underpayment ditolak.
- `tests/b041-theme-entitlement.test.ts`, `tests/b036-theme-switch.test.ts` dan
  `npx tsx scripts/verify-theme-entitlement.ts` (database sungguhan): undangan Standard yang sudah publish tidak bisa
  memakai palet atau tema Premium tanpa order; setelah order Premium `PAID` boleh; pindah ke tema Standard lain
  menyimpan id katalog dan paletnya, isi tetap, `template_id` tetap, tanpa order baru, dan `hasPaidOrder` tetap benar.
  Skrip database ini dijalankan di job database (`scripts/ci/database.sh`); kedua penulis diuji
  `scripts/verify-content-api.ts` di job rust.

## Belum dikerjakan

- Acquirer QRIS sungguhan (blokir: keputusan komersial).
- Stripe belum pernah diuji terhadap akun sungguhan; signature terverifikasi secara unit, tetapi
  belum ada Checkout Session nyata yang dibuat.
- Auto-create akun dari pembayaran (untuk pembeli yang belum punya akun). Saat ini order selalu
  dimiliki user yang sudah login.
