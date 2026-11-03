#!/usr/bin/env python3
"""Offline regression tests: benchmark eligibility, measurement sources, privacy redaction (brief 05 Task B3).

    python3 -B invitation-research/_tools/capture/test_eligibility.py        # stdlib unittest, ~1 s, no network

Every case uses preserved evidence in raw/ or a small synthetic fixture built in a temp dir. No competitor is contacted
and no capture is made. Fixture names are fake ("Budi & Sari"), as AGENTS.md requires.
"""
import copy
import csv
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import eligibility as elig  # noqa: E402


def load_script(name, relative):
    spec = importlib.util.spec_from_file_location(name, os.path.normpath(os.path.join(HERE, relative)))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


summarize = load_script('summarize_captures', 'summarize-captures.py')
redact = load_script('redact_demo_names', '../safety/redact-demo-names.py')
DIGEST = os.path.join(HERE, 'dossier-digest.py')
SUMMARIZE = os.path.join(HERE, 'summarize-captures.py')
PSEUDONYMIZE = os.path.normpath(os.path.join(HERE, '..', 'safety', 'pseudonymize.mjs'))

CAPTURES = elig.load_captures()
BY_ID = {c['id']: c for c in CAPTURES}
REGISTER = elig.load_register(known_ids=set(BY_ID))
RESULTS = elig.evaluate_all(CAPTURES, REGISTER)
IDS = lambda prefix, numbers: [f'{prefix}-{n}' for n in numbers]


