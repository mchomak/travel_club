# Границы, решённые в спецификации
Локальный test_5 владеет только новой homepage и opening. LivingIssue отвечает за timeline и измерение; EditorialHome сохраняет прежние content/style/state, при необходимости минимально выставляет hero seam. Test seams: браузерный route, scroll, hash, resize, media query и живой DOM hero. Существующий test_4 — readonly эталон.

# Общие правила
- Next 16/React 19/TypeScript/CSS modules. Windows: npm.cmd. Не добавлять dependencies.
- Только frontend/src/app/test_5, frontend/src/components/test_5 и новые test_5 tests; source routes/components readonly. Не менять package/lockfile, backend, shared assets.
- baseline copy прежде camera; дождаться сообщения root «baseline approved».
- Docker frontend обслуживает 3000. Допускается npm.cmd run dev -- --port 3001 для быстрой разработки; финальный Docker rebuild frontend на 3000.
- Проверки frontend: npm.cmd run lint, npm.cmd run typecheck, npm.cmd test -- --run, npm.cmd run build. Playwright: npm.cmd exec playwright test e2e/<file> -- --workers=1, PLAYWRIGHT_BASE_URL задаёт origin.
- Объективные browser QA и скриншоты сохранить в frontend/test-results (ignored). Хэши source до/после.
