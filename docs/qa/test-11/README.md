# /test_11 — refinement acceptance

## 19 октября — шесть глав: production evidence

Новый контракт содержит **6 разворотов / 12 страниц**. Финальный capture после production rebuild с `PCFShadowMap` **19 октября, 02:08:27–02:10:18 UTC** завершился exit 0: **33 PNG**. Все 18 финальных пар в трёх размерах, оба curved turn и выбранные кадры обложки/intro/reveal лично просмотрены заново. [Текущая приёмка и таблица PNG](completion-acceptance.md), [актуальный manifest](completion-production/capture-results.json). Финальный production browser-прогон: **48/48 passed**, exit 0, **4.8 минуты**, 1 worker, output `frontend/test-results/test-11-completion-final-stable`: 25 текущих test_11 (15 magazine + 3 reveal + 7 visual), 23 legacy (6 test_10 + 11 test_7 + 6 test_8).

Координатор подтвердил lint/typecheck, **119 unit tests в 26 файлах**, production build (35 маршрутов), Docker rebuild и HTTP 200; **30 защищённых SHA256** не изменены. [Независимая приёмка](completion-blind-acceptance.md) — PASS, 18 шагов без ошибок. История первых неуспешных QA-попыток и runtime-reset старого image optimizer сохранена в текущей приёмке; финальный полный прогон зелёный.

Новые кадры сохранены отдельно в `completion-production/`; dev-контент туда не попадает. JSON фиксирует origin, время UTC, URL и время sample каждого PNG, `evidenceStatus`, `final`, reading progress/source/target/geometry, reveal, bounds, изображения, canvas и console. `visualReview` фиксирует личный просмотр. Все 21 settled reading states: 0 clipped text, overflow, broken images, running animations, canvas и idle-rAF drift; минимальный текст 11 px.

Сняты все шесть финальных пар и обложка в 1280×768 / 1440×900 / 1920×1080; intro, curved reading leaf вперёд/назад, ранняя/средняя редакционная сборка и settled endpoint в 1440×900. Curvature 0.789285 / 0.783188, spine error 0, source/back правильные. Reveal-suite проверяет no-flash по кадрам. Финальный PNG ждёт fonts, decode и отсутствие running animations (bounded timeout 12 s). Ошибок JavaScript и предупреждения PCFSoftShadowMap нет; ReadPixels, CSS preload и Canvas2D readback сохранены в manifest. FPS/GPU memory не измерялись; история неуспешного первого capture отражена в текущей приёмке.

```powershell
$env:NO_COLOR=$null
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
$env:TEST_11_SOURCE_LABEL='local Docker production after final PCFShadowMap rebuild 2026-10-19'
$env:TEST_11_EVIDENCE_STATUS='production-awaiting-visual-review'
npm.cmd exec playwright test e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11-completion-production-qa
node scripts/capture-test-11.mjs
```

## Историческая приёмка трёх глав — 18 октября

Все приведённые ниже **21 PNG, 45 browser checks и 119 unit baseline относятся к предыдущей версии из трёх глав**. Они не подтверждают текущие шесть глав или curved reading turn.

