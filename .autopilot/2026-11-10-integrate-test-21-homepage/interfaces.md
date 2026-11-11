# Границы, решённые в спецификации

## Продуктовые границы

- `TestTwentyOneExperience` — один общий route-level компонент, который соединяет существующие `ConceptHome` и `ImageEditorProvider`. Он используется корневой страницей и `/test_21`, не добавляет DOM-узел и не владеет содержимым или состоянием самой главной.
- `SiteHeader` — единственная React-реализация Header. Её используют `ConceptHome` и `SiteShell`; она отвечает за разметку меню, language picker и существующие стили `/test_21`.
- `PUBLIC_NAVIGATION_LINKS` — один readonly-массив основных адресов и подписей; его читают `SiteHeader` и оба Footer. Содержимое отдельных Footer остаётся локальным.
- `SiteShell` продолжает владеть оболочкой редакционных страниц: skip link, `main#publication-main`, Footer и адаптером publication-токенов. Корневая страница не оборачивается в `SiteShell`.
- Metadata остаются на route entry points: корень индексируем и каноничен на `/`; `/test_21` сохраняет `noindex, nofollow` без canonical.

## Согласованный контракт меню

| label | href |
|---|---|
| Услуги | `/formats` |
| О нас | `/#point-of-view` |
| Архив | `/archive` |
| Начать поездку | `/start` |

Header сохраняет CSS и поведение навигации `/test_21`. В `ConceptHome` его предок уже несёт `data-editorial-home="test-21"`; в `SiteShell` этот маркер задаётся самому `<header>`, чтобы активировать те же централизованные `--tc-*` токены без изменения их источника и без внешнего DOM-wrapper. Адреса CTA на `/formats`, `/archive`, `/start` и завершение `/thanks` остаются в своих текущих компонентах.

## Ограничения для исполнителей

- Проект: Next.js 16.3.6, React 19.3, TypeScript, Tailwind 4.3; frontend лежит в `frontend/`.
- Команды: из `frontend/` — `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run build`; Playwright запускается через `npm.cmd exec playwright test <files> -- --workers=3` при работающем сайте и Chromium.
- Не менять `/test_20`, дизайн-систему, тексты/композицию главной кроме необходимых адресов, другие тестовые маршруты, реальную обработку заявок и глобальные SEO-настройки. Не удалять legacy-файлы. Не добавлять анимации, страницы или зависимости.
- Существующий language picker меняет выбранную метку, но не переводит страницы; сохранять текущее поведение и не реализовывать перевод.
- Если обнаружится отсутствующая зависимость, вернуть `BLOCKED` с командой, которая её требует. Самостоятельно не устанавливать.

## Test seams

- Unit: DOM-ссылки и сохранённое поведение `SiteHeader` через публичный компонент.
- Browser: App Router entry points, metadata, переходы, форматные query-параметры, прежние `/test_*` маршруты и отсутствие горизонтального overflow на 375, 768, 1280 и 1440 px.

## From task 02 ? Root route reuse

- `TestTwentyOneExperience() -> JSX.Element` composes the existing `ConceptHome` and `ImageEditorProvider`; both `/` and `/test_21` use it.
- `testTwentyOneMetadata: Metadata` shares the home title and description. `/` is indexable and canonical at `/`; `/test_21` remains noindex/nofollow without canonical.

## From task 01 ? Shared public navigation

- `PUBLIC_NAVIGATION_LINKS` is exported from server-safe `public-navigation.ts` and used by `SiteHeader` and both Footers.
- `SiteHeader({ applyEditorialTokens?: boolean })` is used by `ConceptHome` and `SiteShell`; only `SiteShell` enables the header marker because the ConceptHome ancestor already activates the same tokens.
- The two Footers retain their local composition while consuming the shared public destinations.
