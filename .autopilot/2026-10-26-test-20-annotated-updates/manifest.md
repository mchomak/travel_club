# Реестр требований

Источник: `2026-10-26-brief.md` и `2026-10-28-brief.md`. Статусы будут уточняться по мере прохождения этапов.

| ID | Требование (цитата пользователя) | Статус | Основание | Реализация |
|---|---|---|---|---|
| R01 | «надпись "люди места общие истории" убрать совсем» | done | `spec.md` §4 | concept-home.tsx; test-20-home.spec.ts |
| R02 | «надпись про иллюстративный кадр, тоже убрать» | done | `spec.md` §4 | concept-home.tsx; test-20-home.spec.ts |
| R03 | «уберем полоску между ценой и услугой» | done | `spec.md` §4 | concept-home.tsx; concept.module.css; test-20-home.spec.ts |
| R04 | «разместим цену чуть выше» | done | `spec.md` §4 | concept-home.tsx; concept.module.css; test-20-home.spec.ts |
| R05 | «переносила на страницу с более подробным описанием услуг» | done | `spec.md` §3.1, §4 | concept-home.tsx; public-site/formats.tsx; test-20-home.spec.ts |
| R06 | «например "подробнее"» | done | `spec.md` §4 | concept-home.tsx; test-20-home.spec.ts |
| R07 | «название на английском главное» | done | `spec.md` §4 | concept-home.tsx; concept.module.css |
| R08 | «описание на русском побочное, поменяй их местами» | done | `spec.md` §4 | concept-home.tsx; concept.module.css |
| R09 | «выдели названия услуг» | done | `spec.md` §4 | concept-home.tsx; concept.module.css |
| R10 | «текст "NEXT ISSUE" иконку и надпись сделать в другом цвете #F5E2A0» | done | `spec.md` §4 | design-tokens.ts; concept.module.css; test-20-home.spec.ts |
| R11 | «сделай этот экран более похожим на аналогичный экран с test_19 те же цвета на тех же надписях» | done | `spec.md` §3.4, §4 | design-tokens.ts; concept.module.css; test-20-home.spec.ts |
| R12 | «Расширь экран про Китай, чтобы тут было больше текста и фото» | done | `spec.md` §3.4, §4 | concept-home.tsx; concept.module.css; test-20-home.spec.ts |
| R13 | «Сделай его длиннее примерно на 30%» | done | `spec.md` §3.4, §4 | concept.module.css; concept-home.tsx; test-20-home.spec.ts |
| R14 | «Добавь обратно между Next issur и Китаем перебивку из небольшого описательного раздела FIELD NOTES как у нас было в test_19» | done | `spec.md` §3.4, §4 | concept-home.tsx; test-20-home.spec.ts |
| R15 | «Весь текст наверх, выровни по верхней границе фотографии» | done | `spec.md` §4 | concept.module.css; test-20-home.spec.ts |
| R16 | «Весь белый фон перекрасить в #F5F0DC» | done | Аннотация 9: `section#formats`; `spec.md` §3.5, §4 | design-tokens.ts; concept.module.css; test-20-home.spec.ts |
| R17 | «Вместо обычного текста, наш логотип» | done | `spec.md` §4 | concept-home.tsx; brand-logo.tsx |
| R18 | «добавить сюда кнопку для выбора языка» | done | `spec.md` §3.3, §4 | concept-home.tsx; concept.module.css; test-20-home.spec.ts |
| R19 | «планируются пока что русский английский и китайский упрощенный» | done | `spec.md` §3.3, §4 | concept-home.tsx; test-20-home.spec.ts |
| R20 | «Но переводить страницу не нужно, просто добавь стилизованную кнопку» | done | `spec.md` §3.3, §4 | concept-home.tsx; test-20-home.spec.ts |
| R21 | «скрин 1 - добавить подложку под цифру и название» | in-spec | ASSUMPTION — принято за пользователя: лёгкая светлая подложка только под номером и английским названием; оттенок строится от темы секции | `2026-10-28-spec.md` §Решение 1 |
| R22 | «скрин 2 и 3 - сделать текст "еще не на карте уже в планах" как он был изначально на test_13»; «Меняем только эту надпись остальное не трогаем» | in-spec | Одна подпись с точным текстом в левой нижней части постера; конфликтующая плашка убирается, остальные надписи не меняются | `2026-10-28-spec.md` §Решение 2 |
| R23 | «скрин 4 - перекрасить иконку» | in-spec | ASSUMPTION — принято за пользователя: использовать красный `#CE3C28` из `/test_13` только для иконки заметки | `2026-10-28-spec.md` §Решение 3 |
| R24 | «скрин 5 - перенести надпись 26 вверх справа от Таиланда» | in-spec | ASSUMPTION — принято за пользователя: переносится только `’26`; подпись остаётся снизу слева, адаптивная композиция не перекрывается | `2026-10-28-spec.md` §Решение 4 |
| R25 | «скрин 6 - для фона китая добавить узоры как на фото референсе» | in-spec | ASSUMPTION — принято за пользователя: локальный декоративный векторный мотив в приглушённых тонах под содержимым секции | `2026-10-28-spec.md` §Решение 5 |
| R26 | «выполни все правки, затем коммит и пуш в основную ветку» | in-spec | ASSUMPTION — основная ветка — `origin/master` (`origin/HEAD`); отправляется отдельный коммит прогона | `2026-10-28-spec.md` §Решение 6 |