Доработка ниже снята **18 октября 2026, 19:11 UTC** с пересобранного локального production Docker frontend: [Между строк](http://localhost:3000/test_11). Chromium **153.0.8010.12**, device scale 1. [Capture metadata](capture-results.json) содержит origin, время, реальные состояния и геометрию. Dev3001 использовался отдельно; его снимки не входят в этот каталог. [Прежняя слепая приёмка](blind-acceptance.md) сохранена как историческая.

## Production screenshots

| Окно | Hero + Formats | Next Issue | Thailand ’26 | Ожидающая обложка |
|---|---|---|---|---|
| 1280 × 768 | [PNG](hero-formats-1280x768.png) | [PNG](next-issue-1280x768.png) | [PNG](thailand-1280x768.png) | [PNG](cover-1280x768.png) |
| 1440 × 900 | [PNG](hero-formats-1440x900.png) | [PNG](next-issue-1440x900.png) | [PNG](thailand-1440x900.png) | [PNG](cover-1440x900.png) |
| 1728 × 900 | [PNG](hero-formats-1728x900.png) | [PNG](next-issue-1728x900.png) | [PNG](thailand-1728x900.png) | — |
| 1920 × 1080 | [PNG](hero-formats-1920x1080.png) | [PNG](next-issue-1920x1080.png) | [PNG](thailand-1920x1080.png) | [PNG](cover-1920x1080.png) |

Реальная последовательность 1440 × 900: [открывающаяся обложка](opening-cover-1440x900.png) → [ранний лист](opening-early-leaf-1440x900.png) → [поздний лист и pending Hero](opening-late-leaf-1440x900.png) → [первый живой Hero](intro-hero-endpoint-1440x900.png). Дальше: [450 ms reading turn](reading-turn-1440x900.png) → [готовый Next](reading-next-endpoint-1440x900.png). Промежуточные кадры помечены `final:false`; реальные phase записаны в JSON, снимок не останавливает часы сцены.

## Проверенный результат

- Перед запуском видны только маленькая настоящая обложка и тёплая oxblood/plum поверхность. Capture ждёт готовую сцену и ещё 4500 ms: все три cover-снимка остаются `opening/CLOSED`, восемь листов загружены, автоматического старта нет. Canvas здесь ожидаем: сцена готова, но остановлена.
- Клик по фону запускает физическую обложку, деформацию декоративных листов и приближение камеры. Поздний промежуточный кадр показывает опорные заголовки/цены Hero, пока фото и детали скрыты. Чтение останавливается на `spread=1`, `introResult=target`, `introPhase=TARGET`; canvas отсутствует.
- Reading turn сохраняет уходящий Hero и pending Next: NEXT/ISSUE и заголовок письма видны, круглый кадр и отложенный текст ещё закрыты. Финальный Next показывает их полностью. Непрерывные sample-проверки no-flash находятся в reveal и shell suite; screenshots сами по себе не доказывают каждый кадр.
- Лично просмотрены все три текущих разворота в 1280/1440/1920, ожидание, физические фазы и reading turn. Синий, киноварный и зелёный миры сохраняют общий ритм; цветные route/group/service icons помогают сканировать. CTA, цены, credits и ограничения Next не сталкиваются с заголовками или сгибом. Крупные THAI/LAND и фото сохраняют намеренную композицию.
- Все **12 direct-final captures**: **0 clipped text ranges, 0 page/document overflow, 0 broken images, 0 running animations, 0 canvas**. Минимальный текст — **11 px**; body ≥14 px проверяет reveal suite. Два дополнительных финальных endpoint capture также без overflow/clipped ranges/broken images/running animations/canvas.

| Окно | Книга, px | Высота viewport | Верхний отступ | Нарушения текста всех 6 страниц |
|---|---|---|---|---|
| 1280 × 768 | 1126.39 × 703.98 | 91.7% | 16 px | 0 |
| 1440 × 900 | 1337.59 × 835.98 | 92.9% | 16 px | 0 |
| 1920 × 1080 | 1625.59 × 1015.98 | 94.1% | 16 px | 0 |

Сохранены три главы, Маршрут / Travel Design **5 000 ₽**, Под ключ / Travel Ready **10 000 ₽**, В компании / Travel Trips **по согласованию**. Next остаётся первым путешествием в подготовке, интерес — не бронирование. Thailand — четверо друзей, острова → Бангкок до запуска клуба. Иллюстративные подписи и оговорка о неопубликованной полной истории присутствуют.

## Проверки

Task06: targeted dev visual suite — **passed**, 7 сценариев, `.last-run.json` без failed tests; dev capture — exit 0. Production capture — **exit 0**, 21 изображение. Targeted ESLint для visual/capture — exit 0.

Финальный интеграционный production прогон координатора: **22/22 passed, 1.5 минуты**, один worker: **12 intro + 3 reveal + 7 visual**, output `frontend/test-results/test-11-refinement-production`. Вместе с 23 legacy-проверками ниже — **45/45 browser checks**. Проверены ручное ожидание и клик по фону/обложке, ранняя активация, клавиатура, history/query, 450 ms lock, pending → enter, повторный вход, reduced motion/fallback, bounds и реальные CTA.

Координатор подтвердил lint/typecheck, Vitest **119 passed**, production frontend build и `docker compose up -d --no-deps --build --wait frontend` — exit 0; frontend running и HTTP 200. Старые `/test_10`, `/test_7`, `/test_8`: **23/23 passed**, один worker, output `frontend/test-results/test-11-refinement-regression`. Защищённые **30 файлов** SHA256 не изменены относительно refinement baseline. Это проверка исходников, попиксельная идентичность не заявляется.

Task04 подтвердил shell suite **12/12 dev**, focused production manual wait/scene/corners **1/1 passed**. Независимые production-измерения проекции всего разворота: **3 samples**, максимальная ошибка **0.0612087 px**, после Hero — **0 canvas**, idle frame count стабилен. Это дополняет screenshot endpoint и не заменяет измерение FPS/GPU memory.

В direct-final captures console чиста. При подготовке/движении WebGL зарегистрированы предупреждения Chromium **GPU stall due to ReadPixels** и Next **unused CSS preload**; они сохранены в JSON. Ошибок JavaScript/сломанных изображений в capture нет. Ноль canvas после TARGET дополняется shell-проверкой cleanup и visual-проверкой отсутствия idle rAF. FPS и GPU memory на всех устройствах не измерялись.

## Воспроизведение

Из `frontend/` при работающем localhost:3000:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11-refinement-production
node scripts/capture-test-11.mjs
```

Для dev задать `PLAYWRIGHT_BASE_URL=http://localhost:3001` и отдельный абсолютный `TEST_11_CAPTURE_DIR`; production evidence не заменять dev-кадрами. Карта исходников — [component README](../../../frontend/src/components/test_11/README.md).

Проверен desktop Chromium; Safari/Firefox, печать и отдельный mobile magazine не проверялись. Минимум — 1100 × 700; ниже предлагается обычная версия `/test_8`. `/start` остаётся прототипом. Новые API/зависимости и внешняя публикация не требовались.
