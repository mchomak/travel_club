# Границы и правила

Рабочая копия: C:/Users/McHomak/Projects/travel_club/.worktrees/test-13. Ветка codex/test-13. Existing clean HEAD 7f9484685a45edf8a3eee5c87a46650953011615.

Локальный компонент EditorialSymbol({name, className?}) владеет семью SVG-геометриями; скрывает пути, не управляет состоянием. Spreads владеет размещением, локальный CSS — CTA и визуальными деталями. MagazineSpread API, navigation/reading engines, данные и assets read-only. Проверки через настоящий MagazineSpread DOM и ссылки в браузере.

Изменять только frontend/src/components/test_13/, новый scoped e2e при обоснованной необходимости, docs/qa/test-13/graphic-details/. Не трогать прежние версии, data.ts, фото, шрифты, shared tokens, engines, dependencies. Сохранять текущий layout, текст и анимации. При отсутствующей зависимости вернуть BLOCKED.

Next 16 / React 19 / CSS Modules / authored SVG. Windows npm.cmd. Dev http://localhost:3113/test_13. Запуск из frontend: npm.cmd run dev -- --port 3113.

Проверки из frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. E2E с PLAYWRIGHT_BASE_URL=http://localhost:3113 (production позже отдельный порт): npm.cmd exec playwright test e2e/test-13-motion.spec.ts e2e/test-13-refinement.spec.ts e2e/test-12-magazine.spec.ts -- --workers=2.

T0: единая доработка, без нарезки тасков.

## Реализовано
EditorialSymbol({name: route|ready|companions|direction|waypoint|note|onward, className?}) — семь декоративных SVG на сетке24. CTA прозрачные с постоянным подчёркиванием; существующий reveal владеет графикой. Scoped media<=1200x790 корректирует только плотность Formats, текст от13px.
