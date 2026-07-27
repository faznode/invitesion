<!-- SUMMARY (first 7 lines — greppable) -->
# DATABASE_SCHEMA.md — Skema Database
> WHAT: Skema DB lengkap (Drizzle/Postgres) untuk MVP. Source of truth data model.
> STATUS: LIVE (MVP scope)
> OWNER: Architect
> DEPS: PROJECT_OVERVIEW.md
> GREP: schema, drizzle, tabel, users, invitations, guests, orders, versions
> UPDATED: 2026-07-15
> ORM DECISION (whyme 2026-07-15): pakai **Drizzle** (bukan Prisma) — ikut fondasi nextjs/saas-starter biar backend cepat jalan. Schema di bawah = kanonik, diimplementasi sbg Drizzle schema (lib/db/schema.ts).

## Prinsip
- `config(json)` = source of truth isi undangan. Renderer deterministik config→HTML.
- Setiap revisi AI = insert `invitation_versions` baru (rollback-able).
- Operational modules (registration form, meal preferences, communications settings, check-in settings, seating plan, secondary events, ticketing configuration, and event operations) live as optional additive sections inside `invitations.config`; they do not require DB migrations.
- These sections contain setup/presentation rules only. Live guest submissions, RSVP status/counts, check-in timestamps, message delivery/provider status, payment transactions, and analytics remain DB-owned in the tables below; config must never claim a provider is active or replace those records.
- Webhook idempotent: `orders.midtrans_order_id` UNIQUE + `users.email` UNIQUE.
- Guest slug: `UNIQUE(invitation_id, slug)` — anti-collision per undangan.

## Tabel

### AUTH
```
users
  id, email(UNIQUE), phone(UNIQUE, nullable), password_hash,   ← phone: resolver identity WA↔web (customer-memory.md)
  role[CUSTOMER|ADMIN], created_at
```

### CONTENT
```
templates
  id, name, category[wedding|birthday|aqiqah|tasyakuran|khitanan|corporate],  ← enum SATU sumber (samain design-agent + catalog)
  default_config(json), thumbnail, is_premium, created_at

invitations
  id, user_id→users, template_id→templates,
  slug(UNIQUE), event_type, config(json),
  status[DRAFT|PUBLISHED|EXPIRED],
  revision_count(default 0, max 3),
  published_at, expires_at (published_at + 12 bulan), created_at

invitation_versions               ← rollback revisi AI
  id, invitation_id→invitations, version_no,
  config(json), created_by[customer|ai-agent],
  is_live, created_at

media_assets
  id, invitation_id→invitations,
  type[photo|video|music], url, meta(json), created_at
```

### GUESTS
```
guests
  id, invitation_id→invitations, name,
  slug, phone, category, qr_code,
  sent_at, opened_at, opened_count,
  rsvp_status[PENDING|CONFIRMED|DECLINED],
  guest_count, checked_in_at
  UNIQUE(invitation_id, slug)      ← anti-collision

guest_messages
  id, invitation_id→invitations, guest_id→guests(nullable),
  name, message, is_hidden, created_at
```

### COMMERCE
> REVISI 2026-07-27: Midtrans diganti QRIS (lokal) + Stripe (internasional).
> `midtrans_order_id` DIHAPUS — identitas provider jadi kolom, bukan nama kolom.
> `amount` = integer MINOR UNITS sesuai eksponen `currency` (IDR: rupiah utuh, USD: sen).
> JANGAN pakai float. Detail: `lib/payment/money.ts`.
```
orders
  id, user_id→users, invitation_id→invitations(nullable),
  tier, amount, currency[IDR|USD],
  status[PENDING|PAID|FAILED|EXPIRED],
  rail[qris|stripe],
  reference(UNIQUE),           ← punya kita; anchor idempotency di kedua sisi
  provider_payment_id,         ← punya provider; untuk rekonsiliasi
  paid_at, expires_at,         ← expires_at = jendela pembayaran, BUKAN masa aktif undangan
  created_at

payments
  id, order_id→orders, provider, transaction_id,
  status, raw_payload(json), created_at

payment_events                 ← log delivery webhook; ini yang bikin settlement idempotent
  id, rail, event_id, order_id→orders(nullable),
  status, raw_payload(json), created_at
  UNIQUE(rail, event_id)       ← retry provider konflik di sini lalu dilewati
```

### AI / MESSAGING
```
conversations
  id, customer_phone, invitation_id→invitations(nullable),
  channel[wa], state, created_at

messages
  id, conversation_id→conversations,
  sender_type[customer|agent], content, created_at

agent_tasks
  id, invitation_id→invitations, type[DESIGN|REVISION],
  status, input(json), output(json),
  version_id→invitation_versions(nullable), created_at

wa_log
  id, invitation_id→invitations, guest_id→guests(nullable),
  direction[out|in], status, payload(json), created_at
```

### CUSTOMER MEMORY (after-sales — detail: customer-memory.md)
```
customer_memory                       ← profil ingatan, 1:1 users
  id, user_id→users(UNIQUE),
  preferensi(json),                   -- catatan LUNAK, bukan fakta keras
  last_interaction_at, updated_at
  -- fakta keras baca dari users + intake_session/config (hindari drift)

customer_session_summary              ← 1 baris per sesi chat selesai
  id, user_id→users, conversation_id→conversations,
  invitation_id→invitations(nullable),   -- 1 customer : N acara
  summary(≤300char), next_action(nullable),
  status[draft|confirmed], created_at
```
> Transkrip chat REUSE `conversations`+`messages` (jangan bikin tabel baru). Trigger ringkasan: idle 30m / publish / paid. Inject ke LLM = ringkasan+profil, BUKAN transkrip.

### ANALYTICS
```
analytics_events
  id, invitation_id→invitations, guest_id→guests(nullable),
  event_type[VIEW|RSVP|GUESTBOOK|CHECKIN], meta(json), created_at
```

## Nunggu OPEN ITEMS
- #1 opsi B → tambah tabel `wa_devices(id, user_id, fonnte_token, status)`.
- #3 → `revision_count` naik per sesi chat selesai (logika app, DB siap).

## intake_session (slot-filling Design Agent — detail: design-agent.md)
```
intake_session                        ← state slot-filling, resume kalau chat keputus
  id, invitation_id→invitations, event_type,
  slots(json: {field:{value,status,source_utterance}}),
  template_id→templates, palette_id,
  status[in_progress|ready|assembled], updated_at
```
> OTORITAS fakta intake (nama/tanggal/venue). customer_memory TIDAK dobel simpan fakta ini.
