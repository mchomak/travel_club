# Манифест требований

Источник: `2026-10-21-brief.md`. Цитаты взяты из полного исходного сообщения без редакторского пересказа; исходная escape-разметка сохранена. Повторённые требования сохраняются, если повторены в критериях проверки/отчёта. Только пользователь может снять требование. Подводящие строки, не содержащие отдельного требования, остаются в брифе.

G1: full/self-briefing, открытых вопросов нет. Вопросы о бизнесе/оплате/аккаунтах не возникают: локальная изолированная UI-итерация. Ни один факт о пользователе не выдуман.

ASSUMPTION: проигрывание один раз при каждой законченной активации, включая повторный визит; разрешено брифом. Существующий desktop cutoff/fallback сохраняется. Никаких платных/account-bound решений и новых заглушек.

| ID | Из брифа (дословно) | Статус | Основание | Где |
| --- | --- | --- | --- | --- |
| R001 | Твоя задача — создать новую версию сайта \`/test_13\` на основе текущей \`/test_12\` и добавить в неё выразительные, аккуратные анимации текста, графики, навигации и интерактивных элементов. | done | Brief section 1; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R002 | \*\*Главная цель — сделать журнал более живым, интерактивным и запоминающимся, сохранив существующую журнальную стилистику, композицию и удобство использования.\*\* | done | Brief section 1; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R003 | Не переписывай сайт с нуля. Развивай текущую реализацию, сохраняя всё, что уже работает хорошо. | done | Brief section 1; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R004 | 1\. Изучи архитектуру проекта и найди, как реализованы существующие тестовые страницы, в частности \`/test_12\`. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R005 | 2\. Определи, какие компоненты, стили, конфигурации, данные и маршруты используются этой страницей. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R006 | 3\. Создай независимую версию \`/test_13\`, полностью воспроизводящую текущее состояние \`/test_12\`. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R007 | 4\. Проверь, что \`/test_13\` открывается локально и визуально соответствует \`/test_12\`. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R008 | 5\. Только после этого начинай вносить изменения. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R009 | \- \*\*\`/test_12\` — контрольная версия. Не изменяй её ни при каких обстоятельствах.\*\* | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R010 | \- Все новые анимации и связанные с ними изменения реализуй исключительно в \`/test_13\`. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R011 | \- Не изменяй \`/test_11\`, \`/test_10\` и другие существующие версии. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R012 | \- Не вноси изменения в общие компоненты или стили, если это затронет поведение контрольной версии. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R013 | \- Если необходимо переиспользовать общую логику, организуй независимую реализацию или аккуратно выдели новые компоненты так, чтобы \`/test_12\` продолжала работать без изменений. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R014 | \- Не ограничивайся изменением URL или созданием алиаса, который ведёт на ту же страницу. Нужна полноценная тестовая версия, в которой можно независимо экспериментировать. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R015 | \- Не удаляй, не переименовывай и не перемещай существующие файлы без необходимости. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R016 | Если страницы построены на общих компонентах, сначала разберись, как изолировать изменения. Не допускай, чтобы новые анимации автоматически появились в \`/test_12\`. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R017 | \*\*Критерий готовности первого этапа:\*\* \`/test_12\` остаётся неизменной, а \`/test_13\` открывается и воспроизводит исходный дизайн. После этого приступай к анимациям. | done | Brief section 2; self-briefing: explicit / implementation choice within brief. | spec section 2 -> T01, T02 |
| R018 | \- Крупная редакционная типографика. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R019 | \- Контрастные шрифты: выразительная антиква и современный гротеск. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R020 | \- Индивидуальные цветовые решения разных глав. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R021 | \- Тонкие разделительные линии, номера страниц и редакционные подписи. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R022 | \- Крупные фотографии и типографические композиции. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R023 | \- Нижняя навигация по главам. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R024 | \- Перелистывание журнала. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R025 | \- Сдержанная, но выразительная подача коммерческих предложений. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R026 | Необходимо сохранить ощущение качественного печатного издания, перенесённого в цифровую среду. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R027 | Не превращай сайт в типовой корпоративный лендинг, интерфейс SaaS-продукта или перегруженную анимациями промостраницу. | done | Brief section 3; self-briefing: explicit / implementation choice within brief. | spec section 1 -> T01, T02 |
| R028 | \*\*Начальную анимацию журнала.\*\* Она отвечает за появление и открытие обложки, перелистывание страниц и переход к первому содержательному развороту. Не меняй её механику, тайминги, камеру, освещение, последовательность сцен или поведение обложки. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R029 | \*\*Существующую анимацию фотографий.\*\* Не изменяй механизм появления изображений, их маски, переходы, задержки и последовательность. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R030 | \- Содержание и порядок всех семи разворотов. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R031 | \- Тексты, цены, фотографии и ссылки. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R032 | \- Логотип и существующую цветовую палитру. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R033 | \- Типографику и основные размеры элементов. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R034 | \- Композицию страниц. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R035 | \- Механику перелистывания и навигации. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R036 | \- Существующую адаптивность. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R037 | Не добавляй новые страницы и не переписывай контент. Текущая задача — только анимации, микроинтеракции и необходимые для них элементы. | done | Brief section 4; self-briefing: explicit / implementation choice within brief. | spec section 3 -> T01, T02 |
| R038 | 1\. \*\*REVEAL\*\* — постепенное раскрытие заголовков слева направо. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R039 | 2\. \*\*CASCADE\*\* — последовательное появление текстовых блоков. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R040 | 3\. \*\*DRAW\*\* — прорисовка разделительных линий и подчёркиваний. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R041 | 4\. \*\*ICON MOTION\*\* — короткие анимации линейных иконок. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R042 | 5\. \*\*HOVER\*\* — микроинтеракции ссылок, CTA и строк продуктов. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R043 | 6\. \*\*NAVIGATION MOTION\*\* — плавная индикация активной главы в нижней навигации. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R044 | Необязательно применять все эффекты к каждому элементу. Выбирай подходящие решения для конкретной композиции. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R045 | Используй существующий стек проекта. Не добавляй новые библиотеки без реальной необходимости. | done | Brief section 5; self-briefing: explicit / implementation choice within brief. | spec section 5-10 -> T02 |
| R046 | При активации содержательного разворота заголовок постепенно открывается слева направо, словно проявляется на бумаге. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R047 | Визуально это должно напоминать раскрытие напечатанного текста, а не набор символов на клавиатуре. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R048 | Предпочтительно использовать маску, clipping или аналогичный механизм, сохраняющий исходную типографику. Выбери техническую реализацию самостоятельно с учётом архитектуры проекта. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R049 | \- «С нами в путь». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R050 | \- «Люди, с которых начался Travel Club». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R051 | \- Имена Василисы и Рамиля на развороте «О нас». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R052 | \- «Следующая история — вместе». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R053 | \- Заголовки THAILAND и CHINA, если эффект не конфликтует с фотографиями. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R054 | \- ARCHIVE. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R055 | \- «Не только куда». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R056 | \- «Начнём с разговора». | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R057 | Для крупных графических надписей, взаимодействующих с изображениями, можно оставить исходное поведение, если маска ухудшает композицию. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R058 | \- Одна строка: 350–550 мс. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R059 | \- Многострочный заголовок: 450–700 мс на весь блок. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R060 | \- Между строками допустима небольшая задержка. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R061 | Не используй медленный посимвольный эффект. Пользователь должен практически сразу получить возможность читать заголовок. | done | Brief section 6; self-briefing: explicit / implementation choice within brief. | spec section 5 -> T02 |
| R062 | 1\. Подзаголовок или вводная фраза. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R063 | 2\. Основной текст. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R064 | 3\. Дополнительные смысловые блоки. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R065 | 4\. Ссылки и CTA. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R066 | Используй комбинацию плавного изменения прозрачности и небольшого вертикального смещения. Движение должно быть едва заметным. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R067 | \- Продолжительность обычного текстового блока: 250–400 мс. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R068 | \- Смещение: примерно 6–12 px. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R069 | \- Интервал между смысловыми группами: 60–120 мс. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R070 | \- Общая продолжительность появления основных элементов разворота: примерно 0,8–1,4 секунды. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R071 | Не анимируй каждое предложение отдельно. Объединяй элементы в логические группы. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R072 | \- Заголовок. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R073 | \- Главное описание Travel Club. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R074 | \- Строки Travel Design, Travel Ready и TC Trips. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R075 | \- Иконки, описания и цены. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R076 | \- Разделительные линии и CTA. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R077 | Название, описание и цена каждой услуги должны появляться достаточно близко по времени, чтобы пользователь сразу воспринимал их как единый блок. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R078 | \- Заголовок. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R079 | \- Имена Василисы и Рамиля. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R080 | \- Их роли и описания. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R081 | \- История появления Travel Club. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R082 | \- Дополнительные подписи. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R083 | Сохрани композицию Next Issue. Анимируй заголовок, описание концепции, статус подготовки и CTA, не меняя содержания предложения. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R084 | Используй сдержанное появление заголовков, подписей и текстовых блоков. Не вмешивайся в существующие анимации фотографий. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R085 | Последовательно появляются заголовок, принципы Travel Club, этапы работы и CTA. | done | Brief section 7; self-briefing: explicit / implementation choice within brief. | spec section 6 -> T02 |
| R086 | Используй существующие тонкие линии как естественную часть анимации. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R087 | \- Разделители между строками продуктов. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R088 | \- Горизонтальные линии под колонтитулами. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R089 | \- Разделители смысловых блоков. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R090 | \- Подчёркивания заголовков и ссылок. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R091 | \- Линии, отделяющие основной текст от нижних подписей. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R092 | Линии постепенно удлиняются слева направо. Для вертикальных линий допустима прорисовка сверху вниз. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R093 | \- Короткие линии: 200–300 мс. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R094 | \- Длинные разделители: 300–450 мс. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R095 | \- Подчёркивания ссылок при наведении: 150–250 мс. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R096 | Сохрани исходные толщину и цвет линий. Не добавляй свечение, объёмные эффекты и лишнюю декоративность. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R097 | Не запускай все линии одновременно. Синхронизируй их появление с соответствующими текстовыми блоками. | done | Brief section 8; self-briefing: explicit / implementation choice within brief. | spec section 7 -> T02 |
| R098 | Развивай существующую систему иконок, не создавая отдельный визуальный язык. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R099 | \- Единая толщина штриха. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R100 | \- Сдержанный размер. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R101 | \- Цвет в соответствии с палитрой страницы. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R102 | \- Отсутствие конкуренции с заголовками и фотографиями. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R103 | \- Переиспользование уже подключённой библиотеки иконок. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R104 | \- Travel Design — маршрут, компас или точки пути. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R105 | \- Travel Ready — готовность, проверенный план или контрольный список. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R106 | \- TC Trips — люди или совместная поездка. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R107 | \- Field Notes и Archive — записи и заметки. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R108 | При появлении строки иконка может плавно проявляться, немного смещаться или однократно прорисовываться по контуру. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R109 | При наведении допускается короткое движение или изменение отдельной детали. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R110 | Не добавляй постоянную пульсацию, бесконечное вращение и непрерывную анимацию. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R111 | Не заменяй логотип Travel Club иконкой или текстовой имитацией. | done | Brief section 9; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R112 | \- Стрелка слегка смещается в направлении движения. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R113 | \- Подчёркивание плавно появляется или меняет положение. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R114 | \- Цвет текста может немного изменяться в рамках палитры. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R115 | \- Фон существующей кнопки может плавно менять оттенок. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R116 | Продолжительность — ориентировочно 150–250 мс. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R117 | Не используй сильное масштабирование, большие тени и пружинящие эффекты. Не превращай все ссылки в одинаковые массивные кнопки. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R118 | \- Немного усилить цвет иконки или номера. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R119 | \- Изменить цвет разделительной линии. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R120 | \- Добавить сдержанную реакцию ссылки «Подробнее о формате». | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R121 | Если строка кликабельна целиком, её интерактивность должна быть понятна пользователю. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R122 | Не добавляй скруглённые карточки и тени, если их нет в текущем дизайне. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R123 | Сохрани существующие URL и действия всех ссылок. | done | Brief section 10; self-briefing: explicit / implementation choice within brief. | spec section 8 -> T02 |
| R124 | Нижняя навигация уже является частью интерфейса. Не перестраивай её заново. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R125 | \- Подчёркивание плавно перемещается к активной главе. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R126 | \- Активное название становится визуально различимым. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R127 | \- При необходимости номер текущей главы обновляется через короткое перекрёстное затухание. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R128 | \- Неактивные пункты остаются читаемыми. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R129 | При наведении стрелка слегка смещается в направлении движения. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R130 | Сохрани корректное поведение на границах журнала и все существующие способы перелистывания. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R131 | \- Порядок глав не меняется. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R132 | \- Прямые ссылки на развороты продолжают работать. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R133 | \- Активный пункт всегда соответствует отображаемому развороту. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R134 | \- Сохраняются управление с клавиатуры и видимый фокус. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R135 | \- Не добавляй отдельную полосу прогресса, если она дублирует текущую индикацию. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R136 | Навигация должна восприниматься как часть журнальной вёрстки, а не как панель управления приложением. | done | Brief section 11; self-briefing: explicit / implementation choice within brief. | spec section 9 -> T02 |
| R137 | Новые эффекты должны запускаться после завершения существующего перехода к новому развороту. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R138 | 1\. Пользователь выбирает новый разворот. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R139 | 2\. Срабатывает существующая анимация перелистывания без изменений. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R140 | 3\. После завершения перехода активируется новый разворот. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R141 | 4\. Запускаются текстовые и графические эффекты. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R142 | 5\. Элементы появляются в согласованной последовательности. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R143 | Используй существующий механизм определения активного разворота и завершения перехода, если он доступен. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R144 | Не создавай параллельную систему навигационного состояния без необходимости. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R145 | Если пользователь перелистнул страницу вперёд, а затем вернулся назад, поведение анимаций должно быть предсказуемым. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R146 | Допускается повторное проигрывание при повторной активации разворота, если оно не раздражает и не мешает чтению. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R147 | Не допускай повторного запуска из-за обычного React re-render, изменения несвязанного состояния или повторного расчёта размеров. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R148 | Текст не должен оставаться скрытым, если анимация не запустилась или произошла ошибка. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R149 | Учитывай многострочные заголовки, переносы, кириллицу и вложенные элементы. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R150 | При использовании масок текст должен оставаться полноценным текстовым содержимым страницы, доступным для копирования, поиска и вспомогательных технологий. | done | Brief section 12; self-briefing: explicit / implementation choice within brief. | spec section 10 -> T02 |
| R151 | \- По возможности анимируй \`opacity\` и \`transform\`. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R152 | \- Избегай постоянных циклов обновления для статичных элементов. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R153 | \- Не допускай скачков размеров текста и блоков. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R154 | \- Не используй тяжёлые эффекты без визуальной необходимости. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R155 | \- Не блокируй взаимодействие до завершения второстепенных анимаций. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R156 | \- Не скрывай важный контент навсегда, если JavaScript или анимация не сработали. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R157 | \- Учитывай \`prefers-reduced-motion\`: при включении отключай или существенно упрощай новые необязательные эффекты. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R158 | \- Сохраняй заметное состояние клавиатурного фокуса. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R159 | \- Не полагайся только на hover для передачи важной информации. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R160 | \- Проверь работу на сенсорных устройствах. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R161 | Не нужно заново проектировать мобильную версию, но новые эффекты не должны нарушать существующую адаптивность. | done | Brief section 13; self-briefing: explicit / implementation choice within brief. | spec section 11 -> T02 |
| R162 | 1\. Раскрытие крупных заголовков слева направо. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R163 | 2\. Последовательное появление текстовых блоков. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R164 | 3\. Прорисовка разделительных линий и подчёркиваний. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R165 | 4\. Hover-эффекты для ссылок, CTA и строк продуктов. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R166 | 5\. Плавная индикация активного раздела в нижней навигации. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R167 | 6\. Единая система линейных иконок и их коротких анимаций. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R168 | Необязательно применять все эффекты на каждом развороте. Интенсивность должна соответствовать содержанию и композиции. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R169 | Не добавляй сейчас сложную маршрутную графику, дополнительные параллаксы или тяжёлые декоративные эффекты. Сначала качественно реализуй основную систему. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R170 | У тебя есть свобода выбирать технический способ реализации, конкретные задержки в заданных диапазонах и подходящие визуальные детали. Главное — не жертвовать читаемостью, производительностью и предсказуемостью ради эффектности. | done | Brief section 14; self-briefing: explicit / implementation choice within brief. | spec section 5-11 -> T02 |
| R171 | После реализации открой \`/test_13\` в браузере и проверь все семь разворотов. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R172 | \- Заголовки раскрываются корректно. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R173 | \- Многострочный текст не обрезается. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R174 | \- Кириллица, знаки препинания и переносы отображаются правильно. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R175 | \- Строки продуктов не скачут по высоте. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R176 | \- Новые эффекты согласуются с цветами и шрифтами. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R177 | \- Иконки имеют единый стиль. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R178 | \- Hover-эффекты не мешают чтению. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R179 | \- Навигация корректно показывает активную главу. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R180 | \- Перелистывание работает как раньше. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R181 | \- Начальная анимация не изменилась. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R182 | \- Анимация появления фотографий не изменилась. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R183 | \- Новые эффекты запускаются после завершения перелистывания. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R184 | \- Нет повторных запусков при каждом рендере. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R185 | \- Все кнопки, ссылки и CTA продолжают работать. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R186 | \- Управление с клавиатуры работает корректно. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R187 | \- В режиме reduced motion контент остаётся доступным. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R188 | Отдельно проверь, что \`/test_12\` осталась неизменной. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R189 | Если возможно, сравни её исходные файлы и изменения в Git до и после работы. Убедись, что новые эффекты не затронули контрольную версию через общие стили, компоненты или конфигурацию. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R190 | Также проверь, что \`/test_11\`, \`/test_10\` и остальные версии не изменились. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R191 | Не ограничивайся проверкой первого разворота. Проект должен собираться и работать штатным образом, без ошибок в консоли и новых проблем загрузки. | done | Brief section 15; self-briefing: explicit / implementation choice within brief. | spec section 13 -> T01, T02 |
| R192 | 1\. Как была создана и проверена независимая версия \`/test_13\`. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R193 | 2\. Какие анимации реализованы. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R194 | 3\. На каких разворотах применяются конкретные эффекты. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R195 | 4\. Как устроен запуск анимаций при перелистывании. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R196 | 5\. Как реализована поддержка reduced motion. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R197 | 6\. Какие проверки выполнены. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R198 | 7\. Подтверждение, что \`/test_12\` и остальные версии не изменены. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R199 | 8\. Какие проблемы, ограничения или компромиссы остались. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R200 | Если какой-либо эффект несовместим с текущей архитектурой, выбери наиболее близкий визуальный аналог, не ломая существующий код, и объясни решение. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R201 | \*\*Итоговая цель:\*\* сохранить характер Travel Club как авторского интерактивного travel-журнала и сделать взаимодействие с ним более выразительным за счёт точной типографической анимации, последовательного раскрытия контента и аккуратных микроинтеракций. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |
| R202 | Сначала создай и проверь \`/test_13\`. Только затем приступай к реализации. \`/test_12\` должна остаться нетронутой контрольной версией для сравнения. | done | Brief section 16; self-briefing: explicit / implementation choice within brief. | spec section 15 -> T01, T02 |

## Финальная приёмка

202/202 требований выполнены; независимыеG2/G4 иsource/Craftпроверки пройдены. Implementationcommit: e108ca8c9258b4e1ceeee2bfd63d85e20add698f. Проверки/ограничения: final-report.md и docs/qa/test-13/README.md. Ни одно требование не отменено/отложено.
