# Границы

Один изолированный frontend surface. Контент владеет редакционными данными и theme tokens; страница владеет выбранным Issue и навигацией; форма владеет полями/validation/success и наружу отдаёт typed submit-adapter. Проверять поведение через браузер и public submit boundary. Реальное API — вне scope.

## Правила
Next.js 16 / React 19 / TypeScript. Существующие зависимости достаточны. Не менять globals.css, root layout, public-home, admin, backend, compose и package manifests. Только frontend/src/app/test, frontend/src/components/test, frontend/public/test и scoped e2e при необходимости. Все импорты/классы изолированы. Фото и WOFF2 локальные.

PowerShell: npm.cmd test, npm.cmd run lint, npm.cmd run typecheck, npm.cmd run build из frontend. Docker localhost:3000 — уже запущен; пересборка frontend необходима для новых assets. Результаты browser QA и README сохранять scoped. Никаких внешних публикаций и отправки контактов.

## Реализованные границы

- `data.ts`: `ProductId = "plan" | "turnkey" | "group"`; массивы `navigation`, `products`, `issues`, `principles`, `workflow`; `copy` и `images`. `Issue.theme` содержит `background`, `foreground`, `accent`, `muted`, `line`; `EditorialImage` содержит `src`, `alt`, `width`, `height`, необязательный `position`.
- `lead.ts`: `Lead = { product, destination, when, contact }`; `validateLead(Lead): LeadErrors`; `SubmitLead = (Lead) => Promise<{ kind: "demo" | "sent" }>`; `submitDemoLead` не вызывает сеть и не хранит данные.
- `LeadForm`: получает `product`, `onProductChange`, необязательный `submitLead`; владеет значениями и состояниями. `demo` честно сообщает отсутствие отправки, `sent` предназначен для будущего реального адаптера.
- `EditorialHome`: владеет выбранным выпуском и форматом; ссылки продуктов выбирают формат формы. Темы применяются только к архиву через CSS variables. Golos Text и Lora локальны; шрифтовые tokens заменяются в `.root` CSS Module.
- `test-home.spec.ts`: публичные пользовательские сценарии переключателя, формы и responsive; существующие финансовые и admin utilities не меняются.
