СДЕЛАНО: Все локальные browser-критерии task05 выполнены; final combined 29 passed, 1.4 min, exit 0.
СДЕЛАНО: 7 maps + 22 constructor; настоящий Leaflet, auth, PostgreSQL, persistence, overnight, hotels, order, errors.
СДЕЛАНО: На 1440/390/320 нет document overflow, markers внутри bounds; initial mobile 390/320 и pageerror проверены.
ФАЙЛЫ: frontend/e2e/trip-map.spec.ts готов; frontend/e2e/constructor.spec.ts содержит одно уточнение exact label.
ФАЙЛЫ: docs/qa/trip-day-maps/README.md и 7 PNG готовы с результатами, ограничениями и командами.
РЕШЕНИЯ: Только картографические HTTP fixtures внутри tests; backend CRUD/auth и Leaflet DOM настоящие.
РЕШЕНИЯ: Тестовый login имеет 9 символов m<8hex>; app header не изменён, long login overflow описан в QA.
РЕШЕНИЯ: Resize fix автора04 reviewed/committed 9ddd172; production Compose пересобран с ним.
ТУПИКИ: 15 символов hex login давали 321 px; исходный длинный fixture — 367 px; проблема шапки вне maps scope.
ТУПИКИ: Tile error нельзя искать через весь section text: скрытые boundary pickers тоже имеют ошибки; scope выбранной карты.
ТУПИКИ: Backend items order не гарантирован; fixtures находятся по уникальным title, nullable DTO сравнивается частично.
ДАЛЬШЕ: Только root Spec + Craft review / commit; новые acceptance критерии начинать не нужно.
ДАЛЬШЕ: Live Geoapify quality, keys, origins, egress, квоты и phone performance не проверены; setup и ADR согласованы.
ПРОВЕРКИ: Compose build healthy; e2e ESLint/typecheck exit 0; root frontend119/26 и lint, backend106/maps47 и Ruff green.
ПЕРЕДАЧА: Достигнут порог 50 calls; остановлено на зелёном прогоне без новых критериев, Docker свободен.
