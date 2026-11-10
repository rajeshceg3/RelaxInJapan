#!/usr/bin/env python3
"""Purpose-fit verification for RelaxInJapan (Serene Dashboard).

Runs the repo's own Jest suites and browser/data test drives in real
Chrome. Exit 0 and FAILURES=0 mean green.
"""
import http.server
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import threading

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
CHROME = os.environ.get('CHROME_BIN', '/usr/bin/google-chrome')

# Suites that start their own server run as-is; calm-data expects one.
SELF_SERVED = ['journal-browser', 'quick-links-browser', 'timer-browser', 'calm-browser']
NEEDS_SERVER = {'calm-data': 4213}

checks = []
failures = []


def record(name, ok, detail=''):
    checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
    print(('PASS' if ok else 'FAIL') + ' ' + name + (' :: ' + detail if detail else ''))
    if not ok:
        failures.append(name)


def main():
    npm = shutil.which('npm')
    record('doctor: npm on PATH', npm is not None, npm or 'not found')
    record('doctor: chrome available', os.path.exists(CHROME), CHROME)
    if failures:
        return finish()

    if not os.path.isdir(os.path.join(REPO_ROOT, 'node_modules')):
        ci = subprocess.run([npm, 'ci', '--no-audit', '--no-fund'], cwd=REPO_ROOT,
                            capture_output=True, text=True, timeout=900)
        record('npm ci', ci.returncode == 0, ci.stderr.strip()[-200:])
        if ci.returncode != 0:
            return finish()

    jest = subprocess.run(['npx', 'jest'], cwd=REPO_ROOT, capture_output=True, text=True, timeout=900)
    clean = re.sub(r'\x1b\[[0-9;]*m', '', jest.stdout + jest.stderr)
    m = re.search(r'Tests:\s+(\d+) passed, (\d+) total', clean)
    record('jest suites green', jest.returncode == 0 and m and m.group(1) == m.group(2),
           ('%s/%s tests' % (m.group(1), m.group(2))) if m else clean.strip()[-200:])

    env = dict(os.environ)
    env['CHROME_PATH'] = CHROME

    server = None
    port = NEEDS_SERVER['calm-data']
    with socket.socket() as s:
        free = s.connect_ex(('127.0.0.1', port)) != 0
    if not free:
        record('doctor: port %d free for calm-data' % port, False, 'occupied')
        return finish()
    server = http.server.ThreadingHTTPServer(('127.0.0.1', port), http.server.SimpleHTTPRequestHandler)
    server.RequestHandlerClass.log_message = lambda *a: None
    os.chdir(REPO_ROOT)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        for name in ['calm-data'] + SELF_SERVED:
            t = subprocess.run(['node', 'tests/%s.mjs' % name], cwd=REPO_ROOT, env=env,
                               capture_output=True, text=True, timeout=900)
            passes = t.stdout.count('PASS')
            tail = (t.stdout.strip().splitlines() or [t.stderr.strip()[-150:]])[-1]
            record('browser drive: %s' % name, t.returncode == 0,
                   ('%d PASS lines; %s' % (passes, tail)) if t.returncode == 0
                   else (t.stdout + t.stderr).strip()[-250:])
    finally:
        server.shutdown()
    return finish()


def finish():
    evidence_dir = tempfile.mkdtemp(prefix='verify-relax-in-japan-')
    with open(os.path.join(evidence_dir, 'evidence.json'), 'w') as f:
        json.dump({'repo': 'RelaxInJapan', 'checks': checks, 'failures': failures}, f, indent=2)
    print('EVIDENCE_DIR=' + evidence_dir)
    print('FAILURES=%d' % len(failures))
    return 0 if not failures else 1


if __name__ == '__main__':
    sys.exit(main())
