# Реализованный контракт 19 октября

- Шесть глав; MagazineSpread/RevealPhase/MagazineCover API сохранены.
- ReadingTurn({from,to,direction,onPrepared,onComplete}); createReadingTurn(host,source,target,direction,complete) возвращает disposer.
- Реальный mesh64×16/2210вершин,1000ms, source-static/target-pending текстуры, capture watchdog6s, supportedPCFShadowMap. Hidden clock и CSSleaf/shadow приостанавливаются; ресурсы освобождаются.
- Шесть индивидуальных редакционных пар,2.4–3.0s раскрытия; query1–6/nav/history динамические.
- 48/48 browser,119 unit,33 PNG,30 SHA256 unchanged; G4 PASS. Source push и post-push rebuild завершены.

Ниже сохранены рабочие и исторические контракты проходов.

# Границы текущего расширения

## Расширение 19 октября — ЕДИНСТВЕННЫЙ актуальный контракт

- Читать completion-spec.md; новая версия содержит6разворотов, прежний450ms/threechapter контракт ниже исторический. Зоны непересекаются.
- 07: app/test_11/page.tsx, magazine-experience.tsx, magazine.module.css, reading-turn* localhelpers, capture-page.ts еслинужно, introфайлы только при необходимойинтеграции, e2e/test-11-magazine.spec.ts. Настоящий curvedleaf, ориентир1000ms; reusable readonlytest7/deformation. Source виден покаcaptureготовится, destinationpendingдоexposure, окончаниеenter; noflash. WebGLtransient, noidlecanvas/rAF. Fallback/reduced/abort/history/resize/reentry safe.
- 08: data.ts, spreads.tsx, spreads.module.css, public/test_11 newassets/manifest/README, e2e/test-11-reveal.spec.ts. SPREADS первые3безизмененияназваний + {title:"China ’26"},{title:"Archive ’25"},{title:"Point of View + Start"}. Индексы0–5. Export MagazineCover,MagazineSpread({index,side?,animate?,reveal?}),RevealPhase static/pending/enter сохраняются. Новые3пары и разнообразные2.4–3.2srevealsвсех6, общийпечатныйритм. Основныеякорясразу, остальноеисходноhiddenизпервогоpaint. Side left/right поддерживаетсядлявсех6.
- 07используетSPREADS.length вместо3вquery/nav/history/status; 08неправитparent. 07неправитspreads/data/CSSредакции. ОбщийDOMhook data-magazine-page=left/right и data-reveal-object сохранять. При необходимостиизменитьконтракт сообщитьдругомуагенту/координатору доизменения.
- 09: e2e/test-11-visual.spec.ts, scripts/capture-test-11.mjs, docs/qa/test-11, componentREADME. После07/08 проверка12страниц3размера,6финальныхпар,midturn/intro,actualsource↔target/pending/enter, быстрыекоманды/history/fallback/reduced. Материалproduction3000 послеребилда.
- Толькокоординатор запускаетservers/build/Compose и gitcommit/push; агентытолькоизолированныеtests/evidenceвразныхoutputdirs,workers1. Dev3001 будетподняткоординатором; production3000покапринятаяпредыдущаяверсия.
- ДанныеChina26/Archive25/POV/Start братьreadonlytest8/concept-home.tsx и public-site/archive-data.ts. Не выдумыватьфакты/услуги/детали/новыедаты. Фототолькопроверенныелицензии и явнаяиллюстративность. Старыефайлы/маршруты/userdirty неприкосновенны,baselinecompletion-baseline.json. Не добавлятьdeps.


---

Исторические контракты предыдущих проходов:

# Границы, решённые в спецификации

## Итог доработки

- Текущий код: локальный intro-scene с read-only test_7 helpers/fast preset; пауза на настоящей маленькой обложке до активации,8декоративных листов, endpoint первого Hero. Повтор обложки сохраняет текущий индекс. Начальные reduced/capture/WebGL fallbacks также ждут активации.
- MagazineIntro({bookRef,frameRef,actionsRef,disabled,onComplete,onMoving}), IntroActions={open(),skip()}; reveal static/pending/enter. Пустая capture texture отклоняется по alpha, rootlogicalinset сбрасывается.
- 296b8ef редакция;32c91ea вступление;196d72d QA. 45 production checks,21 PNG,119 unit; endpoint ≤0.062px,canvas0.
- Нижние разделы о DOM hinge-only/автотаймере — исторический контракт первой итерации, заменённый текущей доработкой.


## Доработка 18 октября — актуальный контракт (заменяет прежние assumptions ниже)

