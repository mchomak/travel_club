# Таск 02 — editorial motion и полная проверка

Статус: blocked-by-01. Только после документированного PASS и baseline commit таска 01. Уровень T1; координатор передаёт этот таск свежему исполнителю после независимой проверки копии.

## Источник

Все live `R` манифеста. Таск 01 закрывает исходную копию; этот таск сохраняет её инварианты и реализует все шесть motion-приёмов, доступность, проверки и отчёт. Основное: brief §§4–16, spec §§3–15 и interfaces.md. Никаких дополнительных возможностей `A`.

## Работа

- Локально добавить REVEAL native заголовков clip/mask слева направо (480/620 ms ориентиры), CASCADE смысловых text-only групп (340 ms / 8 px / 90 ms шаг, 0.8–1.4 s), DRAW прежних правил (250/380 ms), короткий ICON MOTION Lucide, тихий HOVER/focus ссылок/CTA/продуктовых строк (150–250 ms), одну перемещаемую underline нижней навигации.
- Применить по карте всех семи глав spec §6. Сохранить нативный текст, все цены/URL/фото/логотип/палитру/метрики/композицию. Image-filled THAILAND и связанный с фото hero/NEXT можно оставить исходными с объяснением.
- Использовать уже существующие pending→enter/finish/introComplete; не менять engine/intro/photo timing/мasks/общие beats. Capture static/pending по исходному контракту; live new motion после onComplete. Ни второго navigation state, ни бесконечного loop/animation lock.
- Base/static видимы, enter finite backwards animations, fail-open; reduced motion сразу полный финал и при preference change. Сохранить focus/keyboard/history/unsupported/touch.
- Добавить отдельные TEST_13 browser tests и QA capture/результаты, не править старые. Проверить все 7 глав с ранними/средними/финальными кадрами; начало только после turn, отсутствие re-render повторов, replay на revisit, exact photo rules, intro unchanged, service heights, glyph clipping, nav/URLs/history/границы, fallback/reduced/no-animation/console/loading.
- Выполнить lint/typecheck/full Vitest/production build; targeted new TEST_13 Playwright + TEST_12 regression и уместные TEST_11/10. Использовать отдельный preview, чужие runtime не трогать. Protected SHA256/Git diff до/после, restored next-env.
- Обновить только новый TEST_13 README/interfaces и свои QA docs. Представить изменения координатору для независимого review/G4. Финальный commit после успешных релевантных проверок; не deploy/publish.

## Приёмка

Все spec §13 checks реально выполнены или конкретная недоступность честно отмечена; основной запрос выполнен без известного нарушения инвариантов. 0 изменённых старых frontend-файлов/shared/packages/assets. В отчёте карта эффектов, completion hook, reduced/fail-open, команды/результаты, protected evidence, ограничения/компромиссы. Существующая founder portrait заглушка не выдаётся за новую/решённую проблему.
