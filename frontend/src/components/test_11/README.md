# /test_11 — Между строк

Изолированный noindex editorial experiment для окна от **1100 × 700 px**. Основной сайт и `/test_10` не меняет. Шесть разворотов / двенадцать страниц: Hero + Formats, Next Issue, Thailand ’26, China ’26, Archive ’25, Point of View + Start. Фотографии иллюстративные; Field Notes описывают поездки друзей до запуска клуба. Next Issue остаётся в подготовке.

## Карта

- `../../app/test_11/page.tsx` — metadata и серверный разбор `spread=1`–`6`; query открывает журнал сразу. Неизвестные/повторённые значения нормализуются в 1 с сохранением остальных query.
- `magazine-experience.tsx` — единственный владелец индекса, turn lock, history, клавиатуры, краевых кнопок, оглавления и фокуса. Количество глав берётся из `SPREADS.length`. Временные страницы `inert` и `aria-hidden`.
- `magazine-intro.tsx` — distant cover, ожидающая нажатия без таймера. Прозрачная семантическая кнопка на весь viewport принимает клик по обложке/фону и Enter/Space; ранний клик сохраняется до загрузки. «Обложка» сохраняет текущую главу при повторном открытии.
- `intro-scene.ts`, `capture-page.ts` — локальная физическая WebGL-сцена на основе read-only test_7/test_8 fast preset: настоящая обложка, восемь декоративных листов, движение камеры к первому живому Hero + Formats. Листы не становятся главами. На TARGET сцена, canvas и её ресурсы освобождаются; skip, resize, context loss и reduced motion дают читаемый fallback. В скрытой вкладке часы сцены приостановлены.
- `reading-turn.tsx` — захватывает настоящие source-static и target-pending страницы. До готовности текстур сохраняет исходный разворот. Таймаут capture 6 s и ошибки запускают CSS fallback; resize, reduced motion и unmount безопасно завершают/освобождают переход.
- `reading-turn-engine.ts` — transient WebGL-лист: `deformPage` из read-only `test_7`, 64×16 сегментов, отдельные лицо/оборот и тень, фиксированная ортографическая камера. Движение занимает 1000 ms после подготовки. Скрытая вкладка приостанавливает часы. После финала/context loss уничтожаются geometry, materials, textures, renderer, canvas и rAF. Hooks `data-reading-turn`, `data-progress`, `data-front/back`, `data-geometry` описывают реальный кадр и деформацию.
- `magazine.module.css` — тёплое oxblood/plum окружение, размеры книги, сгиб/края, CSS fallback reading turn, навигация, малый viewport и reduced motion. В спокойном чтении нет canvas и rAF.
- `spreads.tsx` — `MagazineCover()` и `MagazineSpread({ index, side?, animate?, reveal? })`; `side` — `left | right`, `index` — 0–5; `RevealPhase` — `static | pending | enter`. По умолчанию финальная печатная `static` композиция безопасна для capture.
- `spreads.module.css` — двенадцать страниц, printable cover и конечные редакционные reveal примерно 2.4–3.2 s. `pending` с первого paint сохраняет якорные объекты и скрывает только отложенные; `enter` раскрывает их из той же позы. Shell применяет pending также к обороту листа и проекции intro, затем enter без промежуточного финального кадра. Hero — маски строк/горизонтальный кадр, Next — ирис, Thailand — буквы и полосы, China — вертикальный городской кадр/текст, Archive — последовательность отпечатков, финал — принципы и шаги разговора. Reduced motion сразу показывает финал.
- `data.ts` — `SPREADS`, `FORMATS`, `PHOTOS`. Фотографии локальны в `public/test_11`; источники/лицензии — в его `manifest.json` и `README.md`. Логотипы читаются из `public/test_9`, TC Golos/TC Lora — из существующего набора шрифтов.

Книга имеет aspect ratio 1.6 и размер `min(100vw - 72px, (100svh - 64px) * 1.6)`. Ниже поддержанного размера показывается ссылка на `/test_8`. CTA ведут на существующие `/start`, `/formats`, `/start?format=group`, `/archive`; `/start` остаётся прототипом.

Правки по комментариям 19 октября: hero использует отдельный `PHOTOS.hero` на всю площадь artwork, navy SVG и две уменьшенные строки слогана. Настоящий DOM-слой `heroFog` содержит размытую копию фото и светлый градиент: его можно захватить в текстуру листания без `backdrop-filter` и псевдоэлементов. Тайская обложка использует `PHOTOS.thailandCover`; `coast` на обложке журнала и `nature` в архиве сохранены. Заголовок услуг и тайский маршрут однострочные. В финале CTA расположен после трёх шагов, рядом с пояснением о демонстрационной форме. `e2e/test-11-comments.spec.ts` проверяет геометрию этих строк, порядок CTA и переход в `/start`.

## Проверка и screenshots

Из `frontend/` в PowerShell, при работающем production frontend:

```powershell
$env:NO_COLOR=$null
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11-completion-production
$env:TEST_11_SOURCE_LABEL='local Docker production after final PCFShadowMap rebuild 2026-10-19'
$env:TEST_11_EVIDENCE_STATUS='production-awaiting-visual-review'
node scripts/capture-test-11.mjs
```

Capture ждёт fonts.ready, decode картинок и окончания конечных reveal для финальных кадров (bounded timeout 12 s). Сохраняет все шесть пар в 1280×768 / 1440×900 / 1920×1080, distant waiting cover, intro, curved reading leaf в двух направлениях и фазы reveal в 1440. В `docs/qa/test-11/completion-production/capture-results.json` записываются origin/UTC, URL и время каждого sample, размеры, bounds, leaf geometry/progress, phase, canvas, idle frame count и console; промежуточные кадры явно помечены `final:false`. Для dev задавать отдельный `TEST_11_CAPTURE_DIR`. Скрипт требует настоящий WebGL midturn; CSS fallback не выдаётся за curved evidence. Итоги и screenshots — в [QA README](../../../../docs/qa/test-11/README.md).

Финальный production capture 19 октября 2026, 02:08:27–02:10:18 UTC: 33 PNG, exit 0, все 18 пар лично просмотрены в трёх размерах. Все 21 settled reading samples имеют 0 clipped text/overflow/broken images/running animations/canvas и 0 idle-rAF drift за 750 ms; min text 11 px. Оба направления сняты с настоящим WebGL curved leaf, curvature 0.789285 / 0.783188, spine error 0. Предупреждение PCFSoftShadowMap после rebuild отсутствует; ограничения GPU и остальные предупреждения сохранены в QA.

Финальные проверки координатора: **48/48 browser tests**, exit 0, 4.8 минуты, 1 worker (`test-results/test-11-completion-final-stable`): 25 test_11 и 23 legacy test_10/test_7/test_8. Lint/typecheck, 119 unit tests в 26 файлах, production build (35 маршрутов), Docker rebuild/HTTP 200 прошли; 30 защищённых SHA256 не изменены. Независимая приёмка — PASS, 18 шагов. Полный разбор результатов и прежних QA/runtime попыток — в текущей приёмке.

Историческая приёмка 18 октября относится к прежним трём главам: 22 targeted + 23 regression browser checks, 21 PNG и 119 unit baseline. Она не подтверждает шесть глав и новый reading engine. Текущие полные проверки и независимая приёмка перечислены в QA README.
