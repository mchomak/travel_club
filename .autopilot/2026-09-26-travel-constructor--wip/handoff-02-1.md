СДЕЛАНО: Pricing + CRUD aggregate готовы; pytest 12 passed (было7), Ruff PASS. Backend routes все /api/trips. Ещё не DONE.
ФАЙЛЫ: backend/app/pricing.py, backend/app/trips.py, backend/app/main.py; backend/tests/test_pricing.py, backend/tests/test_trips.py; shared/pricing-vectors.json.
СДЕЛАНО: 20 shared cases всех формул, 5/9 composite, FX midpoint, hotel tiny clamp .02/4 .03/5; day распределение и schema/domain invalid checks.
СДЕЛАНО: PostgreSQL CRUD/reopen/duplicate/archive/delete/preview, sequential stale409, shrink409/confirm, omitted/cleared day bypass, ownership/FX rejection и all endpoints401.
РЕШЕНИЯ: Decimal precision50; money2 HALF_UP; margin4. Для hotel tiny shares принятый D01 clamp. Other inactive fields не влияют.
РЕШЕНИЯ: parent row SELECT FOR UPDATE; normalized child tables заменяются атомарно в порядке item→day→rate, новые IDs копии. Snapshots server-owned.
РЕШЕНИЯ: omitted persisted in-range days сохраняются; persisted removed content защищается независимо от payload. Hotel outside range никогда автоматически не режется.
РЕШЕНИЯ: FX new base full rates payload считается явным вводом; T03 очищает foreign rates; orchestrator согласовал, wire flag не добавляется.
ТУПИКИ: ORM Numeric до refresh имел неконстантное число decimal digits, db.refresh перед document устранил reopen mismatch.
ТУПИКИ: increment_version до calculate оставлял dirty ORM после422 в shared test session; теперь инкремент после successful calculate.
ДАЛЬШЕ: concurrent version HTTP/PostgreSQL test двумя независимыми sessions; persisted recalculation people/rates/mode/date, hotel outside boundaries и item move/order дополнительные API проверки.
ДАЛЬШЕ: validation_error main.py generic Russian message, но details от Pydantic могут быть English — критерий Russian errors требует mapping. Review возможных bounds (исходные schema сохранены).
ДАЛЬШЕ: Docker rebuild backend начат session80455; pip DNS files.pythonhosted.org intermittent. Он ещё running, родитель может poll; build взял исходники до последних мелких фиксов, нужен final refresh/rebuild.
ДАЛЬШЕ: после Docker готовности уведомить /root/trip_frontend для smoke (local3001 конфликтует с ALLOWED_ORIGIN3000), final Ruff/pytest; независимый review и commit делает root.
ПРИЧИНА HANDOFF: достигнут обязательный потолок50 операций executor.md, ближайшая зелёная граница; DB fixture data rollback, no migrations/schema/TS/commits touched.
