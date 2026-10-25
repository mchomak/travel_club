# Границы, решённые в спецификации

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| Pocket publication | Оригинальное содержание в новых 15 портретных композициях, статическая метаинформация | `PocketPage({page: number})`; `PAGES: readonly {number,title,chapter: number|null}[]`; `CHAPTERS: readonly {label,start,end}[]`; `PAGE_COUNT = 15`; `parsePageValues(value: string|string[]|undefined): number` | Внутреннюю типографику, фотоэффекты, геометрию и цвета. Число страницы публичное, 1-based. |
| Pocket reader | Текущий лист, history, scroll, фокус, contents dialog, жест/keyboard, направления переходов | `PocketReader({initialPage: number; initialQuery?: string})` | Состояния/обработчики взаимодействия. Рендерит ровно один `PocketPage`. |
| Route | Noindex metadata и SSR query | Default Next.js page по `/test_18` | Ожидание searchParams; передаёт результат parser reader-у. |

Изменение размещения parser: публичный parser принадлежит метаинформации publication, чтобы первый завершённый SSR reader и его progressive enhancement использовали одинаковую валидацию; поведение spec §3 неизменно.

## Правила проекта

- Рабочий каталог только `C:/Users/McHomak/Projects/travel_club/.worktrees/test-18-mobile-magazine`; branch `codex/test-18-mobile-magazine`, base `233ba99`.
- Next.js/React/TypeScript/CSS modules; без зависимостей, lockfile, env, backend и общей навигации. `npm.cmd` на Windows. `node_modules` уже установлен.
- Все старые маршруты/компоненты/shared styles/assets read-only. Новое только `frontend/src/app/test_18/`, `frontend/src/components/test_18/`, `frontend/e2e/test-18-magazine.spec.ts` и README этого компонента.
- Source: `frontend/src/components/test_13/{data.ts,spreads.tsx,spreads.module.css,editorial-symbol.tsx}`. Сохранять содержание, использовать существующие фото и SVG. Не импортировать MobileIssueSpread и CSS-сброс test_mobile.
- Publication metadata: `frontend/src/components/test_18/page-data.ts`; `PocketPage`: `pages.tsx` и `pages.module.css`; reader: `reader.tsx`, `reader.module.css`. Контракт не менять без сообщения родителю.
- Материал 1: обложка. Материал 2..15: source spread floor((page-2)/2), side left при чётном page и right при нечётном. Оглавление 02–03, 04–05, 06–07, 08–09, 10–11, 12–13, 14–15.
- `PocketPage` выводит один article с `data-pocket-page={page}`, доступным названием и одним `h1` с `data-reader-heading` и `tabIndex={-1}`. Никакой navigation state в publication.
- Авторство и исходные caveats должны остаться в том же материале. Иллюстративные фото и пустые портреты честны. Текст ≥16px, вторичные labels/captions ≥12px. Кнопки/ссылки ≥44px, композиционный текст/CTA не обрезать.
- Команды из frontend/: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run build`.
- Один unit: `npm.cmd test -- --run src/components/test_18/pages.test.tsx --testTimeout=15000`. Browser: `$env:PLAYWRIGHT_BASE_URL='http://localhost:3118'; npm.cmd exec playwright test e2e/test-18-magazine.spec.ts -- --workers=2`.
- Швы: реальный маршрут Playwright, статическая content/photo/link parity с исходными компонентами и parser query. Не создавать тесты приватных деталей.
- Если не хватает зависимости, верни BLOCKED; устанавливать самостоятельно нельзя.
- Родитель ведёт `.autopilot` и git-коммиты. Исполнители их не меняют, не коммитят и не отправляют наружу.

## Реализовано таском01

- Все15 PocketPage готовы. PAGE_COUNT/PAGES/CHAPTERS/parsePageValues находятся в page-data.ts; PocketPage в pages.tsx.
- Route SSR показывает один лист с native page/contents href, сохраняет сторонние query; reader02 заменяет только shell.
- Content/photo/link parity15листов, targeted2 passed; lint/typecheck passed.
- Photo letterforms — TC Golos background-clip:text с outline fallback, без крупного embedded mask.

- Таск02: optional initialQuery содержит сериализованные non-page query от SSR route для native href; default пустой. Это сохраняет исходный контракт вызова и чужие параметры до hydration.

## Реализовано таском02

- PocketReader({initialPage,initialQuery?}) owns history, page scroll, heading focus, printed modal contents, touch/keyboard and finite paper motion.
- NoJS uses real href and noscript contents. Local typography scales16to32px under200% text.
- Browser13passed in Linux production; Vitest163/39; lint/typecheck passed.
