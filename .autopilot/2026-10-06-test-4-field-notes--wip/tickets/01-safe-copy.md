# 01 — Безопасная копия /test_2

Требования: R01–R06. Blocked by: нет. Зона: test_4 initial copy; qa baseline. Волна: 1.

Из брифа: «Сначала изучи /test_2 и сделай безопасную копию. Только после проверки, что /test_2 не изменился, начинай переработку /test_4».

Spec §1. Изучи исходную структуру, capture хеши всех tracked project files вне .autopilot (можно git ls-files + SHA256) и screenshots /test_2 1440×900, 1280×800,390×844 (reduced-motion для детерминированной visual baseline, плюс normal opening screenshot). Сохрани baseline в qa. Сделай локальные копии всех test_2 компонентов/стилей/data и app/test_4/page.tsx, заменив только import references test_2→test_4. Копировать immutable assets необязательно пока. Никакой переработки контента/дизайна на этом таске.

Приёмка:
- /test_4 открывается и визуально идентичен /test_2 на трёх размерах.
- Living Issue и navigation работают как исходник.
- Исходные /test_2 файлы и другие tracked project files имеют те же хеши.
- Отчёт qa/baseline.md с путями screenshots и digest check; copy files сравнить с оригиналами с учётом import substitutions.
- Typecheck проходит, исходные Vitest baseline зафиксированы.

Не менять backend/admin/shared/other routes/package. Если localhost3000 Docker и не видит копию, используй отдельный local next dev порт 3001 и capture baseline+copy из одного build. Не запускай пока rebuild на3000. Возвращай результат <=25 строк по executor contract. Не коммить.
