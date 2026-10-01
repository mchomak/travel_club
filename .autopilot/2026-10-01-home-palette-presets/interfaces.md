# Границы модулей

## Решено в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| `HomeExperience` и мастерская стиля | текущей темой, выбором рекомендаций, формой сохранения и списком пользовательских пресетов | пользовательские действия в панели и применение `Theme` на корень главной | загрузку/запись localStorage и состояние формы |
| JSON-каталог рекомендаций | именами, описаниями, цветовыми ролями и шрифтами встроенных вариантов | массив пресетов для панели | расположение статического файла и формат сборки |

## Правила проекта

- Существующий стек: Next.js 16, React 19, TypeScript 6, CSS; новые зависимости не нужны.
- Изменения ограничены публичной главной и её палитрами; админку, backend, PostgreSQL и несвязанные страницы не менять.
- Оставить ключ темы `travel-club-home-style-v1`; отдельный ключ использовать только для сохранённых пользовательских пресетов.
- Не включать пользовательские данные в серверный JSON-каталог рекомендаций и не давать публичной странице запись на диск.
- Пользовательские записи считать недоверенными: проверять id/name, нормализовать Theme через существующий `restoreTheme`, переживать ошибки localStorage без падения страницы.
- Проверка этого прогона — production Docker build frontend. Для этого задания тесты не добавлять и не запускать.

## Швы

Один сквозной шов — панель мастерской стиля: применить JSON-вариант, сохранить текущий Theme, выбрать сохранённый Theme и повторно открыть главную. Новых API/сервисов/других программных границ нет.

## Построено

## Implemented files

- frontend/src/components/public-home/home-experience.tsx owns recommended palette selection, named preset save/apply/delete, status messages, and live theme coordination.
- frontend/src/components/public-home/theme.ts validates saved preset records and restores safe theme values.
- frontend/src/components/public-home/presets/recommended.json is the static catalog for recommended palettes.
- frontend/src/components/public-home/home.css styles preset lists, the save form, delete confirmation, and status feedback.
- User-created presets use browser localStorage key travel-club-home-presets-v1; the active theme keeps using travel-club-home-style-v1.
