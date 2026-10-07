# 02 — FIELD NOTES, travel spreads и новая структура

Требования: R07–R34,R44–R47,R50. Blocked by: 01. Зона: copied test_4 route/TSX/CSS/data/photo-slots/public assets. Волна: 2.

Из брифа: «НЕ редизайнь сайт заново»; «Thailand ... САМЫЙ крупный travel-разворот»; «Не делай три одинаковые карточки»; «Каждый image slot ... стабильный уникальный ID».

Spec §2–§10,§13–§15. Реализуй всю описанную структуру и честный контент из этих разделов. Максимально сохрани Hero/products/form/POV/Club/Process/CTA. Local Living Issue content China26, palette China, mechanic неизменна. После формы короткий origin/терминология, Thailand первый/крупнейший botanical spread, China второй dark, три различные archive route stories с dashed trace и по3 фото, NEXT ISSUE будущий официальный. Memory и ссылки убрать только локально. Не выдумывать поездки/события.

Создай photo-slots.ts — все rendered editorial изображения включая Living Issue имеют уникальные ID и ratio, fallback src/alt/position. Используй EditableImage контракт из interfaces; его реализацию пишет T03 параллельно. Оберни страницу ImageEditorProvider (он экспортируется из image-editor.tsx). Меню/поля формы не менять кроме якорей. Все фото стабильные по ratio в desktop/mobile, overflow hidden/cover. Найди хорошие stock фото Thailand/Madagascar/Beijing через primary photo pages/direct источники, скачай локально в public/test_4 и опиши авторство/источники/license. Stock — временные иллюстрации, не реальные участники. Существующие China фото можно читать/скопировать.

Приёмка:
- Все секции в нужном порядке, данные точные, короткая copy.
- Thailand больше China, преимущественно светлая страница, continuity исходного дизайна.
- Каждый Photo/Image заменён EditableImage уникального слота; stable ratio на all breakpoint.
- На1440/1280/390 нет overflow, screenshots и хотя бы один реальный visual refinement pass после просмотра.
- Slots и source manifest готовы для ручной замены фото.
- README test_4 описывает где copy/photos/цвета/editor.
- Lint/typecheck проходят после интеграции T03, existing tests не ломаются.

Запрещено менять editor implementation/package/e2e editor tests/other routes/shared styles. Обсуждай interface несовпадения сообщением primary. Можно local editorial e2e отдельным файлом. Не коммить. Верни <=25 строк contract.
