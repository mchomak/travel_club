# Границы, решённые в спецификации
Локальный test_5 владеет только новой homepage и opening. LivingIssue отвечает за timeline и измерение; EditorialHome сохраняет прежние content/style/state, при необходимости минимально выставляет hero seam. Test seams: браузерный route, scroll, hash, resize, media query и живой DOM hero. Существующий test_4 — readonly эталон.

# Общие правила
- Next 16/React 19/TypeScript/CSS modules. Windows: npm.cmd. Не добавлять dependencies.
- Только frontend/src/app/test_5, frontend/src/components/test_5 и новые test_5 tests; source routes/components readonly. Не менять package/lockfile, backend, shared assets.
- baseline copy прежде camera; дождаться сообщения root «baseline approved».
- Docker frontend обслуживает 3000. Допускается npm.cmd run dev -- --port 3001 для быстрой разработки; финальный Docker rebuild frontend на 3000.
- Проверки frontend: npm.cmd run lint, npm.cmd run typecheck, npm.cmd test -- --run, npm.cmd run build. Playwright: npm.cmd exec playwright test e2e/<file> -- --workers=1, PLAYWRIGHT_BASE_URL задаёт origin.
- Объективные browser QA и скриншоты сохранить в frontend/test-results (ignored). Хэши source до/после.

## Ticket01 baseline
- /test_5 cloned from /test_4, source unchanged187 SHA256 entries.
- IndexedDB travel-club-test-5-photos; same public assets.
- Baseline screenshots frontend/test-results/baseline-test-5: cover/spread/start pixel-identical3000/3001; full homepage pixel-identical same server3001.
- All Playwright runs use explicit --output=test-results/<run> to preserve baseline.
- Baseline collector opt-in CAPTURE_TEST_5_BASELINE=1, do not overwrite after camera.

## Ticket02 camera contract
- `LivingIssue({ children }: { children: ReactNode })` owns one live homepage DOM; the route passes `EditorialHome` inside its local `site` wrapper.
- `data-page-masthead` identifies the unchanged live masthead for measurement. No duplicate hero or shared source edit.
- Passive native scroll + rAF update CSS variables. Cached bounding boxes and ResizeObserver recalculate camera geometry; journey 1.25 viewports.
- `#start` prehydration :target CSS and initial layout effect bypass opening. Reduced motion opens the normal homepage directly. Camera completion removes inert before keyboard focus is transferred.
- Local IndexedDB and existing photo-editor state survive forward/reverse camera motion.
- Screenshot phases: `frontend/test-results/test-5-camera/`; responsive widths 1920, 1440, 1280, 768, 390, and 667 landscape.
