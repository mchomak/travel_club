# T03 — независимая проверка и repair 1

Manifest+Spec reviewer `/root/spec_coverage`: все экраны, типы и правила в зоне T03 покрыты, кроме R311 / spec §17 — защита несохранённого ввода не учитывает черновики TripForm, DayForm, RatesForm и форму создания новой поездки. Закрытие/перезагрузка страницы до «Применить» теряет ввод без предупреждения. Это BLOCKING.

Craft reviewer `/root/foundation` независимо воспроизвёл DayForm: `beforeunload.defaultPrevented=false`. Он также подтвердил, что удаление неиспользуемого курса EUR при `items=[]` отклоняется сообщением «Нужен курс EUR». Второе замечание не блокирует само по себе, но repair 1 исправляет его вместе с формой курсов.

Автор `/root/trip_frontend_finish` получил оба условия с требованием red→green regression, защиты без ложных предупреждений после Save/Cancel и полного frontend test/lint/typecheck/build/browser прогона. История пользовательского смешанного commit `ff71816` не изменяется; repair получит отдельный коммит после повторного review.

## Повторная проверка repair 1

Оба независимых reviewer подтвердили защиту Trip/Day/Rates и удаление неиспользуемого курса, но нашли два остатка. Manifest+Spec — BLOCKING: заполненная new-trip форма теряется при нажатии кнопки «Выйти», поскольку guard перехватывает ссылки, а не logout action. Craft — `!!editing` в ItemForm предупреждает даже без изменений и после полного отката; исходное условие отсутствия ложных предупреждений не закрыто. Repair 2 назначен тому же автору с узким scope, целевыми browser regressions и полным прогоном.

## Итог после repair 2

Manifest+Spec reviewer: clean, F1/R311 и spec §17 выполнены. Craft reviewer: исходное условие ItemForm addressed, meaningful browser assertions, новых находок нет. Root независимо запустил Docker backend pytest 38 passed, frontend unit 5 passed и browser Playwright 14 passed. Автор подтвердил lint, typecheck, production и Docker frontend build/restart PASS. Итоговый frontend контракт записан в `interfaces.md`; T04 дополнительно проверит полный продукт по исходному брифу.
