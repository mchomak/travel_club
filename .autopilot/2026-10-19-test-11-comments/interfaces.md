# Границы

- Локальный `/test_11`, Next.js / React / TypeScript / CSS modules. API MagazineSpread и reveal static/pending/enter сохраняются.
- data.ts: PHOTOS и FORMATS/PRINCIPLES. Фото hero и Thailand должны иметь отдельные ключи: не подменять coast (cover) и nature (archive).
- spans внутри .heroSlogan сохраняют пригодность к существующим reveal-тестам; адаптировать CSS при смене композиции.
- Трогать только явно назначенные файлы. Не перезаписывать существующие dirty edits. Не делать git add/commit/push: этим владеет root.
- Команды: frontend/npm.cmd run lint, npm.cmd run typecheck, npm.cmd test -- --run --testTimeout=15000; браузер: npm.cmd exec playwright test e2e/test-11-*.spec.ts -- --workers=1.
- Общий .autopilot/state.js и dashboard.html принадлежат отдельной активной работе Research. Наши инструменты локальны в этом каталоге.
