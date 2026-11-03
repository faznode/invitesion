#!/usr/bin/env python3
"""Benchmark eligibility of capture summaries (brief 05 Task B1, decision D-023, protocol §2.2).

    python3 -B invitation-research/_tools/capture/eligibility.py --check    # validate the register against raw/ (exit 1 on errors)
    python3 -B invitation-research/_tools/capture/eligibility.py --report   # + one line per capture and coverage per competitor

Library use (summarize-captures.py, dossier-digest.py):
    register = load_register(known_ids=...)              # curated rows of 04-template-benchmarks/benchmark-exclusions.csv
    ev = evaluate(capture, register.rules.get(cid))      # page class, cold-load / structure eligibility, theme key, cover verdict

Rules, in order of authority:
  1. A curated register row always wins. Heuristics never override it; they only add findings for a human to curate.
  2. page_class: curated row > capture `kind` (marketing, catalog) > wrapper heuristic (excluded until curated) > `kind=demo`.
  3. Cold-load (Lighthouse) eligible = guest_page + Lighthouse OK with the protocol settings + robots allowed + no `scope=all`.
  4. Structure eligible = guest_page + robots allowed + no `scope=all` or `scope=structure` row.
  5. Opening and post-open interaction claims also need `gate_opening`: only `verified_open` is a D-016 verified opening.
     Audio playback is never measured by capture.mjs, so `audio_playback` is always `not_measured`.
  6. Coverage counts unique `theme_key`s (host + path + theme query parameters, guest parameters dropped), never attempts;
     aggregates take the median per theme first, so a retried theme weighs as much as a theme captured once.
"""
import argparse
import csv
import glob
import json
import os
import re
import statistics
import sys
from dataclasses import dataclass, field
from urllib.parse import parse_qsl, urlencode, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
RESEARCH = os.path.normpath(os.path.join(HERE, '..', '..'))
REGISTER_PATH = os.path.join(RESEARCH, '04-template-benchmarks', 'benchmark-exclusions.csv')
REGISTER_COLUMNS = ['capture_id', 'scope', 'page_class', 'reason', 'decision', 'evidence', 'revisit_when']
SCOPES = ('all', 'structure')
PAGE_CLASSES = ('guest_page', 'wrapper', 'catalog', 'marketing')
GATE_OPENINGS = ('verified_open', 'unverified_open', 'gate_persisted', 'no_click', 'no_cover_detected')
CAPTURE_ID = re.compile(r'^C-[A-Z]{3}-\d{3}$')
DECISION_ID = re.compile(r'^D-\d{3}$')
ROBOTS_STATUS = re.compile(r'robots\.txt\s+(\d{3})')
# Every cold-load sample must share these Lighthouse settings (protocol §2); anything else is a different method.
PROTOCOL = {'lighthouseVersion': '12.8.2', 'cpuSlowdownMultiplier': 4, 'rttMs': 150, 'width': 412, 'mobile': True}
# Guest personalisation parameters do not identify a theme. Every other query parameter (e.g. Enviory's `tpl`) does.
GUEST_PARAMS = {'to', 'code', 'kpd', 'guest', 'tamu', 'nama', 'name', 'u'}
# A vendor preview wrapper (small top document + same-origin iframe holding the real invitation) is not the guest page
# (protocol §2.1, session 04). The heuristic also matches closed-cover guest pages, so a curated row must decide.
WRAPPER_MAX_DOM_NODES = 200


@dataclass
class Register:
    path: str
    rules: dict = field(default_factory=dict)
    problems: list = field(default_factory=list)
    rows: int = 0


def is_wrapper(url, after):
    host = (urlparse(url or '').hostname or '').removeprefix('www.')
    frames = [(h or '').removeprefix('www.') for h in ((after.get('media') or {}).get('iframes') or [])]
    same_origin = any(h and (h == host or h.endswith('.' + host) or host.endswith('.' + h)) for h in frames)
    dom = after.get('domNodes')
    return bool(same_origin and isinstance(dom, int) and dom < WRAPPER_MAX_DOM_NODES)


def theme_key(url):
    parts = urlparse(url or '')
    host = (parts.hostname or '').removeprefix('www.')
    port = f':{parts.port}' if parts.port else ''
    path = parts.path.rstrip('/') or '/'
    params = sorted((k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True)
                    if k.lower() not in GUEST_PARAMS and not k.lower().startswith('utm_'))
    return f'{host}{port}{path}' + (f'?{urlencode(params)}' if params else '')


