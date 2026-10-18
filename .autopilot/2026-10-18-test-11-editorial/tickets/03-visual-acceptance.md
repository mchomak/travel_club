# 03 — Visual refinement и production проверка

**Требования:** R41–R49, R50, R51, R52, R53, R54; regression R36/R55
**Blocked by:** 01,02
**Зона:** frontend/e2e/test-11-visual.spec.ts, frontend/scripts/capture-test-11.mjs, docs/qa/test-11/, test_11 refinement if delegated by coordinator
**Волна:** 2

> «Не останавливайся на первой работающей версии.»
> «После реализации открой сайт в браузере, посмотри на все развороты и проведи полноценный visual refinement.»
> «Сделай screenshots готовых разворотов и обложки.»

## Acceptance

- [ ] Inspect actual screenshots cover+three spreads at supported desktop sizes. Record observed problems and improvements, not just render completion.
- [ ] Check composition, cohesion, type/contrast/readability, photo crop/quality, navigation/CTA, timing/idle performance/reentry/reduced motion.
- [ ] Run lint/typecheck/Vitest/build and browser suite on production localhost3000 after local Docker rebuild; test_10 regressions plus relevant scene regressions.
- [ ] No horizontal/vertical hidden page overflow, broken images, stuck lock, delayed stale animation, duplicate accessible content; smaller viewport fallback.
- [ ] Save final cover+3 spread screenshots and compact QA README/results. SHA256 protected files baseline match.
- [ ] Return final report facts, known limitations and transferable ideas. Source README usable next session.


**Требования (точная привязка):** R41, R42, R43, R44, R45, R46, R47, R48, R49, R50, R51, R52, R53, R54
