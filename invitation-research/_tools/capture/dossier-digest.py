#!/usr/bin/env python3
"""Dossier §4/§5 helper: a measurement table with medians plus a compact structure digest per capture.

    python3 -B invitation-research/_tools/capture/dossier-digest.py --competitor katsudoto C-KAT-101 … C-KAT-106

Reads raw/<competitor>/C-*.json only (measurements and structure: no page copy, no names, R1/R2) and prints
Markdown to stdout for pasting into 03-teardowns/<competitor>/dossier.md.
"""
import argparse
import json
import os
import statistics

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.normpath(os.path.join(HERE, '..', '..'))


def load(competitor, capture_id):
    with open(os.path.join(RESEARCH, 'raw', competitor, f'{capture_id}.json')) as handle:
        return json.load(handle)


def fmt(value, kind):
    if value is None:
        return '–'
    if kind == 's':
        return f'{value / 1000:.2f}'
    if kind == 'cls':
        return f'{value:.3f}'
    if kind == 'int':
        return f'{round(value):,}'
    return str(value)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--competitor', required=True)
    parser.add_argument('ids', nargs='+')
    args = parser.parse_args()

    columns = [('Perf', 'perf', 'raw'), ('A11y', 'a11y', 'raw'), ('BP', 'bp', 'raw'), ('SEO', 'seo', 'raw'),
               ('LCP s', 'lcp', 's'), ('TBT ms', 'tbt', 'int'), ('CLS', 'cls', 'cls'), ('CDP KB', 'kb', 'int'),
               ('JS KB', 'js', 'int'), ('Img KB', 'img', 'int'), ('Font KB', 'font', 'int'), ('Req', 'req', 'int'),
               ('DOM', 'dom', 'int'), ('Sections', 'sec', 'raw'), ('Cover', 'cover', 'raw')]
    rows = []
    digests = []
    for capture_id in args.ids:
        d = load(args.competitor, capture_id)
        lh = d.get('lighthouse') or {}
        scores, metrics = lh.get('scores') or {}, lh.get('metrics') or {}
        net = d.get('network') or {}
        by_type = net.get('byType') or {}
        structure = d.get('structure') or {}
        after = structure.get('afterOpen') or {}
        kb = lambda name: round(((by_type.get(name) or {}).get('bytes') or 0) / 1024)
        rows.append({'id': capture_id, 'perf': scores.get('performance'), 'a11y': scores.get('accessibility'),
                     'bp': scores.get('best-practices'), 'seo': scores.get('seo'), 'lcp': metrics.get('lcpMs'),
                     'tbt': metrics.get('tbtMs'), 'cls': metrics.get('cls'), 'kb': round((net.get('bytes') or 0) / 1024),
                     'js': kb('Script'), 'img': kb('Image'), 'font': kb('Font'), 'req': net.get('requests'),
                     'dom': after.get('domNodes'), 'sec': after.get('sectionCount'),
                     'cover': structure.get('coverClicked') or 'no'})
        media = after.get('media') or {}
        digests.append({
            'id': capture_id, 'driver': d.get('driver', 'pre-s06'), 'lang': after.get('lang'),
            'zoom': 'blocked' if 'user-scalable=no' in (after.get('viewport') or '').replace(' ', '') or 'maximum-scale=1' in (after.get('viewport') or '').replace(' ', '') else 'allowed',
            'og': ''.join(k[0] for k, v in (after.get('og') or {}).items() if v), 'reducedMotionCss': after.get('reducedMotionCss'),
            'generator': (after.get('generator') or '')[:30], 'fonts': (after.get('fontsUsed') or [])[:6],
            'audio': [f"{'autoplay ' if a.get('autoplay') else ''}{'loop ' if a.get('loop') else ''}{a.get('type')}" for a in (media.get('audio') or [])][:2],
            'video': media.get('video'), 'iframes': sorted(set(media.get('iframes') or []))[:4], 'lazyImages': f"{media.get('lazyImages')}/{media.get('images')}",
            'forms': [len(f.get('fields') or []) for f in (after.get('forms') or [])][:4],
            'tz': (after.get('features') or {}).get('timezoneLabel'), 'docHeight': after.get('docHeight'),
            'a11yFailures': lh.get('a11yFailures') or [], 'unusedJsKB': round((lh.get('unusedJsBytes') or 0) / 1024),
            'thirdParties': [f"{t.get('entity')} {round((t.get('bytes') or 0) / 1024)}KB/{round(t.get('blockingMs') or 0)}ms" for t in (lh.get('thirdParties') or [])[:5]],
            'fontDisplayIssues': lh.get('fontDisplayIssues'), 'protocols': net.get('protocols'),
        })

    print('| Capture | ' + ' | '.join(c[0] for c in columns) + ' |')
    print('|' + '---|' * (len(columns) + 1))
    for row in rows:
        print(f"| {row['id']} | " + ' | '.join(fmt(row[c[1]], c[2]) for c in columns) + ' |')
    medians = {}
    for _, key, kind in columns:
        values = [row[key] for row in rows if isinstance(row[key], (int, float)) and not isinstance(row[key], bool)]
        medians[key] = statistics.median(values) if values else None
    print('| **Median** | ' + ' | '.join(f"**{fmt(medians[c[1]], c[2] if c[2] != 'raw' else 'int')}**" if medians[c[1]] is not None else '' for c in columns) + ' |')
    print()
    for digest in digests:
        print(json.dumps(digest, ensure_ascii=False))


if __name__ == '__main__':
    main()
