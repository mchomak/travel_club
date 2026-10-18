# /test_11 — visual acceptance

Проверено **18 октября 2026** на локальном production Docker frontend: [Между строк](http://localhost:3000/test_11). Chromium **153.0.8010.12**, device scale 1. Файлы в этом каталоге сняты с production после пересборки; dev screenshots заменены.

## Финальные кадры

| Окно | Hero + Formats | Next Issue | Thailand ’26 | Обложка |
|---|---|---|---|---|
| 1280 × 768 | [PNG](hero-formats-1280x768.png) | [PNG](next-issue-1280x768.png) | [PNG](thailand-1280x768.png) | — |
| 1440 × 900 | [PNG](hero-formats-1440x900.png) | [PNG](next-issue-1440x900.png) | [PNG](thailand-1440x900.png) | [PNG](cover-1440x900.png) |
| 1728 × 900 | [PNG](hero-formats-1728x900.png) | [PNG](next-issue-1728x900.png) | [PNG](thailand-1728x900.png) | — |
| 1920 × 1080 | [PNG](hero-formats-1920x1080.png) | [PNG](next-issue-1920x1080.png) | [PNG](thailand-1920x1080.png) | [PNG](cover-1920x1080.png) |

Все 14 изображений открыты и осмотрены после production capture. Capture ждёт загруженные шрифты, decode фотографий, два кадра браузера и конец анимаций; обложка снята через ручное возвращение, где нет автоматического таймера. [Измерения](capture-results.json) фиксируют размер книги, overflow, состояние и console.

## Что осмотрено и доведено

- Общий язык: охристая обложка, синий Hero, киноварный Next, лесной Thailand; единые running heads, тонкие правила и folio связывают самостоятельные главы. Логотип остаётся настоящим SVG, а фотографии входят в крупную типографику.
- В ходе refinement разнесены ISSUE и угловая подпись Next; у белых служебных текстов на красном фоне повышен контраст, мелкие подписи внутри страниц доведены до 11 px. В финальных кадрах Next нет столкновения подписи с буквами, уточнение о направлении читается целиком.
- Кадр лодочника перенастроен так, чтобы человек и нос лодки сохранялись на самом маленьком desktop. Проверены также лагуна внутри букв, городские вывески и лодка на Hero/обложке; заметной пикселизации нет.
- На 1280 × 768 особенно проверены плотная правая страница Next, цены/описания форматов, архивная CTA и нижние подписи. Текст и действия остаются в своих листах; у сгиба не теряются буквы. На 1728 × 900 сохраняется та же высота издания, боковое пространство намеренное.
- Исправлены переход фокуса после skip/повторного открытия и перехват модифицированных стрелок. Обложка возвращается к выбранной главе. Декоративные элементы не перекрывают четыре основные CTA.
- Hero использует маски строк и горизонтальный photo reveal, Next — ирис, Thailand — вертикальные полосы и буквы с изображением. Повторный вход в обе стороны заново запускает конечное раскрытие обеих страниц. После него остаётся стабильная композиция.

## Проверки

`e2e/test-11-visual.spec.ts`: **7 passed, 50.6 s**, production localhost:3000. До добавления visual suite было 10 shell-сценариев `/test_11`; добавлено 7 поведенческих проверок. Targeted ESLint новых test/capture файлов — exit 0.

После уточнения TypeScript-типа тестового rAF-счётчика полный `npm.cmd run typecheck` и targeted ESLint повторены — exit 0; production reentry/idle-сценарий повторён отдельно — **1 passed, 13.9 s**. Приложение и screenshots не менялись.

Координатор выполнил lint, typecheck, Vitest (**119 passed / 26 файлов**), Next.js production build и `docker compose up -d --no-deps --build --wait frontend` — успешно, frontend running, HTTP 200. Защищённый baseline: **10 файлов, 0 изменено**, [результат SHA256](../../../.autopilot/2026-10-18-test-11-editorial/protected-result.json), [исходные хеши](../../../.autopilot/2026-10-18-test-11-editorial/baseline-hashes.json). Это проверка исходников; попиксельная идентичность старого маршрута не заявляется.

Финальный production shell/regression run: **33 passed, 1.4 min**, один worker — 10 shell-сценариев `/test_11` плюс 23 регрессии `/test_10`, `/test_7`, `/test_8`. [Лог](../../../frontend/test-results/test-11-production-stable.log). С отдельным visual suite итог — **40 passed**.

- Все шесть страниц в четырёх desktop размерах: bounds каждого текстового range, минимум 11 px, полная видимость ссылок, целые изображения, отсутствие внутреннего и внешнего overflow. Проверка bounds дополняет scrollHeight: `overflow:hidden` не маскирует обрезанный текст.
- Reentry `2 → 3 → 2 → 1`: обе страницы анимируются, эффекты трёх глав различаются, iteration count конечный. После завершения — 0 running animations, 0 canvas; число вызовов rAF за последующие 750 ms не меняется. Это проверка отсутствия idle loop, без заявления о FPS на других устройствах.
- Reduced motion: финальные тексты, фото и действия видны без отложенного раскрытия и intro.
- Реальные pointer clicks четырёх CTA доходят до `/start`, `/formats`, `/start?format=group`, `/archive`; в доступном DOM действие представлено один раз.

Во всех 14 capture: **0 broken images, 0 page/document overflow, 0 running animations, 0 canvas**; console warnings отсутствуют. Opening выполнен CSS transform, отдельного WebGL renderer нет. Комбинированный shell-сценарий с отключённым WebGL и resize проверяет читаемое завершение при resize; WebGL fallback renderer здесь не заявляется.

## Воспроизведение

Из `frontend/`, при работающем localhost:3000:

```powershell
$env:NO_COLOR=$null
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'
npm.cmd exec playwright test e2e/test-11-visual.spec.ts -- --workers=1 --output=test-results/test-11-production-visual
node scripts/capture-test-11.mjs
```

Полный route/shell suite — `e2e/test-11-magazine.spec.ts`; карта реализации — [component README](../../../frontend/src/components/test_11/README.md).

## Границы проверки

Desktop Chromium проверен; Safari/Firefox, печать и отдельный mobile magazine не проверялись. Ниже 1100 × 700 px предусмотрена обычная версия `/test_8`. Стоковые кадры обозначены иллюстративными, они не документируют участников. Next Issue не объявляет направление/даты; `/start` сохраняет существующий демонстрационный сценарий.

При ручном просмотре проекта встречались favicon 404 и предупреждение о preload CSS публичного сайта; координатор воспроизвёл их также на `/test_10`. Они относятся к существующему окружению, в финальной capture-матрице не появились.

Первый production regression run с двумя workers: 32 passed, один `/test_8` не дошёл до приложения из-за `net::ERR_NO_BUFFER_SPACE` при `page.goto` (171 ms). Немедленный отдельный повтор прошёл за 4.9 s без изменения кода. Финальный повтор всего набора с одним worker — 33 passed.

Для переноса в основной продукт подходят ритм главы «обложка + статья», фото внутри типографики, явные цены форматов и ограниченные reveal-анимации с видимой базовой статикой. Эксперимент остаётся отдельным маршрутом.
