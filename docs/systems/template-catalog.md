<!-- SUMMARY (first 7 lines — greppable) -->
# template-catalog.md — Katalog & Filter Template (customer-driven)
> WHAT: Cara sajiin & filter katalog template biar CUSTOMER milih sendiri. Grid + filter chip.
> STATUS: LIVE (design, tervalidasi riset)
> OWNER: Operator
> DEPS: design-agent.md, DATABASE_SCHEMA.md (templates)
> GREP: template, katalog, filter, tag, galeri, occasion, style, color, swatch
> UPDATED: 2026-07-15

## Prinsip
CUSTOMER yang milih template/vibe/warna. Sistem cuma nyajiin katalog + filter jelas. AI NOL peran di sini.

## Verdict (katalog 10-20 template)
**JANGAN pakai search/semantic/embedding.** Cukup **grid galeri + filter tag (chip/swatch)**. Katalog sekecil ini di-scan mata; filter fungsinya nyempitin, bukan nyari. Skip embedding sampai >500 item + query natural-language.

## 3-4 dimensi filter
> **Enum `occasion` = SATU sumber kebenaran (fix S3):** `wedding | birthday | aqiqah | tasyakuran | khitanan | corporate`. HARUS identik dengan jenis acara di design-agent.md schema. Tiap occasion di katalog WAJIB punya schema acara. (aqiqah & tasyakuran dipisah; khitanan pakai schema mirip aqiqah.)

| Dimensi | Peran | UI |
|---|---|---|
| **Occasion** | entry point (wedding/birthday/aqiqah/tasyakuran/khitanan/corporate) | chip/tab atas |
| **Style/Vibe** | diferensiator (elegan/minimalis/rustic/floral/modern/islami/playful) | chip multi-select |
| **Color** | filter visual | **swatch warna** (bukan teks) |
| **Format** (opsional) | portrait/landscape | chip |

Aturan skala kecil: opsi filter langsung terlihat (jangan disembunyiin); multi-select dlm 1 dimensi = OR, antar-dimensi = AND; jangan pernah "0 hasil mati" → greyed-out / "longgarkan filter"; mobile pakai bottom-sheet tray; preview BESAR sebelum pilih.

## Metadata tag template (enum terkontrol)
```json
{
  "id": "tpl-012", "name": "Rustic Garden",
  "thumbnail_url": "...", "preview_url": "...",
  "occasion": ["wedding"],
  "style": ["rustic","floral"],
  "color_palette": ["green","cream"],
  "color_hex": ["#6B8E5A","#F5F0E1"],
  "format": "portrait", "is_premium": false, "sort_order": 12
}
```
- Enum terkontrol per dimensi (~5-8 nilai), JANGAN free-tag. Batasi: 1-2 occasion, 1-3 style, 1-3 color per template.
- `color_hex` dipisah utk render swatch. `sort_order` utk kurasi manual.
- Simpan di Postgres jsonb/array. TIDAK butuh Algolia/Elastic/vector DB.

## Sumber (tervalidasi)
- NN/G filter categories & mobile faceted tray, Prefixbox faceted filtering, Minted/Greenvelope/Canva taksonomi (occasion+style+color), Redis semantic-vs-keyword.
