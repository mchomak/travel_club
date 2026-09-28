СДЕЛАНО: Все 27 критериев §34 сопоставлены с фактическими browser/API проверками в docs/acceptance.md.
СДЕЛАНО: Два замечания T01 воспроизведены красными тестами, исправлены, точечные тесты зелёные.
СДЕЛАНО: Playwright охватывает две страны/города, все семь формул, 5→9 людей, FX, preview, mobile.
СДЕЛАНО: Добавлены сценарии отказа сети/повтора, копии, архива, удаления и logout.
СДЕЛАНО: README переписан для текущего продукта; отдельная чистая БД успешно мигрирована и удалена.
СДЕЛАНО: Последний совместный backend pytest + Playwright прогон: 40 и 16 passed; unit 5, линтеры/types/build зелёные.
ФАЙЛЫ: backend/app/auth.py, backend/app/schemas.py, backend/tests/test_auth.py, backend/tests/test_pricing.py.
ФАЙЛЫ: backend/tests/test_trips.py, frontend/e2e/constructor.spec.ts, README.md, docs/acceptance.md.
РЕШЕНИЯ: DTO Calculation теперь требует все 4 groups и 9 by_type, как TypeScript Record.
РЕШЕНИЯ: Login после NFKC/strip/casefold проверяется до INSERT login_attempts и возвращает 422.
РЕШЕНИЯ: Backend test ищет собственный trip id в общем списке, потому что все администраторы видят все поездки.
ТУПИКИ: Параллельный pytest/Playwright ранее ломал test_trips из-за предположения о первой строке; исправлено, совместный прогон зелёный.
ТУПИКИ: Повтор полного compose build упирается в Docker Hub TLS handshake timeout на python:3.14-slim; backend build отдельно прошёл, образы/сервисы healthy.
ДАЛЬШЕ: Root проверяет diff/README/report и git diff --check; при доступном registry повторяет полный compose build/up без правки исходников.
ДАЛЬШЕ: После review root выполняет commit/обновляет state; исполнитель не коммитил и не менял state/interfaces.
