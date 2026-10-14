# Границы, решённые в спецификации

Вся feature — один связный исполнитель; публичная граница с сайтом — React children, ровно один EditorialHome. SceneController управляет clock/focus/dispose; DOM coordinator управляет lock/native flow/hash и принимает projected page quad из сцены. Математика camera/projection скрыта внутри новой версии; тестовый шов — DOM scene datasets (phase/focus/frames) и доступные UI/настоящий scroll. Root preset equality и projective corners допускают небольшие pure checks, без зеркалирования внутренностей.


## Правила
Next16/React19/TypeScript, Three0.186.1, CSS modules. Новых dependencies нет. Зона записи: frontend/src/{app,components}/test_7, frontend/e2e/test-7-handoff.spec.ts. Существующие test_5/test_6 и чужие dirty files не редактируются.
Preset: точная копия root test-6-settings.json внутри frontend, проверяемая сравнением.
Проверки из frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd exec playwright test e2e/test-7-handoff.spec.ts -- --workers=1. Docker из корня: docker compose up -d --no-deps --build --wait frontend.
Если зависимости не хватает, BLOCKED; ничего не устанавливать.

## Построено
- `MagazineHandoff({children:ReactNode})`: scene intro → ready → focus → native site; one existing EditorialHome/provider from test_5.
- `createScene(host,settings,report,failure,signal,project) → Promise<SceneController>`; `setFocus(0..1)` draws and reports projected world-page corners; `dispose()` owns all WebGL resources.
- `pageMatrix(width,height,corners) → CSS matrix3d string`; source sheet aspect2.32/2.9; live DOM behind transparent depth-tested shader mask, ShadowMaterial receiver above.
- preset.json is exact root snapshot for frontend-only Docker context; equality checked by e2e. Settings are not changed by this route.
- datasets stage/progress/pageCorners/sourceHeight and scene phase/count/frames are QA seams. Native-flow boundary occurs at1.25 viewport heights; startup explicit wheel/touch/key guard plus overflow restore.
- Earlier dirty files remain hash-identical. Devserver localhost3001, production Docker localhost3000. 94 unit tests; 10 new route scenarios passed dev; lint/typecheck passed.
