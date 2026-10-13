import re
import subprocess
from pathlib import Path

run = Path(__file__).resolve().parent
paths = list(run.rglob('*.md')) + list(run.rglob('*.py')) + list(run.rglob('*.cjs')) + list(run.rglob('*.log')) + [run.parent / 'state.js', run.parent / '2026-10-09-deploy-travel-club-preview/state.js']
patterns = [r'sk-(?:proj-)?[\w-]{20,}', r'gh[pous]_[\w]{20,}', r'AKIA[A-Z0-9]{16}', r'AIza[\w-]{30,}', r'xox[bpa]-[\w-]{20,}', r'-----BEGIN [A-Z ]*PRIVATE KEY-----', r'[a-z]+://[^\s/:]+:[^\s@]+@']
hits = []
for path in paths:
    raw = path.read_bytes()
    body = raw.decode('utf-16' if raw.startswith((b'\xff\xfe', b'\xfe\xff')) else 'utf-8-sig')
    if path.suffix == '.log' and raw.startswith((b'\xff\xfe', b'\xfe\xff')):
        path.write_text(body, encoding='utf-8')
    if any(re.search(pattern, body) for pattern in patterns):
        hits.append(path.name)
assert not hits, 'Secret-like values found; do not commit: ' + ', '.join(hits)
previous = subprocess.check_output(['git', 'show', 'HEAD:AGENTS.md']).decode('utf-8').replace('\r\n', '\n')
current = Path('AGENTS.md').read_text(encoding='utf-8').replace('\r\n', '\n')
before = '<!-- autopilot:start -->'
after = '<!-- autopilot:end -->'
assert previous.split(before)[0] == current.split(before)[0], 'AGENTS outside markers changed'
assert previous.split(after)[1] == current.split(after)[1], 'AGENTS trailing outside markers changed'
print('Owned run artifacts: secret scan clean; AGENTS outside markers unchanged.')
