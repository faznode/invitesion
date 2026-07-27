<!-- SUMMARY (first 7 lines — greppable) -->
# AGENTS.md — Router Undangan Digital Platform
> WHAT: Router utama. Ngarahin tiap agent ke docs/skill/tool yang tepat sebelum kerja.
> STATUS: LOCKED
> OWNER: Architect
> DEPS: AGENT_WORKFLOW.md, docs/INDEX.md
> GREP: router, agents, roles, rules, workflow, stack, git
> UPDATED: 2026-07-14

## Apa ini
Platform SaaS undangan digital Indonesia (wedding/birthday/corporate/aqiqah) + AI agent ecosystem. One-time payment, bukan subscription. Detail keputusan: `docs/PROJECT_OVERVIEW.md`.

**JANGAN mulai kerja sebelum baca doc yang relevan lewat tabel router di bawah.**

## Tim & routing
| Butuh | Agent | Model |
|---|---|---|
| Rencana, arsitektur, breakdown task | **Architect** | opus-4.8 |
| Riset (kompetitor, API, teknis) | **Oracle** | research |
| Eksekusi kode / implementasi | **Operator** | opus-4.8 |
| Review kualitas/security tiap milestone | **Guardian** | opus-4.8 |
| Simpan/ambil knowledge | **Vault** | memory |

Alur baku ada di `AGENT_WORKFLOW.md`. Koordinasi lintas-agent lewat Kanban board.

## Doc router (task → baca dulu)
| Kalau kerjain… | Baca |
|---|---|
| Auth / user / role | `docs/systems/auth.md` |
| Payment / order / webhook | `docs/systems/payment.md` |
| AI agent (design/revisi) | `docs/systems/ai-agents.md` |
| Design Agent detail (intake/schema) | `docs/systems/design-agent.md` |
| Katalog & filter template | `docs/systems/template-catalog.md` |
| Memori customer / after-sales / recall | `docs/systems/customer-memory.md` |
| Kirim WA / blast / Fonnte | `docs/systems/wa-delivery.md` |
| Guest / slug / RSVP / import | `docs/systems/guest-management.md` |
| Skema database | `docs/DATABASE_SCHEMA.md` |
| Arsitektur panel/template | `docs/PROJECT_OVERVIEW.md` |
| Review kode | `docs/review/review-personas.md` |
| Index semua doc | `docs/INDEX.md` |

## Hard rules (wajib, diadopsi dari setup Jamon Holmgren)
1. **Selalu JALANIN app-nya.** Jangan cuma nulis kode — run, test, fix sendiri sambil jalan. Deliverable = artifact yang jalan, bukan deskripsi.
2. **Self-healing docs.** Abis ngubah sistem apapun, UPDATE doc-nya di sesi yang sama. Tiap doc wajib punya 7-baris summary greppable di atas (lihat format file ini).
3. **Cross-agent review tiap milestone** (research → plan → impl → wrap-up). Guardian review, penulis ≠ reviewer session.
4. **Commit worklog.** Tiap sesi implementasi isi worksheet dari `docs/worklog/_TEMPLATE.md`, commit bareng kerjaan. Kalau gagal di tengah, agent lain bisa nerusin dari worksheet.
5. **Test targeted pas implementasi**, commit bareng kode. Bukan belakangan.
6. Kalau nemu keputusan yang belum final, cek bagian **OPEN ITEMS** di `docs/PROJECT_OVERVIEW.md` — jangan asal tebak.

## Stack
**Terpasang hari ini** (verifikasi `package.json`, 2026-07-27):
Next.js 15.6-canary (App Router) · React 19.1.4 · TS · Tailwind 4 + Radix/shadcn ·
**Drizzle** + PostgreSQL · **Clerk** (auth) · qrcode.

**Payment (2026-07-27):** QRIS untuk lokal (IDR) · Stripe untuk internasional. **Midtrans
tidak dipakai.** Keduanya diimplementasi tanpa SDK — REST + signing sendiri, diuji terhadap
vektor resmi. Detail & batasan: `docs/systems/payment.md`.

**Auth (2026-07-27):** **Clerk** pegang kredensial/sesi/reset-password/MFA; tabel `users` lokal
tetap identitas domain lewat `clerk_user_id`. **Role tetap di database, bukan di Clerk.**
Detail: `docs/systems/auth.md`.

**Storage:** disk lokal (dev) atau S3-compatible (produksi), lewat `lib/storage/`.

**Direncanakan, belum ada kodenya:** Redis + BullMQ · LangGraph (orkestrasi agent) ·
Fonnte (WA). Tabel DB-nya sudah ada (`agent_tasks`, `wa_log`) tetapi belum ditulisi kode.

> Blok ini sebelumnya menyebut Next 14 + Prisma + Midtrans dan mengirim agent ke arah yang
> salah. Kalau menambah dependency, pindahkan barisnya dari "direncanakan" ke "terpasang"
> di sesi yang sama.

## Verifikasi wajib sebelum bilang selesai
```
pnpm typecheck && pnpm test && pnpm build
npx tsx scripts/verify-payment.ts   # butuh database
```

## Git
Commits pakai identity **Whyme** `<nodexone@users.noreply.github.com>`. Push ke branch baru, jangan langsung main. Commit conventions: `feat:` `fix:` `refactor:` `docs:` `chore:`.
