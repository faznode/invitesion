#!/usr/bin/env python3
"""Per-second CPU % (of one core) and RSS for process groups, from /proc deltas (ps %CPU is a lifetime average).

    python3 -B sample-proc.py --out run.json --seconds 70 --group server=next-server --group postgres=postgres --group platform-dev='next dev'

A group matches every process whose command line contains its pattern, or, for `cwd:/path`, every process whose
working directory is exactly /path (two `next-server` processes with identical command lines are told apart this way).
Its CPU is summed. Prints mean / p95 / max.
"""
import argparse
import json
import os
import time

TICKS = os.sysconf('SC_CLK_TCK')


def processes():
    for pid in os.listdir('/proc'):
        if not pid.isdigit():
            continue
        try:
            with open(f'/proc/{pid}/cmdline', 'rb') as handle:
                cmd = handle.read().replace(b'\0', b' ').decode(errors='replace').strip()
            with open(f'/proc/{pid}/stat') as handle:
                fields = handle.read().rsplit(')', 1)[1].split()
            ticks = int(fields[11]) + int(fields[12])
            rss_kb = int(fields[21]) * os.sysconf('SC_PAGE_SIZE') // 1024
            try:
                cwd = os.readlink(f'/proc/{pid}/cwd')
            except OSError:
                cwd = ''
            yield int(pid), cmd, cwd, ticks, rss_kb
        except (FileNotFoundError, ProcessLookupError, IndexError, ValueError, PermissionError):
            continue


def matches(pattern, cmd, cwd):
    return cwd == pattern[4:] if pattern.startswith('cwd:') else pattern in cmd


def snapshot(groups):
    totals = {name: [0, 0] for name in groups}
    for _pid, cmd, cwd, ticks, rss in processes():
        if 'sample-proc.py' in cmd:
            continue
        for name, pattern in groups.items():
            if matches(pattern, cmd, cwd):
                totals[name][0] += ticks
                totals[name][1] += rss
    return totals


def pct(values, q):
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(round(q * (len(ordered) - 1))))] if ordered else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', required=True)
    parser.add_argument('--seconds', type=int, default=60)
    parser.add_argument('--group', action='append', default=[], help='name=pattern')
    args = parser.parse_args()
    groups = dict(g.split('=', 1) for g in args.group)
    series = {name: {'cpu_pct': [], 'rss_mb': []} for name in groups}
    previous, last = snapshot(groups), time.monotonic()
    for _ in range(args.seconds):
        time.sleep(1)
        current, now = snapshot(groups), time.monotonic()
        elapsed = now - last
        for name in groups:
            series[name]['cpu_pct'].append(round(100 * (current[name][0] - previous[name][0]) / TICKS / elapsed, 1))
            series[name]['rss_mb'].append(round(current[name][1] / 1024, 1))
        previous, last = current, now
    summary = {}
    for name, data in series.items():
        cpu, rss = data['cpu_pct'], data['rss_mb']
        summary[name] = {'cpu_mean': round(sum(cpu) / len(cpu), 1) if cpu else 0, 'cpu_p95': pct(cpu, 0.95), 'cpu_max': max(cpu or [0]),
                         'rss_mean_mb': round(sum(rss) / len(rss), 1) if rss else 0, 'rss_max_mb': max(rss or [0])}
    with open(args.out, 'w') as handle:
        json.dump({'groups': groups, 'summary': summary, 'series': series}, handle, indent=1)
    for name, values in summary.items():
        print(f'{name}: cpu mean {values["cpu_mean"]} % p95 {values["cpu_p95"]} % max {values["cpu_max"]} % | rss mean {values["rss_mean_mb"]} MB max {values["rss_max_mb"]} MB')


if __name__ == '__main__':
    main()
