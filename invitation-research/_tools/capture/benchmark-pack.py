#!/usr/bin/env python3
"""Benchmark pack: tier classification, per-tier aggregates and structure blueprints from eligible captures only.

    python3 -B invitation-research/_tools/capture/benchmark-pack.py            # write the three CSVs
    python3 -B invitation-research/_tools/capture/benchmark-pack.py --check    # exit 1 if the files on disk are stale
    python3 -B invitation-research/_tools/capture/benchmark-pack.py --markdown # print the aggregate tables

Input: 04-template-benchmarks/captures-summary.csv (summarize-captures.py) for the numbers; eligibility is recomputed
with eligibility.py from raw/ and the exclusion register, and the run fails if the summary disagrees (stale summary).
Outputs in 04-template-benchmarks/: tiers.csv (one row per eligible theme), tier-aggregates.csv, blueprints.csv.

Rules (benchmark-pack.md §2, D-027):
- Cold-load aggregates use Lighthouse columns of cold-load-eligible captures; post-visit aggregates use CDP columns of
  structure-eligible captures. The two sources are never mixed. TBT is reported as TBT, never as INP.
- Theme first: each theme contributes the median of its own eligible captures, so retries never add weight.
- Tier = the template tier our harness would assign from OBSERVED signals (08-template-system-and-harness.md §2–§3):
  signature = scroll-linked or 3D motion (scrollTrigger, three); premium = audio (an <audio> element or a detected
  music control) or a level-2 motion library; basic = none of those signals detected. Absence of a detected signal is
  not proof of absence, so a basic classification carries low confidence. It is not the vendor's price tier.
- Our own captures (population=own) are reported next to the competitor aggregates, never inside them.
- p75 = the value 75 % of themes meet or beat (75th percentile for lower-is-better metrics, 25th for higher-is-better);
  linear interpolation between order statistics. Best-in-class = the best theme value in the metric's direction (best_theme_capture = that theme's first eligible capture).
- Confidence per aggregate: high = >= 10 themes from >= 3 vendors; medium = >= 5 themes from >= 2 vendors; else low.
No parity threshold is derived here; harness budgets stay internal (benchmark-pack.md §5).
"""
import argparse
import csv
import io
import os
import statistics
import sys

import eligibility

RESEARCH = eligibility.RESEARCH
BENCH = os.path.join(RESEARCH, '04-template-benchmarks')
SUMMARY = os.path.join(BENCH, 'captures-summary.csv')

SIGNATURE_LIBS = {'scrollTrigger', 'three'}
LEVEL2_LIBS = {'gsap', 'aos', 'animateCss', 'lottie', 'anime'}
NON_LATIN_DETECTOR_GAP = {'barunson': 'Korean page: the Indonesian/English feature detector does not apply (dossier §4 manual reading)'}

# (metric, column, direction, source); direction 'low' = lower is better.
METRICS = [
    ('perf', 'perf', 'high', 'lighthouse'), ('a11y', 'a11y', 'high', 'lighthouse'),
    ('best_practices', 'best_practices', 'high', 'lighthouse'), ('seo', 'seo', 'high', 'lighthouse'),
    ('fcp_ms', 'fcp_ms', 'low', 'lighthouse'), ('lcp_ms', 'lcp_ms', 'low', 'lighthouse'),
    ('tbt_ms', 'tbt_ms', 'low', 'lighthouse'), ('cls', 'cls', 'low', 'lighthouse'), ('si_ms', 'si_ms', 'low', 'lighthouse'),
    ('lh_requests', 'lh_requests', 'low', 'lighthouse'), ('lh_kib', 'lh_kib', 'low', 'lighthouse'),
    ('lh_kib_script', 'lh_kib_script', 'low', 'lighthouse'), ('lh_kib_image', 'lh_kib_image', 'low', 'lighthouse'),
    ('lh_kib_font', 'lh_kib_font', 'low', 'lighthouse'), ('lh_kib_third_party', 'lh_kib_third_party', 'low', 'lighthouse'),
    ('cdp_visit_kib', 'cdp_visit_kib', 'low', 'cdp_visit'), ('cdp_visit_requests', 'cdp_visit_requests', 'low', 'cdp_visit'),
    ('cdp_third_party_hosts', 'cdp_third_party_hosts', 'low', 'cdp_visit'), ('cdp_font_files', 'cdp_font_files', 'low', 'cdp_visit'),
]
TIERS = ('basic', 'premium', 'signature')


