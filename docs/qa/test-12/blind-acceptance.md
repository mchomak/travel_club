# TEST_12 — независимая слепая приёмка

Дата: 20 октября 2026. Проверяемый production: `http://localhost:3013/test_12`.

Единственный источник ожиданий — `.autopilot/2026-10-20-test-12--wip/2026-10-20-brief.md`. Остальные файлы `.autopilot/`, существующие тесты и QA-отчёты не читались. Проверка выполнена по исходникам `/test_12`, сравнению с исходниками `/test_11` и работающему Chromium через Playwright. Качество кода не оценивалось. Серверы не запускались и не перезапускались.

## Результат по требованиям

| Требование брифа | Статус | Фактическое свидетельство |
|---|---|---|
| Независимая TEST_12, сохранность TEST_11 и прочих страниц | Реализовано | Diff от `7cf5899` в app/components/public/package ограничен новой TEST_12; diff контрольных путей пустой. `/test_11` реально открылся, сохранил шесть старых названий и перешёл Next на Next Issue. |
| Подсказка закрытой обложки | Реализовано | До hover видна «Открыть журнал ↗». Проверено визуально на исходной странице. |
| Деликатное движение, hover, pointer и focus обложки | Реализовано | Локальный CSS задаёт однократный `coverImpulse` 1400 ms и hover-сдвиг −4 px/−.25°. Кнопка реально имеет `cursor: pointer`; после focus — `outline: solid`. |
| Enter/Space и reduced motion | Реализовано | Оба нажатия открыли `data-stage=reading`. При reduce у intro `animation: none`, `transform: none`; прямой выбор «О нас» работает. |
| Сохранить саму анимацию открытия и перелистывания | Реализовано | SHA256 файлов `intro-scene.ts`, `magazine-intro.tsx`, `reading-turn.tsx`, `reading-turn-engine.ts`, `capture-page.ts` совпадает между версиями. Реальное открытие и 12 последовательных переходов завершились. |
| Сохранить композицию hero, оригинальный логотип и фото | Реализовано | В браузере сохранены двухстраничная композиция, горная фотография, слоган; SVG `/test_9/TC_Logo_Editorial_Signature_V2_Navy.svg`. Diff Hero ограничен заменой пояснения и удалением прежнего CTA. |
| Подзаголовок бизнеса справа | Реализовано | Полный текст «Создаём индивидуальные маршруты…» читается сразу под «С нами в путь», визуально заметен на 1366×768. |
| Названия, описания и цены продуктов | Реализовано | Главные заголовки Travel Design / Travel Ready / TC Trips; под ними русское назначение. 5 000 ₽ / 10 000 ₽ / «По согласованию». Design объясняет самостоятельное бронирование, Ready — согласованные задачи, Trips — небольшую компанию. Новых дат, направлений и обещаний поддержки нет. |
| Структура стоимости, два отдельных CTA | Реализовано | Явное пояснение относится к Travel Design и Travel Ready: транспорт, проживание и прочие расходы отдельно. Верхний правый CTA реально привёл на `/start`; нижний «Подробнее о форматах» — на `/formats`. Дублирующего CTA слева нет. |
| Новый разворот после услуг, до Next Issue | Реализовано | Фактическая последовательность: услуги → О нас → Next Issue → Thailand → China → Archive → Start. «О нас» имеет страницы 04–05. |
| Равноправные Василиса и Рамиль, роли и история | Реализовано | Оба названы сооснователями; явно написано о равноправных партнёрах и совместных решениях. У Василисы сопровождение/люди/продукты, у Рамиля технологии/финансы/процессы/развитие/продукты. История — самостоятельные путешествия друзей до проекта. Не обнаружены вымышленные достижения, даты или сотрудники. |
| Портреты и их замена | Реализовано | Честные подписанные области «Место для настоящего портрета». `FOUNDER_PHOTOS` содержит отдельные src/alt/position для каждого. Отсутствие реальных портретов разрешено брифом и не является пропуском. |
| Семь русских пунктов, активность, hit areas | Реализовано | Услуги / О нас / Первая поездка / Таиланд / Китай / Архив / Начать. Активная глава подчёркнута и имеет `aria-current=page`. Измеренные области всех пунктов высотой 44 px, шириной ≥71 px на 1366×768. |
| Next/Previous, прямой выбор, стрелки и история URL | Реализовано | Пройдено 1→7 и 7→1; прямой выбор всех семи в несмежном порядке; ArrowLeft/ArrowRight; browser Back/Forward. URL, глава и active совпали во всех случаях. |
| Прямое открытие семи spread и нумерация | Реализовано | `?spread=1`…`?spread=7` открыты заново на каждом из трёх размеров. Все сразу `reading`, правильный active. Физические страницы 02–03, 04–05, 06–07, 08–09, 10–11, 12–13, 14–15. |
| Сохранить Next Issue / Thailand / China / Archive / POV+Start | Реализовано | Diff `spreads.tsx` для этих функций содержит только новые folio. Изображения и прочие данные этих глав неизменны; соответствующие правила CSS не менялись. Функции реально отрисованы при прохождении журнала. |
| Desktop 1366×768, 1440×900, 1920×1080 | Реализовано | 21 прямое открытие: по 7 глав на каждом размере. Ни один из проверенных a/h1/h2/h3/p/footer не вышел за рамку журнала, horizontal overflow не появился, все img загружены. Дополнительно визуально просмотрены обложка, hero 1366×768 и «О нас» 1366×768/1440×900. |
| Сохранить существующий компактный сценарий | Реализовано | На 390×844 показано прежнее сообщение «Журнал для большого экрана» и ссылка на обычную `/test_8`; порог 1100×700 сохранён. Новый мобильный журнал бриф не требует. |
| Отсутствие критических ошибок runtime | Реализовано | Основной сценарий не прервался; ошибок приложения/исключений не наблюдалось. Есть отдельные некритичные сообщения ниже. |
| Lint / typecheck / production build | Не проверено этой приёмкой | Существующий production работает; команды сборки и проверки типов независимо не запускались. Это предел приёмки, не обнаруженная ошибка реализации. |

