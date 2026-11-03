<!-- SUMMARY (first 7 lines — greppable) -->
# 10-data-privacy-security-payments.md — privacy, abuse prevention, input safety, tenancy, money, WhatsApp, professional review
> WHAT: Rules and planned controls for guest data, host data, payments and messaging; open questions that need professional (legal / compliance) review, which this research does not answer.
> STATUS: FINAL v1 (s08, 2026-11-03)
> OWNER: Research agent
> DEPS: ../01-codebase-audit/quality-audit.md, ../00-setup/privacy-hygiene.md, 12-decision-log.md (ADR-O03, ADR-O04, ADR-O07), 06-backlog.md
> GREP: privacy, security, pdp, abuse, rate limit, tenancy, payments, qris, whatsapp, compliance
> UPDATED: 2026-11-03

## 1. Data we hold and how we protect it
| Data | Where | Today | Plan |
|---|---|---|---|
| Guest names, phones, RSVP, wishes | `guests`, `guest_messages` | owner-scoped queries; React escaping | opaque guest tokens (B-011), rate limits (B-013), host moderation (B-028), deletion and retention (B-031) |
| Open / view events | `analytics_events`, `guests.opened_*` | collected silently (QA-023) | guest notice + host disclosure (B-021); no third-party analytics on guest pages (keep FM-179 at 0) |
| Gift account numbers, addresses | invitation `config` | shown to anyone with the invitation link (QA-022) | personal-link-only by default (B-026) |
| Media | storage driver | sandboxed `/media`, no SVG | image pipeline strips metadata (EXIF location) at upload (B-019) |
| Hosts | Clerk identity + local `users` | roles in DB | co-host / usher roles with least privilege (G-044) |

Indonesia's Personal Data Protection law (UU PDP) obligations (lawful basis, notices, retention, breach handling, cross-border transfer) need **professional review**; this plan only makes the product capable of notices, deletion and minimisation.

## 2. Abuse prevention and input safety
- Rate limits per guest and per IP on RSVP and wishes; message length limits kept (1,000 chars); moderation flag honoured (B-013, B-028).
- Hostile-input cases in the harness: long names, Arabic / RTL, emoji, HTML / script payloads in names and wishes (brief 03 §21.3); CSV formula neutralisation (B-006).
- Reverse-trial or free-publish experiments only after rate limits exist (spam invitations risk).
- No external scripts on guest pages beyond an allowlist (harness gate); CSP enforced after a report-only period (B-038).

## 3. Tenancy and authorization
Single-owner invitations with ownership checks on every query (good). Additions: invitation members (co-host, usher) with scoped permissions; reseller workspaces later with tenant IDs on invitations and per-tenant quotas (G-052). Admin entry stays private (M-031).

## 4. Payments (ADR-O03)
- Keep the rail interface and idempotent webhooks; **no acquirer chosen, no credential created by the agent**; manual confirmation stays the production fallback.
- Selection criteria for a PJP: Bank Indonesia licence, dynamic QRIS + VA + e-wallets, signed webhooks, idempotency, refunds and settlement APIs, sandbox, transparent fees.
- **Gift money:** the safe first step is the host's own static QRIS image and accounts (no custody, idea I-03). Platform-processed gifts with payouts (BRN-style) need a licensed partner and a legal review of fund custody, refunds and tax before any money is held.
- International: Stripe for non-IDR stays; verify against a real account before claiming it works (F-083).

## 5. WhatsApp
- **Now:** `wa.me` links with an editable message and the guest's personal link; normalise numbers to `62…` (B-018); nothing is sent automatically.
- **Bulk sending:** only through the official WhatsApp Business Platform via a provider the owner contracts, with opt-in, templates and rate limits. Unofficial gateways (session-based "blast" tools) risk number bans and policy violations; the plan does not use them (the planned Fonnte integration in AGENTS.md is an owner decision with this risk recorded).

## 6. Religious text (ADR-O04)
Only owner-approved entries in `content/verified-religious-texts/` with source, translation edition, licence / permission, verifier and date; the harness blocks anything else; no agent writes scripture from memory.

## 7. Questions for professional review (not answered here)
1. UU PDP: notices, consent for tracking opens, retention periods, deletion SLAs, processor agreements (Clerk, storage, hosting region).
2. Holding or routing guests' gift money: licence requirements, custody, refunds, tax treatment.
3. Consumer-protection rules for discounts and "free" claims.
4. Image rights for template art and guest-uploaded photos; licences for fonts and music.
5. WhatsApp Business policy compliance for reminders and blasts.
