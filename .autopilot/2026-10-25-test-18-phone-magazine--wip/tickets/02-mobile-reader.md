# 02 — Рабочее чтение на телефоне

**Требования:** R01, R02, R03, R04, R05, R06i, R07i
**Blocked by:** 01
**Зона:** `frontend/src/components/test_18/reader.tsx`, `reader.module.css`, route `/test_18`, `frontend/e2e/test-18-magazine.spec.ts`, component README; обоснованные mobile CSS исправления publication после browser evidence
**Волна:** 2
**Status:** ready

## Что должно заработать

Полный progressive reader поверх готового издания. Один лист, короткое бумажное перелистывание, печатное оглавление, история и положение чтения, удобные действия большими пальцами. Доказать пригодность на реальном HTTP preview в Chromium, не только чтением кода.

## Из брифа дословно

> «мобильную адаптацию более рабочей и удобной»
> «мне нужно выяснить насколько вообще реально адаптировать test_13 под моибльные устройства при этом сохранив концепцию жрунала»

## Спецификация

`spec.md`: §2, §3 целиком, §4, §5 целиком, §6. `interfaces.md` целиком, включая контракт готового таска01.

## Приёмка

- [ ] Обложка, нативные соседние href и viewport-safe нижние контроли. Все главы доступны в модальном печатном оглавлении с focus trap, Escape, current marker и возвратом к scroll/focus.
- [ ] Один source of truth page, валидные URL и Back/Forward; scroll по каждому листу сохраняется в текущей сессии, незнакомый лист сверху; при гидрации не перехватывать фокус.
- [ ] Keyboard навигация с исключениями; optional touch swipe с directional intent, интерактивными/selection/edge exclusions; native vertical scroll, не блокировать zoom. Быстрое листание не ломает состояние.
- [ ] Короткая конечная CSS-анимация бумаги; reduced motion мгновенен. Нет WebGL/canvas/idle-loop/таймеров, управляющих доступностью текста.
- [ ] SSR/no-JS навигация и noscript оглавление; один текущий article и доступный status/heading; безопасные query из01 используются повторно.
- [ ] Playwright покрывает все15 листов и7 глав на320×700/390×844, плюс430×932,320×568,844×390; фактические touch horizontal/vertical, history/direct invalid links, contents focus+scroll, быстрые переходы, reduced motion, 200% текста, noJS, отсутствие overflow/ошибок. Содержательный output, не скриншоты вместо assert.
- [ ] Визуально inspect все листы минимум390 и выборочно320/landscape; артефакты screenshot в ignored test-results. README фиксирует команды и ограничения физических устройств.
