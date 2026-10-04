СДЕЛАНО: календарь строит производные блоки аэропорта с default 180/60, обрезкой по дням, пересечением полуночи и 0 как скрытием; отдельные кнопки открывают панель настройки, поля длительности добавлены в форму рейса.
ФАЙЛЫ: frontend/src/lib/calendar.ts, calendar.test.ts; frontend/src/components/trips/trip-calendar.tsx, trip-calendar.test.tsx, trip-editor.tsx, item-form.tsx, airport-block-form.tsx; frontend/src/app/globals.css.
РЕШЕНИЯ: блоки находятся только в buildCalendarEntries.airportBlocks, содержат itemId исходного рейса и не добавляются в trip.items/Calculation; lane placement общий с событиями, чтобы блоки не перекрывались.
РЕШЕНИЯ: airportBlockInterval считает арифметику локальных дат через UTC минуты только как календарную шкалу, без timezone conversion; after привязан к end_day_id либо выведенной следующей дате старого ночного рейса.
РЕШЕНИЯ: клик передаёт (itemId, before|after) в TripEditor; AirportBlockForm изменяет дату/время внешней границы, переводит в минуты 0–1440 и сохраняет через DraftSession.
ТУПИКИ: старый тест overlapping intervals использовал flight fixtures и после появления аэропортовых блоков ожидал 2 lane; fixtures переключены на activity, поскольку тест проверяет обычные события.
ТУПИКИ: параллельный полный npm test с production build один раз превысил timeout одного старого теста; отдельный повтор npm test прошёл.
ДАЛЬШЕ: добавить тест формы/редактора на изменение границы через полночь, неверный диапазон, 0 и сохранение/повторное открытие; проверить flight form сохранение длительности.
ДАЛЬШЕ: добавить браузерную проверку основного пути; после Compose rebuild оркестратор запустит e2e и Docker проверки, затем commit/push.
ДАЛЬШЕ: проверить ручной перенос рейса и удаление в тестах, включая сохранение настроенных минут; производная модель должна обновлять/удалять блоки автоматически.
ПРОВЕРКИ: npm.cmd test — 59 passed (baseline 57); npm.cmd run typecheck — passed; npm.cmd run lint — passed; npm.cmd run build — passed.
ОГОВОРКА: отдельная панель уже реализована, но её пользовательский сценарий и сохранение ещё не покрыты тестом; не считать задачу завершённой.
