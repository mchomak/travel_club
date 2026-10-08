1. Созданы `/test_5`, полная локальная копия `frontend/src/components/test_5/`, три теста `test-5-{baseline,camera,photo-editor}.spec.ts` и документы прогона `.autopilot/`.
2. После копирования адаптированы `page.tsx`, `living-issue.tsx`, `living-issue.module.css`, `editorial-home.tsx`, `photo-store.ts` и локальный `README.md`. Обновлены `AGENTS.md` и служебные файлы `.autopilot/`.
3. Четыре фазы: сохранённая обложка → плавное раскрытие разворота → zoom и сдвиг к правой странице → исчезновение краёв, корешка и теней с переходом в homepage.
4. Progress вычисляется из нативного scroll через passive listener и requestAnimationFrame. Sticky-переход занимает 1.25 высоты viewport; React не перерисовывается на каждый пиксель.
5. Правая страница содержит один живой homepage. Его TRAVEL CLUB, метаданные и линия продолжают движение; измеренные transform/clip снимаются в финале без общего crossfade и смены hero.
6. `/test_5#start` сразу открывает основной сайт. CSS скрывает opening до hydration; координаты и клавиатурный фокус проверены, включая режим без JavaScript.
7. Reduced motion полностью пропускает opening и сохраняет доступность homepage и навигации.
8. На mobile используется одна правая страница с упрощённым раскрытием и тем же page → website. Проверены 390 px, tablet 768 px и landscape 667 px.
9. `/test_4`, `/test_2`, `/test_3` и остальные исходные routes не изменены. 187 исходных файлов совпадают по SHA256; итоговый hero совпал со source.
10. Выполнены baseline-сравнение, refinement, screenshots 1920/1440/1280/768/390/667 px, slow/fast/reverse scroll, resize, refresh, #start, reduced motion, клавиатура и console/hydration QA. Консоль чистая; Playwright 30 и Vitest 67 passed; lint, typecheck, build и Docker frontend прошли. Унаследованный выход фотографии обложки за frame на 1280×720 сохранён.
