# TEST_13 independent copy gate — PASS

Task01 only, before any new motion. Control commit: `3a1dbf75b7db951e126b46113791e8d7fdad0bcb` (`codex/test-12`); destination worktree: `.worktrees/test-13`, branch `codex/test-13`. Exact UTC timestamps are recorded in the JSON evidence. The coordinator owns the baseline commit after independent review; this executor has not committed.

The initial project-code change copied `frontend/src/app/test_12/` to `test_13/` and all eleven files in `frontend/src/components/test_12/` to `test_13/`. The ten local source/data/style files are byte-identical. Only the route imports/default function identifier and copied README version identifiers changed. All shared resources, existing photo URLs, tokens, geometry, fonts, content, prices, intro/capture/turn contracts, CSS and existing effects remain unchanged. No motion work has begun.

## Browser comparison

Both routes were opened on the same isolated Next dev origin, `http://localhost:3113/test_12?spread=N` and `/test_13?spread=N`, for N=1–7 at 1440×900 and 1100×700. Chromium used normal motion, device scale 1. Each frame waited for reading state, fonts ready, all live images decoded, all original finite animations finished and two paint frames. Screenshot-only styling hides the unrelated Next dev portal identically in both pages; publication DOM/styles were not altered.

All fourteen pairs have **0 differing decoded RGBA pixels** and identical PNG bytes. All compared DOM elements have identical text, href, image src/alt, semantic labels/current state, bounding boxes, font metrics and final paint properties. Paired PNGs and per-view DOM dumps remain in the local `copy-baseline/` worktree and are ignored by Git. The screenshot equality plus recorded DOM equality supplies the measured destination comparison. Tracked [results](copy-baseline/results.json) and [pixel counts](copy-baseline/pixel-comparison.json) are machine-readable.

The same run verifies the real WebGL cover is ready, Enter opens it to the target reading state with book focus, ArrowRight/ArrowLeft perform GPU turns to chapters 2/1 with endpoint error below one pixel and canvas cleanup, Back/Forward restore chapters 2/1, repeated spread normalizes to 1 while preserving unrelated query values, and 1099×700 displays the original ordinary-version fallback and `/test_8` link. Console errors, page errors, HTTP errors and non-abort request failures: zero.

## Commands and results

Run from the worktree root:

```powershell
node docs/qa/test-13/copy-parity.mjs
python docs/qa/test-13/check-copy-integrity.py
```

Browser run: exit 0; fourteen complete paired captures and all behavior assertions passed. Pixel verification used Python Pillow `ImageChops.difference` on the decoded RGBA frames; all fourteen differing-pixel counts are zero. No dependencies were installed for verification.

From `frontend/`:

```powershell
npm.cmd run lint
npm.cmd run typecheck
```

Both exited 0. The coordinator's starting Vitest baseline was 113 passing tests in 26 files; task01 did not add unit tests or rerun that suite. Production build/full regression are reserved for the complete motion task; this report claims only the copy gate.

## Isolation

The initial working-byte SHA256 comparison covered all 424 protected frontend files; only Next dev's generated `next-env.d.ts` differed. It was restored to the canonical Git baseline after checks. The final [integrity report](copy-baseline/integrity.json) verifies all 424 working hashes, all 424 canonical Git blob SHA256 values, zero protected tracked Git differences, ten byte-identical copied source files and the strictly normalized local route. TEST_12, TEST_11, TEST_10, every other old frontend file, shared code, configuration, packages and assets remain unchanged. No backend, env, publish, deployment or external actions occurred; no existing runtime was restarted.

Only new TEST_13 route/components and this QA evidence were authored. Parent-owned `.autopilot` coordination changes were left untouched. The copied README retains historical TEST_12-era verification prose as source-copy context; this report is the authoritative task01 evidence. Subsequent motion work should replace that prose with final TEST_13 checks.
