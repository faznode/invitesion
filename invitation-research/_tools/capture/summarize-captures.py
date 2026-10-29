#!/usr/bin/env python3
"""Flatten capture summaries (raw/<competitor>/C-*.json) into one CSV row per capture.

    python3 invitation-research/_tools/capture/summarize-captures.py            # all captures
    python3 .../summarize-captures.py --competitor invi --print                                 # one competitor, table to stdout
    -> invitation-research/04-template-benchmarks/captures-summary.csv (generated; feeds blueprints, dossiers, tier aggregates)

Only measurements and structure leave raw/: no page copy, no names (R1/R2).
"""
import argparse
import csv
import glob
import json
import os
from urllib.parse import urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.normpath(os.path.join(HERE, '..', '..'))
COLUMNS = ['id', 'competitor', 'kind', 'url', 'captured_at', 'lh_ok', 'perf', 'a11y', 'best_practices', 'seo',
           'fcp_ms', 'lcp_ms', 'tbt_ms', 'cls', 'si_ms', 'requests', 'kb_total', 'kb_script', 'kb_image', 'kb_font',
           'kb_css', 'kb_media', 'third_party_hosts', 'libs', 'font_files', 'sections', 'features', 'og_image',
           'reduced_motion_css', 'dom_nodes', 'wrapper', 'cover_clicked']
# A vendor preview wrapper (small top document + same-origin iframe holding the real invitation) is not the
# guest page: its numbers must not feed thresholds; re-target the iframe's official URL (protocol §2.1, session 04).
WRAPPER_MAX_DOM_NODES = 200


def is_wrapper(url, after):
    host = (urlparse(url or '').hostname or '').removeprefix('www.')
    frames = [(h or '').removeprefix('www.') for h in ((after.get('media') or {}).get('iframes') or [])]
    same_origin = any(h and (h == host or h.endswith('.' + host) or host.endswith('.' + h)) for h in frames)
    dom = after.get('domNodes')
    return bool(same_origin and isinstance(dom, int) and dom < WRAPPER_MAX_DOM_NODES)


def kb(by_type, *names):
    total = 0
    for name in names:
        total += (by_type.get(name) or {}).get('bytes') or 0
    return round(total / 1024)


def row(path):
    d = json.load(open(path))
    net = d.get('network') or {}
    by_type = net.get('byType') or {}
    lh = d.get('lighthouse') or {}
    scores = lh.get('scores') or {}
    metrics = lh.get('metrics') or {}
    structure = d.get('structure') or {}
    after = structure.get('afterOpen') or {}
    before = structure.get('beforeOpen') or {}
    libs = sorted(k for k, v in (after.get('libs') or {}).items() if v)
    # A gate's wording is gone once the cover opens, so judge coverGate on the before-open pass and the click as well.
    flags = dict(after.get('features') or {})
    flags['coverGate'] = bool(flags.get('coverGate') or (before.get('features') or {}).get('coverGate') or structure.get('coverClicked'))
    features = sorted(k for k, v in flags.items() if v)
    return {
        'id': d.get('id'), 'competitor': d.get('competitor'), 'kind': d.get('kind'), 'url': d.get('url'),
        'captured_at': d.get('capturedAt') or d.get('captured_at') or '',
        'lh_ok': bool(lh.get('ok')), 'perf': scores.get('performance'), 'a11y': scores.get('accessibility'),
        'best_practices': scores.get('best-practices'), 'seo': scores.get('seo'),
        'fcp_ms': metrics.get('fcpMs'), 'lcp_ms': metrics.get('lcpMs'), 'tbt_ms': metrics.get('tbtMs'),
        'cls': metrics.get('cls'), 'si_ms': metrics.get('siMs'),
        'requests': net.get('requests'), 'kb_total': round((net.get('bytes') or 0) / 1024),
        'kb_script': kb(by_type, 'Script'), 'kb_image': kb(by_type, 'Image'), 'kb_font': kb(by_type, 'Font'),
        'kb_css': kb(by_type, 'Stylesheet'), 'kb_media': kb(by_type, 'Media'),
        'third_party_hosts': len(net.get('thirdPartyHosts') or []), 'libs': ' '.join(libs),
        'font_files': len(net.get('fontFiles') or []), 'sections': after.get('sectionCount'),
        'features': ' '.join(features), 'og_image': (after.get('og') or {}).get('image'),
        'reduced_motion_css': after.get('reducedMotionCss'),
        'dom_nodes': after.get('domNodes'), 'wrapper': is_wrapper(d.get('url'), after),
        'cover_clicked': structure.get('coverClicked') or '',
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--competitor', default='*')
    ap.add_argument('--out', default=os.path.join(RESEARCH, '04-template-benchmarks', 'captures-summary.csv'))
    ap.add_argument('--print', action='store_true')
    a = ap.parse_args()
    paths = sorted(glob.glob(os.path.join(RESEARCH, 'raw', a.competitor, 'C-*.json')))
    rows = [row(p) for p in paths]
    if a.competitor == '*':
        with open(a.out, 'w', newline='') as fh:
            w = csv.DictWriter(fh, fieldnames=COLUMNS)
            w.writeheader()
            w.writerows(rows)
        print(f'{len(rows)} captures -> {os.path.relpath(a.out, RESEARCH)}')
    if a.print or a.competitor != '*':
        for r in rows:
            print(f"{r['id']:11} lh={str(r['lh_ok'])[0]} perf={r['perf']} a11y={r['a11y']} lcp={r['lcp_ms']} "
                  f"tbt={r['tbt_ms']} cls={r['cls']} req={r['requests']} kb={r['kb_total']} "
                  f"(js {r['kb_script']}, img {r['kb_image']}, font {r['kb_font']}, media {r['kb_media']}) "
                  f"libs=[{r['libs']}] sections={r['sections']}{' WRAPPER' if r['wrapper'] else ''}")


if __name__ == '__main__':
    main()
