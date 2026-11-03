<!-- SUMMARY (first 7 lines — greppable) -->
# content/verified-religious-texts — the only source of scripture and religious quotations in Invitesion
> WHAT: An owner-approved corpus of religious texts (Qur'an translations, hadith, Bible verses, prayers, etc.) with provenance. Templates and presets may show a quotation only by referencing an entry id here.
> STATUS: EMPTY by design (session 09, 2026-11-03). No entry has been supplied or approved yet, so no template or preset ships a quotation block (ADR-O04, B-003).
> OWNER: Product owner (approval) · agents may only add entries the owner supplied verbatim with complete provenance
> DEPS: corpus.json, lib/invitation/religious-text.ts, tools/template-harness (religious-text gate), AGENTS.md (religious text rule)
> GREP: religious text, scripture, quran, hadith, ayat, corpus, provenance, verified
> UPDATED: 2026-11-03

## Rules
1. **Never write scripture from memory**, never paraphrase, never "fix" wording. Agents copy only text the owner supplied, character for character.
2. An entry is usable only when every provenance field below is filled and `status` is `approved`.
3. Presets and templates reference entries by `id` (`quote: { corpusId }` in a template manifest; the product renders `text` and `citation` from the entry). Inline religious text anywhere else fails the template harness and the registry test.
4. Existing invitations are customer content and are never rewritten by these rules.

## Entry fields (`corpus.json` → `entries[]`)
| Field | Meaning |
|---|---|
| `id` | stable kebab id, e.g. `quran-<surah>-<ayah>-<edition>` |
| `tradition` | e.g. `islam`, `christianity`, `catholic`, `hindu`, `buddhist`, `confucian` |
| `kind` | `scripture-translation`, `hadith`, `prayer`, `verse`, … |
| `language` | BCP 47 (`id`, `en`, `ar`, …) |
| `text` | the exact text as supplied |
| `citation` | the reference as it should be displayed |
| `source` | publication / edition the text is taken from (title, publisher, year, edition) |
| `translationEdition` | for translations: which official translation and revision |
| `licence` | licence or written permission for reuse in a commercial product |
| `verifiedBy` | person who checked the text against the source |
| `verifiedAt` | ISO date of that check |
| `approvedBy` | owner representative who approved use |
| `status` | `approved` or `pending` (only `approved` is usable) |

## How to add an entry
1. The owner supplies the text, the source edition and the permission.
2. Add the entry with `status: "pending"`; a second person verifies it against the source and fills `verifiedBy` / `verifiedAt`.
3. The owner approves (`approvedBy`, `status: "approved"`).
4. Run `pnpm test` (corpus schema + registry checks) and `pnpm harness check <template>` for every template that references it.
