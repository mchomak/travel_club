"""Read-only verification of task01's independent copy and protected baseline."""
import hashlib
import io
import json
from datetime import datetime, timezone
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[3]
baseline = json.loads((root / '.autopilot/2026-10-21-test-13-motion--wip/protected-hashes.json').read_text(encoding='utf-8-sig'))
names = list(baseline['gitBlobHashes'])
raw = subprocess.check_output(['git', 'cat-file', '--batch'], cwd=root, input=('\n'.join(baseline['baseCommit'] + ':' + name for name in names) + '\n').encode())
stream = io.BytesIO(raw)
canonical_mismatches = []
for name in names:
    header = stream.readline().split()
    body = stream.read(int(header[2]))
    stream.read(1)
    if hashlib.sha256(body).hexdigest() != baseline['gitBlobHashes'][name]:
        canonical_mismatches.append(name)
working_mismatches = [name for name, expected in baseline['hashes'].items() if hashlib.sha256((root / name).read_bytes()).hexdigest() != expected]
source = root / 'frontend/src/components/test_12'
copy = root / 'frontend/src/components/test_13'
source_files = sorted(path.name for path in source.iterdir() if path.name != 'README.md')
copy_mismatches = [name for name in source_files if (source / name).read_bytes() != (copy / name).read_bytes()]
route_source = (root / 'frontend/src/app/test_12/page.tsx').read_bytes()
route_expected = route_source.replace(b'components/test_12/', b'components/test_13/').replace(b'TestTwelvePage', b'TestThirteenPage')
route_matches = (root / 'frontend/src/app/test_13/page.tsx').read_bytes() == route_expected
protected_diff = subprocess.check_output(['git', 'diff', '--name-only', baseline['baseCommit'], '--', 'frontend'], cwd=root, text=True).splitlines()
result = {
    'time': datetime.now(timezone.utc).isoformat(),
    'baseCommit': baseline['baseCommit'],
    'protectedFiles': len(names),
    'canonicalGitMismatches': canonical_mismatches,
    'workingTreeMismatches': working_mismatches,
    'protectedTrackedGitDiff': protected_diff,
    'byteIdenticalLocalSourceFiles': source_files,
    'copyMismatches': copy_mismatches,
    'routeOnlyIdentifierAndLocalImportChanges': route_matches,
    'initialPreCopyCheck': {'protectedFiles': 424, 'workingTreeMismatches': ['frontend/next-env.d.ts'], 'note': 'Observed before first copy edit; Next dev generated file restored to Git baseline before this final check.'},
}
result['pass'] = not (canonical_mismatches or working_mismatches or protected_diff or copy_mismatches) and route_matches
(root / 'docs/qa/test-13/copy-baseline/integrity.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
print(json.dumps(result, indent=2))
assert result['pass']
