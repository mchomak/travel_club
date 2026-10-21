from pathlib import Path
import json
import re
import subprocess

root = Path(__file__).resolve().parents[3]
components = root / 'frontend/src/components'
identical = {}
for name in ['data.ts', 'intro-scene.ts', 'capture-page.ts', 'magazine-intro.tsx', 'reading-turn-engine.ts', 'reading-turn.tsx']:
    identical[name] = (components / 'test_12' / name).read_bytes() == (components / 'test_13' / name).read_bytes()
css12 = (components / 'test_12/spreads.module.css').read_text(encoding='utf-8')
css13 = (components / 'test_13/spreads.module.css').read_text(encoding='utf-8')
photo_names = ['heroPhotoReveal', 'nextAperture', 'thaiStrips', 'peopleFigure', 'cityFigure', 'chinaVertical', 'chinaDetail', 'contactSheet figure']
photo_rules = {}
for name in photo_names:
    rules = lambda css: [s.strip() for s in re.findall(r'[^{}]*\{[^{}]*\}', css) if name in s]
    photo_rules[name] = rules(css12) == rules(css13)
changed = subprocess.check_output(['git', 'diff', '--name-only', '3a1dbf7', '--', 'frontend/src', 'frontend/public', 'frontend/package.json', 'frontend/package-lock.json'], cwd=root, text=True).splitlines()
old_changed = [p for p in changed if not (p.startswith('frontend/src/app/test_13/') or p.startswith('frontend/src/components/test_13/'))]
baseline = subprocess.check_output(['git', 'log', '--oneline', '3a1dbf7..HEAD'], cwd=root, text=True).splitlines()
result = {'identicalControlFiles': identical, 'photoRulesIdentical': photo_rules, 'changedFrontendPaths': changed, 'changedExistingFrontendPaths': old_changed, 'history': baseline}
(Path(__file__).parent / 'blind-source.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
print(json.dumps(result, indent=2))
