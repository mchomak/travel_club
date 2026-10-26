# T03 — пошаговый конструктор

## Реализовано

- Защищённый `/admin/trips/[id]/builder`, `TripEditor mode="builder"`; default mode остаётся `editor`.
- Одна mounted DraftSession, общие CRUD/модальные формы/обработчики; stage/day меняются через URL replaceState без refetch. Незавершённая форма не размонтируется при попытке переключения.
- Basic create показывает основные поля, раскрывает дополнительные, всегда создаёт draft и открывает step=2. Step 1 существующей поездки открывает ту же полную форму параметров.
- Step 2 предлагает flight/дальний transport; taxi/walk не предлагаются в новом long-haul контексте. В дне доступны прежние подвиды; существующий legacy subtype сохраняется при редактировании.
- Step 3 использует прежнюю hotel ItemForm, location inputs и общий календарь. DayRouteMap отсутствует; аудит ItemForm/LocationPicker подтвердил отсутствие canvas внутри самой формы, поэтому no-op map prop не добавлен.
- Step 4: общий TripCalendar → day navigation → single-day TripCalendar / derived getDayProgram list + категории + DayRouteBoundaries / DayRouteMap hideBoundaries + calculation.days allocation. Обе календарные области имеют разные доступные имена, получают полные days/items и используют общую selection/handlers.
- Элементы без времени/дня и с днём вне диапазона доступны; редактирование/перенос — общая ItemForm, удаление — прежнее подтверждение. Сохраняются day notes/advanced fields.
- Step 5 переиспользует expenses/Finances/RatesForm; step 6 — reviewTrip warnings с действиями для дня/элемента и общей финансовой сводкой. Завершение не меняет статус на ready.
- Preview/full editor/finish ждут прямой session.save, сохраняют draft при ошибке и поддерживают повтор. Capture guard ждёт flush при обычной ссылке и logout. Dirty form явно отражается в статусе; safe transitions её не закрывают.
- DraftSession исправляет ack→finally race: поздняя revision не оставляет status=saving без активного запроса, вызвавший save ждёт актуальную revision.
- Desktop 3 / tablet 2 / narrow stacked CSS, существующий light/navy/green admin стиль.

## Проверки 2026-10-26

- До T03: 226 tests / 48 files.
- Red→green: ack microtask race; basic-create старый статус/адрес; отсутствующий builder; потеря выбранного дня при добавлении расхода. Long-haul regression дополнительно запускалась против HEAD ItemForm: падение на taxi option; восстановленный context — green.
- Первый полный `npm.cmd test -- --run --testTimeout=15000` до дозапроса: **235 passed / 50 files**, exit 0. После дозапроса и тестов на порядок/Browser Back результат обновлён ниже до **237 passed / 50 files**; повторено также оркестратором.
- Последние `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`: exit 0.
- Mechanical design detector: [] до последнего расширения тестов, UI после этого не менялся.
- Backend/API/DB/dependencies/environment не менялись. Коммиты/ветки/worktrees не создавались.

## Граница T04

Реальный browser/API/PostgreSQL acceptance, визуальная проверка desktop/tablet и Compose rebuild в этой задаче не запускались по разделению работ. Прошедшие component-тесты используют настоящий TripEditor/DraftSession и формы с замоканным tripApi; они не заменяют T04.

## Уточнение T03 — порядок и Browser Back

- Причина нарушения порядка: общая stage navigation безусловно стояла над содержимым step4. Для step4 она перенесена после трёх колонок; для остальных этапов положение сохранено. DOM-order regression проверяет full calendar → day navigation → day calendar / program / map → stage transitions; до исправления red, после green.
- Причина потери гарантий Back: прежний popstate guard спрашивал confirm и вызывал history.forward, не ожидая session.save и не останавливая обработчик router. Builder теперь перехватывает popstate в capture, восстанавливает текущую history entry и ждёт актуальный save, затем повторяет native Back. Ошибка оставляет URL/day/draft и retry; полный редактор сохраняет свой прежний guard.
- Regression использует настоящий jsdom history.back/popstate и downstream route listener: проверены фактический route path, отсутствие события router до ack, failure/retry и дополнительная revision во время запроса. До исправления downstream получал преждевременные `/admin/trips` и builder, после — только `/admin/trips` после последнего ack.
- Последние targeted: **19 passed / 4 files**. Последние full frontend: **237 passed / 50 files**, было 235 / 50 до уточнения. lint/typecheck/production build — exit 0. Коммитов нет.
