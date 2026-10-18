# /test_11 — Между строк

Изолированный noindex editorial experiment для окна от **1100 × 700 px**. Основной сайт и `/test_10` не меняет. Три разворота: Hero + Formats, Next Issue, Thailand ’26. Фотографии иллюстративные; факты о поездках и ограничения Next Issue видны в тексте.

## Карта

- `../../app/test_11/page.tsx` — metadata и серверный разбор `spread=1|2|3`; query открывает журнал сразу.
- `magazine-experience.tsx` — единственный владелец индекса, 450 ms turn lock, history, клавиатуры, краевых кнопок, оглавления и фокуса. Временные страницы `inert` и `aria-hidden`.
- `magazine-intro.tsx` — реальная печатная обложка на шарнире: начальная выдержка 1600 ms, открытие 1400 ms. «Обложка» возвращает её без автозапуска и сохраняет выбранный разворот; «Открыть журнал» продолжает чтение. Skip, resize и reduced motion завершают вступление.
- `magazine.module.css` — окружение, размеры книги, сгиб/края, CSS 3D opening и turn, навигация, малый viewport и reduced motion. Canvas, WebGL и постоянного rAF нет.
- `spreads.tsx` — `MagazineCover()` и `MagazineSpread({ index, side?, animate = false })`; `side` — `left | right`, `index` — 0–2. Статичный `animate=false` всегда показывает финальную композицию.
- `spreads.module.css` — шесть страниц, printable cover, конечные reveal-анимации. Базовые стили видимы; `data-reveal=true` включает keyframes после завершения turn. Hero — маски строк/горизонтальный кадр, Next — ирис, Thailand — буквы и вертикальные полосы.
- `data.ts` — `SPREADS`, `FORMATS`, `PHOTOS`. Фотографии локальны в `public/test_11`; источники/лицензии — в его `manifest.json` и `README.md`. Логотипы читаются из `public/test_9`, TC Golos/TC Lora — из существующего набора шрифтов.

Книга имеет aspect ratio 1.6 и размер `min(100vw - 72px, (100svh - 64px) * 1.6)`. Ниже поддержанного размера показывается ссылка на `/test_8`. CTA ведут на существующие `/start`, `/formats`, `/start?format=group`, `/archive`; `/start` остаётся прототипом.

## Проверка и screenshots

Из `frontend/` в PowerShell, при работающем production frontend:

```powershell
$env:NO_COLOR=$null
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-11-magazine.spec.ts e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11
node scripts/capture-test-11.mjs
```

Capture ждёт fonts.ready, decode всех картинок и окончания конечных анимаций. Сохраняет 12 разворотов в четырёх размерах и обложку в 1440/1920, плюс измерения в `docs/qa/test-11/capture-results.json`. Итоги, visual refinement и ссылки на screenshots — в [QA README](../../../../docs/qa/test-11/README.md).
