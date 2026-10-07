# Границы, решённые в спецификации

- Открытие журнала: `test_2/living-issue.tsx` и `living-issue.module.css`; не редактирует редакционную страницу.
- Контент: `test_2/editorial-home.tsx`, `lead-form.tsx`, `issue-content.ts` и локализованные данные внутри `test_2`; не редактирует CSS и общие данные `/test`.
- Стили и медиа: scoped CSS страницы `/test_2`, локальные файлы `frontend/public/test/` и их манифест; не редактирует TSX/контент.
- Проверка через `/test_2` и контрольный `/test`. Стек: Next.js, React, TypeScript, CSS modules; зависимости не добавлять.
- Отсутствующую зависимость сообщать как BLOCKED, не устанавливать самовольно.

- Таск 02 создаёт точную копию `test/editorial.module.css` в `test_2` и переключает импорты; таск 03 редактирует её позже.

- Таск 02 обновляет e2e-проверку: буквальное равенство текста `/test` и `/test_2` больше неуместно после локализации, сравнивать надо сценарий и структуру.


## Из таска 01 — открытие журнала
- `LivingIssue()` и `livingIssue` сохранены; публичные интерфейсы не добавлены.
- Вступительный блок локализован, кроме Travel Club; раскрытие подчинено прокрутке и reduced motion.


## Из таска 02 — редакционный контент
- `FormatMotif({ id: ProductId })`; классы `formatPlan`, `formatTurnkey`, `formatGroup`, `formatMotif*`, `printedPhoto`, `printedPhotoShanghai`, `printedPhotoCulture`, `printedPhotoPin`, `memoryNote` ждут стилей таска 03.
- `data-format` и `data-printed-photo` — атрибуты для браузерных проверок; локальные данные `test_2/data.ts` не меняют `/test`.


## Из таска 03 — стили и медиа
- `images.istanbulTea` на `/test_2` указывает на `/test_2/istanbul-tea-kubra.jpg`; исходный `/test` не изменён.
- Локальный `test_2/editorial.module.css` задаёт шкалу текста, равные размеры архивных обложек, фото-вставки, три мотива форматов и адаптивные сетки.
