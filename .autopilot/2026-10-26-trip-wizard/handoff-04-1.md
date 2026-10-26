СДЕЛАНО: T02 concern воспроизведён: Enter открывал popup, но selection оставался null; после добавления selection handler rerender удалял popup и терял фокус.
MapCanvas исправлен: selection меняет aria-pressed/class на живых Leaflet marker, Enter и Space выбирают item; popup/фокус сохраняются.
Regression зелёный; основной T04 acceptance ещё не начат.
ФАЙЛЫ: frontend/src/components/trips/map-canvas.tsx — исправление selection-only update и клавиатурного выбора.
frontend/e2e/trip-map.spec.ts — browser regression для Enter, popup, focus и aria-pressed.
Единственный разрешённый новый файл autopilot — handoff-04-1.md; manifest/interfaces/state не менялись.
РЕШЕНИЯ: Для selection Leaflet layer не очищается; полный rebuild остаётся для changes nodes/geometries.
Для enter используется Leaflet keypress, Space открывает popup и выбирает marker через keydown.
Map provider стабилен только в тесте; auth/API/сохранение основного сценария обязаны оставаться реальными.
ТУПИКИ: Первые два browser прогона использовали старый production frontend до rebuild; их нельзя считать доказательством нового callback.
После rebuild промежуточный callback дал aria-pressed=true, но popup исчезал и focus терялся; последующий scoped fix прошёл.
Mouse-click сам не подтверждал focus retention; итоговая regression целится в клавиатурный сценарий.
ДАЛЬШЕ: Продолжить T04 из acceptance-04 сценария: 8-дневная поездка, random admin, реальная auth/API/PostgreSQL.
Проверить R62–R80, T03 stage navigation после сохранения формы, legacy null-offset editor, retry/delay/rapid navigation и DB-строки только по fixture IDs.
Затем clean isolated migration, полный backend pytest/Ruff, полный frontend suite/lint/typecheck/build, constructor+map+wizard Playwright, docs и acceptance-04.md.
