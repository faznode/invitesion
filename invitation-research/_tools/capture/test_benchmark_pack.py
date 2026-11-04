#!/usr/bin/env python3
"""Offline regression tests for benchmark-pack.py (tier rule, percentile direction, theme-first medians, exclusions).

    python3 -B invitation-research/_tools/capture/test_benchmark_pack.py
"""
import importlib.util
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
_spec = importlib.util.spec_from_file_location('benchmark_pack', os.path.join(HERE, 'benchmark-pack.py'))
bp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(bp)


def row(cid, competitor='vendor', theme='t1', population='competitor', cold=True, struct=True, **values):
    base = {'id': cid, 'competitor': competitor, 'theme_key': theme, 'population': population,
            'coldload_eligible': str(cold), 'structure_eligible': str(struct), 'libs': '', 'features': '',
            'audio_elements': '0', 'sections': '5', 'og_image': 'True', 'reduced_motion_css': 'False', 'dom_nodes': '900',
            'cover_detected': 'True', 'click_attempted': 'True', 'gate_opening': 'verified_open', 'audio_playback': 'not_measured'}
    base.update({k: str(v) for k, v in values.items()})
    return base


class TierRule(unittest.TestCase):
    def test_scroll_linked_motion_is_signature(self):
        self.assertEqual(bp.classify(row('C-X-1', libs='gsap scrollTrigger'))[0], 'signature')

    def test_audio_element_or_music_control_is_premium(self):
        self.assertEqual(bp.classify(row('C-X-1', audio_elements=1))[0], 'premium')
        self.assertEqual(bp.classify(row('C-X-1', features='musicControl rsvp'))[0], 'premium')

    def test_level_two_library_is_premium(self):
        self.assertEqual(bp.classify(row('C-X-1', libs='aos jquery'))[0], 'premium')

    def test_no_signal_is_basic_with_low_confidence(self):
        tier, signals, conf = bp.classify(row('C-X-1', libs='jquery swiper'))
        self.assertEqual((tier, signals, conf), ('basic', [], 'low'))


class Statistics(unittest.TestCase):
    def test_percentile_interpolates(self):
        self.assertEqual(bp.percentile([1, 2, 3, 4, 5], 0.75), 4)
        self.assertEqual(bp.percentile([10], 0.25), 10)

    def test_p75_direction_follows_the_metric(self):
        rows = [row(f'C-X-{i}', theme=f't{i}', perf=p, lcp_ms=l) for i, (p, l) in enumerate([(20, 9000), (40, 7000), (60, 5000), (80, 3000), (100, 1000)])]
        _, aggregates, _ = bp.build(rows)
        perf = next(a for a in aggregates if a['metric'] == 'perf' and a['tier'] == 'all')
        lcp = next(a for a in aggregates if a['metric'] == 'lcp_ms' and a['tier'] == 'all')
        self.assertEqual((perf['p75'], perf['best']), (40.0, 100.0))   # 75 % of themes score at least 40
        self.assertEqual((lcp['p75'], lcp['best']), (7000.0, 1000.0))  # 75 % of themes load in at most 7 s

    def test_retries_do_not_overweight_a_theme(self):
        rows = [row('C-X-1', theme='a', lh_kib=100), row('C-X-2', theme='a', lh_kib=300), row('C-X-3', theme='b', lh_kib=1000)]
        _, aggregates, _ = bp.build(rows)
        kib = next(a for a in aggregates if a['metric'] == 'lh_kib' and a['tier'] == 'all')
        self.assertEqual((kib['n_themes'], kib['n_captures'], kib['median']), (2, 3, 600.0))  # medians 200 and 1000

    def test_ineligible_rows_never_enter(self):
        rows = [row('C-X-1', theme='a', lh_kib=100), row('C-X-2', theme='b', cold=False, struct=False, lh_kib=1)]
        tiers, aggregates, blueprints = bp.build(rows)
        self.assertEqual([t['theme_key'] for t in tiers], ['a'])
        self.assertEqual(next(a for a in aggregates if a['metric'] == 'lh_kib')['best'], 100.0)

    def test_own_pages_stay_out_of_competitor_aggregates(self):
        rows = [row('C-X-1', theme='a', lh_kib=5000), row('C-INV-005', competitor='invitesion', theme='own', population='own', lh_kib=311)]
        _, aggregates, _ = bp.build(rows)
        comp = next(a for a in aggregates if a['population'] == 'competitor' and a['metric'] == 'lh_kib' and a['tier'] == 'all')
        self.assertEqual((comp['n_themes'], comp['best']), (1, 5000.0))


class RealData(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        rows, stale = bp.load_rows()
        cls.stale = stale
        cls.tiers, cls.aggregates, cls.blueprints = bp.build(rows)

    def test_summary_matches_recomputed_eligibility(self):
        self.assertEqual(self.stale, [])

    def test_curated_exclusions_are_absent(self):
        ids = ' '.join(t['coldload_captures'] + ' ' + t['structure_captures'] for t in self.tiers)
        for cid in ['C-VID-104', 'C-VID-105', 'C-VID-106', 'C-INV-101'] + [f'C-IDI-10{i}' for i in range(1, 8)] + [f'C-ENV-10{i}' for i in range(1, 7)]:
            self.assertNotIn(cid, ids)

    def test_korean_vendor_carries_the_detector_caveat(self):
        for bpr in self.blueprints:
            if bpr['competitor'] == 'barunson':
                self.assertIn('Korean page', bpr['caveats'])

    def test_files_on_disk_are_current(self):
        for name, records in (('tiers.csv', self.tiers), ('tier-aggregates.csv', self.aggregates), ('blueprints.csv', self.blueprints)):
            with open(os.path.join(bp.BENCH, name), encoding='utf-8') as handle:
                self.assertEqual(handle.read(), bp.render(records), name)


if __name__ == '__main__':
    unittest.main(verbosity=1)
