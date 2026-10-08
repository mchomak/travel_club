# Требования

| ID | Дословно | Статус | Проверка |
|---|---|---|---|
| R01 | «сделай анимацию более плавной» | done | eased phases + короткое frame-rate independent smoothing; native/reverse/fast scroll QA |
| R02 | «вторая страница журнала (которая правая при открытии) сделай чтобы она была страницей сайта» | done | раскрытый spread показывает реальный живой hero, без China-overlay |
| R03 | «возьми верхний экран сайта и вставиь его в журнал» | done | navbar, TRAVEL CLUB, headline, summary и hero photography видны в миниатюре |
| R04 | «чтобы при прилженеии он как бы расскрывался» | done | те же DOM элементы непрерывно переходят из right page в homepage |
| R05 | «коммит» | done | scoped local commit after verification |
| R06 | «пуш» | done | normal git push origin current branch; no force/history rewriting |
| R07 | «рестрат docker» | done | docker compose up -d --no-deps --build --wait frontend; actual target3000 QA |

Нет новых бизнес-систем, данных пользователя или незаказанных UI-возможностей. Проверки в spec связаны только с сохранением поведения существующего opening.
