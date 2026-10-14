# Манифест требований

Источник: `2026-10-14-brief.md`. Только пользователь отменяет требования.

| ID | Из брифа | Статус | Основание | Где |
|---|---|---|---|---|
| R01 | «делай страницу test_7» | done | Отдельный route /test_7 | c8beffb + browser/Docker/git evidence |
| R02 | «объеденим анимацию с test_6» | done | Сохраняем процедурную геометрию и автоматическую последовательность | c8beffb + browser/Docker/git evidence |
| R03 | «с выставленными мной настройками из файла test-6-settings.json» | done | JSON — источник всех чисел; без повторного подбора | c8beffb + browser/Docker/git evidence |
| R04 | «дизайном страницы с test_5» | done | Переиспользовать текущий EditorialHome и дизайн | c8beffb + browser/Docker/git evidence |
| R05 | «сначала нимация с test_6» | done | Intro запускается автоматически | c8beffb + browser/Docker/git evidence |
| R06 | «когда она заканчивается, то пользователь может скролить сайт» | done | До конца intro scroll не расходуется | c8beffb + browser/Docker/git evidence |
| R07 | «начинается приближение к правой последней странице» | done | Scroll управляет непрерывным camera focus | c8beffb + browser/Docker/git evidence |
| R08 | «которая и становиться сайтом, как на test_5» | done | Один живой DOM сохраняет состояние после передачи | c8beffb + browser/Docker/git evidence |
| R09 | «последнюю правую страницу в журнале нужно переделать, чтобы она была как на test_5» | done | На финальном листе виден макет настоящей homepage | c8beffb + browser/Docker/git evidence |
| R10 | «пересобери docker» | done | Production frontend на localhost:3000 | c8beffb + browser/Docker/git evidence |
| R11 | «сделай коммит» | done | Только относящиеся к работе файлы | c8beffb + browser/Docker/git evidence |
| R12 | «и пуш» | done | Обычный push текущей main; разрешён явно | c8beffb + browser/Docker/git evidence |
| R13i | «*(подразумевается)* отдельная test_7» | done | Сохранить контрольные test_5/test_6 и чужие изменения | c8beffb + browser/Docker/git evidence |
| R14i | «*(подразумевается)* как на test_5» | done | Reduced motion, обратная прокрутка, resize, skip и работа живого сайта | c8beffb + browser/Docker/git evidence |

## Самобрифинг — G1
Все 14 требований разрешены. Полный автомат; вопросов не требуется.
ASSUMPTION: новый route без лабораторной панели; один живой homepage; intro повторяется только при новой загрузке; обратный scroll возвращает открытый журнал, без повторного перелистывания.
ASSUMPTION: reduced motion, прямые hash и сбой WebGL открывают сайт; прежние route не меняются.
Предыдущие изменения test_6 — исходный материал, не повод включать весь грязный working tree в коммит.
