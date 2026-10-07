# Манифест требований

Источник: `2026-10-08-brief.md`. Снять требование может только пользователь. Все строки `in-spec`: покрытие существующим `spec.md`; T01 — копирование и доказательство исходного совпадения, T02 — opening и QA. Цитаты дословны после транспортной нормализации исходного сообщения; повторы DoD служат тем же требованиям.

| ID | Из брифа (дословно) | Статус | Основание | Где |
|----|---------------------|--------|-----------|-----|
| R01 | «Работай в существующем проекте Travel Club.» | in-ticket | — | spec §1 → T01 |
| R02 | «Нужно создать новую экспериментальную версию текущей homepage:» | in-ticket | — | spec §1 → T01 |
| R03 | «Сначала полностью скопируй текущую страницу /test_4 на /test_5 так, чтобы новая страница визуально и функционально совпадала с /test_4.» | in-ticket | — | spec §1,6 → T01 |
| R04 | «После этого на /test_5 измени ТОЛЬКО opening-механику / hero с журналом.» | in-ticket | — | spec §1 → T02 |
| R05 | «Остальная homepage должна остаться содержательно и визуально максимально близкой к /test_4.» | in-ticket | — | spec §1,6 → T01,T02 |
| R06 | «Не изменяй /test_4.» | in-ticket | — | spec §1,6 → T01,T02 |
| R07 | «Не изменяй /test_2, /test_3 и другие существующие routes.» | in-ticket | — | spec §1,6 → T01,T02 |
| R08 | «→ пользователь начинает приближаться к ПРАВОЙ странице» | in-ticket | — | spec §2 → T02 |
| R09 | «→ левая страница и корешок уходят за пределы viewport» | in-ticket | — | spec §2 → T02 |
| R10 | «→ правая страница занимает весь экран» | in-ticket | — | spec §2 → T02 |
| R11 | «→ её композиция естественно превращается в настоящий homepage» | in-ticket | — | spec §2,3 → T02 |
| R12 | «- текущую эстетику Living Issue;» | in-ticket | — | spec §1,2 → T01,T02 |
| R13 | «- current cover;» | in-ticket | — | spec §1,2 → T01,T02 |
| R14 | «- текущий editorial language;» | in-ticket | — | spec §1 → T01,T02 |
| R15 | «- текущую типографику;» | in-ticket | — | spec §1,3 → T01,T02 |
| R16 | «- China ’26 как содержание opening;» | in-ticket | — | spec §1,2 → T01,T02 |
| R17 | «- FIELD NOTES;» | in-ticket | — | spec §1 → T01,T02 |
| R18 | «- существующую цветовую систему;» | in-ticket | — | spec §1,2 → T01,T02 |
| R19 | «- общий slow/editorial характер движения;» | in-ticket | — | spec §2 → T02 |
| R20 | «Это короткий digital editorial transition.» | in-ticket | — | spec §2 → T02 |
| R21 | «После открытия журнала НЕ оставляй весь открытый разворот центрированным перед пользователем.» | in-ticket | — | spec §2 → T02 |
| R22 | «1–1.5 viewport scroll journey.» | in-ticket | — | spec §2 → T02 |
| R23 | «Настрой их после визуального теста.» | in-ticket | — | spec §2,6 → T02 |
| R24 | «Используй существующую cover-механику /test_4 как базу.» | in-ticket | — | spec §1,2 → T01,T02 |
| R25 | «Сохрани ощущение небольшого physical/editorial object в большом viewport.» | in-ticket | — | spec §2 → T02 |
| R26 | «При scroll журнал раскрывается.» | in-ticket | — | spec §2 → T02 |
| R27 | «Должен появиться полноценный spread:» | in-ticket | — | spec §2 → T02 |
| R28 | «- opening должен быть плавным;» | in-ticket | — | spec §2 → T02 |
| R29 | «- perspective должна быть subtle;» | in-ticket | — | spec §2 → T02 |
| R30 | «- shadows постепенно должны становиться слабее по мере перехода к сайту.» | in-ticket | — | spec §2 → T02 |
| R31 | «- центр масштабирования смещается к правой странице;» | in-ticket | — | spec §2,4 → T02 |
| R32 | «- perspective выравнивается.» | in-ticket | — | spec §2 → T02 |
| R33 | «ZOOM + TRANSLATE + LOSS OF OBJECT BOUNDARIES.» | in-ticket | — | spec §2,3 → T02 |
| R34 | «- её внешние края уходят за viewport;» | in-ticket | — | spec §2 → T02 |
| R35 | «- shadow становится 0;» | in-ticket | — | spec §2 → T02 |
| R36 | «- perspective становится 0;» | in-ticket | — | spec §2 → T02 |
| R37 | «- page background становится background сайта;» | in-ticket | — | spec §2,3 → T02 |
| R38 | «- её внутренний editorial grid начинает совпадать с grid homepage;» | in-ticket | — | spec §2,3 → T02 |
| R39 | «Но хотя бы один крупный визуальный элемент должен физически или визуально продолжить движение из журнала в hero.» | in-ticket | — | spec §3 → T02 |
| R40 | «Не делай:<br><br>magazine fades out<br>+<br>homepage fades in.» | in-ticket | — | spec §3 → T02 |
| R41 | «После merge пользователь должен прийти в существующую hero-зону /test_4.» | in-ticket | — | spec §3 → T02 |
| R42 | «Не redesign hero в рамках этой задачи.» | in-ticket | — | spec §3 → T02 |
| R43 | «Куда — важно.<br>С кем — важнее.» | in-ticket | — | spec §3 → T01,T02 |
| R44 | «Используй scroll-driven animation.» | in-ticket | — | spec §4 → T02 |
| R45 | «Не добавляй тяжёлую dependency без необходимости.» | in-ticket | — | spec §4 → T02 |
| R46 | «Сначала изучи существующую реализацию.» | in-ticket | — | spec §4 → T01,T02 |
| R47 | «Сохрани работающие части.» | in-ticket | — | spec §1,4 → T01,T02 |
| R48 | «Основной визуальный эффект должен строиться на нескольких понятных параметрах.» | in-ticket | — | spec §4 → T02 |
| R49 | «1. Определи bounding box правой страницы в раскрытом состоянии.» | in-ticket | — | spec §4 → T02 |
| R50 | «2. Определи конечный bounding box hero / homepage viewport.» | in-ticket | — | spec §4 → T02 |
| R51 | «3. Рассчитай необходимый scale.» | in-ticket | — | spec §4 → T02 |
| R52 | «4. Рассчитай translateX / translateY.» | in-ticket | — | spec §4 → T02 |
| R53 | «Не хардкодь анимацию только под один конкретный screenshot.» | in-ticket | — | spec §4,5,6 → T02 |
| R54 | «- вынеси их в понятные константы;<br>- подпиши их назначение.» | in-ticket | — | spec §4 → T02 |
| R55 | «Но mobile не должен ломаться.» | in-ticket | — | spec §5,6 → T02 |
| R56 | «Не пытайся впихнуть desktop spread 1:1 в мобильный экран.» | in-ticket | — | spec §5 → T02 |
| R57 | «Во время scroll нельзя создавать постоянные React rerenders на каждый пиксель без необходимости.» | in-ticket | — | spec §4 → T02 |
| R58 | «Не вызывай layout thrashing.» | in-ticket | — | spec §4 → T02 |
| R59 | «Добавь нормальное поведение для:<br><br>prefers-reduced-motion: reduce» | in-ticket | — | spec §5,6 → T02 |
| R60 | «- navigation должна оставаться доступной.» | in-ticket | — | spec §5 → T02 |
| R61 | «- opening animation должна быть пропущена;» | in-ticket | — | spec §5 → T02 |
| R62 | «- не должно быть flash of magazine.» | in-ticket | — | spec §5,6 → T02 |
| R63 | «STEP 2:<br>запусти /test_5.» | in-ticket | — | spec §1,6 → T01 |
| R64 | «STEP 3:<br>убедись, что она визуально совпадает с /test_4.» | in-ticket | — | spec §1,6 → T01 |
| R65 | «STEP 4:<br>только после этого начинай менять Living Issue.» | in-ticket | — | spec §1,6 → T01,T02 |
| R66 | «Не используй /test_2 как source страницы.» | in-ticket | — | spec §1 → T01 |
| R67 | «- перекомпоновывать Products;» | in-ticket | — | spec §1 → T01,T02 |
| R68 | «- удалять Contents;» | in-ticket | — | spec §1 → T01,T02 |
| R69 | «- менять Field Notes;<br>- менять Thailand;<br>- менять China;<br>- менять Archive;<br>- менять Point of View;<br>- менять Club;<br>- менять Process;<br>- менять forms;» | in-ticket | — | spec §1 → T01,T02 |
| R70 | «- переписывать copy;<br>- внедрять новую design system;<br>- менять photography;<br>- делать общий redesign.» | in-ticket | — | spec §1 → T01,T02 |
| R71 | «- off-white / Cloud;<br>- Ink;<br>- blue China accent;<br>- editorial typography;<br>- restrained animation;<br>- contemporary publication feeling.» | in-ticket | — | spec §1,2,3 → T01,T02 |
| R72 | «Не добавляй дополнительные:<br><br>"SCROLL TO ENTER"<br>"ENTER THE WEBSITE"<br>"OPEN THE ISSUE"» | in-ticket | — | spec §2 → T02 |
| R73 | «После первой реализации сделай refinement pass.» | in-ticket | — | spec §6 → T02 |
| R74 | «11. скорость первого обычного scroll после hero.» | in-ticket | — | spec §6 → T02 |
| R75 | «Не используй один linear transform для всей анимации.» | in-ticket | — | spec §2 → T02 |
| R76 | «Но не делай bounce / springy overshoot.» | in-ticket | — | spec §2 → T02 |
| R77 | «Но debug UI не должен оставаться видимым в финальной версии.» | in-ticket | — | spec §4 → T02 |
| R78 | «6. Проверь медленный scroll.<br>7. Проверь быстрый scroll.<br>8. Проверь scroll назад вверх.» | in-ticket | — | spec §6 → T02 |
| R79 | «9. Проверь resize окна.<br>10. Проверь refresh в начале.<br>11. Проверь /test_5#start.» | in-ticket | — | spec §5,6 → T02 |
| R80 | «12. Проверь desktop.<br>13. Проверь tablet.<br>14. Проверь mobile.» | in-ticket | — | spec §5,6 → T02 |
| R81 | «16. Проверь browser console.<br>17. Убедись, что нет hydration errors.<br>18. Убедись, что unrelated routes работают.» | in-ticket | — | spec §6 → T02 |
| R82 | «Если доступны browser / screenshot tools:<br>обязательно используй их для visual QA.» | in-ticket | — | spec §6 → T01,T02 |
| R83 | «transition должен корректно проигрываться назад.» | in-ticket | — | spec §5,6 → T02 |
| R84 | «- teleport;<br>- broken transform;<br>- blank screen;<br>- две hero одновременно;<br>- stuck magazine;<br>- неправильный z-index;<br>- scroll lock.» | in-ticket | — | spec §5,6 → T02 |
| R85 | «Сделай понятную локальную stack hierarchy.» | in-ticket | — | spec §4 → T02 |
| R86 | «Если пользователь может чётко показать пальцем момент:<br><br>"вот здесь журнал закончился, а вот здесь отдельно появился сайт",<br><br>transition сделан недостаточно хорошо.» | in-ticket | — | spec §3,6 → T02 |
| R87 | «В финальном отчёте дай только:» | in-ticket | — | spec §Покрытие / финальный отчёт → T02 |
| R88 | «Не присылай большой листинг кода.» | in-ticket | — | spec §Покрытие / финальный отчёт → T02 |
| R89 | «Сначала реализуй, запусти и визуально проверь.» | in-ticket | — | spec §6 → T01,T02 |

