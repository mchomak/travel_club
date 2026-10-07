# Манифест требований

Источник: `2026-10-06-brief.md`. Требования снимает только пользователь.

| ID | Из брифа | Статус | Основание | Где |
|---|---|---|---|---|
| R01 | «Нужно создать её отдельную копию: http://localhost:3000/test_4» | done | — | §1 | → T01 / 7fe6cb6
| R02 | «/test_2 визуально и функционально не менять вообще» | done | исходные хеши и screenshots | §1 | → T01 / 7fe6cb6
| R03 | «не менять /test, /test_3, / и остальные routes» | done | отдельный маршрут | §1 | → T01 / 7fe6cb6
| R04 | «не трогать admin, backend, API, PostgreSQL, auth» | done | — | §1 | → T01 / 7fe6cb6
| R05 | «не рефакторить общие компоненты» | done | локальная копия | §1 | → T01 / 7fe6cb6
| R06 | «Только после проверки, что /test_2 не изменился, начинай переработку /test_4» | done | блокирующая последовательность | §1 | → T01 / 7fe6cb6
| R07 | «Итоговый порядок» | in-ticket | 13 секций | §2 | → T02
| R08 | «Полностью УБЕРИ с главной секцию Memory / The Book» | in-ticket | без удаления оригинала | §2 | → T02
| R09 | «Hero, три продукта, форма, Point of View, Club, Process и финальный CTA максимально сохрани» | in-ticket | — | §2 | → T02
| R10 | «Сохрани текущую механику Living Issue» | in-ticket | копия rAF/CSS/reduced motion | §3 | → T02
| R11 | «FIELD NOTES / 2026 BEIJING → SHANGHAI 4 FRIENDS + 2 LOCAL FRIENDS IN BEIJING» | in-ticket | — | §3 | → T02
| R12 | «Сохрани текущий визуальный характер China palette» | in-ticket | — | §3 | → T02
| R13 | «После формы добавь короткий editorial intro» | in-ticket | заданный origin story | §4 | → T02
| R14 | «Обязательно визуально отдели: FIELD NOTES ... ISSUES» | in-ticket | терминология | §4 | → T02
| R15 | «Thailand ... САМЫЙ крупный travel-разворот» | in-ticket | первый и крупнее China | §5 | → T02
| R16 | «THAILAND ISLANDS → BANGKOK 2026 4 PEOPLE» | in-ticket | — | §5 | → T02
| R17 | «botanical / deep green; warm off-white; muted natural green» | in-ticket | выбранные цвета | §5 | → T02
| R18 | «Избегай ... tropical gradient ... neon ... palm-leaf cliché» | in-ticket | — | §5 | → T02
| R19 | «несколько фотографий разных форматов, metadata ... captions» | in-ticket | editorial spread | §5 | → T02
| R20 | «Второй большой разворот ... BEIJING → SHANGHAI» | in-ticket | China ’26 | §6 | → T02
| R21 | «graphite; deep/electric blue; cold off-white; silver / grey; night city» | in-ticket | — | §6 | → T02
| R22 | «Четверо прилетели из Москвы. Двое друзей ждали нас в Пекине» | in-ticket | без новых событий | §6 | → T02
| R23 | «CHINA / 2025 ... BEIJING → SHANGHAI → SUZHOU → SANYA ... 5 PEOPLE» | in-ticket | — | §7 | → T02
| R24 | «MADAGASCAR / 2025 ... 2 PEOPLE ... Не выдумывай города» | in-ticket | маршрут отсутствует | §7 | → T02
| R25 | «THAILAND / 2025 ... ISLANDS → BANGKOK ... SMALL COMPANY» | in-ticket | — | §7 | → T02
| R26 | «Не делай три одинаковые карточки ... примерно 3 фотографии» | in-ticket | три композиции | §7 | → T02
| R27 | «editorial diagram / travel trace» | in-ticket | dashed линия | §7 | → T02
| R28 | «координаты только если ... реально относятся» | in-ticket | координаты не добавляем | §7 | → T02
| R29 | «первый будущий официальный выпуск Travel Club» | in-ticket | NEXT ISSUE | §8 | → T02
| R30 | «НЕ редизайнь сайт заново ... typography ... current navigation ... motion» | in-ticket | существующий дизайн | §9 | → T02
| R31 | «База сайта остаётся преимущественно светлой» | in-ticket | локальный тёмный China | §9 | → T02
| R32 | «хорошие временные stock images» | in-ticket | локальные assets, источники | §10 | → T02
| R33 | «у КАЖДОГО фото ... стабильный frame» | in-ticket | единый aspect ratio | §10 | → T02
| R34 | «Каждый image slot ... стабильный уникальный ID» | in-ticket | отдельный ID для каждого использования | §10 | → T02
| R35 | «ПКМ ... custom context menu ... Заменить фото ... file picker» | in-ticket | — | §11 | → T03
| R36 | «JPG / PNG / WEBP» | in-ticket | type/decode validation | §11 | → T03
| R37 | «рамка ТОЧНО с aspect ratio ... drag reposition ... zoom ... Cancel ... Save» | in-ticket | — | §11 | → T03
| R38 | «После Save ... crop применяется ... layout не меняется» | in-ticket | canvas export | §11 | → T03
| R39 | «IndexedDB ... стабильному image slot ID ... после refresh ... сохраняться» | in-ticket | Blob persistence | §12 | → T03
| R40 | «Вернуть исходное фото ... Исходные stock assets остаются fallback» | in-ticket | — | §12 | → T03
| R41 | «ОДНУ небольшую ... библиотеку ... Blob/File ... достаточное качество» | in-ticket | react-easy-crop | §11 | → T03
| R42 | «Modal ... clean ... без лишних настроек» | in-ticket | только crop и zoom | §11 | → T03
| R43 | «ПКМ ... предотвращай ТОЛЬКО на ... фотографиях /test_4» | in-ticket | — | §11 | → T03
| R44 | «responsive ... Никаких layout shift ... сломанных grids» | in-ticket | — | §10 | → T02
| R45 | «НЕ добавляй ... российские поездки» | in-ticket | — | §13 | → T02
| R46 | «не создавать ложную историю бизнеса» | in-ticket | stock ≠ документальные фото | §13 | → T02
| R47 | «1440×900; laptop; 390×844 ... visual refinement pass» | in-ticket | Playwright screenshot QA | §14 | → T02
| R48 | «image crop modal ... сохранение ... reload» | in-ticket | browser tests | §14 | → T03
| R49 | «Build/typecheck/lint проходят» | in-ticket | плюс существующий Vitest | §14 | → T03
| R50 | «После выполнения коротко сообщи» | in-ticket | все перечисленные пункты | §15 | → T02

Самобрифинг: полный автомат. ASSUMPTION — фото иллюстрируют места/настроение, не изображают реальных участников; сохраняем demo-форму; локальный редактор доступен в тестовом route без изменения auth. Ошибки чтения/записи IndexedDB показываются понятно, исходник сохраняется как fallback.

## Обнаружено при интеграции

D01 → R33–R44: T02 использует editor T03, а T03 использует slot registry T02. Два отдельные rollback commits дают неполную интеграцию. Исполнители и ownership остаются отдельными, review проходит по каждому таску; готовый совместный код сохраняется одним проверенным рабочим коммитом. Safe copy T01 уже имеет отдельный rollback point.
