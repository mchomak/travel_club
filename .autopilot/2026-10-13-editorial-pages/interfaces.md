# Границы, решённые в спецификации

Next.js 16 / React 19 / TS / CSS Modules, без новых зависимостей. Корень C:/Users/McHomak/Projects/travel_club. Windows: npm.cmd. Новые public файлы в frontend/src/components/public-site/, маршруты в route group frontend/src/app/(publication)/; группа не меняет URL. В group layout общая SiteShell. Root not-found.tsx сам оборачивается в SiteShell, не меняя RootLayout или globals.css.

BASE_TOKENS в components/design-system/tokens.ts — существующий immutable источник, импортировать без изменения. Пользовательские незакоммиченные изменения в playground-preview.tsx, playground-shell.tsx, playground.module.css неприкосновенны. Запрещены backend/admin/database/constructor, /test_4, Living Issue /test_5, homepage layout/copy/стили. В test_5 допускаются только href/navigation и ссылки документов, без изменения state/form и Field Notes content.

## Публичные сигнатуры после таска 01
- `createSiteVariables(tokens?: PlaygroundTokens): CSSProperties` — адаптирует BASE_TOKENS в primitives/semantic variables; central CSS resolves desktop/mobile роли. Допускает injection другого набора в tests.
- `SiteShell({children: ReactNode})` — scoped variables, header/footer/skip link, main id publication-main, data-publication-root. Страницы НЕ создают ещё один main/header/footer.
- `PageIntro({label:string, title:ReactNode, children?:ReactNode})` — semantic h1, short lead.
- `EditorialLabel({children:ReactNode})`, `CTA({href:string, children:ReactNode, secondary?:boolean})`.
- `EditorialImage({src:string, alt:string, caption?:string, ratio?:'landscape'|'portrait'|'square'|'hero', priority?:boolean})` — Next Image fill + фиксированный ratio из общих frame tokens.
- `LegalNavigation()`, `LegalDocument({title:string, kind:'privacy'|'personal-data'})`.
- CSS module `publication.module.css` для общего shell/type/form/detail layouts. Таски 02/03 используют свои CSS modules только для композиции: никаких font-size/family/color hardcode, роли через exported public type classes (в module 01) или центральные semantic vars. Созданные 01 CSS НЕ редактировать параллельно.

## Швы и проверки
Browser pages — основной шов для навигации, responsive typography propagation и forms. Contact validation использовать `validateLead` из components/test/lead.ts, новый backend не создавать. Архивные assets из test_4/test/test_2, считать иллюстративными; отдельные routes FIELD NOTE отсутствуют.

Команды из frontend: `npm.cmd run lint`; `npm.cmd run typecheck`; `npm.cmd test -- --run --testTimeout=15000`; `npm.cmd run build`; один Vitest файл `npm.cmd test -- src/path/file.test.tsx`; Playwright `npm.cmd exec playwright test e2e/publication.spec.ts -- --workers=3`. Сайт localhost:3000, preview rebuild из корня `docker compose up -d --no-deps --build --wait frontend`. Не запускайте concurrent builds, npm install, compose. Пропавшая dependency = BLOCKED, не добавлять.

Таски не меняют этот файл, state.js, AGENTS.md, не коммитят; возвращают короткий contract. Не читать .env или private data. Отправлять progress родителю, user commentary держит родитель.

## Shared API T01 (объявление исполнителя)
CSS module publication.module.css exports s.container, s.h1/h2/h3, s.lead/body/small/meta/caption/button, s.displayXL/displayL, s.muted/accent, s.textLink, s.actions, s.section, s.rule, s.columns, s.prose, s.field/control/fieldLabel/fieldHint/fieldError, s.buttonPrimary/buttonSecondary. Scoped prefix --pub (не --tc, чтобы Playground не затронуть): --pub-color-{kebab BASE color}, --pub-space-{xs,s,m,l,xl,2xl}, --pub-layout-{kebab layout}, --pub-type-{h1,h2,h3,lead,body,small,meta,caption,button,display-xl,display-l}-{size,family,weight,line-height,tracking}. Responsive size resolution централизованный. PageIntro/CTA/EditorialImage из primitives.tsx. Primitive serif/sans влияют на semantic font alias; все цвета основаны на BASE_TOKENS. Точный завершённый contract будет добавлен после return.

G2 завершён: независимый coverage-reader после поправок не обнаружил missing/half-covered/extras.

## Завершённый T01
Каждая page использует s.container на корневом div, не добавляет main. createSiteVariables с BASE sizes/colors/space/layout/frames. --pub-font-serif, --pub-font-sans; editorial alias --pub-font-editorial derived от BASE h3.family, semantic h1/h2/h3-family используют его. DOM propagation test может менять --pub-font-serif / --pub-type-h1-size / --pub-type-body-size / --pub-color-cloud на data-publication-root. Shared files finished, следующие таски не меняют их параллельно. T01 lint/typecheck pass, Vitest76/17files. Root 404 standard, thanks честный prototype.
