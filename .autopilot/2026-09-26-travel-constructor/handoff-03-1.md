СДЕЛАНО: T03 list/new/editor/preview, 9 типов/7 формул, дни/notes/time/move/reorder/general, FX, pricing, autosave/version/date confirmation реализованы на настоящем API.
СДЕЛАНО: decimal.js Calculation соответствует всем текущим shared vectors; HALF_UP2 money, HALF_UP4 margin, нормативный неотрицательный hotel remainder.
СДЕЛАНО: npm test 5 passed (было 1), ESLint/typecheck green, npm build и Docker build green; frontend контейнер обновлён на localhost:3000.
СДЕЛАНО: Playwright 3 passed (было 2), финальный shell exit0; созданные каждым запуском random fixture users/trips удалены.
СДЕЛАНО: browser9статей/7режимов даёт335174→402208.80 markup20 и418967.50 margin20; reopening/nighttime/client notes3levels/redaction/mobile390/no pageerror.
ФАЙЛЫ: frontend/src/lib/{pricing,draft-session,trips,trip-ui}.ts и tests; frontend/src/test-fixtures.ts.
ФАЙЛЫ: frontend/src/components/trips/*; frontend/src/app/admin/(private)/trips/*; layout.tsx; globals.css; logout-button.tsx; frontend/e2e/constructor.spec.ts.
ФАЙЛЫ: frontend/test-results/constructor-desktop.png и constructor-mobile-form.png просмотрены (ignored test artifacts).
РЕШЕНИЯ: TripInput allowlist strips ItemDocument snapshots; DraftSession сериализует requests и сохраняет ввод поверх late response; retry после ошибки сохраняет draft.
РЕШЕНИЯ: dates payload retains old days/items; backend owns normalization/confirmation; base currency change drops rates; unknown FX blocks local total/autosave.
РЕШЕНИЯ: preview query получает только safe DTO; Radix modal focus trap+explicit return focus; Field htmlFor/aria-describedby отделяет label от select options.
ТУПИКИ: static JSON imports shared ломали Docker frontend-only context; test-fixtures fs loader читает общий файл только в Vitest runtime. nullable RHF null→0 исправлен.
ДАЛЬШЕ: в trip-editor.tsx saved parity mismatch должен всегда показывать document.calculation при !dirty; сейчас calculation ветка выбирает local estimate при mismatch.
ДАЛЬШЕ: улучшить date error UX списком удаляемых дат и явным возвратом прежнего диапазона при hotel-out-of-range; проверить reload conflict без двойного beforeunload.
ДАЛЬШЕ: T04 независимые network/conflict/date-shrink/duplicate/reorder/move/security браузерные сценарии; executor остановлен по лимиту вызовов на зелёном шве, no commits.
