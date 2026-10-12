# Публичная редакция Travel Club

Основные маршруты — `frontend/src/app/(publication)/{formats,archive,start,thanks,legal,privacy,personal-data}/page.tsx`. Route group не меняет URL. `layout.tsx` использует один `SiteShell`, который создаёт header, skip link, `main#publication-main` и footer. Страницы внутри группы не добавляют собственные main/header/footer. Главная остаётся `/test_5`. Стандартная неизвестная страница — `frontend/src/app/not-found.tsx`, с отдельной обёрткой SiteShell.

## Общая система

Источник истины — неизменяемый `frontend/src/components/design-system/tokens.ts`, экспорт `BASE_TOKENS`. `site-tokens.ts` экспортирует `createSiteVariables(tokens?: PlaygroundTokens): CSSProperties` и переводит цвета, семьи/роли type, spacing, layout и frame ratios в локальные CSS variables. Переменные применены только к `[data-publication-root]`; Playground drafts не читаются и не применяются. `fonts.css` подключает уже существующие self-hosted Golos/Lora из `frontend/public/test/fonts/`.

Устройство: primitive `--pub-font-sans`, `--pub-font-serif`, `--pub-color-*`, `--pub-space-*`, `--pub-layout-*`; responsive semantic `--pub-type-{role}-{size,family,weight,line-height,tracking}`. Роли: h1/h2/h3/lead/body/small/meta/caption/button/display-xl/display-l. Размеры в rem, desktop fluid clamp интерполирует mobile390 → desktop1440; на ширине до 760px включаются mobile sizes. Центральные aliases в `.root` из `publication.module.css`: editorial font для h1/h2/h3; Cloud как фон; Blue как accent; metadata не менее .75rem; компактный h1 до 359px. Изменять semantic styling только здесь/в adapter, не копировать значения в CSS отдельных страниц. Page-specific overrides пока не нужны: `page-tokens.css` отсутствует.

## Reusable API

`primitives.tsx`: `EditorialLabel({children})`, `PageIntro({label,title,children?})`, `CTA({href,children,secondary?})`, `EditorialImage({src,alt,caption?,ratio?,priority?})`. Image ratios: landscape/portrait/square/hero из BASE; Next Image fill, object-fit cover, фиксированный размер кадра. `legal-document.tsx`: `LegalNavigation()`, `LegalDocument({title,kind:'privacy'|'personal-data'})`.

Общие CSS classes: `container`, `h1/h2/h3`, `displayXL/displayL`, `lead/body/small/meta/caption/button`, `muted/accent`, `textLink`, `actions`, `section/rule/columns/prose`, `field/control/fieldLabel/fieldHint/fieldError`, `buttonPrimary/buttonSecondary`. Дополнительные CSS страниц задают только композицию с этими semantic variables/classes. Не импортировать public CSS в RootLayout/globals.css.

## Честные placeholders

`/legal` содержит только реальные ссылки на `/privacy` и `/personal-data`; оферта, реквизиты, договор, оплата и возврат отмечены как будущие документы без ссылок. Privacy/personal-data — планы разделов со статусом «Документ находится в подготовке. Не является действующим документом». Утверждённого правового текста и сведений об операторе нет, они не выдуманы. `/thanks` подтверждает завершение демонстрации и отсутствие отправки/сохранения. Фотографии архива иллюстративные, detail routes для Field Notes отсутствуют.

## Проверка

Из `frontend/`: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test -- --run --testTimeout=15000`, `npm.cmd run build`. Production browser проверки запускает оркестратор после единственной сборки frontend; не запускать concurrent build/Compose. Визуальная проверка/propagation проводится по реальным DOM ролям, а не сравнением adapter с самим собой.
