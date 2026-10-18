# /test_11 — Между строк

Изолированный noindex editorial experiment для окна от **1100 × 700 px**. Основной сайт и `/test_10` не меняет. Три разворота: Hero + Formats, Next Issue, Thailand ’26. Фотографии иллюстративные; факты о поездках и ограничения Next Issue видны в тексте.

## Карта

- `../../app/test_11/page.tsx` — metadata и серверный разбор `spread=1|2|3`; query открывает журнал сразу.
- `magazine-experience.tsx` — единственный владелец индекса, 450 ms turn lock, history, клавиатуры, краевых кнопок, оглавления и фокуса. Временные страницы `inert` и `aria-hidden`.
- `magazine-intro.tsx` — distant cover, ожидающая нажатия без таймера. Прозрачная семантическая кнопка на весь viewport принимает клик по обложке/фону и Enter/Space; ранний клик сохраняется до загрузки. «Обложка» сохраняет текущую главу при повторном открытии.
- `intro-scene.ts`, `capture-page.ts` — локальная физическая WebGL-сцена на основе read-only test_7/test_8 fast preset: настоящая обложка, восемь декоративных листов, движение камеры к первому живому Hero + Formats. Листы не становятся главами. На TARGET сцена, canvas и её ресурсы освобождаются; skip, resize, context loss и reduced motion дают читаемый fallback. В скрытой вкладке часы сцены приостановлены.
- `magazine.module.css` — тёплое oxblood/plum окружение, размеры книги, сгиб/края, CSS 3D reading turn, навигация, малый viewport и reduced motion. WebGL/rAF используются только во вступлении и не остаются в чтении.
- `spreads.tsx` — `MagazineCover()` и `MagazineSpread({ index, side?, animate?, reveal? })`; `side` — `left | right`, `index` — 0–2; `RevealPhase` — `static | pending | enter`. По умолчанию финальная печатная `static` композиция безопасна для capture.
- `spreads.module.css` — шесть страниц, printable cover и конечные reveal-анимации. `pending` с первого paint сохраняет якорные объекты и скрывает только отложенные; `enter` раскрывает их из той же позы. Shell применяет pending также к обороту листа и проекции intro, затем enter без промежуточного финального кадра. Hero — маски строк/горизонтальный кадр, Next — ирис, Thailand — буквы и вертикальные полосы. Reduced motion сразу показывает финал.
- `data.ts` — `SPREADS`, `FORMATS`, `PHOTOS`. Фотографии локальны в `public/test_11`; источники/лицензии — в его `manifest.json` и `README.md`. Логотипы читаются из `public/test_9`, TC Golos/TC Lora — из существующего набора шрифтов.

Книга имеет aspect ratio 1.6 и размер `min(100vw - 72px, (100svh - 64px) * 1.6)`. Ниже поддержанного размера показывается ссылка на `/test_8`. CTA ведут на существующие `/start`, `/formats`, `/start?format=group`, `/archive`; `/start` остаётся прототипом.

## Проверка и screenshots

Из `frontend/` в PowerShell, при работающем production frontend:

```powershell
$env:NO_COLOR=$null
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11-refinement-production
node scripts/capture-test-11.mjs
```

Capture ждёт fonts.ready, decode картинок и окончания конечных reveal для финальных кадров. Сохраняет 12 разворотов в четырёх размерах, distant waiting cover в 1280/1440/1920, промежуточные физические фазы и первый живой endpoint в 1440. В `docs/qa/test-11/capture-results.json` записываются origin, время, размеры, bounds текста, phase, canvas и console; промежуточные кадры явно помечены `final:false`. Для dev задавать отдельный абсолютный `TEST_11_CAPTURE_DIR`, чтобы не заменять production evidence. Итоги и screenshots — в [QA README](../../../../docs/qa/test-11/README.md).

Доработка проверена 18 октября 2026 на production localhost:3000: 22/22 targeted browser checks (12 intro, 3 reveal, 7 visual), 23/23 регрессии прежних версий; 21 текущий production screenshot. Lint/typecheck, 119 Vitest и production build прошли; локальный frontend пересобран. Подробные результаты, границы и предупреждения capture — в QA README.