def robots_blocked(robots):
    match = ROBOTS_STATUS.search(robots.get('note') or '')
    status = int(match.group(1)) if match else None
    return robots.get('allowed') is False or (status is not None and (status >= 500 or status == 429))


def lighthouse_status(lh):
    if not lh.get('ok'):
        return False, 'Lighthouse failed'
    if (lh.get('scores') or {}).get('performance') is None or (lh.get('metrics') or {}).get('lcpMs') is None \
            or lh.get('totalBytes') is None:
        return False, 'Lighthouse incomplete (performance, LCP or transfer missing)'
    throttling, screen = lh.get('throttling') or {}, lh.get('screen') or {}
    actual = {'lighthouseVersion': lh.get('lighthouseVersion'), 'cpuSlowdownMultiplier': throttling.get('cpuSlowdownMultiplier'),
              'rttMs': throttling.get('rttMs'), 'width': screen.get('width'), 'mobile': screen.get('mobile')}
    differences = [f'{key}={actual[key]!r}' for key, wanted in PROTOCOL.items() if actual[key] != wanted]
    if differences:
        return False, 'Lighthouse settings differ from the protocol (' + ', '.join(differences) + ')'
    return True, ''


def cover_verdict(structure):
    """Cover detected / click attempted / gate opening / audio, kept as separate facts (brief 05 B2, D-016)."""
    before = (structure.get('beforeOpen') or {}).get('features') or {}
    after_open = structure.get('afterOpen') or {}
    after = after_open.get('features') or {}
    label = structure.get('coverClicked')
    attempted = isinstance(label, str) and bool(label.strip())
    method = structure.get('coverClickMethod') or ''
    detected = bool(before.get('coverGate') or after.get('coverGate'))
    if not detected:
        opening = 'no_cover_detected'
    elif not attempted:
        opening = 'no_click'
    elif after.get('coverGate'):
        opening = 'gate_persisted'
    elif method.startswith('trusted'):
        opening = 'verified_open'
    else:
        opening = 'unverified_open'
    audio = (after_open.get('media') or {}).get('audio') or []
    return {
        'cover_detected': detected,
        'click_attempted': attempted,
        'click_method': method or ('pre-D-016 (untrusted or unrecorded)' if attempted else ''),
        'click_landing': structure.get('coverClickLanding') or '',
        'gate_opening': opening,
        'audio_elements': len(audio),
        'audio_autoplay_attr': any(bool(a.get('autoplay')) for a in audio),
        'audio_playback': 'not_measured',
    }


def load_register(path=REGISTER_PATH, known_ids=None):
    """Read the curated register. Invalid rows are reported and applied conservatively (as scope=all, class unknown)."""
    register = Register(path=path)
    name = os.path.basename(path)
    with open(path, newline='', encoding='utf-8') as handle:
        reader = csv.DictReader(handle)
        missing = [column for column in REGISTER_COLUMNS if column not in (reader.fieldnames or [])]
        if missing:
            register.problems.append(('error', '-', f'{name}: missing column(s) {", ".join(missing)}'))
        for line, raw in enumerate(reader, start=2):
            register.rows += 1
            row = {column: (raw.get(column) or '').strip() for column in REGISTER_COLUMNS}
            cid, where = row['capture_id'], f'{name}:{line}'
            if not CAPTURE_ID.match(cid):
                register.problems.append(('error', cid or '-', f'{where}: invalid capture_id {cid!r}'))
                continue
            errors = []
            if row['scope'] not in SCOPES:
                errors.append(f"invalid scope {row['scope']!r} (allowed: {', '.join(SCOPES)})")
            if row['page_class'] not in PAGE_CLASSES:
                errors.append(f"invalid page_class {row['page_class']!r} (allowed: {', '.join(PAGE_CLASSES)})")
            elif row['scope'] == 'structure' and row['page_class'] != 'guest_page':
                errors.append(f"scope=structure contradicts page_class={row['page_class']} (only a guest page keeps cold-load evidence)")
            if not row['reason']:
                errors.append('empty reason')
            if not row['decision']:
                errors.append('empty decision')
            elif not DECISION_ID.match(row['decision']):
                register.problems.append(('warning', cid, f"{where}: decision {row['decision']!r} is not a D-NNN id"))
            if known_ids is not None and cid not in known_ids:
                errors.append('unknown capture id (no raw/<competitor>/<id>.json)')
            for message in errors:
                register.problems.append(('error', cid, f'{where}: {message}'))
            rule = {'scope': row['scope'], 'page_class': row['page_class'], 'decision': row['decision'],
                    'reason': row['reason'], 'valid': not errors, 'line': line}
            if errors:
                rule['scope'] = 'all'
                if row['page_class'] not in PAGE_CLASSES or row['scope'] not in SCOPES:
                    rule['page_class'] = 'unknown'
            previous = register.rules.get(cid)
            if previous:
                same = (previous['scope'], previous['page_class']) == (rule['scope'], rule['page_class'])
                register.problems.append(('error', cid, f"{where}: {'duplicate' if same else 'conflicting'} row "
                                                        f"(first at line {previous['line']}); the stricter reading applies"))
                if 'all' in (previous['scope'], rule['scope']):
                    previous['scope'] = 'all'
                if previous['page_class'] != rule['page_class']:
                    previous['page_class'] = 'unknown'
                previous['valid'] = False
                continue
            register.rules[cid] = rule
    return register


