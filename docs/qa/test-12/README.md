# TEST_12 — приёмка, 20 октября 2026

Изолированная ветка `codex/test-12`, worktree `.worktrees/test-12`. Production preview: `http://localhost:3013/test_12`, контейнер `travel-club-test12-preview`. Основной сайт другой сессии не заменялся.

## Результаты

- Новый браузерный набор: **13 passed** на dev3012, 37,7 с.
- Production Chromium: **36 passed**, 2,1 минуты, exit 0: 13 новых проверок и 23 регрессионных проверки TEST_11 (magazine/reveal/comments).
- Production capture: **39 PNG**, **15 успешных сравнений**, **0 failures**. Семь глав, обложка и пять контрольных разворотов TEST_11 на 1366×768, 1440×900 и 1920×1080.
- Lint, TypeScript, **113 unit tests / 26 файлов** и production Docker build с **36 маршрутами** прошли; итоговые проверки повторены координатором.
- SHA-256 всех **367 защищённых прежних файлов** `src/public` совпали с исходным baseline. Пять локальных intro/capture/reading engine файлов TEST_12 побайтно совпадают с TEST_11.
- Backend не менялся; backend-проверки в этой итерации не запускались.

## Что проверено

Семь прямых URL, Next/Previous последовательно в обе стороны, переходы из оглавления, active `aria-current`, физические номера страниц, стрелки клавиатуры, focus, Back/Forward и прерывание перелистывания через Back. Восемь невалидных/повторённых query нормализуются в `spread=1` с сохранением остальных параметров. Возврат к обложке сохраняет выбранную главу.

Проверены названия, назначение, цены и оговорка Travel Design/Travel Ready, ссылки `/formats` и `/start`, отсутствие дублирующего CTA слева; равноправные роли основателей, честные области портретов и история поездок друзей.

Настоящий WebGL intro открывается по Enter и Space; подсказка видна до hover, ожидание не вызывает бесконечных canvas-кадров. Pointer/skip, reduced motion и малый viewport fallback проверены. Настоящая текстурированная изогнутая страница перелистывается в About и обратно, повторный ввод блокируется до завершения, конечная геометрия совпадает с DOM.

Capture проверяет границы текста и CTA новых разворотов, отсутствие overflow, сломанных изображений и активных анимаций/canvas после завершения; за контрольный интервал в покое новые rAF не выполняются. Высота целей оглавления не меньше 44 px.

Старые главы сравниваются по DOM-тексту, изображениям, ссылкам, reveal hooks, геометрии и computed styles. Единственные исключения — новый текст folio и его зависящие от формы цифр горизонтальные координата/ширина; вертикальная геометрия и стили folio сравниваются.

Лично просмотрены Hero+Formats и About во всех трёх разрешениях, обложка 1366×768 и [контактный лист пяти пар](production/control-comparison-contact-sheet.jpg). Видимых перекрытий текста, обрезанных заголовков или скрытых CTA нет; композиции контрольных глав сохранены. Независимая проверка: [blind acceptance](blind-acceptance.md).

## Повторение

Из `frontend/`, с работающим изолированным preview:

```powershell
$env:PLAYWRIGHT_BASE_URL='http://localhost:3013'
npm.cmd exec playwright test e2e/test-12-magazine.spec.ts e2e/test-11-magazine.spec.ts e2e/test-11-reveal.spec.ts e2e/test-11-comments.spec.ts -- --workers=1 --output=test-results/test-12-production
$env:TEST_12_CAPTURE_DIR='../docs/qa/test-12/production'
$env:TEST_12_RUNTIME_LABEL='Docker production; isolated travel-club-test12-preview on port3013'
node scripts/capture-test-12.mjs
```

Точный runtime и исходные измерения: [production manifest](production/capture-results.json); предварительный прогон: [development manifest](development/capture-results.json). Артефакты Playwright находятся в игнорируемом `frontend/test-results/test-12-production`.

## Ограничения

Два настоящих портрета основателей не предоставлены; показываются подписанные сменяемые области без выдуманных лиц. Браузерная приёмка выполнена в desktop Chromium; одинаковое поведение всех устройств/GPU не утверждается. Значимых ошибок приложения нет. Существующие favicon 404, предупреждения CSS preload и Canvas/WebGL readback описаны в blind acceptance и manifest отдельно; это не новые ошибки приложения.
