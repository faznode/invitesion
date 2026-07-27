<!-- SUMMARY (first 7 lines — greppable) -->
# payment.md — Sistem Pembayaran (QRIS lokal + Stripe internasional)
> WHAT: Dua rail pembayaran, webhook idempotent, dan aktivasi undangan setelah bayar.
> STATUS: LIVE (implemented; acquirer QRIS belum dipilih)
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (orders, payments, payment_events), lib/payment/*
> GREP: payment, qris, stripe, webhook, idempotent, signature, order, rail, currency
> UPDATED: 2026-07-27

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

## Belum dikerjakan

- Acquirer QRIS sungguhan (blokir: keputusan komersial).
- Stripe belum pernah diuji terhadap akun sungguhan; signature terverifikasi secara unit, tetapi
  belum ada Checkout Session nyata yang dibuat.
- Auto-create akun dari pembayaran (untuk pembeli yang belum punya akun). Saat ini order selalu
  dimiliki user yang sudah login.