def evaluate(capture, rule=None):
    structure = capture.get('structure') or {}
    after = structure.get('afterOpen') or {}
    findings = []
    wrapper_heuristic = is_wrapper(capture.get('url'), after)
    kind = capture.get('kind')
    if rule:
        page_class, source = rule['page_class'], 'curated'
        if wrapper_heuristic and page_class != 'wrapper':
            findings.append(('note', f'wrapper heuristic overridden by the curated row (page_class={page_class})'))
    elif kind in ('marketing', 'catalog'):
        page_class, source = kind, 'kind'
    elif wrapper_heuristic:
        page_class, source = 'wrapper', 'heuristic'
        findings.append(('warning', 'wrapper by heuristic only, so excluded: add a curated register row'))
    elif kind == 'demo':
        page_class, source = 'guest_page', 'kind'
    else:
        page_class, source = 'unknown', 'default'
        findings.append(('warning', f'unknown kind {kind!r}: not eligible until curated'))

    blocked = robots_blocked(capture.get('robots') or {})
    if blocked and not (rule and rule['scope'] == 'all'):
        findings.append(('error', 'robots.txt disallowed or unreachable at capture time, but no scope=all register row (D-022)'))
    lh_ok, lh_reason = lighthouse_status(capture.get('lighthouse') or {})
    if rule and rule['scope'] == 'structure' and not lh_ok:
        findings.append(('warning', 'scope=structure keeps cold-load evidence, but Lighthouse failed: no cold-load sample either'))

    decision = f" ({rule['decision'] or 'no decision'})" if rule else ''
    coldload, structural = [], []
    if rule and rule['scope'] == 'all':
        coldload.append(f'register scope=all{decision}')
    if rule:
        structural.append(f"register scope={rule['scope']}{decision}")
    for reasons in (coldload, structural):
        if page_class != 'guest_page':
            reasons.append(f'page_class={page_class}')
        if blocked:
            reasons.append('robots blocked at capture time')
    if not lh_ok:
        coldload.append(lh_reason)

    cover = cover_verdict(structure)
    if not structural and cover['gate_opening'] == 'gate_persisted':
        findings.append(('warning', 'cover gate still detected after the click: opening and post-open interaction unverified '
                                    '(structure kept per the register)'))
    return {
        'population': 'own' if capture.get('competitor') == 'invitesion' else 'competitor',
        'page_class': page_class, 'page_class_source': source, 'wrapper_heuristic': wrapper_heuristic,
        'exclusion_scope': rule['scope'] if rule else '', 'exclusion_decision': rule['decision'] if rule else '',
        'coldload_eligible': not coldload, 'coldload_reasons': coldload,
        'structure_eligible': not structural, 'structure_reasons': structural,
        'theme_key': theme_key(capture.get('url')), 'visit_driver': capture.get('driver') or 'pre-s06',
        **cover, 'findings': findings,
    }


def load_captures(raw_glob=None):
    pattern = raw_glob or os.path.join(RESEARCH, 'raw', '*', 'C-*.json')
    captures = []
    for path in sorted(glob.glob(pattern)):
        with open(path, encoding='utf-8') as handle:
            captures.append(json.load(handle))
    return captures


