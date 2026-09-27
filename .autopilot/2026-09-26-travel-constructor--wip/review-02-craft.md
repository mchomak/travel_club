# T02 — Craft, первая проверка

Reviewer: `/root/foundation`, отдельный от авторов. Scope: изменения после `4ad56a2` в backend, shared fixtures и backend build configuration. Host и Docker pytest: 35 passed, frontend unit: 5 passed, browser: 3 passed; все проверки root повторил независимо.

**BLOCKING:** `backend/app/trips.py:246` — GET читает parent и дочерние строки разными SELECT без общего снимка. Изолированная гонка с PUT дала `version=2`, `participants=1`, `calculation.cost_total=100.00`, но `item.normalized_amount=200.00`; параллельный PUT вернул version3/participants2/cost200.00. Документ, preview и список должны отражать единую версию сохранённого агрегата. Требуется HTTP GET/PUT регрессия с независимыми PostgreSQL sessions. Reviewer воспроизвёл в своей временной schema и удалил её; product files не менял.

Repair 1 назначается автору T02. До устранения и независимого повторного review таск не коммитится.