## Расхождения и ограничения

Блокирующих или функциональных расхождений с брифом не обнаружено. Частично реализованных или отсутствующих продуктовых требований по проверенному сценарию не найдено.

В консоли TEST_12 зарегистрированы:

- `Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:3013/favicon.ico:0` — отсутствует favicon, работе журнала не мешает.
- Предупреждения о неиспользованном в первые секунды CSS preload (`1y7pmczr8-ctf.css`, `3bswa89roskq3.css`).
- `Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true.` при перелистывании. Это предупреждение браузера; зависания или незавершённого перехода в проверенном сценарии не было.

Для будущей замены нужны два настоящих портрета. Это ожидаемое состояние, а не дефект.

Пиксельное сравнение скриншотов старых разворотов не выполнялось: сохранность установлена diff исходников/данных/стилей и runtime smoke старой версии. Измерение границ не является автоматическим доказательством отсутствия любого внутреннего наложения; просмотренные hero и «О нас» явных перекрытий текста не имеют.

## Выполненные команды и результаты

Рабочая директория: `C:/Users/McHomak/Projects/travel_club/.worktrees/test-12`. Запуска сервера не было: использован уже запущенный `http://localhost:3013`.

Сравнение неизменяемых частей (команды приведены дословно):

```powershell
git diff --no-index -- frontend/src/components/test_11/intro-scene.ts frontend/src/components/test_12/intro-scene.ts
git diff --no-index -- frontend/src/components/test_11/magazine-intro.tsx frontend/src/components/test_12/magazine-intro.tsx
git diff --no-index -- frontend/src/components/test_11/reading-turn.tsx frontend/src/components/test_12/reading-turn.tsx
git diff --no-index -- frontend/src/components/test_11/reading-turn-engine.ts frontend/src/components/test_12/reading-turn-engine.ts
git diff --no-index -- frontend/src/components/test_11/capture-page.ts frontend/src/components/test_12/capture-page.ts
```

Результат каждой: пустой diff.

```powershell
$paths = @('frontend/src/app/test_11', 'frontend/src/components/test_11', 'frontend/src/components/public-site', 'frontend/public', 'frontend/package.json', 'frontend/package-lock.json'); git diff --exit-code 7cf5899 -- $paths; $checks = @('intro-scene.ts', 'magazine-intro.tsx', 'reading-turn.tsx', 'reading-turn-engine.ts', 'capture-page.ts'); foreach ($file in $checks) { $a = (Get-FileHash -Algorithm SHA256 -LiteralPath "frontend/src/components/test_11/$file").Hash; $b = (Get-FileHash -Algorithm SHA256 -LiteralPath "frontend/src/components/test_12/$file").Hash; "$file identical=$($a -eq $b)" }
```

Результат дословно:

