# Манифест требований

Источник: `2026-10-13-brief.md`. Требование может снять только пользователь.

| ID | Из брифа (дословно) | Статус | Основание | Где |
|---|---|---|---|---|
| R001 | «Работай в существующем проекте Travel Club.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R002 | «КОНТЕКСТ» | done | Бриф: Контекст | T01 → spec: Контекст |
| R003 | «Сейчас основной актуальный экспериментальный homepage находится на:» | done | Бриф: Контекст | T01 → spec: Контекст |
| R004 | «http://localhost:3000/test_5» | done | Бриф: Контекст | T01 → spec: Контекст |
| R005 | «Его визуальный язык, композиционный характер и общая концепция являются текущей базой для следующих страниц сайта.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R006 | «Также в проекте уже должен существовать Design System Playground / design tokens или связанные с ним стили. Сначала изучи текущую реализацию и переиспользуй её там, где это разумно.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R007 | «ЗАДАЧА» | done | Бриф: Контекст | T01 → spec: Контекст |
| R008 | «Нужно создать следующие базовые страницы:» | done | Бриф: Контекст | T01 → spec: Контекст |
| R009 | «/formats<br>/archive<br>/start<br>/thanks» | done | Бриф: Контекст | T01 → spec: Контекст |
| R010 | «а также юридический раздел:» | done | Бриф: Контекст | T01 → spec: Контекст |
| R011 | «/legal<br>/privacy<br>/personal-data» | done | Бриф: Контекст | T01 → spec: Контекст |
| R012 | «и branded 404 page через стандартный механизм текущего Next.js router.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R013 | «После этого связать новые страницы с текущей homepage /test_5:» | done | Бриф: Контекст | T01 → spec: Контекст |
| R014 | «- существующие релевантные ссылки / CTA на /test_5 должны вести на новые страницы;» | done | Бриф: Контекст | T01 → spec: Контекст |
| R015 | «- на всех новых страницах должна быть очевидная возможность вернуться на homepage;» | done | Бриф: Контекст | T01 → spec: Контекст |
| R016 | «- навигация между страницами должна быть рабочей.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R017 | «Это пока НЕ финальные production-страницы.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R018 | «Главная задача этапа:<br>создать качественный архитектурный и визуальный каркас, который потом можно будет легко корректировать после финального выбора typography, colors и spacing.» | done | Бриф: Контекст | T01 → spec: Контекст |
| R019 | «Перед написанием новых страниц:» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R020 | «1. Изучи:<br>   - /test_5;<br>   - текущую файловую структуру;<br>   - существующие global styles;<br>   - Design System Playground;<br>   - design tokens;<br>   - font imports;<br>   - typography;<br>   - цвета;<br>   - spacing;<br>   - grid/container system;<br>   - header/navigation;<br>   - footer;<br>   - buttons/links;<br>   - forms;<br>   - image components;<br>   - существующие animation utilities.» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R021 | «2. Определи, что можно переиспользовать.» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R022 | «3. Не создавай вторую параллельную дизайн-систему.» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R023 | «4. Не переписывай /test_5 без необходимости.» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R024 | «5. Не трогай backend, database, admin, constructor и unrelated routes.» | done | Бриф: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ | T01 → spec: 1. СНАЧАЛА ИЗУЧИ ПРОЕКТ |
| R025 | «Все новые страницы должны получать:» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R026 | «- typography;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R027 | «- colors;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R028 | «- spacing;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R029 | «- layout;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R030 | «- borders;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R031 | «- базовые UI styles» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R032 | «из общей системы.» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R033 | «Нельзя писать на каждой странице случайные значения типа:» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R034 | «font-size: 73px;<br>font-family: ...;<br>color: #...<br>margin-top: 137px;» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R035 | «если эти параметры относятся к общей системе сайта.» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R036 | «Нужен единый source of truth.» | done | Бриф: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ | T01 → spec: 2. ГЛАВНЫЙ ТЕХНИЧЕСКИЙ ПРИНЦИП ДИЗАЙН-СИСТЕМЫ |
| R037 | «Используй трёхуровневую модель.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R038 | «LEVEL 1 — BASE / PRIMITIVE TOKENS» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R039 | «Например:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R040 | «--tc-font-serif<br>--tc-font-sans» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R041 | «--tc-font-weight-regular<br>--tc-font-weight-medium» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R042 | «--tc-color-cloud<br>--tc-color-ink<br>--tc-color-blue» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R043 | «и т.д.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R044 | «LEVEL 2 — SEMANTIC TYPOGRAPHY» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R045 | «Например:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R046 | «--tc-type-display-xl-size<br>--tc-type-display-xl-line-height<br>--tc-type-display-xl-spacing» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R047 | «--tc-type-display-size<br>--tc-type-display-line-height» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R048 | «--tc-type-h1-size<br>--tc-type-h1-line-height» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R049 | «--tc-type-h2-size<br>--tc-type-h2-line-height» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R050 | «--tc-type-lead-size<br>--tc-type-body-size<br>--tc-type-small-size<br>--tc-type-meta-size<br>--tc-type-caption-size» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R051 | «Не обязательно использовать именно эти названия.<br>Адаптируй naming к текущему проекту.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R052 | «Главное:<br>страницы должны использовать семантические роли, а не собственные случайные размеры.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R053 | «LEVEL 3 — OPTIONAL PAGE OVERRIDES» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R054 | «Иногда конкретной странице может понадобиться небольшое отличие.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R055 | «Например:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R056 | «Archive может иметь чуть другой display scale.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R057 | «Formats может иметь более компактный product title.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R058 | «В таком случае допускаются scoped aliases / overrides.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R059 | «Концептуально:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R060 | «.page-archive {<br>    --page-display-size: var(--tc-type-display-xl-size);<br>}» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R061 | «или:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R062 | «--archive-title-size<br>--formats-product-title-size» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R063 | «НО:» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R064 | «не создавай полный отдельный набор typography variables для каждой страницы.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R065 | «80–90% typography должны оставаться глобальными.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R066 | «Page overrides нужны только для осознанных исключений.» | done | Бриф: 3. АРХИТЕКТУРА TYPOGRAPHY | T01 → spec: 3. АРХИТЕКТУРА TYPOGRAPHY |
| R067 | «Сохрани архитектуру проекта, если она уже существует.» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R068 | «Логически должно быть примерно:» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R069 | «styles/<br>    design-tokens.css<br>    typography.css<br>    layout.css<br>    globals.css» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R070 | «или текущий аналог.» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R071 | «При необходимости можно добавить:» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R072 | «page-tokens.css» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R073 | «для небольшого количества page-specific overrides.» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R074 | «Но НЕ:» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R075 | «formats.css с независимой типографикой<br>archive.css с другой типографикой<br>start.css с третьей типографикой» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R076 | «Общая система важнее.» | done | Бриф: 4. ФАЙЛЫ СТИЛЕЙ | T01 → spec: 4. ФАЙЛЫ СТИЛЕЙ |
| R077 | «Typography должна централизованно поддерживать минимум:» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R078 | «desktop<br>mobile» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R079 | «и tablet, если он уже используется системой.» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R080 | «Предпочтительно через:» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R081 | «clamp()» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R082 | «или централизованные media queries.» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R083 | «Не дублируй responsive typography в каждом page component.» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R084 | «Цель:» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R085 | «если позже я изменю:» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R086 | «H1 96px → 88px» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R087 | «или:» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R088 | «serif A → serif B» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R089 | «из одного design system файла,» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R090 | «изменение должно автоматически распространиться на все соответствующие страницы.» | done | Бриф: 5. RESPONSIVE TYPOGRAPHY | T01 → spec: 5. RESPONSIVE TYPOGRAPHY |
| R091 | «Все страницы должны продолжать визуальный язык /test_5.» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R092 | «Travel Club — это:» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R093 | «LIVING TRAVEL PUBLICATION.» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R094 | «Стиль:» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R095 | «- contemporary editorial;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R096 | «- independent magazine;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R097 | «- cultural travel;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R098 | «- young;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R099 | «- clean;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R100 | «- characterful;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R101 | «- немного fashion;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R102 | «- без luxury-пафоса.» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R103 | «Использовать:» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R104 | «- asymmetric editorial grid;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R105 | «- сильную typography hierarchy;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R106 | «- большие serif/display headlines;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R107 | «- небольшой grotesk metadata;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R108 | «- numbers;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R109 | «- thin rules;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R110 | «- captions;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R111 | «- controlled whitespace;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R112 | «- фотографии разных размеров;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R113 | «- editorial composition;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R114 | «- плотность там, где она оправдана.» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R115 | «Не превращать страницы в:» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R116 | «- SaaS landing;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R117 | «- Tilda travel page;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R118 | «- карточки с большими border-radius;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R119 | «- обычное турагентство;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R120 | «- generic corporate website;» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R121 | «- luxury resort site.» | done | Бриф: 6. ОБЩИЙ VISUAL DNA | T01 → spec: 6. ОБЩИЙ VISUAL DNA |
| R122 | «На этих страницах у тебя есть больше визуальной свободы.» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R123 | «Если видишь хорошую идею:» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R124 | «- необычная editorial composition;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R125 | «- scroll detail;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R126 | «- subtle hover;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R127 | «- typographic transition;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R128 | «- image reveal;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R129 | «- sticky metadata;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R130 | «- horizontal editorial element;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R131 | «- subtle page transition;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R132 | «- archival indexing;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R133 | «- experimental composition;» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R134 | «можешь попробовать её реализовать.» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R135 | «НО соблюдай правила:» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R136 | «1. Сайт должен хорошо выглядеть на статичном screenshot без анимации.<br>2. Art direction важнее motion.<br>3. Максимум одна заметная механика на страницу.<br>4. Motion не должен мешать чтению.<br>5. Не добавляй WebGL / Three.js / тяжёлые библиотеки без серьёзной причины.<br>6. Не делай эффекты только потому, что можешь.<br>7. Не копируй Living Issue animation с homepage на остальные страницы.<br>8. Каждая страница может иметь собственный характер, но должна оставаться Travel Club.» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R137 | «Если идея сомнительная:<br>лучше сделать subtle implementation, чем сложный эффект.» | done | Бриф: 7. CREATIVE FREEDOM | T01 → spec: 7. CREATIVE FREEDOM |
| R138 | «По возможности переиспользуй или создай reusable components для:» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R139 | «- SiteHeader;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R140 | «- SiteFooter;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R141 | «- BackToHome / logo link;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R142 | «- EditorialLabel;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R143 | «- SectionHeading;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R144 | «- MetadataRow;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R145 | «- Rule;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R146 | «- CTA;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R147 | «- FormField;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R148 | «- PageIntro;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R149 | «- ArchiveEntry;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R150 | «- LegalNavigation;» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R151 | «или эквивалентных элементов.» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R152 | «Не создавай огромную abstraction layer ради нескольких страниц.» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R153 | «Нужен pragmatically reusable code.» | done | Бриф: 8. ОБЩИЕ COMPONENTS | T01 → spec: 8. ОБЩИЕ COMPONENTS |
| R154 | «На новых страницах используй общую навигационную систему.» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R155 | «Логотип / TRAVEL CLUB должен вести на:» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R156 | «/test_5» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R157 | «поскольку это текущая homepage для этой экспериментальной версии.» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R158 | «Также должна быть понятная навигация как минимум:» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R159 | «FORMATS<br>ARCHIVE<br>START» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R160 | «Юридические ссылки можно оставить в footer.» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R161 | «Не перегружай navbar.» | done | Бриф: 9. NAVIGATION | T01 → spec: 9. NAVIGATION |
| R162 | «После создания новых routes аккуратно обнови релевантные ссылки текущей /test_5.» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R163 | «Например:» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R164 | «"Форматы"<br>→ /formats» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R165 | «"Архив"<br>→ /archive» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R166 | «"Начать историю"<br>"Обсудить поездку"<br>"Давайте обсудим"<br>и аналогичные primary application CTA<br>→ /start» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R167 | «"Документы"<br>→ /legal» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R168 | «Privacy links, если существуют<br>→ /privacy» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R169 | «Personal data links<br>→ /personal-data» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R170 | «Не заменяй все ссылки механически.» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R171 | «Сначала пойми их смысл.» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R172 | «Не меняй visual design homepage ради новой navigation.» | done | Бриф: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 | T02 → spec: 10. ОБНОВИТЬ ССЫЛКИ НА /test_5 |
| R173 | «ЦЕЛЬ:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R174 | «понятно и конкретно объяснить три основных продукта Travel Club.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R175 | «Это одна из главных коммерческих страниц.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R176 | «Страница должна быть заметно конкретнее, чем философские блоки homepage.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R177 | «Структура ориентировочно:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R178 | «HERO» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R179 | «FORMATS<br>Три способа путешествовать с Travel Club.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R180 | «Короткое пояснение.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R181 | «01<br>МАРШРУТ» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R182 | «editorial label:<br>GIVE ME THE PLAN.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R183 | «Суть:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R184 | «Мы проектируем индивидуальную поездку:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R185 | «- маршрут;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R186 | «- районы;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R187 | «- логистику;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R188 | «- места;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R189 | «- культурную программу;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R190 | «- рекомендации;» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R191 | «- ориентировочный бюджет.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R192 | «Клиент самостоятельно бронирует и оплачивает поставщиков.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R193 | «Покажи:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R194 | «WHAT YOU GET<br>HOW IT WORKS<br>WHO IT'S FOR» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R195 | «CTA:<br>Обсудить маршрут» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R196 | «02<br>ПОД КЛЮЧ» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R197 | «editorial label:<br>TAKE CARE OF IT.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R198 | «Суть:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R199 | «Мы проектируем поездку и берём на себя большую часть организационной подготовки и координации.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R200 | «Не придумывай юридические обещания или функции, которых ещё нет.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R201 | «CTA:<br>Обсудить поездку» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R202 | «03<br>В КОМПАНИИ» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R203 | «editorial label:<br>I WANT IN.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R204 | «Небольшие групповые поездки.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R205 | «Ориентир:<br>6–9 человек.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R206 | «Ключевая идея:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R207 | «Мы собираем не группу туристов, а компанию и продюсируем для неё путешествие.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R208 | «CTA:<br>Смотреть поездки / Оставить интерес» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R209 | «Если /trips ещё не существует, не создавай broken link.<br>Веди CTA на /start с подходящим context/query parameter или обычный /start.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R210 | «После продуктов:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R211 | «PROCESS» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R212 | «Например:» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R213 | «01 / Знакомимся<br>02 / Проектируем<br>03 / Согласуем<br>04 / Отправляемся» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R214 | «Используй конкретный язык.» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R215 | «FINAL CTA<br>→ /start» | done | Бриф: 11. PAGE /formats | T02 → spec: 11. PAGE /formats |
| R216 | «ЦЕЛЬ:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R217 | «единый архив завершённых travel stories Travel Club.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R218 | «Важно:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R219 | «Thailand ’26 и China ’26 — НЕ коммерческие Issues Travel Club.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R220 | «Это FIELD NOTES:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R221 | «реальные поездки команды / друзей до публичного запуска Travel Club.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R222 | «Не называй их проведёнными турами.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R223 | «Текущий контент:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R224 | «2026» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R225 | «FIELD NOTE» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R226 | «THAILAND ’26<br>ISLANDS → BANGKOK<br>4 PEOPLE» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R227 | «FIELD NOTE» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R228 | «CHINA ’26<br>BEIJING → SHANGHAI<br>4 FRIENDS<br>+ 2 LOCAL FRIENDS IN BEIJING» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R229 | «Можно также предусмотреть визуальное место для:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R230 | «2025» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R231 | «CHINA ’25<br>MADAGASCAR ’25<br>THAILAND ’25» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R232 | «Но если отдельные страницы для них сейчас отсутствуют:<br>не создавай broken links и не придумывай детали.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R233 | «Архитектура Archive должна масштабироваться в будущем:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R234 | «FIELD NOTE<br>=<br>до публичного Travel Club» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R235 | «ISSUE<br>=<br>официальная завершённая поездка Travel Club.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R236 | «Например в будущем:» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R237 | «ISSUE 01<br>SHANGHAI<br>2027» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R238 | «может находиться в том же архиве.» | done | Бриф: 12. PAGE /archive | T02 → spec: 12. PAGE /archive |
| R239 | «Эта страница особенно подходит для творческой интерпретации.» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R240 | «Можно рассмотреть:» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R241 | «- magazine index;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R242 | «- archive catalogue;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R243 | «- years as large editorial markers;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R244 | «- issue numbers;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R245 | «- vertical chronology;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R246 | «- photographic contact sheet;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R247 | «- subtle archival hover;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R248 | «- route metadata;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R249 | «- image → metadata → line → phrase;» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R250 | «- разные размеры preview.» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R251 | «Но:» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R252 | «не делай банальную сетку одинаковых карточек 3x3, если можно сделать более editorial решение.» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R253 | «При этом navigation должна оставаться очевидной.» | done | Бриф: 13. CREATIVE DIRECTION /archive | T02 → spec: 13. CREATIVE DIRECTION /archive |
| R254 | «Если страницы Thailand ’26 и China ’26 уже существуют в проекте:<br>используй их реальные routes.» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R255 | «Если их ещё нет:<br>не создавай полноценные новые Field Note pages в рамках этой задачи.» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R256 | «Карточки можно:» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R257 | «- оставить визуально без ссылки;» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R258 | «или» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R259 | «- сделать disabled/"страница готовится";» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R260 | «но лучше избегать ощущения сломанного сайта.» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R261 | «В финальном отчёте укажи, какие destinations пока не имеют detail pages.» | done | Бриф: 14. LINKS ИЗ ARCHIVE | T02 → spec: 14. LINKS ИЗ ARCHIVE |
| R262 | «ЦЕЛЬ:» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R263 | «простая и понятная точка входа в Travel Club.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R264 | «Страница должна быть менее метафоричной и более функциональной.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R265 | «HERO:» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R266 | «START YOUR STORY» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R267 | «или русская основная формулировка:» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R268 | «Начнём с разговора.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R269 | «Можно без точного плана.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R270 | «Достаточно желания куда-то поехать.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R271 | «Сначала выбор:» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R272 | «ЧТО ВАМ НУЖНО?» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R273 | «[ МАРШРУТ ]<br>[ ПОД КЛЮЧ ]<br>[ ХОЧУ В ГРУППУ ]» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R274 | «Далее форма.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R275 | «Минимальные поля:» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R276 | «- выбранный формат;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R277 | «- куда хотите поехать;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R278 | «- когда;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R279 | «- количество человек;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R280 | «- ориентировочный бюджет, если уместно;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R281 | «- комментарий / пожелания;» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R282 | «- contact.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R283 | «Contact должен позволять понятный формат:<br>Telegram / phone / email в зависимости от существующей системы.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R284 | «Не усложняй форму.» | done | Бриф: 15. PAGE /start | T03 → spec: 15. PAGE /start |
| R285 | «Сначала изучи существующую форму /test_5.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R286 | «Если backend submission уже реализован:<br>переиспользуй существующий безопасный mechanism.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R287 | «Если backend submission НЕ существует:<br>не придумывай backend.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R288 | «Для prototype можно:» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R289 | «- валидировать обязательные поля client-side;» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R290 | «- после submit переводить на /thanks;» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R291 | «- но ясно оставить код так, чтобы он не создавал ложное впечатление реального сохранения данных.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R292 | «Не отправляй персональные данные неизвестно куда.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R293 | «Не создавай новую БД.» | done | Бриф: 16. FORM BEHAVIOR | T03 → spec: 16. FORM BEHAVIOR |
| R294 | «Если не создаёт лишней сложности, поддержи ссылки вроде:» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R295 | «/start?format=route<br>/start?format=complete<br>/start?format=group» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R296 | «Чтобы CTA с /formats могла сразу выбрать нужный формат.» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R297 | «Например:» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R298 | «Маршрут<br>→ /start?format=route» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R299 | «Под ключ<br>→ /start?format=complete» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R300 | «В компании<br>→ /start?format=group» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R301 | «На странице /start соответствующая опция становится selected.» | done | Бриф: 17. QUERY CONTEXT | T03 → spec: 17. QUERY CONTEXT |
| R302 | «Очень простая страница.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R303 | «Цель:<br>подтвердить завершение действия и вернуть человека в TC.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R304 | «Например:» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R305 | «ЗАЯВКА ПОЛУЧЕНА» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R306 | «История начинается с разговора.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R307 | «Если форма реально отправляет данные:<br>можно кратко объяснить следующий шаг.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R308 | «Если это пока prototype:<br>не писать ложное:» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R309 | «"мы получили ваши данные"» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R310 | «если они на самом деле никуда не отправлены.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R311 | «В таком случае используй нейтральный prototype-safe текст.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R312 | «CTA:» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R313 | «Вернуться в Travel Club<br>→ /test_5» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R314 | «Можно добавить:» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R315 | «Посмотреть архив<br>→ /archive» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R316 | «Не перегружать страницу.» | done | Бриф: 18. PAGE /thanks | T01 → spec: 18. PAGE /thanks |
| R317 | «Сделай branded 404 через стандартный механизм текущего Next.js router.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R318 | «Если используется App Router:<br>проверь существующий not-found.tsx и корректно реализуй его.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R319 | «Если используется Pages Router:<br>используй соответствующую архитектуру.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R320 | «Не ломай глобальные routes.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R321 | «Визуальный тон:» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R322 | «editorial + немного характера.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R323 | «Можно использовать copy уровня:» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R324 | «404» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R325 | «Этой страницы нет в маршруте.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R326 | «или другую короткую формулировку в tone of voice TC.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R327 | «CTA:» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R328 | «Вернуться в Travel Club<br>→ /test_5» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R329 | «Вторая ссылка:<br>Archive<br>→ /archive» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R330 | «404 должна оставаться функциональной, а не art experiment.» | done | Бриф: 19. CUSTOM 404 | T01 → spec: 19. CUSTOM 404 |
| R331 | «Это index / hub юридических страниц.» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R332 | «Не придумывай юридические документы.» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R333 | «Структура:» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R334 | «LEGAL» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R335 | «Документы Travel Club» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R336 | «→ Политика конфиденциальности<br>/privacy» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R337 | «→ Обработка персональных данных<br>/personal-data» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R338 | «Можно предусмотреть место для будущих:» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R339 | «- оферта;» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R340 | «- реквизиты;» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R341 | «- договор;» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R342 | «- правила оплаты / возврата;» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R343 | «но не писать их содержание без исходных данных.» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R344 | «Если документ ещё не готов:<br>не изображай его как действующий.» | done | Бриф: 20. PAGE /legal | T01 → spec: 20. PAGE /legal |
| R345 | «Создай визуально готовый legal page template.» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R346 | «НО:» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R347 | «не придумывай юридически значимый текст.» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R348 | «Если в проекте уже есть действующая политика:<br>используй существующий текст.» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R349 | «Если её нет:<br>создай структуру страницы с явно обозначенным placeholder content:» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R350 | «Политика конфиденциальности» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R351 | «[Документ находится в подготовке.]» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R352 | «или аналогичный честный статус.» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R353 | «Можно создать headings / layout под будущий документ:» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R354 | «1. Общие положения<br>2. Какие данные обрабатываются<br>3. Цели обработки<br>4. Хранение<br>5. Права пользователя<br>6. Контакты» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R355 | «НО не заполняй разделы юридическими утверждениями от себя.» | done | Бриф: 21. PAGE /privacy | T01 → spec: 21. PAGE /privacy |
| R356 | «Та же логика.» | done | Бриф: 22. PAGE /personal-data | T01 → spec: 22. PAGE /personal-data |
| R357 | «Это template для будущего документа по обработке персональных данных.» | done | Бриф: 22. PAGE /personal-data | T01 → spec: 22. PAGE /personal-data |
| R358 | «Не писать юридический текст из головы.» | done | Бриф: 22. PAGE /personal-data | T01 → spec: 22. PAGE /personal-data |
| R359 | «Если существующий документ найден в проекте:<br>можно использовать его.» | done | Бриф: 22. PAGE /personal-data | T01 → spec: 22. PAGE /personal-data |
| R360 | «Если нет:<br>показывать честный статус подготовки.» | done | Бриф: 22. PAGE /personal-data | T01 → spec: 22. PAGE /personal-data |
| R361 | «Legal pages должны оставаться частью Travel Club, но здесь приоритет:» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R362 | «READABILITY > ART DIRECTION.» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R363 | «Используй:» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R364 | «- хороший text column;» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R365 | «- clear headings;» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R366 | «- metadata;» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R367 | «- table of contents при необходимости;» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R368 | «- thin rules;» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R369 | «- clear back navigation.» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R370 | «Не использовать сложные animations.» | done | Бриф: 23. LEGAL DESIGN | T01 → spec: 23. LEGAL DESIGN |
| R371 | «Сделай общий подход для новых страниц.» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R372 | «HEADER:» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R373 | «TRAVEL CLUB<br>→ /test_5» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R374 | «Formats<br>→ /formats» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R375 | «Archive<br>→ /archive» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R376 | «Start<br>→ /start» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R377 | «Не обязательно использовать именно эти английские labels.<br>Сначала посмотри navigation /test_5 и сохрани её язык.» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R378 | «FOOTER:» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R379 | «Travel Club<br>Formats<br>Archive<br>Start» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R380 | «Legal<br>Privacy<br>Personal Data» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R381 | «© 2026 Travel Club» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R382 | «Не придумывай соцсети / контакты, которых нет.» | done | Бриф: 24. HEADER / FOOTER | T01 → spec: 24. HEADER / FOOTER |
| R383 | «Основной язык:<br>русский.» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R384 | «English допустим как metadata:» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R385 | «FORMATS<br>FIELD NOTES<br>ARCHIVE<br>START YOUR STORY<br>LEGAL<br>ISSUE» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R386 | «Не превращай страницы в хаотичный русско-английский микс.» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R387 | «Тон:» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R388 | «- короткий;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R389 | «- конкретный;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R390 | «- уверенный;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R391 | «- молодой;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R392 | «- editorial;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R393 | «- без рекламного пафоса.» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R394 | «Не использовать:» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R395 | «- незабываемое путешествие;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R396 | «- уникальный тур;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R397 | «- путешествие мечты;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R398 | «- море эмоций;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R399 | «- лучшие цены;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R400 | «- успейте;» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R401 | «- luxury experience.» | done | Бриф: 25. COPY / TONE OF VOICE | T01 → spec: 25. COPY / TONE OF VOICE |
| R402 | «Сейчас одна из задач Travel Club:<br>стать конкретнее.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R403 | «Поэтому новые страницы НЕ должны превращаться в ещё один сборник афоризмов.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R404 | «Каждая страница должна иметь ясную задачу.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R405 | «FORMATS:<br>что мы делаем.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R406 | «ARCHIVE:<br>что мы уже прожили.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R407 | «START:<br>как начать.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R408 | «LEGAL:<br>документы.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R409 | «THANKS:<br>что произошло дальше.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R410 | «404:<br>как вернуться.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R411 | «Editorial language поддерживает информацию, а не заменяет её.» | done | Бриф: 26. НЕ ПЕРЕГРУЖАТЬ COPY | T01 → spec: 26. НЕ ПЕРЕГРУЖАТЬ COPY |
| R412 | «Если для page composition нужны изображения:» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R413 | «переиспользуй текущие изображения проекта / existing placeholders.» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R414 | «Не добавляй случайные новые stock images без необходимости.» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R415 | «Image slots должны использовать:» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R416 | «- fixed aspect ratio;» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R417 | «- overflow hidden;» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R418 | «- object-fit: cover;» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R419 | «- responsive sizing.» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R420 | «Не строить layout под размеры конкретного файла.» | done | Бриф: 27. IMAGE USAGE | T01 → spec: 27. IMAGE USAGE |
| R421 | «Creative freedom разрешена.» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R422 | «Но используй существующий motion stack проекта.» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R423 | «Не устанавливай новую dependency без необходимости.» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R424 | «Допустимы:» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R425 | «- subtle reveal;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R426 | «- text/image transition;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R427 | «- hover;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R428 | «- sticky editorial detail;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R429 | «- archive motion;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R430 | «- small parallax;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R431 | «- number / metadata interaction.» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R432 | «Не допустимы без веской причины:» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R433 | «- custom cursor;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R434 | «- particles;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R435 | «- WebGL;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R436 | «- 3D globe;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R437 | «- aggressive scroll-jacking;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R438 | «- giant page transitions;» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R439 | «- autoplay sound.» | done | Бриф: 28. ANIMATION | T01 → spec: 28. ANIMATION |
| R440 | «Обязательно:» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R441 | «- semantic HTML;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R442 | «- keyboard navigation;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R443 | «- visible focus states;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R444 | «- form labels;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R445 | «- alt text;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R446 | «- reasonable contrast;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R447 | «- prefers-reduced-motion;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R448 | «- links должны быть links;» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R449 | «- buttons должны быть buttons.» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R450 | «Не жертвуй accessibility ради editorial style.» | done | Бриф: 29. ACCESSIBILITY | T01 → spec: 29. ACCESSIBILITY |
| R451 | «Каждая новая страница должна быть проверена минимум:» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R452 | «1440px<br>1280px<br>768px<br>390px» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R453 | «Не просто уменьшай desktop layout.» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R454 | «Editorial composition должна нормально перестраиваться на mobile.» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R455 | «Особенно проверить:» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R456 | «- display headings;» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R457 | «- nav;» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R458 | «- forms;» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R459 | «- archive;» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R460 | «- long legal copy.» | done | Бриф: 30. RESPONSIVE | T01 → spec: 30. RESPONSIVE |
| R461 | «В рамках этой задачи НЕ создавать:» | done | Бриф: 31. НЕ СОЗДАВАТЬ ПОКА | T01 → spec: 31. НЕ СОЗДАВАТЬ ПОКА |
| R462 | «/about<br>/club<br>/events<br>/journal<br>/move<br>/trips» | done | Бриф: 31. НЕ СОЗДАВАТЬ ПОКА | T01 → spec: 31. НЕ СОЗДАВАТЬ ПОКА |
| R463 | «и полноценные Thailand / China detail pages, если их ещё нет.» | done | Бриф: 31. НЕ СОЗДАВАТЬ ПОКА | T01 → spec: 31. НЕ СОЗДАВАТЬ ПОКА |
| R464 | «Не расширять scope.» | done | Бриф: 31. НЕ СОЗДАВАТЬ ПОКА | T01 → spec: 31. НЕ СОЗДАВАТЬ ПОКА |
| R465 | «Не переделывать:» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R466 | «- Living Issue;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R467 | «- hero animation /test_5;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R468 | «- homepage layout;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R469 | «- existing Field Notes;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R470 | «- homepage copy;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R471 | «- Design System Playground;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R472 | «- backend;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R473 | «- database;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R474 | «- admin;» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R475 | «- constructor.» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R476 | «Можно изменить на /test_5 только ссылки/navigation, необходимые для соединения новых страниц.» | done | Бриф: 32. НЕ МЕНЯТЬ | T01 → spec: 32. НЕ МЕНЯТЬ |
| R477 | «После реализации проверь следующий сценарий.» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R478 | «Если изменить в одном центральном design token:» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R479 | «-- основной serif font» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R480 | «или:» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R481 | «-- H1 size» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R482 | «или:» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R483 | «-- body size» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R484 | «или:» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R485 | «-- Cloud color» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R486 | «это изменение должно корректно распространяться на все новые страницы, где используется соответствующая semantic role.» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R487 | «Если приходится менять 7 page-specific CSS файлов вручную:<br>архитектура сделана неправильно.» | done | Бриф: 33. REUSABILITY TEST | T01 → spec: 33. REUSABILITY TEST |
| R488 | «Допустимы только там, где реально нужны.» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R489 | «Например:» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R490 | «/archive может иметь:» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R491 | «--page-display-scale» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R492 | «/formats:» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R493 | «--product-heading-scale» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R494 | «Но такие overrides должны:» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R495 | «- находиться централизованно;» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R496 | «- иметь понятные имена;» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R497 | «- наследоваться от base tokens;» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R498 | «- не дублировать всю систему.» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R499 | «Пожалуйста, не создавай:» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R500 | «--formats-h1-font<br>--archive-h1-font<br>--start-h1-font<br>--thanks-h1-font» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R501 | «если они все фактически одинаковые.» | done | Бриф: 34. PAGE-SPECIFIC OVERRIDES | T01 → spec: 34. PAGE-SPECIFIC OVERRIDES |
| R502 | «После реализации:» | done | Бриф: 35. QA | T01 → spec: 35. QA |
| R503 | «1. Запусти проект.<br>2. Проверь /test_5.<br>3. Проверь /formats.<br>4. Проверь /archive.<br>5. Проверь /start.<br>6. Проверь /thanks.<br>7. Проверь /legal.<br>8. Проверь /privacy.<br>9. Проверь /personal-data.<br>10. Открой несуществующий URL и проверь custom 404.<br>11. Проверь все navigation links.<br>12. Проверь возврат на /test_5.<br>13. Проверь CTA /test_5 → новые pages.<br>14. Проверь browser console.<br>15. Проверь mobile.<br>16. Проверь desktop.<br>17. Проверь keyboard navigation.<br>18. Проверь forms.<br>19. Проверь query format на /start, если реализовано.<br>20. Проверь отсутствие broken links.» | done | Бриф: 35. QA | T01 → spec: 35. QA |
| R504 | «Если доступны browser / screenshot tools:<br>обязательно проведи visual QA.» | done | Бриф: 35. QA | T01 → spec: 35. QA |
| R505 | «После первой рабочей версии не останавливайся.» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R506 | «Отдельно оцени каждую страницу как дизайнер.» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R507 | «Проверь:» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R508 | «- visual hierarchy;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R509 | «- typography rhythm;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R510 | «- whitespace;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R511 | «- слишком длинные строки;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R512 | «- повторяемость layouts;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R513 | «- image scale;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R514 | «- section transitions;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R515 | «- CTA visibility;» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R516 | «- mobile composition.» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R517 | «Особенно следи, чтобы страницы не превратились в:» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R518 | «headline<br>→ paragraph<br>→ 3 cards<br>→ next section» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R519 | «Используй editorial composition.» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R520 | «Если страница выглядит слишком generic:<br>сделай один refinement pass.» | done | Бриф: 36. REFINEMENT PASS | T01 → spec: 36. REFINEMENT PASS |
| R521 | «Работа закончена, когда:» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R522 | «- /formats существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R523 | «- /archive существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R524 | «- /start существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R525 | «- /thanks существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R526 | «- /legal существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R527 | «- /privacy существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R528 | «- /personal-data существует;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R529 | «- branded 404 работает;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R530 | «- все routes responsive;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R531 | «- все используют общую typography/design token систему;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R532 | «- page-specific overrides минимальны и централизованы;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R533 | «- изменение базовой typography автоматически влияет на страницы;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R534 | «- /test_5 связана с новыми routes;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R535 | «- новые страницы связаны обратно с /test_5;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R536 | «- нет broken links;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R537 | «- legal content не выдуман;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R538 | «- Field Notes не названы прошедшими коммерческими турами;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R539 | «- unrelated routes не затронуты;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R540 | «- console чистая;» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R541 | «- visual refinement выполнен.» | done | Бриф: 37. DEFINITION OF DONE | T01 → spec: 37. DEFINITION OF DONE |
| R542 | «После этой работы должно возникнуть ощущение:» | done | Бриф: 38. ГЛАВНЫЙ КРИТЕРИЙ | T01 → spec: 38. ГЛАВНЫЙ КРИТЕРИЙ |
| R543 | «это уже не одна красивая homepage с несколькими техническими страницами.» | done | Бриф: 38. ГЛАВНЫЙ КРИТЕРИЙ | T01 → spec: 38. ГЛАВНЫЙ КРИТЕРИЙ |
| R544 | «Это начало единого сайта Travel Club.» | done | Бриф: 38. ГЛАВНЫЙ КРИТЕРИЙ | T01 → spec: 38. ГЛАВНЫЙ КРИТЕРИЙ |
| R545 | «При этом все страницы должны быть достаточно системными, чтобы после моего выбора финальной typography я мог изменить несколько central tokens и быстро обновить весь сайт.» | done | Бриф: 38. ГЛАВНЫЙ КРИТЕРИЙ | T01 → spec: 38. ГЛАВНЫЙ КРИТЕРИЙ |
| R546 | «В финальном отчёте напиши кратко:» | done | Бриф: 39. ПОСЛЕ ВЫПОЛНЕНИЯ | T01 → spec: 39. ПОСЛЕ ВЫПОЛНЕНИЯ |
| R547 | «1. какие routes созданы;<br>2. какие файлы созданы;<br>3. какие существующие файлы изменены;<br>4. как устроена централизованная typography;<br>5. где находятся base design tokens;<br>6. где находятся page-specific overrides;<br>7. какие reusable components созданы;<br>8. какие ссылки на /test_5 обновлены;<br>9. как работает /start;<br>10. отправляет ли форма реальные данные или пока является prototype;<br>11. как реализована 404;<br>12. какие creative visual ideas были добавлены;<br>13. какие responsive/visual QA проверки выполнены;<br>14. какие страницы или данные пока являются placeholders.» | done | Бриф: 39. ПОСЛЕ ВЫПОЛНЕНИЯ | T01 → spec: 39. ПОСЛЕ ВЫПОЛНЕНИЯ |
| R548 | «Не присылай большой листинг кода.» | done | Бриф: 39. ПОСЛЕ ВЫПОЛНЕНИЯ | T01 → spec: 39. ПОСЛЕ ВЫПОЛНЕНИЯ |
| R549 | «Сначала реализуй, запусти, проверь navigation и сделай visual refinement.» | done | Бриф: 39. ПОСЛЕ ВЫПОЛНЕНИЯ | T01 → spec: 39. ПОСЛЕ ВЫПОЛНЕНИЯ |

## Самобрифинг

ASSUMPTION: реальной отправки нет; новый прототип не сохраняет и не передаёт данные. Юридические тексты и detail pages не выдумываются. Используем BASE_TOKENS Playground, не меняя Playground и его draft. Новые стили scoped, /test_5 меняется только в ссылках.

G1: нет open.

| D01 | Нативный HTML form GET без JavaScript передаёт contact в URL; выявлено контролируемой privacy-проверкой, запрос перехвачен до передачи | done | Защищает требования prototype без отправки и персональных данных в URL; spec D01 | T03 |
