# 02 — Geoapify: защищённый поиск и расчёт

**Требования:** R04,R05,R06,R13,R14,R15,R18,R20,R23i,R24i,R25
**Blocked by:** 01
**Зона:** backend maps module/routes/config/main and maps tests; .env.example, compose.yaml, compose.deploy.yaml; docs/geoapify-setup.md, ADR provider
**Волна:** 2
**Status:** done — backend102/maps43, Ruff/Compose green; Manifest/Spec/Craft blocking нет.

## Результат
Аутентифицированный API получает карту runtime, ищет и уточняет места, безопасно читает Maps URLs, рассчитывает три режима Geoapify. При пустых ключах поддерживает честную настройку и offline URL parsing.

## Из брифа
«давай Geoapify»; «временм пешком, на машине и на транспорте»; «напиши как его настроить и какие данные тебе предоставить».

## Спецификация
spec.md §2 Google links; §3 Расчёты (API); §5 config+R25 setup; §6 verification. interfaces.md exact endpoint shapes.

## Приёмка
- [ ] Protected /maps/config/search/reverse/resolve-link/route implemented with exact DTO shapes; server key never returned/logged/errors.
- [ ] Geoapify httpx calls bounded timeout/result counts/geometry; drive/walk/transit converted to distance_m,duration_s,LineString. No data/timeouts/429/malformed results controlled; unconfigured status503 search/routing with normal manual place features still possible.
- [ ] Google link resolver detects selected coordinates/query text, excludes viewport center, handles allowed short redirects with SSRF protection and response size bounds. Unsupported opaque IDs show fallback query/no place, no false point.
- [ ] Tests for auth, no keys, provider success/errors/route modes and malicious URLs, no real credentials or external test calls.
- [ ] Empty env names pass through local/deploy Compose at runtime; no frontend rebuild key coupling; setup doc has exact env/create keys/restart/check steps and attribution/quota/transit limits.
- [ ] Keep schemas aggregate changes minimal and coordinate if new DTOs needed. No frontend modifications.
