# Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| Главная страница | публичное содержание и секции | маршрут `/` | композицию секций |
| Мастерская стиля | настройки цветов и шрифта | CSS custom properties на корне главной | сохранение и валидацию |
| Цветовой круг | выбор оттенка и маркеры ролей | выбранный HEX для активной роли | перевод координат и цветов |

Существующий стек: Next.js 16, React 19, TypeScript, Tailwind. Изменения ограничить публичной главной и относящимися к ней стилями/ассетами. Проверки: `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`. Админку не менять. Ссылки используют существующие маршруты, не обещают ещё не запущенные поездки. T0: один сквозной исполнитель, без отдельных тасков.

## Построено

- `HomeExperience` обслуживает `/`; публичные заглушки остаются под `(public)/layout.tsx`.
- CSS роли главной: `--tc-background`, `--tc-text`, `--tc-primary`, `--tc-accent`, `--tc-surface`, `--tc-on-primary`, `--tc-on-accent`, `--tc-heading-font`, `--tc-body-font`.
- `Theme`, `restoreTheme`, `hexToHsv`, `hsvToHex`, `wheelMarkerPositions` определены в `frontend/src/components/public-home/theme.ts`; запись настроек — `localStorage`, ключ `travel-club-home-style-v1`.
- `ColorWheel` рисует спектр на canvas; пять точек по ролям обновляются при смене полей. Светлота управляется отдельным ползунком.
- Фотографии лежат в `frontend/public/images/`; `frontend/Dockerfile` копирует `public/` в runtime-образ.
