# Living Issue — эксперимент /test_2

Открыть `http://localhost:3000/test_2`. `#start` пропускает журнал и ведёт к шапке редакционной страницы; `#story` — к demo-форме. Контрольный `/test` сохраняет свои якоря и поведение.

- `issue-content.ts`: тексты и выбор кадров вступления; объекты изображений импортируются из `../test/data`. Обложка использует `/test/memory-ferry.jpg`, разворот — общий стол и кадр чая из `/test`.
- `living-issue.tsx`: семантическая обложка и декоративный разворот, lifecycle нативной прокрутки. Passive scroll/resize + rAF обновляют три CSS-переменные без React renders. IntersectionObserver выключает расчёт за пределами сцены.
- `living-issue.module.css`: scoped композиция, глубина и адаптация открытия. Обёртка занимает 140svh; sticky viewport — 100svh. После разворота обычная прокрутка ведёт к редакционному hero.
- `editorial-home.tsx`, `lead-form.tsx`, `format-motif.tsx`: отдельная русская версия страницы с тремя мотивами форматов и печатными фото-вставками. Контент хранится в собственном `data.ts`, стили — в собственном `editorial.module.css`; изменения `/test` не обновляют их автоматически. Из `../test/lead` используются только валидация и demo-адаптер заявки.

Большинство фото обеих версий лежит в `frontend/public/test/`, включая кадры вступления `/test_2`; локальный кадр чая для редакционной страницы — `frontend/public/test_2/istanbul-tea-kubra.jpg`. CSS `/test_2` загружает общие шрифты Golos/Lora из `/test/fonts/`.

Desktop раскрывает обложку с умеренным rotateY. Телефон раскрывает её вверх и показывает вертикальный разворот с естественной высотой текста. Короткий landscape использует горизонтальную композицию без 3D. Reduced motion показывает статичную обложку и обычную прокрутку, без дополнительного пустого пути. Контент и anchors работают без JS. Клавиатурный пропуск переводит focus к содержимому; следующий skip-link остаётся внутри основного сайта.

Проверки: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`; `npx.cmd playwright test e2e/living-issue.spec.ts e2e/test-home.spec.ts`. Для проверки на другом dev-порту задать `PLAYWRIGHT_BASE_URL`. Финальная production-версия доступна через существующий frontend Docker service на 3000.
