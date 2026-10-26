# 03 — Шесть этапов и трёхколоночный планировщик

**Требования:** R01, R02, R03, R04, R05, R06, R07, R08, R09, R10, R11, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22, R23, R24, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R37, R38, R39, R40, R41, R42, R48, R49, R50, R51, R52, R53, R54, R55, R56, R57, R58, R59, R60, R61, R81, R82, R43, R44, R45, R46, R47
**Blocked by:** 02
**Зона:** frontend/
**Волна:** 3
**Status:** ready

## Что должно заработать

Реализовать §1–§4/§6 UI: новый /admin/trips/[id]/builder, TripEditor mode default full editor и builder на ОДНОЙ DraftSession. Использовать seams T01/T02, прежние handlers/modals/ItemForm/TripForm/DayForm/RatesForm/Finances. Basic create только основные поля, дополнительные отдельно; новый doc draft, переход builder step2. Six steps с навигацией и resume URL, источник один aggregate; navigation внутри не remount/refetch. Step2 только дальние транспортные категории, городские taxi/walk доступны в дне; step3 hotel без интерактивной карты (в форме не показывать canvas в этом контексте). Step4 точный порядок шапка→полный прежний TripCalendar→day nav→три колонки [тот же single-day calendar | event list+category buttons+boundaries | existing map/logistics+daily allocation]. Все события включая unplaced доступны/редактируемы/удаляемы/переносимы. Day detail/notes не теряются. Stage5 существующие расходы/finances/rates, stage6 review warnings+links и итог. Finish/full-editor/preview await latest session.save; failure остаётся с draft/retry. Applied draft survives fast day/stage switches; dirty form не теряется. Save status не saved до ack; dirty form также обозначается. Старый редактор сохраняет UI/CRUD и даёт безопасный переход builder. Responsive desktop3/tablet2/stack, light/navy/green стиль admin, accessible controls. Не менять pricing formulas, API/DB. Добавить meaningful component/session/navigation tests.

## Из брифа, дословно

> «Перед изменениями изучи существующий код конструктора.»

> «После аудита составь краткий технический план изменений с указанием переиспользуемых модулей и необходимых новых компонентов.»

> «Нужно максимально переиспользовать существующие компоненты, API, модели данных и бизнес-логику, не сломав действующие функции.»

> «По возможности сохрани существующие API и структуру БД. Если изменения в схеме действительно необходимы, подготовь безопасные миграции с сохранением совместимости существующих поездок.»

## Разделы спецификации

§1–§7; Границы и швы.

## Критерии приёмки

- [ ] Create сохраняет draft и открывает шесть рабочих этапов поверх существующего TripInput.
- [ ] Step2/3/5 сохраняют все прежние поля, CRUD и финансовые возможности через существующие формы.
- [ ] Step4 имеет полный calendar сверху и три требуемые колонки, nav, sync edit/move/delete и shared selection.
- [ ] URL reload восстанавливает этап/день; latest save errors не ведут прочь, формы/данные не теряются при fast nav.
- [ ] Finish открывает старый редактор после server ack, старые поездки/preview работают.
- [ ] Desktop/tablet все операции доступны; unit/lint/typecheck/build и существующие editor regressions проходят.