def number(text):
    try:
        value = float(text)
    except (TypeError, ValueError):
        return None
    return value


def truthy(text):
    return str(text).strip().lower() in ('true', 'y', 'yes', '1')


def classify(row):
    """Return (tier, signals, confidence) from observed libraries, audio elements and the music-control feature."""
    libs = set((row.get('libs') or '').split())
    features = set((row.get('features') or '').split())
    audio = (number(row.get('audio_elements')) or 0) > 0 or 'musicControl' in features
    signals = sorted(libs & (SIGNATURE_LIBS | LEVEL2_LIBS)) + (['audio'] if audio else [])
    if libs & SIGNATURE_LIBS:
        return 'signature', signals, 'medium'
    if audio or libs & LEVEL2_LIBS:
        return 'premium', signals, 'medium'
    return 'basic', signals, 'low'


def percentile(values, q):
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    pos = (len(ordered) - 1) * q
    lo, hi = int(pos), min(int(pos) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (pos - lo)


def confidence(n_themes, n_vendors):
    if n_themes >= 10 and n_vendors >= 3:
        return 'high'
    if n_themes >= 5 and n_vendors >= 2:
        return 'medium'
    return 'low'


def load_rows():
    with open(SUMMARY, encoding='utf-8') as handle:
        rows = list(csv.DictReader(handle))
    register = eligibility.load_register()
    captures = eligibility.load_captures()
    results = eligibility.evaluate_all(captures, register)
    stale = []
    for row in rows:
        ev = results.get(row['id'])
        if ev is None:
            stale.append(f"{row['id']}: in the summary but not in raw/")
            continue
        for key in ('coldload_eligible', 'structure_eligible'):
            if truthy(row[key]) != bool(ev[key]):
                stale.append(f"{row['id']}: {key} summary={row[key]} recomputed={ev[key]}")
    if len(rows) != len(results):
        stale.append(f'summary has {len(rows)} rows, raw/ has {len(results)} captures')
    return rows, stale


def theme_values(rows, column, eligible_key):
    """{(competitor, theme_key): (median value, [capture ids])} over eligible captures with a number."""
    by_theme = {}
    for row in rows:
        if not truthy(row[eligible_key]):
            continue
        value = number(row.get(column))
        if value is None:
            continue
        by_theme.setdefault((row['competitor'], row['theme_key']), []).append((value, row['id']))
    return {key: (statistics.median(v for v, _ in items), [cid for _, cid in items]) for key, items in by_theme.items()}


def build(rows):
    eligible = [r for r in rows if truthy(r['coldload_eligible']) or truthy(r['structure_eligible'])]
    themes = {}
    for row in sorted(eligible, key=lambda r: r['id']):
        key = (row['competitor'], row['theme_key'])
        entry = themes.setdefault(key, {'rows': [], 'population': row['population']})
        entry['rows'].append(row)
    tiers_out, tier_of = [], {}
    for (competitor, theme), entry in sorted(themes.items()):
        first = entry['rows'][0]
        tier, signals, conf = classify(first)
        tiers_seen = {classify(r)[0] for r in entry['rows']}
        if len(tiers_seen) > 1:
            conf = 'low'
        tier_of[(competitor, theme)] = tier
        tiers_out.append({
            'competitor': competitor, 'population': entry['population'], 'theme_key': theme, 'tier': tier,
            'signals': ' '.join(signals) or '-', 'tier_confidence': conf,
            'coldload_captures': ' '.join(r['id'] for r in entry['rows'] if truthy(r['coldload_eligible'])) or '-',
            'structure_captures': ' '.join(r['id'] for r in entry['rows'] if truthy(r['structure_eligible'])) or '-',
            'detector_note': NON_LATIN_DETECTOR_GAP.get(competitor, ''),
        })
    aggregates = []
    for population in ('competitor', 'own'):
        for tier in TIERS + ('all',):
            for metric, column, direction, source in METRICS:
                eligible_key = 'coldload_eligible' if source == 'lighthouse' else 'structure_eligible'
                values = {k: v for k, v in theme_values(rows, column, eligible_key).items()
                          if themes.get(k, {}).get('population') == population and (tier == 'all' or tier_of.get(k) == tier)}
                if not values:
                    continue
                nums = [v for v, _ in values.values()]
                best_key = (min if direction == 'low' else max)(values, key=lambda k: values[k][0])
                vendors = {k[0] for k in values}
                aggregates.append({
                    'population': population, 'tier': tier, 'metric': metric, 'direction': 'lower is better' if direction == 'low' else 'higher is better',
                    'source': source, 'n_themes': len(values), 'n_vendors': len(vendors), 'n_captures': sum(len(c) for _, c in values.values()),
                    'median': round(statistics.median(nums), 3), 'p75': round(percentile(nums, 0.75 if direction == 'low' else 0.25), 3),
                    'best': round(values[best_key][0], 3), 'best_theme_capture': values[best_key][1][0],
                    'confidence': confidence(len(values), len(vendors)) if population == 'competitor' else 'own pages (not a market sample)',
                })
    blueprints = []
    for (competitor, theme), entry in sorted(themes.items()):
        structural = [r for r in entry['rows'] if truthy(r['structure_eligible'])]
        if not structural:
            continue
        row = structural[0]
        blueprints.append({
            'competitor': competitor, 'population': entry['population'], 'theme_key': theme, 'capture': row['id'],
            'tier': tier_of[(competitor, theme)], 'libs': row['libs'] or '-',
            'features_detected': row['features'] or '-', 'sections_detected': row['sections'],
            'audio_elements': row['audio_elements'], 'og_image': row['og_image'], 'reduced_motion_css': row['reduced_motion_css'],
            'dom_nodes': row['dom_nodes'], 'cover_detected': row['cover_detected'], 'click_attempted': row['click_attempted'],
            'gate_opening': row['gate_opening'], 'audio_playback': row['audio_playback'],
            'caveats': '; '.join(filter(None, [NON_LATIN_DETECTOR_GAP.get(competitor, ''),
                                               'sectionCount unreliable for div layouts' if row['sections'] in ('0', '1', '2') else '',
                                               'feature list = keywords detected; absence is unknown, not missing'])),
        })
    return tiers_out, aggregates, blueprints


def render(records):
    if not records:
        return ''
    out = io.StringIO()
    writer = csv.DictWriter(out, fieldnames=list(records[0].keys()), lineterminator='\n')
    writer.writeheader()
    writer.writerows(records)
    return out.getvalue()


def markdown(aggregates, metrics=('perf', 'a11y', 'lcp_ms', 'tbt_ms', 'cls', 'lh_kib', 'lh_kib_script', 'lh_kib_font', 'cdp_visit_kib')):
    lines = ['| Population | Tier | Metric (direction) | Source | Themes / vendors / captures | Median | p75 | Best (first capture of that theme) | Confidence |',
             '|---|---|---|---|---|---|---|---|---|']
    for a in aggregates:
        if a['metric'] in metrics:
            lines.append(f"| {a['population']} | {a['tier']} | {a['metric']} ({'↓' if a['direction'].startswith('lower') else '↑'}) | {a['source']} | "
                         f"{a['n_themes']} / {a['n_vendors']} / {a['n_captures']} | {a['median']:g} | {a['p75']:g} | {a['best']:g} ({a['best_theme_capture']}) | {a['confidence']} |")
    return '\n'.join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--markdown', action='store_true')
    args = ap.parse_args()
    rows, stale = load_rows()
    if stale:
        print('captures-summary.csv is stale against raw/ + the register; run summarize-captures.py first:', file=sys.stderr)
        for line in stale:
            print('  ' + line, file=sys.stderr)
        return 1
    tiers_out, aggregates, blueprints = build(rows)
    files = {'tiers.csv': render(tiers_out), 'tier-aggregates.csv': render(aggregates), 'blueprints.csv': render(blueprints)}
    if args.markdown:
        print(markdown(aggregates))
        return 0
    if args.check:
        bad = [name for name, text in files.items()
               if not os.path.exists(os.path.join(BENCH, name)) or open(os.path.join(BENCH, name), encoding='utf-8').read() != text]
        print(f"benchmark-pack: {'STALE ' + ', '.join(bad) if bad else 'up to date'} "
              f"({len(tiers_out)} themes, {len(aggregates)} aggregates, {len(blueprints)} blueprints)")
        return 1 if bad else 0
    for name, text in files.items():
        with open(os.path.join(BENCH, name), 'w', encoding='utf-8') as handle:
            handle.write(text)
    print(f'benchmark-pack: wrote tiers.csv ({len(tiers_out)} themes), tier-aggregates.csv ({len(aggregates)} rows), '
          f'blueprints.csv ({len(blueprints)} themes)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
