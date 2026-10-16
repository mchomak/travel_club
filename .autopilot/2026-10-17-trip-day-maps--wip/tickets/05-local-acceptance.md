# 05 — Локальная интеграция и браузерная приёмка

**Требования:** R01,R02,R03,R04,R05,R06,R07,R08,R09,R10,R11,R12,R13,R14,R15,R16,R17,R18,R19i,R20,R21,R23i,R24i,R25
**Blocked by:** 04
**Зона:** frontend/e2e/trip-map.spec.ts and targeted integration fixes coordinated with original authors; docs QA/setup/ADR only
**Волна:** 4
**Status:** ready

## Результат
Тестами подтверждён реальный локальный save/reopen/duplicate и карта с контролируемыми provider fixtures, migration и regression checks. Понятно, что готово локально и что ждёт ключей/серверных данных.

## Из брифа
«пиши код пока локально, потом дам тебе данные сервера для деплоя и тестов»; «все спецификации у тебя уже есть».

## Приёмка
- [ ] Local PostgreSQL+backend+production frontend run in Compose; no deploy or business data deletion. Isolated test users/trips cleaned only by own fixture.
- [ ] Authenticated browser tests create mapped events and boundaries, switch day and mode, see map markers+route and detailed cards below it, save/reopen/duplicate no loss; missing location breaks path; unconfigured/429/error honest; short URL/search/pin verified deterministically with external API routes intercepted only in tests.
- [ ] At least overnight arrival vs hotel, hotel change/ambiguous manual choice, chosen end/reset and untimed order covered through public UI or API+UI path; responsive 390/320 and desktop, screenshots and no runtime errors.
- [ ] Whole backend/frontend checks, relevant constructor regression, clean migration+existing upgrade verify. Return exact commands/counts/limits; absent real keys/live Geoapify test explicitly not passed.
- [ ] Setup/QA docs and ADR agree with shipped shapes/env names; no exposed key in screenshots/files. No unrelated public site edits, no pushed/deployed code.