def evaluate_all(captures, register):
    """Evaluate every capture; number retries per theme in capture order (1 = first attempt)."""
    results = {}
    for capture in captures:
        results[capture['id']] = evaluate(capture, register.rules.get(capture['id']))
    by_theme = {}
    for capture in sorted(captures, key=lambda c: (c.get('capturedAt') or '', c['id'])):
        by_theme.setdefault((capture.get('competitor'), results[capture['id']]['theme_key']), []).append(capture['id'])
    for ids in by_theme.values():
        for attempt, cid in enumerate(ids, start=1):
            results[cid]['theme_attempt'], results[cid]['theme_attempts'] = attempt, len(ids)
    return results


def theme_median(samples, value):
    """Median over unique themes. Each theme contributes the median of its own samples, so retries add no weight.

    samples: iterable of (theme_key, capture); value: capture -> number or None. Returns (median, n_themes, n_captures)."""
    by_theme = {}
    for key, capture in samples:
        number = value(capture)
        if isinstance(number, (int, float)) and not isinstance(number, bool):
            by_theme.setdefault(key, []).append(number)
    if not by_theme:
        return None, 0, 0
    return (statistics.median(statistics.median(v) for v in by_theme.values()), len(by_theme),
            sum(len(v) for v in by_theme.values()))


def coverage(captures, results):
    table = {}
    for capture in captures:
        ev = results[capture['id']]
        entry = table.setdefault(capture.get('competitor'), {'captures': 0, 'coldload': set(), 'structure': set(),
                                                             'verified_open': set(), 'coldload_n': 0, 'structure_n': 0})
        entry['captures'] += 1
        if ev['coldload_eligible']:
            entry['coldload'].add(ev['theme_key'])
            entry['coldload_n'] += 1
        if ev['structure_eligible']:
            entry['structure'].add(ev['theme_key'])
            entry['structure_n'] += 1
            if ev['gate_opening'] == 'verified_open':
                entry['verified_open'].add(ev['theme_key'])
    return table


def all_problems(register, captures, results):
    problems = list(register.problems)
    for capture in captures:
        problems.extend((level, capture['id'], message) for level, message in results[capture['id']]['findings'])
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    parser.add_argument('--register', default=REGISTER_PATH)
    parser.add_argument('--raw-glob', default=None, help='capture summaries to evaluate (default raw/*/C-*.json)')
    parser.add_argument('--check', action='store_true', help='validate only; exit 1 on errors')
    parser.add_argument('--report', action='store_true', help='also print every capture and the coverage table')
    args = parser.parse_args()
    captures = load_captures(args.raw_glob)
    register = load_register(args.register, known_ids={c['id'] for c in captures})
    results = evaluate_all(captures, register)
    problems = all_problems(register, captures, results)
    if args.report:
        for capture in captures:
            ev = results[capture['id']]
            reasons = '; '.join(ev['coldload_reasons'] + [r for r in ev['structure_reasons'] if r not in ev['coldload_reasons']])
            print(f"{capture['id']:10} {ev['page_class']:10} ({ev['page_class_source']:9}) cold-load={'Y' if ev['coldload_eligible'] else 'n'} "
                  f"structure={'Y' if ev['structure_eligible'] else 'n'} opening={ev['gate_opening']:17} "
                  f"theme={ev['theme_key']} [{ev['theme_attempt']}/{ev['theme_attempts']}]{'  -- ' + reasons if reasons else ''}")
        print()
        print('competitor   captures  cold-load captures/themes  structure captures/themes  verified-open themes')
        for competitor, entry in sorted(coverage(captures, results).items()):
            print(f"{competitor:12} {entry['captures']:8}  {entry['coldload_n']:9} / {len(entry['coldload']):<14} "
                  f"{entry['structure_n']:9} / {len(entry['structure']):<14} {len(entry['verified_open'])}")
        print()
    levels = {'error': 0, 'warning': 0, 'note': 0}
    for level, cid, message in sorted(problems, key=lambda p: (('error', 'warning', 'note').index(p[0]), p[1])):
        levels[level] += 1
        print(f'{level.upper():7} {cid:10} {message}', file=sys.stderr if level == 'error' else sys.stdout)
    print(f"eligibility: {len(captures)} captures, register {register.rows} rows; "
          f"{levels['error']} error(s), {levels['warning']} warning(s), {levels['note']} note(s)")
    return 1 if levels['error'] else 0


if __name__ == '__main__':
    sys.exit(main())