```text
intro-scene.ts identical=True
magazine-intro.tsx identical=True
reading-turn.tsx identical=True
reading-turn-engine.ts identical=True
capture-page.ts identical=True
```

Содержательные сравнения:

```powershell
git diff --no-index -- frontend/src/components/test_11/spreads.tsx frontend/src/components/test_12/spreads.tsx
git diff --no-index -- frontend/src/components/test_11/spreads.module.css frontend/src/components/test_12/spreads.module.css
git diff --no-index -- frontend/src/components/test_11/magazine.module.css frontend/src/components/test_12/magazine.module.css
git diff --no-index -- frontend/src/components/test_11/data.ts frontend/src/components/test_12/data.ts
git diff --name-only 7cf5899 -- frontend/src/app frontend/src/components frontend/public frontend/package.json frontend/package-lock.json
```

Результат: изменены только новые файлы `frontend/src/app/test_12/page.tsx` и `frontend/src/components/test_12/*`; старые содержательные развороты имеют только сдвиг folio, эффекты/стили их композиции не менялись.

Браузерные команды запускались через `mcp__playwright__browser_run_code_unsafe`, не через существующие тесты проекта. Основная последовательность, дословно:

```javascript
async (page) => { const results=[]; for(let i=3;i<=7;i++){ await page.getByRole('button',{name:'Next',exact:true}).click(); await page.locator(`main[data-spread="${i}"][data-turning="false"]`).waitFor(); results.push({action:'Next',spread:i,url:page.url(),active:await page.locator('nav [aria-current]').innerText(),headings:await page.locator('[data-magazine-book] h2').allTextContents(),folios:await page.locator('[data-magazine-book] footer').allTextContents()}); } for(let i=6;i>=1;i--){ await page.getByRole('button',{name:'Previous',exact:true}).click(); await page.locator(`main[data-spread="${i}"][data-turning="false"]`).waitFor(); results.push({action:'Previous',spread:i,url:page.url(),active:await page.locator('nav [aria-current]').innerText()}); } return results; }
```

До этого отдельно выполнен Next 1→2. Все ожидания завершились. Возвращённые пары страниц: `06/07`, `08/09`, `10/11`, `12/13`, `14/15`; обратный путь вернулся к `?spread=1`, active `01\nУслуги`.

Проверка прямых URL/границ на трёх размерах, дословно:

```javascript
async (page) => { const rows=[]; for(const viewport of [{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080}]) {await page.setViewportSize(viewport); for(let i=1;i<=7;i++){await page.goto(`http://localhost:3013/test_12?spread=${i}`);await page.locator(`main[data-stage="reading"][data-spread="${i}"][data-turning="false"]`).waitFor(); const value=await page.evaluate(()=>{const book=document.querySelector('[data-magazine-book]'); const br=book.getBoundingClientRect(); const errors=[]; for(const el of book.querySelectorAll('a,h1,h2,h3,p,footer')){const r=el.getBoundingClientRect(); if(r.width && r.height && (r.left<br.left-.5||r.right>br.right+.5||r.top<br.top-.5||r.bottom>br.bottom+.5))errors.push({tag:el.tagName,text:el.textContent.slice(0,70),r:r.toJSON()});} return {box:br.toJSON(),outside:errors,active:document.querySelector('nav [aria-current]')?.textContent,scroll:document.documentElement.scrollWidth>innerWidth,images:[...book.querySelectorAll('img')].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src)};}); rows.push({viewport,spread:i,...value});}} return rows; }
```

Все 21 результата содержат дословно `"outside":[],"scroll":false,"images":[]` и соответствующий active. Размеры рамки: 1126.390625×703.984375, 1337.59375×835.984375, 1625.59375×1015.984375.

Клики CTA вернули дословно:

```json
{"start":"http://localhost:3013/start","formats":"http://localhost:3013/formats"}
```

Проверка клавиатуры вернула для Enter и Space `"focused":true,"outline":"solid","cursor":"pointer"` перед открытием и `"after":"reading"` после. Проверка reduce вернула `"animation":"none","transform":"none"`, затем `?spread=2` с active `02\nО нас`.

Материалы визуального просмотра созданы браузерным инструментом в его служебном `.playwright-mcp` output: `page-2026-10-20T02-02-07-111Z.png` (обложка), `page-2026-10-20T02-02-24-335Z.png` (hero), `page-2026-10-20T02-02-34-336Z.png` (О нас 1366), `page-2026-10-20T02-03-57-847Z.png` (О нас 1440). Исходники приложения и тесты при этой приёмке не изменялись.
