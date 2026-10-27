# Интерфейсы и границы

## Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| TripEditor / DraftSession | Единым черновиком, открытой inline-формой, обновлением и сохранением поездки | Текущую строку формы для builder; save перед переходом к шагу 4 | Очередность сохранения, сверку версии с сервером и сетевые ошибки |
| TripBuilder | Строками на этапах 2–3, состояниями пустого списка и местом для формы | renderItemForm(itemId) для единственного активного элемента; добавление/редактирование/удаление через существующие callbacks | Финансовые расчёты и сохранение |
| ItemForm | Валидацией и полями одного элемента | Существующие onSubmit, onCancel, onDirtyChange; inline-размещение в builder | Черновик поездки и persistence |
| CountryCity | Контролируемой парой страны и города, поиском и быстрыми вариантами | onChange(countryCode, city); необязательную историю предыдущих мест перелётов | Формирование истории из поездки и хранение маршрута |
| Maps search | Преобразованием ответа геокодера и поиском городов | country_code в результатах города | Секрет провайдера и формат его ответа |
| TripCalendar | Отображением и взаимодействиями общего/дневного календаря | Существующий onEditDay(dayId) и события календаря | Переходами между страницами и сохранением |

История для CountryCity передаётся через необязательный prop ItemForm.flightHistory. Элемент истории содержит countryCode и city; список строится T02 из отправления и прибытия сохранённых перелётов поездки. T01 добавляет проп и отображение вариантов; T02 вычисляет список и передаёт его. Остальные ItemForm props остаются совместимыми.

Швы для тестов: controlled props CountryCity и результат mapsClient.searchCities; TripBuilder с подменёнными callbacks и рендером формы; TripEditor + существующие DraftSession/Trip API; callback TripCalendar.onEditDay. Backend parsing country_code проверяется на ответе /maps/search.

## Зоны тасков

### T01 — данные страны и истории мест

Владеет изменениями API поиска мест и полей выбора в CountryCity/ItemForm, включая focused tests. Включает backend/app/maps.py, backend/app/schemas.py, backend/tests/test_maps.py, frontend/src/lib/contracts.ts, frontend/src/lib/maps-client.ts, frontend/src/components/trips/country-city.tsx, frontend/src/components/trips/item-form.tsx и их узкие тесты.

Точный межтасковый шов: T01 добавляет в ItemForm необязательный flightHistory с элементами { countryCode: string; city: string }[] и передаёт этот список CountryCity; T02 строит такой список из ItemInput поездки и передаёт ItemForm. T01 не меняет TripBuilder, TripEditor и их тесты.

### T02 — встроенные анкеты и переход к дню

Владеет frontend/src/components/trips/trip-builder.tsx, frontend/src/components/trips/trip-editor.tsx, их CSS и тестами компонентов; может менять изолированные сценарии конструктора в frontend/e2e/trip-builder.spec.ts или constructor.spec.ts. T02 передаёт flightHistory в ItemForm по контракту выше. T02 не меняет CountryCity, ItemForm, maps client, backend и тесты T01.

## Правила проекта

- Стек: Python, FastAPI, Pydantic; Next.js, React, TypeScript. Существующие версии и стиль проекта сохраняются, новые зависимости не нужны.
- Схема БД, pricing, Trip API и финансовые правила за пределами правки.
- Не трогать публичные страницы и клиентский preview.
- Проверки из корня: docker compose exec -T backend pytest -q; docker compose exec -T backend ruff check .
- Проверки frontend из frontend/: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. Узкие frontend тесты допустимы до полного набора.
- Playwright запускается из frontend/ по командам и конфигурации проекта; нужен работающий сайт и Chromium.
- Не добавлять недостающие зависимости автоматически: вернуть тикет со статусом BLOCKED и причиной.
- Исполнители работают в текущем checkout, не создают ветки/worktree и не коммитят; итоговый коммит и push выполняет orchestrator в origin/master после ревью.
- Не включать не относящийся к задаче DOCX из корня.

## Общий git-контекст

Рабочая ветка — master; origin/HEAD сейчас указывает на origin/master. Перед публикацией проверить, что удалённая ветка не изменилась. Изменения AutoPilot сохраняются в репозитории.
## Из таска 01 — выбор страны и места перелёта

- maps search result: MapPlace с country_code?: string | null; выбираемые варианты города отфильтрованы до наличия ISO-кода.
- ItemForm.flightHistory?: { countryCode: string; city: string }[].
- CountryCity.history?: PreviousFlightPlace[]; выбор результата или истории передаёт countryCode и city вместе.
- Структурированные поля карты и сохранённый location остаются; у flight скрыто только текстовое поле маршрута.
## Из таска 02 — встроенные формы и переход к редактору дня

- TripBuilder принимает activeItem: ItemInput | null и renderItemForm(itemId: string) -> ReactNode.
- TripEditor владеет inlineEditing, сохраняет DraftSession перед навигацией на builder step 4 с выбранным dayId и остаётся на месте при ошибке сохранения.
- TripEditor строит уникальный flightHistory из departure_country_code/departure_city и arrival_country_code/arrival_city существующих перелётов, передавая его в ItemForm.
- Inline формы ограничены flight на этапе 2 и hotel на этапе 3; остальные типы сохраняют прежний modal edit.
- Общий календарь и DayCalendar используют общий trip draft и отображаются в редакторе дня вместе с программой/картой.
