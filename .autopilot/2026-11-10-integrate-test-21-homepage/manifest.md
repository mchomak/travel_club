# Manifest требований

Источник: `2026-11-10-brief.md`. Требование может снять только пользователь.

| ID | Из брифа (дословно) | Статус | Основание | Где |
|---|---|---|---|---|
| R01 | «Изучи текущую реализацию `/`, `/test_21` и связанных публичных страниц.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R02 | «Найди компонент, который непосредственно отвечает за отображение `/test_21`.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R03 | «Изучи существующую публичную навигацию, `SiteShell`, Layout и маршрутизацию.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R04 | «Проверь, как подключена централизованная дизайн-система.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R05 | «Изучи зависимости старой главной и компонентов, которые она использует.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R06 | «Проверь Git status и сохрани все существующие незакоммиченные изменения.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R07 | «Следуй существующим инструкциям `AGENTS.md` и workflow проекта.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §6 |
| R08 | «Сделай так, чтобы при открытии `/` пользователь видел ту же страницу, что и при открытии `/test_21`.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R09 | «Предпочтительный способ — повторно использовать существующий компонент `/test_21` через `page.tsx` корневого маршрута.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R10 | «Не нужно физически копировать весь код страницы или создавать вторую независимую реализацию.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R11 | «Все стили и компоненты продолжают использовать централизованную дизайн-систему.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R12 | «Сохраняются существующие функциональные возможности страницы.» | done | Tickets 01 and 02; commits 8747186 and afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R13 | «Не возникает дублирования компонентов и CSS.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R14 | «Не появляются дополнительные обёртки, меняющие ширину, высоту или позиционирование элементов.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R15 | «Визуальный результат на `/` должен совпадать с `/test_21`.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R16 | «не делай редирект с `/` на `/test_21`. Главная должна непосредственно отображаться по корневому адресу.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §2, §5, §6 |
| R17 | «Старая реализация `/` больше не должна использоваться посетителями.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R18 | «Не удаляй её компоненты и файлы автоматически.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R19 | «Не удаляй старые тестовые страницы.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R20 | «Не ломай зависимости других маршрутов.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R21 | «Не выполняй масштабную очистку проекта в рамках этой задачи.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R22 | «Если старые компоненты больше не используются, зафиксируй это в итоговом отчёте.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1, §2, Out of scope |
| R23 | «Нужно обеспечить единый и предсказуемый Header для публичной части сайта.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R24 | «Используй существующий компонент навигации, если он уже подходит.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R25 | «Если требуется, выдели его в общий переиспользуемый компонент, не создавая параллельную реализацию.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R26 | «**Услуги** → `/formats`» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R27 | «**О нас** → соответствующий раздел „Наш подход“ на главной (`/#approach` или фактический ID существующей секции).» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R28 | «**Архив** → `/archive`» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R29 | «**Начать поездку** → `/start`» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R30 | «Сохрани утверждённое оформление навигации из `/test_21`, включая поведение при прокрутке и адаптивность.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R31 | «Не нужно менять композицию и визуальный стиль отдельных редакционных страниц ради унификации.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R32 | «Общей должна быть навигация и базовая оболочка.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3 |
| R33 | «`/` → `/formats` — Просмотр услуг» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R34 | «`/` → `/archive` — Просмотр историй» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R35 | «`/` → `/start` — Начало обращения» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R36 | «`/formats` → `/start` — Передача выбранного формата» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R37 | «`/archive` → `/start` — Переход к обращению» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R38 | «`/start` → `/thanks` — Существующий сценарий завершения формы» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R39 | «Проверь все CTA, ссылки в Header и Footer, а также якорные переходы.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R40 | «Не меняй механизм отправки заявок в рамках этой задачи» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R41 | «Если обнаружишь, что текст или CTA обещает функциональность, которой пока нет, зафиксируй это в отчёте.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §3, §4 |
| R42 | «Проверь metadata корневой страницы.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R43 | «Убедись, что `/` не наследует `noindex, nofollow` от тестовой страницы.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R44 | «Настрой корректные title и description для главной.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R45 | «Убедись, что `/test_21` сохраняет свой тестовый статус и не становится каноническим публичным адресом.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R46 | «Проверь отсутствие конфликтов маршрутов и некорректных редиректов.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R47 | «Не меняй глобальные SEO-настройки остальных страниц без необходимости.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §5 |
| R48 | «`/` открывается и отображает актуальную главную.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R49 | «`/test_21` по-прежнему открывается самостоятельно.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R50 | «`/test_20` остаётся доступной без изменений.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R51 | «Все остальные `/test_*` маршруты продолжают работать.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R52 | «Дизайн-система подключена корректно.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R53 | «Header и Footer работают на публичных страницах.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R54 | «Все пункты меню ведут на правильные адреса.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R55 | «Все CTA и внутренние ссылки работают.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R56 | «Нет горизонтального скролла и проблем с адаптивностью.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R57 | «Корректно работают desktop, tablet и mobile.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R58 | «Проверь минимум разрешения 375, 768, 1280 и 1440 px.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R59 | «Запусти доступные проверки проекта: lint, typecheck и build.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R60 | «Если возможно, дополнительно проведи браузерную проверку основных сценариев.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §4, §6 |
| R61 | «Не менять дизайн `/test_21`.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R62 | «Не менять утверждённую дизайн-систему.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R63 | «Не менять шрифты, цвета, размеры и композицию.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R64 | «Не добавлять анимации.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R65 | «Не создавать новые страницы.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R66 | «Не удалять тестовые маршруты.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R67 | «Не реализовывать новую логику отправки заявок.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R68 | «Не заниматься глобальным рефакторингом проекта.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R69 | «Не перезаписывать чужие незакоммиченные изменения.» | done | Ticket 01; commit 8747186; Full self-briefing: explicit; mapped in Phase 3. | Spec §1-§6, Out of scope |
| R70 | «Какие изменения внесены в маршрутизацию.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R71 | «Как реализовано переиспользование компонента `/test_21`.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R72 | «Какие компоненты навигации используются и где.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R73 | «Какие ссылки и переходы проверены.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R74 | «Что произошло со старой главной.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R75 | «Результаты адаптивной и технической проверки.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |
| R76 | «Какие проблемы обнаружены и остались нерешёнными.» | done | Ticket 02; commit afa107e; Full self-briefing: explicit; mapped in Phase 3. | Spec final report |