- Прочитать `refinement-spec.md`. Новая постановка требует настоящую scene/timeline/deformation из test_8/test_7, distant paused cover, activation anywhere, multiple visual turns, Hero endpoint. Прежнее DOM hinge-only открытие снято пользователем. Не менять test_7/test_8/test_10/shared sources.
- `MagazineSpread({index,side?,animate?,reveal?})`, `reveal?: 'static'|'pending'|'enter'`, export `RevealPhase`. Default static (или прежний animate mapping для совместимости). `pending` с первого paint показывает только якорные элементы, deferred уже скрыты/замаскированы; `enter` finite keyframes из pending; `static` полная печатная версия. `MagazineCover()` и SPREADS прежние.
- Task04 владеет shell/parent/intro/capture/local scene и e2e/test-11-magazine.spec.ts. Он применяет pending к destination live странице И destination turning back до показа, static к уходящей. При окончании450ms переключает ту же target DOM в enter. Декоративный intro target snapshot/projected page также pending, затем enter после снятия scene. Direct/SSR не должны вспыхивать финальным контентом до hydration.
- Task05 владеет spreads.tsx/spreads.module.css/data.ts и e2e/test-11-reveal.spec.ts. Он реализует фазы, IA/type/icons/colors/micro-interactions. Parent менять нельзя; контрактные изменения согласовать с Task04 сообщением.
- Task06 владеет интеграционными screenshots/QA/docs. Только координатор запускает servers/production builds/Compose, все тесты в отдельных output dirs. Dev3001 стартует координатор; production3000 пока старая версия.
- Окружение shell: тёплый цветной oxblood/plum matte, убрать серую зернистость. Start button может быть прозрачной fullviewport поверхностью без видимых надписей; доступное имя/keyboard/focus обязателен. До click только distant cover+background; no automatic start. Repeated/early click безопасно, cover текстура текущая test_11.
- Новые библиотеки/assets/цены/факты не добавлять. Существующие пользовательские dirty файлы неприкосновенны. Baseline старых версий: `refinement-baseline.json`.

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| shell | stage, turn, history, book geometry, surrounding surface, cover opening | MagazineExperience({initialIndex,skipIntro}); MagazineCover render location | timers, physical movement, transition lock |
| editorial | real copy, SVG logo, photos, six page compositions, cover composition, finite reveals | MagazineSpread({index:number,side?:'left'|'right',animate?:boolean}); MagazineCover(); SPREADS | page layout and masks |

## Exact shared contract

- `frontend/src/components/test_11/spreads.tsx` exports `MagazineSpread({index,side,animate=false})`, `MagazineCover()`; side optional `'left'|'right'`. Spread returns the same two pages or one requested side as test_10. Cover fills the rectangular parent (one portrait page). CSS and image/text assets owned by editorial task.
- `data.ts` exports `SPREADS` with `title` for three nav labels, plus local content data as needed. Immutable external data only.
- Both page roots contain `data-magazine-page="left|right"`. All artwork always exists in final geometry; animate flag only triggers CSS reveals when true. Default false final static state (capture safe). Do not use fill animation whose base is hidden.
- Shell sets `animate={ready && !turn}` for live pages and false for turning copies. Remount/reveal semantics must be deterministic on every entry; false→true restarts finite CSS keyframes. Hero intro capture uses final static layout.
- Shell should finish its local opening with same first spread. It can capture cover DOM to texture to use with local scene fork; do not change any existing source. Cover can be revisited via small `Обложка` control; opening keeps user index on return.
- Data attributes test_10 semantics retained for tests: `data-stage`, `data-spread`, `data-turning`, `data-magazine-book`, `data-magazine-intro`.

## Project rules / commands

Next.js/React/TypeScript/CSS modules; existing TC Golos, TC Lora, SVG assets; no new dependencies. No user secrets. Do not edit anything outside task zone; ask coordinator for cross-zone changes. Existing unrelated dirty files and all other experiments remain untouched. Missing dependency → BLOCKED, do not install.

Windows: frontend cwd `npm.cmd run lint`; `npm.cmd run typecheck`; `npm.cmd test -- --run --testTimeout=15000`; `npm.cmd run build`. E2E `npm.cmd exec playwright test e2e/test-11-magazine.spec.ts -- --workers=1 --output=test-results/test-11-dev`. Default production3000; dev3001 if alive, coordinator owns servers. Build includes generated type routes; avoid concurrent builds. Run paths that exist; no secrets in output.

## Plan decision

T1, 3 tasks. Shell and editorial run together despite generic autopilot rule making task01 sequential: this is adaptation of an established working shell, no new foundation; exact imports/signatures are fixed above, zones disjoint. Neither modifies shared primitives or the other's files. UI shell can temporarily import test_10 spreads for smoke only then wire local exports after they land. QA follows both.

## Из тасков 01 и 02 — фактический контракт

- `MagazineExperience({ initialIndex, skipIntro })` owns cover/reading/turn/navigation. Opening uses actual DOM cover on a physical hinge with camera straightening, 1.6s hold and 1.4s opening; no WebGL or snapshot dependency. This is the local opening-composition option in spec.
- `MagazineIntro` receives physical cover/live page components through local imports; manual `Обложка` revisits cover and restores current article on open. Skip/manual open focus transfers after inert clears.
- MagazineSpread/MagazineCover/SPREADS exact exports delivered. Five local optimized Pexels WebP, three new selections and two reused local copies. All labelled illustrative; source metadata local.
- Global arrow handling ignores Alt/Ctrl/Meta. Tests reproduce focus/modifier red→green and check 450ms, history interruptions, queries, natural cover/revisit, runtime reduced, bounds/fallback.
- Editorial finite masks/text/strips run only data-reveal=true; default false static final layout. CSS reduced motion instant final; no idle animation loop.
