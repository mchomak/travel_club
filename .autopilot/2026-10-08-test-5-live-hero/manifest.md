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
| R08 | «левая стрнаица появляется слишком рано… должна появлять по тихоньку… страница которая двигается потом просто пропадает… реалистичное открывания журнала» | done | видимая левая editorial-страница раскрывается физически с обложкой и остаётся на месте, без преждевременного дубля и исчезающего белого листа |
| R09 | «правая страница… скачет вверх вних (подрагивает)… исправь это» | done | запись реальных кадров во время native wheel: website и right-paper frame имеют согласованную вертикальную позицию на opening/focus/merge, без обратных рывков |
| R10 | «смотри первый скрин, видишь в журнале у нас виден на правой странице только первый экран сайта, а дальше пусто, хотя по сути на сайте дальше идуту экраны (например второй скрин) можешь сделать так, чтобы на правой странице журнала в которую мы и приблежаемся, не была полупустой, а были заполнены следующими экранами сайта.» | done | implemented and visually verified: live Contents, formats and lead form fit within right page | spec follow-up → T03 |
| R11 | «после правок коммит пуш и пересборка docker» | done | commit 7f1d4d1 pushed to origin/main; frontend rebuilt and running | spec follow-up → T03 |
| R10 | «смотри первый скрин, видишь в журнале у нас виден на правой странице только первый экран сайта, а дальше пусто, хотя по сути на сайте дальше идуту экраны (например второй скрин) можешь сделать так, чтобы на правой странице журнала в которую мы и приблежаемся, не была полупустой, а были заполнены следующими экранами сайта.» | done | implemented and visually verified: live Contents, formats and lead form fit within right page | spec follow-up → T03 |
| R11 | «после правок коммит пуш и пересборка docker» | done | commit 7f1d4d1 pushed to origin/main; frontend rebuilt and running | spec follow-up → T03 |

Нет новых бизнес-систем, данных пользователя или незаказанных UI-возможностей. Проверки в spec связаны только с сохранением поведения существующего opening.