## Самобрифинг (full)

Вопросов к пользователю нет: URL, обязательные пункты меню, страницы для сохранения, визуальный эталон и запреты заданы явно. Платёжных сервисов, внешних аккаунтов, новых данных и миграций нет. Глубина normal, поэтому adversarial pass не запускается.

- ASSUMPTION A01 — принято за пользователя: фактический ID секции «Наш подход» в `ConceptHome` — `point-of-view`; общий пункт «О нас» ведёт на `/#point-of-view`.
- ASSUMPTION A02 — принято за пользователя: корень получает явные title/description главной и индексируется; `/test_21` сохраняет `noindex, nofollow` и не получает canonical на себя. Канонический публичный адрес — `/`.
- ASSUMPTION A03 — принято за пользователя: Header и набор пунктов меню общие, а отдельные композиции Footer остаются у главной и редакционной оболочки; их ссылки приводятся к тем же публичным адресам.
- ASSUMPTION A04 — принято за пользователя: текущий демонстрационный сценарий `/start` и `/thanks` остаётся как есть; отправка заявок не подключается.
- ASSUMPTION A05 — принято за пользователя: существующий language picker сохраняет только выбор метки и не переводит страницы; перевод не добавляется как отдельная функция.

## Gate G2

Blind review получил только brief и spec. Найденные пробелы закрыты в §1, §3, §4, §6 и составе отчёта: статус старого Git, зависимости старой главной, проверка дизайн-системы/маршрутизации, проверка обещаний, соблюдение `AGENTS.md`, запрет анимаций и состав отчёта. Повторная проверка: пробелов нет.
