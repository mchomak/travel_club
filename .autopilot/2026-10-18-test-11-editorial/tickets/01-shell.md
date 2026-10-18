# 01 — Большой журнал, физическая обложка и управление

**Требования:** see generated requirements line in plan.md, all Mechanics/Geometry/Cover shell/Isolation requirements.
**Blocked by:** none
**Зона:** frontend/src/app/test_11/, frontend/src/components/test_11/magazine-experience.tsx, magazine.module.css, magazine-intro.tsx, local scene/capture helpers, e2e/test-11-magazine.spec.ts
**Волна:** 1

## Что должно заработать

Пользователь видит красивую реальную обложку, открывает журнал почти во всю высоту desktop, быстро листает три разворота с сохранением истории и доступности test_10. Новая сцена/окружение тёмный каменный стол, мягкий свет и тени. Локальные adaptations only; no shared changes.

> «он должен быть почти во весь экран по вертикле, без больших отсупов»
> «Начальную анимацию из `/test_10` используй как основу»
> «Сохрани быстрое перелистывание страниц из `/test_10`»

Read spec: Intent, Isolation, Geometry, Cover, Mechanics, Motion, Boundaries, Verification and interfaces.

## Acceptance

- [ ] Isolated noindex /test_11 works; old routes/hashes unchanged.
- [ ] New cover is physical opening surface, readable before opening; return cover control useful for review.
- [ ] Book ~90–94% height where width permits, nav small and readable, desktop sizes fit.
- [ ] 450ms navigation shared by controls/arrows/history; fast commands cannot conflict; active in-page focus safe.
- [ ] New reveal animations start only when pages become live; copies/capture final static; navigation never waits for editorial animation.
- [ ] Reduced motion including runtime switch, skip, resize and failures release resources/locks; idle no scene loop.
- [ ] Behavioral browser tests for direct/invalid/repeated query, turn interruption, history, keyboard, cover/intro, reduced/static/fallback. Run against functioning route, not only data attributes; capture baseline red when practical before implementation.
- [ ] Typecheck/targeted lint pass, no dependency changes.


**Требования (точная привязка):** R01, R02, R05, R14, R15, R16, R18, R23, R24, R36, R37, R38, R39, R40, R50, R51, R55