## Сверка всех разделов брифа

1 → R08–R11, R86; 2 → R12–R20, R60–R62; 3 → R08–R11,R21,R31,R33; 4 → R22–R23; 5 → R13,R24–R25; 6 → R26–R30; 7 → R08–R09,R31–R33; 8 → R10–R11,R34–R38; 9 → R39–R40; 10 → R41–R43; 11 → R40,R86; 12 → R44–R45; 13 → R46–R47; 14 → R31,R48; 15 → R49–R54; 16 → R55–R56,R80; 17 → R57–R58; 18 → R59–R60; 19 → R61–R62,R79; 20 → R03,R63–R66; 21 → R05–R07,R67–R70; 22 → R12–R19,R71; 23 → R72; 24 → R73–R74; 25 → R75–R76; 26 → R77; 27 → R78–R82; 28 → R83–R84; 29 → R85; 30 → все применимые строки; 31 → R86; 32 → R87–R89.

## Уточнения проверки

R27 включает LEFT PAGE + RIGHT PAGE. R43 включает неизменное «TRAVEL CLUB» и полное описание «Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ.». R53/R80 требуют 1920/1440/1280/768/390 px и laptop; R61/R62 — `/test_5#start`, правильный scroll/layout и немедленный homepage. R73 включает все 11 пунктов refinement исходного раздела 24. R87 ограничивает финал ровно десятью пунктами раздела 32 исходного брифа. Ни одно перечисление исходной задачи не исключено.

