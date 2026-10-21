# Interfaces — TEST_13

## Граница работы

Ветка `codex/test-13`, worktree `C:/Users/McHomak/Projects/travel_club/.worktrees/test-13`, base `3a1dbf7`. Только новый маршрут `frontend/src/app/test_13/`, собственный каталог `frontend/src/components/test_13/`, новые TEST_13 проверки/scripts/evidence и документы этой работы. Все 424 ранее tracked frontend-файла защищены baseline SHA256 в `protected-hashes.json`. Генерируемый `frontend/next-env.d.ts` может быть временно изменён Next dev; восстановить исходный Git baseline перед сдачей. Никаких изменений старых версий/shared/package/env/backend.

Отдельный dev preview уже запущен координатором: `http://localhost:3113`. TEST_12 production control: `http://localhost:3013/test_12`; не перезапускать его. Для чистой parity сравнивать `/test_12` и `/test_13` на одном новом origin, одинаковом browser/viewport и после decode/окончания исходных reveal. Внутренние URL ссылок на `/start`, `/formats`, `/archive` и read-only assets сохраняются.

## Скопированные контракты

- `page.tsx`: noindex metadata, async `searchParams`, `spread=1…7`, невалидный/повторённый spread → 1 с сохранением прочих query.
- `MagazineExperience({ initialIndex: number, skipIntro: boolean })`: один index/turn/ready/reveal, history, keys, focus. DOM seams `data-testid=magazine-experience`, `data-stage`, `data-spread`, `data-turning`, `data-magazine-book`, semantic nav/buttons.
- `MagazineCover()` и `MagazineSpread({ index, side?, animate?, reveal? })`: index 0…6, side left/right, `RevealPhase = static | pending | enter`. Static печатный финал; временные source capture static и target capture pending сохраняются.
- `ReadingTurn({from,to,direction,landed,onPrepared,onLanded,onComplete})`: `onComplete` после landed + decode целевых img + 2 rAF. `finish()` снимает turn и выставляет enter/static. Это единственный существующий нужный триггер новых эффектов.
- `introComplete`: исходный finish вступления, после него новый enter. Intro, capture-page, intro-scene, reading-turn/engine не менять функционально.
- `data.ts`: `SPREADS`, `FORMATS`, `FOUNDER_PHOTOS`, `PHOTOS`, `ARCHIVE`, `PRINCIPLES` из control. Никакого нового текста/цены/фото; missing founder portraits остаются исходными placeholders.
- Existing library `lucide-react`: Route/Sparkles/Users/Compass/MapPin/ArrowUpRight. Новая библиотека не нужна.

## Правила motion

Новые finite animations применяются только к локальному enter; base/static видимы, pending не прячет новый текст навечно. Полный native текст, без character splitting. Новые text-only selectors не меняют фото-ancestors. Существующие фото data-beat и keyframes/delays/мasks не трогать. Старая система ink/rise текста может заменяться новой короткой cascade исключительно на text-only элементах.

Навигационный underline — derived geometry от существующего index/turn/ready, без второго индекса/state machine; ResizeObserver/scroll measurement event-driven, cleanup, CSS transition, reduced instant. До landing отображаемая source глава, после — destination. Важные controls доступны по исходному live/turn lock, не ждать secondary animation.

## Границы и швы (из spec §12)

Копия и motion выполняются последовательно, со свежим исполнителем после проверенного PASS копии; внутренних публичных библиотечных API не требуется. Существующие швы сохраняются:

| Модуль | Владеет | Выставляет | Прячет |
| --- | --- | --- | --- |
| Изолированный TEST_13 route | noindex metadata, server parser spread | Самостоятельный URL `/test_13` и существующий query contract | Локальные импорты новой версии |
| MagazineExperience | Единственные index/turn/ready/reveal, navigation/history/keys/focus | Те же события navigation; data-stage, data-spread, data-turning для браузера | Capture/intro lifecycle и новая измеряемая underline geometry |
| MagazineSpread | Четырнадцать исходных reading pages, cover, локальные motion annotations/CSS | `MagazineCover()`; `MagazineSpread({index, side?, animate?, reveal?})`; `RevealPhase = static | pending | enter` | Тайминги, masks текста, draw/hover/icon правила |
| Intro/ReadingTurn/Capture | Исходные сцена, текстуры, GPU и fallback/cleanup | Неизменённые props и callbacks; ReadingTurn.onComplete после handoff | Все исходные механика/тайминги/геометрия |
| Read-only ресурсы | Существующие fonts/tokens/assets/geometry | Прежние импорты и URL | Не изменяются этой работой |

Швы для проверки: существующий URL и semantic DOM (главы, nav buttons, data-stage/spread/turning, прямые чтение/intro), существующий экспорт spread для capture, SHA256/Git diff для изоляции. Новые data-motion markers разрешены только локально, чтобы детерминированно проверить timing и re-render без повторного запуска. Не создавать отдельный motion manager/state machine/framework.

## Проверенный baseline

Координатор: npm ci завершён; baseline Vitest 113/113, 26 files. `frontend/AGENTS.md` требует читать актуальную Next guide до code (координатор прочёл page guide); исполнитель читает относящуюся к своим изменениям документацию из установленного `node_modules/next/dist/docs/`. Это evidence baseline, не финальная проверка TEST_13.

## Из таска 01 — проверенная независимая копия

- Локальные route + 11 файлов TEST_13, runtime/data/CSS byte-identical до motion. Никакого импорта изменяемых TEST_12 модулей.
- MagazineCover(); MagazineSpread({index,side?,animate?,reveal?}); RevealPhase=static|pending|enter; публичные сигнатуры исходные.
- Preview http://localhost:3113; оба маршрута доступны.
- Evidence docs/qa/test-13/copy-baseline/results.json и pixel-comparison.json:14/14 pairs DOM/PNG equal,0pixels; intro/keyboard/turn/history/query/fallback PASS, errors0.
- 424 protected hashes совпадают, tracked frontend diff пуст; lint/typecheck pass; исходный Vitest113/26.
- Task01 manifest/spec и craft independent PASS. README наследует старый абзац проверки — заменить фактическими TEST_13 результатами в T02.

## Из таска02 — motion

- Публичные props/RevealPhase прежние; motion declarative и finite только на live enter после прежнегоfinish/onComplete.
- Spreads local CSS: native headingclip, text-onlycascade, pseudo separator draw, Lucideicon motion, hover/focus190ms.
- Navigationunderline: geometryderivedfrom existingindex/turn; event-drivenResizeObserver, no newnavigationstate/idleloop.
- Intro/capture/physicalturn/data and originalphotoCSSrules byteidenticaltocontrol.
- Reduced motion/static/capture finalvisible; nocharacter splitting, no photoparentcascade.
- Newtests frontend/e2e/test-13-motion.spec.ts; capture docs/qa/test-13/motion-capture.mjs; productionhttp://localhost:3114.
- Scopedfinalspec reviewPASS: Aboutnames/rolesorder, groupedchapter7CTAs, visiblehover+restunderline, reducedreset.