def write_register(directory, rows, columns=elig.REGISTER_COLUMNS):
    path = os.path.join(directory, 'register.csv')
    with open(path, 'w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(rows)
    return path


def rule_row(cid, scope='all', page_class='guest_page', decision='D-099', reason='fixture'):
    return {'capture_id': cid, 'scope': scope, 'page_class': page_class, 'reason': reason, 'decision': decision,
            'evidence': 'fixture', 'revisit_when': 'never'}


class RegisterIntegrity(unittest.TestCase):
    def test_committed_register_and_captures_have_no_errors(self):
        errors = [p for p in elig.all_problems(REGISTER, CAPTURES, RESULTS) if p[0] == 'error']
        self.assertEqual(errors, [])
        self.assertEqual(REGISTER.rows, len(REGISTER.rules))

    def test_invalid_definitions_are_reported_and_applied_conservatively(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = write_register(tmp, [
                rule_row('C-WEV-101', scope='partial'),                          # invalid scope
                rule_row('C-WEV-102', page_class='demo'),                        # invalid page class
                rule_row('C-WEV-103', scope='structure', page_class='wrapper'),  # contradiction
                rule_row('C-ZZZ-999'),                                           # unknown reference
                rule_row('ENV-101'),                                             # malformed id
                rule_row('C-WEV-104', decision=''),                              # empty decision
                rule_row('C-WEV-105', decision='X-1'),                           # not a D-NNN id (warning)
                rule_row('C-WEV-106', scope='structure'),
                rule_row('C-WEV-106', scope='structure'),                        # duplicate
                rule_row('C-KAT-101', scope='structure'),
                rule_row('C-KAT-101', scope='all'),                              # conflicting
            ])
            register = elig.load_register(path, known_ids=set(BY_ID))
        messages = {(level, cid): message for level, cid, message in register.problems}
        for cid, fragment in [('C-WEV-101', "invalid scope 'partial'"), ('C-WEV-102', "invalid page_class 'demo'"),
                              ('C-WEV-103', 'contradicts page_class=wrapper'), ('C-ZZZ-999', 'unknown capture id'),
                              ('ENV-101', 'invalid capture_id'), ('C-WEV-104', 'empty decision'),
                              ('C-WEV-106', 'duplicate row'), ('C-KAT-101', 'conflicting row')]:
            self.assertIn(fragment, messages.get(('error', cid), ''), cid)
        self.assertIn('not a D-NNN id', messages[('warning', 'C-WEV-105')])
        for cid in ('C-WEV-101', 'C-WEV-102', 'C-WEV-103', 'C-WEV-104', 'C-KAT-101'):
            ev = elig.evaluate(BY_ID[cid], register.rules[cid])
            self.assertFalse(ev['coldload_eligible'], cid)
            self.assertFalse(ev['structure_eligible'], cid)

    def test_missing_column_is_an_error(self):
        columns = [c for c in elig.REGISTER_COLUMNS if c != 'page_class']
        with tempfile.TemporaryDirectory() as tmp:
            register = elig.load_register(write_register(tmp, [rule_row('C-WEV-101')], columns), known_ids=set(BY_ID))
        self.assertTrue(any(level == 'error' and 'page_class' in message for level, _, message in register.problems))

    def test_summarizer_strict_mode_fails_on_a_bad_register(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = write_register(tmp, [rule_row('C-WEV-101', scope='partial')])
            run = subprocess.run([sys.executable, '-B', SUMMARIZE, '--strict', '--register', path,
                                  '--out', os.path.join(tmp, 'out.csv')], capture_output=True, text=True)
        self.assertEqual(run.returncode, 1)
        self.assertIn("invalid scope 'partial'", run.stderr)


class Eligibility(unittest.TestCase):
    def test_1_indoinvite_catalog_pages_are_excluded(self):
        for cid in IDS('C-IDI', range(101, 108)):
            ev = RESULTS[cid]
            self.assertEqual((ev['page_class'], ev['page_class_source']), ('catalog', 'curated'), cid)
            self.assertFalse(ev['coldload_eligible'] or ev['structure_eligible'], cid)
        self.assertEqual(len(elig.coverage(CAPTURES, RESULTS)['indoinvite']['coldload']), 0)

    def test_2_viding_studio_captures_never_enter_aggregates(self):
        for cid in IDS('C-VID', (104, 105, 106)):
            self.assertFalse(RESULTS[cid]['coldload_eligible'] or RESULTS[cid]['structure_eligible'], cid)
        run = subprocess.run([sys.executable, '-B', DIGEST, '--competitor', 'viding'] + IDS('C-VID', range(101, 107)),
                             capture_output=True, text=True, check=True)
        self.assertIn('Median of 3 theme(s), 3 eligible capture(s)', run.stdout)
        vid104 = [line for line in run.stdout.splitlines() if line.startswith('| C-VID-104 |')]
        self.assertEqual(len(vid104), 2)
        for line in vid104:
            self.assertNotRegex(line.split('|', 4)[4], r'\d', 'excluded row must print no numbers')
        perf = sorted(BY_ID[c]['lighthouse']['scores']['performance'] for c in IDS('C-VID', (101, 102, 103)))[1]
        self.assertIn(f'**{perf}**', [line for line in run.stdout.splitlines() if 'Median of 3' in line][0])

    def test_2a_scope_all_alone_excludes_a_valid_guest_page(self):
        clean = copy.deepcopy(BY_ID['C-WEV-104'])
        self.assertTrue(elig.evaluate(clean, None)['coldload_eligible'])
        rule = {'scope': 'all', 'page_class': 'guest_page', 'decision': 'D-099', 'reason': 'x', 'valid': True, 'line': 2}
        ev = elig.evaluate(clean, rule)
        self.assertEqual((ev['coldload_eligible'], ev['structure_eligible']), (False, False))
        self.assertEqual(ev['coldload_reasons'], ['register scope=all (D-099)'])

    def test_2b_robots_failure_without_exclusion_is_an_error(self):
        rules = {k: v for k, v in REGISTER.rules.items() if k != 'C-VID-104'}
        ev = elig.evaluate(BY_ID['C-VID-104'], rules.get('C-VID-104'))
        self.assertTrue(any(level == 'error' and 'D-022' in message for level, message in ev['findings']))
        self.assertFalse(ev['coldload_eligible'] or ev['structure_eligible'])

    def test_3_structure_only_exclusions_keep_cold_load(self):
        structure_rows = IDS('C-ENV', (112, 113, 117, 118, 119, 120, 121)) + IDS('C-IVT', (102, 103))
        for cid in structure_rows:
            self.assertTrue(RESULTS[cid]['coldload_eligible'], cid)
            self.assertFalse(RESULTS[cid]['structure_eligible'], cid)
        env = elig.coverage(CAPTURES, RESULTS)['enviory']
        self.assertEqual((env['coldload_n'], len(env['coldload']), env['structure_n'], len(env['structure'])), (13, 6, 6, 6))

    def test_3b_curated_row_beats_the_wrapper_heuristic(self):
        for cid in ('C-ENV-117', 'C-ENV-120'):
            ev = RESULTS[cid]
            self.assertTrue(ev['wrapper_heuristic'])
            self.assertEqual(ev['page_class'], 'guest_page')
            self.assertTrue(ev['coldload_eligible'])
        uncurated = elig.evaluate(BY_ID['C-ENV-117'], None)
        self.assertEqual((uncurated['page_class'], uncurated['coldload_eligible']), ('wrapper', False))

    def test_4_failed_lighthouse_never_enters_aggregates(self):
        for cid in ('C-IDI-104', 'C-INV-101'):
            self.assertIn('Lighthouse failed', RESULTS[cid]['coldload_reasons'])
        failed = copy.deepcopy(BY_ID['C-WEV-104'])
        failed.update(id='C-ZZZ-901')
        failed['lighthouse']['ok'] = False
        ev = elig.evaluate(failed, None)
        self.assertEqual((ev['coldload_eligible'], ev['structure_eligible']), (False, True))
        slow = copy.deepcopy(BY_ID['C-WEV-104'])
        slow['lighthouse']['throttling']['cpuSlowdownMultiplier'] = 1
        self.assertIn('differ from the protocol', ' '.join(elig.evaluate(slow, None)['coldload_reasons']))
        structure_rule = {'scope': 'structure', 'page_class': 'guest_page', 'decision': 'D-099', 'reason': 'x', 'valid': True, 'line': 2}
        self.assertTrue(any('Lighthouse failed' in message for _, message in elig.evaluate(failed, structure_rule)['findings']))
        samples = [(elig.theme_key(c['url']), c) for c in (BY_ID['C-WEV-105'], failed)
                   if elig.evaluate(c, None)['coldload_eligible']]
        self.assertEqual([c['id'] for _, c in samples], ['C-WEV-105'])

    def test_5_retries_do_not_inflate_unique_coverage(self):
        self.assertEqual(RESULTS['C-IDI-104']['theme_key'], RESULTS['C-IDI-107']['theme_key'])
        self.assertEqual([RESULTS[c]['theme_attempt'] for c in ('C-IDI-104', 'C-IDI-107')], [1, 2])
        self.assertEqual(RESULTS['C-INV-001']['theme_key'], RESULTS['C-INV-005']['theme_key'])
        self.assertEqual(RESULTS['C-ENV-122']['theme_attempts'], 5)
        median, themes, captures = elig.theme_median([('a', 10), ('a', 20), ('a', 30), ('b', 100)], lambda v: v)
        self.assertEqual((median, themes, captures), (60, 2, 4))

    def test_5b_theme_identifiers_survive_deduplication(self):
        key = elig.theme_key
        self.assertNotEqual(key('https://enviory.com/x?tpl=rocaille'), key('https://enviory.com/x?tpl=velora'))
        self.assertEqual(key('https://demo.invi.id/p/a/?to=Nama%20Tamu'), key('https://demo.invi.id/p/a'))
        self.assertEqual(key('https://www.wevitation.com/demo/x/?utm_source=ig'), key('https://wevitation.com/demo/x'))
        self.assertEqual(key('https://invitato.net/t-1/?code=DUMMY-P0001&theme=2'), 'invitato.net/t-1?theme=2')

    def test_cover_facts_are_separate(self):
        expected = {'C-ENV-122': 'verified_open', 'C-WEV-104': 'verified_open', 'C-ENV-111': 'unverified_open',
                    'C-ENV-117': 'gate_persisted', 'C-ENV-118': 'no_click', 'C-BRN-101': 'no_cover_detected'}
        for cid, opening in expected.items():
            self.assertEqual(RESULTS[cid]['gate_opening'], opening, cid)
        self.assertTrue(RESULTS['C-ENV-118']['cover_detected'] and not RESULTS['C-ENV-118']['click_attempted'])
        self.assertEqual({ev['audio_playback'] for ev in RESULTS.values()}, {'not_measured'})
        self.assertTrue(set(ev['gate_opening'] for ev in RESULTS.values()) <= set(elig.GATE_OPENINGS))


class Privacy(unittest.TestCase):
    FIXTURES = [
        {'title': 'Budi & Sari | Undangan Pernikahan', 'headings': ['Budi & Sari', 'Save the Date'], 'buttons': ['Buka Undangan', '@budisari_wedding']},
        {'title': 'The Wedding of Budi Santoso & Sari Lestari by Vendor', 'headings': ['Akad Nikah'], 'buttons': ['Budi Santoso']},
        {'title': 'Wanita & Pria — Undangan Digital', 'headings': ['Wanita & Pria'], 'buttons': ['Buka']},
        {'title': 'Groom & Bride - Wedding', 'headings': ['Our Story'], 'buttons': ['@vendor_official']},
    ]

    @staticmethod
    def summary(fixture):
        return {'id': 'C-ZZZ-900', 'competitor': 'fixture', 'kind': 'demo', 'url': 'https://example.invalid/demo',
                'structure': {'afterOpen': {'title': fixture['title'], 'sections': [{'heading': h} for h in fixture['headings']],
                                            'buttons': list(fixture['buttons'])},
                              'beforeOpen': {'buttons': list(fixture['buttons'])}}}

    def test_6_names_are_redacted_and_generic_placeholders_stay(self):
        out = []
        for fixture in self.FIXTURES:
            summary = self.summary(fixture)
            redact.redact_summary(summary)
            out.append(summary['structure']['afterOpen'])
        self.assertEqual(out[0]['title'], '[name] & [name] | Undangan Pernikahan')
        self.assertEqual([s['heading'] for s in out[0]['sections']], ['[name] & [name]', 'Save the Date'])
        self.assertEqual(out[0]['buttons'], ['Buka Undangan', '@[handle]'])
        self.assertEqual(out[1]['title'], 'The Wedding of [name] [name] & [name] [name] by Vendor')
        self.assertEqual(out[1]['buttons'], ['[name] [name]'])
        self.assertEqual(out[2]['title'], 'Wanita & Pria — Undangan Digital')
        self.assertEqual(out[2]['sections'][0]['heading'], 'Wanita & Pria')
        self.assertEqual(out[3]['title'], 'Groom & Bride - Wedding')
        self.assertEqual(out[3]['buttons'], ['@vendor_official'])
        own = self.summary(self.FIXTURES[0])
        own['competitor'] = 'invitesion'
        self.assertFalse(redact.in_scope(own))
        self.assertTrue(redact.in_scope(self.summary(self.FIXTURES[0])))

    def test_6b_python_and_capture_time_js_agree(self):
        node = shutil.which('node')
        if not node:
            self.skipTest('node not on PATH')
        structures = [self.summary(f)['structure'] for f in self.FIXTURES]
        script = (f"import {{ redactDemoNames }} from {json.dumps('file://' + PSEUDONYMIZE)};"
                  "const input = JSON.parse(await new Promise(r => { let s = ''; process.stdin.on('data', d => s += d);"
                  " process.stdin.on('end', () => r(s)); }));"
                  "process.stdout.write(JSON.stringify(input.map(s => redactDemoNames(s))));")
        run = subprocess.run([node, '--input-type=module', '-e', script], input=json.dumps(structures),
                             capture_output=True, text=True, check=True)
        expected = []
        for fixture in self.FIXTURES:
            summary = self.summary(fixture)
            redact.redact_summary(summary)
            expected.append(summary['structure'])
        self.assertEqual(json.loads(run.stdout), expected)


class MeasurementSources(unittest.TestCase):
    def test_7_derived_values_trace_to_their_raw_source(self):
        for capture in CAPTURES:
            r = summarize.row(capture, RESULTS[capture['id']])
            lh, net = capture.get('lighthouse') or {}, capture.get('network') or {}
            self.assertEqual(r['lh_bytes'], lh.get('totalBytes'), capture['id'])
            self.assertEqual(r['lh_requests'], lh.get('requests'), capture['id'])
            self.assertEqual(r['cdp_visit_bytes'], net.get('bytes'), capture['id'])
            self.assertEqual(r['cdp_visit_requests'], net.get('requests'), capture['id'])
            if lh.get('totalBytes') is not None:
                self.assertEqual(r['lh_kib'], round(lh['totalBytes'] / 1024), capture['id'])
            self.assertEqual(r['cdp_visit_kib'], round(net['bytes'] / 1024), capture['id'])
            self.assertEqual(r['perf'], (lh.get('scores') or {}).get('performance'), capture['id'])

    def test_7b_committed_summary_is_current(self):
        path = os.path.join(elig.RESEARCH, '04-template-benchmarks', 'captures-summary.csv')
        with tempfile.TemporaryDirectory() as tmp:
            fresh = os.path.join(tmp, 'summary.csv')
            subprocess.run([sys.executable, '-B', SUMMARIZE, '--out', fresh], capture_output=True, text=True, check=True)
            with open(fresh, encoding='utf-8') as a, open(path, encoding='utf-8') as b:
                self.assertEqual(a.read(), b.read(), 'captures-summary.csv is stale: re-run summarize-captures.py')

    def test_7c_recorded_comparisons_reproduce_from_lighthouse_fields(self):
        wev = [(RESULTS[c]['theme_key'], BY_ID[c]) for c in IDS('C-WEV', range(101, 107)) if RESULTS[c]['coldload_eligible']]
        lh_kib = lambda c: c['lighthouse']['totalBytes'] / 1024
        median_lh, themes, _ = elig.theme_median(wev, lh_kib)
        median_cdp, _, _ = elig.theme_median(wev, lambda c: c['network']['bytes'] / 1024)
        self.assertEqual(themes, 6)
        self.assertAlmostEqual(median_lh, 3447.7, delta=0.1)
        self.assertNotAlmostEqual(median_lh, median_cdp, delta=10, msg='Lighthouse and CDP totals are different sources')
        self.assertEqual(elig.theme_median(wev, lambda c: c['lighthouse']['scores']['performance'])[0], 40)
        self.assertAlmostEqual(elig.theme_median(wev, lambda c: c['lighthouse']['metrics']['lcpMs'])[0], 17407.6, delta=0.1)
        self.assertAlmostEqual(elig.theme_median(wev, lambda c: c['lighthouse']['metrics']['tbtMs'])[0], 981.75)
        self.assertAlmostEqual(median_lh / lh_kib(BY_ID['C-INV-005']), 10.74, delta=0.005)
        env = [(RESULTS[c]['theme_key'], c) for c in BY_ID if c.startswith('C-ENV') and RESULTS[c]['coldload_eligible']]
        get = lambda path: (lambda cid: path(BY_ID[cid]['lighthouse']))
        self.assertEqual(elig.theme_median(env, get(lambda l: l['scores']['performance']))[:2], (42, 6))
        self.assertAlmostEqual(elig.theme_median(env, get(lambda l: l['metrics']['lcpMs']))[0] / 1000, 13.87, delta=0.005)
        self.assertEqual(round(elig.theme_median(env, get(lambda l: l['totalBytes'] / 1024))[0]), 2404)


if __name__ == '__main__':
    unittest.main(verbosity=2)
