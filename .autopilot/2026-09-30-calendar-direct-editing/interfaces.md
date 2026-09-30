# Границы, решённые в спецификации

- `TripCalendar` владеет разметкой сетки и взаимодействием указателя. Получает дни, элементы, расчёт элементов, базовую валюту и callbacks `onCreateRange(dayId,start,end)`, `onMoveItem(itemId,dayId,start,end,endDayId)`, `onMoveHotel(itemId,checkIn,checkOut,dayId)`, `onEditDay(dayId)`, `onOpenItem(itemId)`.
- `TripEditor` владеет DraftSession, выбором дня, боковой панелью и расчётом. Любая мутация существующего элемента идёт через `session.change`, затем штатное автосохранение.
- `ItemForm` владеет валидацией, выбором типа и полями. Для нового события из сетки получает `requireTypeChoice`; при обычном добавлении тип уже выбран.
- `Modal` владеет жизненным циклом панели и закрытием по фону, Escape и крестику.
- `Calculation` остаётся финансовым источником. Сумма цен событий в заголовке — отдельный видимый показатель из `Calculation.items[].normalized_amount`; его нельзя складывать между днями при многодневных элементах. Себестоимость тура и дневная смета не меняются.

## Из таска 02

- `ItemForm` принимает необязательный `requireTypeChoice?: boolean` (по умолчанию false). Для создания с сетки передать true.
- `Modal` с `variant="panel"` принимает `open?: boolean`; при закрытии сохраняет DOM 220 мс и затем вызывает `onClose`. Родитель после сохранения ставит `open=false`, оставляет `editing` смонтированным и очищает его в `onClose`. Повторное `open=true` до таймера отменяет закрытие.
- Для CSS нужны `.modal-overlay[data-state="open"|"closed"]` и `.modal-panel[data-state="open"|"closed"]`, 220 мс и `prefers-reduced-motion`.

## Из таска 01

- `TripCalendar` callbacks: `onCreateRange?: (dayId: string, start: string, end: string) => void`; `onMoveItem?: (itemId: string, dayId: string, start: string, end: string, endDayId: string | null) => void`; `onMoveHotel?: (itemId: string, checkIn: string, checkOut: string, dayId: string) => void`; `onEditDay?: (dayId: string) => void`.
- Дополнительные props: `calculation?: Calculation | null`, `baseCurrency?: string`. Сумма события берётся из `calculation.items` и повторяется в каждом визуально занятом дне.

## Соглашения проекта

Next/React/TypeScript в `frontend`, FastAPI/PostgreSQL в `backend`. БД и API по этой задаче не менять. Местное время городов без пересчёта зон. Команды проверки: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run test:e2e`; Docker Compose запускается из корня. Не устанавливать зависимости без необходимости. Отсутствующую зависимость возвращать как BLOCKED.
