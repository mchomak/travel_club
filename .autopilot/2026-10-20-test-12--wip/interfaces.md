# Границы и правила

- Worktree: C:/Users/McHomak/Projects/travel_club/.worktrees/test-12; branch codex/test-12. Never write original checkout, other worktrees, main, or root shared runtime.
- Existing Next 16/React19/TypeScript/CSS Modules/Three stack; no dependency changes. Read-only assets/logos/type tokens/legacy geometry as TEST_11. Missing dependency returns BLOCKED.
- Only new frontend/src/app/test_12, frontend/src/components/test_12, test-12 tests/docs/scripts may change. No earlier pages or shared source edits.
- magazine-experience owns index/history/turn lock/nav; export MagazineExperience({initialIndex,skipIntro}); intro state machine remains existing contract.
- spreads owns printable page compositions/reveal; exports MagazineCover() and MagazineSpread({index,side?,animate?,reveal?}), RevealPhase = static|pending|enter. data.ts owns SPREADS, FORMATS, FOUNDER_PHOTOS. SPREADS entries have title and optional navLabel; shell reads navLabel ?? title, and derives count from length.
- Ticket 01 copies all test_11 components first, app route and shell, cover cue, shell CSS/navigation only. It leaves copied data.ts/spreads.tsx/spreads.module.css unchanged. Ticket 02 then owns only those data/spread files and README. Ticket 03 owns new tests/capture/QA docs only. 02 and 03 have disjoint zones.
- intro-scene.ts/capture-page.ts/reading-turn*.tsx/.ts should remain byte-identical to TEST_11 unless purely local import paths require replacing; no scenario/timing/camera changes.
- Tests from frontend: npm.cmd test -- --run --testTimeout=15000; baseline 113 tests in 26 files, passed. Target: npm.cmd exec playwright test e2e/test-12-magazine.spec.ts -- --workers=1. PLAYWRIGHT_BASE_URL supplied by coordinator. No shared-server restart. npm.cmd run lint; npm.cmd run typecheck; npm.cmd run build.
- Browser seams: real URL/DOM/data hooks and exported data only. Tests must fail for genuine missing behavior; don't mirror code. QA compares old chapter DOM/computed styles with folio-only exceptions.
- New test preview PORT=3012 (coordinator starts). Production Docker preview on separate PORT=3013 unless occupied, named travel-club-test12-preview. Don't modify main Compose services.
- Don't commit; coordinator reviews and commits. Return <=25 lines STATUS/FILES/TESTS/INTERFACES/REQUIREMENTS/CONCERNS/BLOCKERS. Before any edit read C:/Users/McHomak/.agents/skills/autopilot/prompts/executor.md. Context ceiling and green HANDOFF rules there apply.

## Ticket01 built
- Complete initial test_11 copy parity: copy-parity.md. Intro/capture/reading engines unchanged.
- Shell nav uses optional navLabel ?? title; count from SPREADS.length. Full book CTA area preserved; finite closed-state CSS pulse applies to ready GPU canvas and waiting DOM, removed on open.
- Executor checks: lint/typecheck, 113 unit tests, GPU ready cue + Space target, reduced Enter, 44px nav and viewport fit.
