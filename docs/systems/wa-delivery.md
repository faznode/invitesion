<!-- SUMMARY (first 7 lines — greppable) -->
# wa-delivery.md — Pengiriman WhatsApp (Fonnte)
> WHAT: Blast undangan + terima chat revisi via Fonnte. Provider abstraction.
> STATUS: LIVE (design). BLOCKED sebagian oleh OPEN ITEM #1.
> OWNER: Operator
> DEPS: DATABASE_SCHEMA.md (wa_log, guests, conversations)
> GREP: whatsapp, wa, fonnte, blast, provider, webhook, revisi, banned
> UPDATED: 2026-07-14

## Pilihan channel (grounded)
- **Fonnte** (unofficial lokal): Rp0 (1rb pesan/bln) → Rp25rb (10rb pesan/bln). Blast bebas, no approval template. Risiko: nomor bisa banned kalau spam agresif.
- **Official (Meta/360Dialog)**: per Juli 2025 skema per-message; blast cold ke tamu = kategori marketing → approval ketat + mahal. DITOLAK buat MVP.
- **Keputusan: Fonnte buat MVP.** Migrasi ke official pas volume gede.

## WAJIB: abstraksi provider
```
interface WhatsAppProvider {
  sendMessage(to, body): Promise<Result>
  sendBulk(recipients[]): Promise<Result[]>
}
class FonnteProvider implements WhatsAppProvider {}
```
Semua kode kirim WA lewat interface ini. Jangan hardcode Fonnte.

## Blast undangan
- Kirim ke guest.phone, body berisi nama tamu + link `/i/:slug/:guestSlug`.
- Rate-limit blast (jeda antar pesan) biar nomor gak kena flag banned.
- Catat tiap kirim ke `wa_log` (direction=out, status).

## Chat masuk (revisi)
- Webhook Fonnte → simpan ke `conversations`+`messages` → route ke Revisi Agent (lihat ai-agents.md).
- 24-jam window relevan di official API; di Fonnte lebih longgar tapi tetap desain aman.

## Mitigasi banned
- Nomor khusus (bukan nomor pribadi), rate-limit, jangan spam, warm-up bertahap.

## ⚠️ OPEN ITEM #1 (nunggu whyme)
Nomor pengirim: A) satu nomor platform vs B) customer connect nomor sendiri. Kalau B → butuh tabel `wa_devices`. JANGAN impl blast final sebelum ini diputuskan.

## Sumber
- fonnte.com (pricing)
