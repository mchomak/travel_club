# 04 — Карта, редактор мест и сравнение маршрутов

**Требования:** R01,R02,R03,R04,R05,R06,R07,R08,R09,R10,R11,R12,R13,R14,R15,R16,R17,R18,R20,R21,R23i
**Blocked by:** 01,02,03
**Зона:** frontend trips UI (item-form, trip-editor, new map/location components and module CSS), frontend maps API client/hooks, package.json/package-lock.json, UI tests
**Волна:** 3
**Status:** done — реализация, repair1(stale link), repair2(resize fit) приняты Manifest/Spec/Craft; root frontend119/lint/typecheck green, fresh production image healthy. Browser QA — таск05.

## Результат
Полный локальный пользовательский путь: указать место → сохранить → выбрать день → увидеть карту/начало/конец → сравнить режимы под картой → выбрать способ для каждого участка → снова открыть поездку без потерь.

## Из брифа
«выбриаешь день и снизу под календарем карта»; «и под картой подробнее расписано из точки A до точки Б»; «оба способа»; «пиши код пока локально».

## Спецификация
spec.md §1–§5 UI portions, domain/service interfaces in interfaces.md. Existing admin design tokens and DraftSession.

## Приёмка
- [ ] Section directly after calendar with selected date, boundary explanations/ambiguous candidate choices/manual overrides+reset, markers/popups/fitted bounds and all chosen route geometries; below map detailed A→B cards/three mode comparisons/day total with partial labels.
- [ ] Reusable LocationPicker in ItemForm for venue/start+end (end available even nontransport overnight) and boundary manual override. Search with debounce, link parse/confirm, choose/move map pin and keyboard/manual coords. Preserve legacy location/external_url fields. No-API keys still accepts coords and supported links.
- [ ] Timed order from domain; untimed up/down updates position and saves; mode per leg and all manual selections use existing change/autosave.
- [ ] Leaflet stable dependency allowed, browser-only lazy lifecycle, correct CSS/icon assets, clickable/drag pin, resize and clean unmount. Runtime config key from API; no secret backend key in browser. Attribution always visible.
- [ ] Limited concurrency/session cache per coords+mode, errors/retry, zero/missing distinction, transit approximate+no guaranteed schedule, stale responses ignored on day/location changes. No duplicate fetch per render, rapid change doesn't show previous day's results.
- [ ] Unconfigured/config loading/empty/invalid/network/unsupported link states usable, selected and typed values retained after error, mobile320/390/Desktop sane, accessible labels and keyboard actions.
- [ ] RTL/Vitest verify form location preserved, section below calendar/day selection, mode/boundary updates, unavailable state; render mocks only in tests.

Implementation notes: Leaflet text popups accept HTML strings, so user/provider labels must be rendered via safe DOM textContent or equivalent escaping, never interpolated HTML. For raster tile requests configure crossOrigin='anonymous' (Origin restriction support) and a suitable referrerPolicy to preserve provider referrer validation; test generated tile image attributes. Avoid nested modal focus traps: location editing can be an inline fieldset in the current drawer. Day totals describe calculated local connections; scheduled flight/train duration can be shown separately, never a road-distance substitute.
