# Спецификация: карта и маршруты дня

## 1. Карта дня (R01–R03)

В закрытом конструкторе непосредственно под календарём отдельная секция «Маршрут дня» следует выбранному дню. Нумерованные места, начало/конец, fit bounds, всплывающая подпись и линии выбранных способов передвижения. Существующее сохранение и календарь остаются рабочими. При отсутствии ключа показывается понятная настройка и текстовый план с координатами; географическая подложка не имитируется. Без выбранных мест — приглашение добавить место к событию. На мобильном карточки участков складываются, карта не расширяет viewport. Клавиатурное управление и подписи всех контролов.

## 2. Места (R13–R16)

Событие получает основное место `map_place`; транспорт и события с окончанием в другом месте дополнительно `map_end_place`. Первое — место посещения/отправления, второе — прибытия. Обычный текст location и external_url сохраняются. Единый редактор места поддерживает поиск названия/адреса, Google Maps URL, ручной ввод широты/долготы, выбор/уточнение пина на карте и удаление привязки. Найденные/извлечённые данные подтверждает пользователь перед сохранением.

MapPlace = {name:string<=200,address:string<=500,latitude:number finite [-90,90],longitude:number finite [-180,180],provider:'geoapify'|'manual'|'google_link',provider_place_id?:string<=300,source_url?:string<=2000}. В базе JSONB value objects; существующим записям соответствует null. Google ссылки: allowlist Google Maps доменов; извлекать координаты выбранного места/query или адрес, центр viewport не принимать за место; opaque Place ID без координат не считать универсальным; короткие карты разрешать только bounded redirects по allowlist Google, запрет private addresses/credentials/arbitrary HTTP fetch. Нераспознаваемая ссылка даёт понятный переход к поиску/пину, не случайную точку. Нет фильтра стран. Ввод координат доступен без API-ключа.

## 3. Расчёты и подробности (R04–R07,R17,R18,R20,R23i)

Под картой для каждой соседней известной пары показывать имя A → имя Б и сравнительные кнопки «Машина / Пешком / Транспорт» с собственными км и временем. Выбранный режим определяет геометрию и сумму дня. При неизвестном месте не соединять события через него; показывать отсутствующие участки. Нулевой доступный результат не означает 0 км. Частичный итог явно неполный. Совпадающие координаты можно трактовать как «на месте» без запроса. Перемещение самолётом/поездом/автобусом и иным запланированным транспортом — отдельная часть плана с его расписанием, не автоматически рассчитанная дорога между origin/destination.

Geoapify map tiles через браузерный ключ, маршруты drive/walk/transit и поиск через защищённый backend с серверным ключом. Ключ карты возвращается через защищённый runtime config, не compile-time env. Каждый endpoint аутентифицирован. Предсказуемые DTO скрывают provider payload/ключи. Timeout, 429, некорректный ответ, отсутствие маршрута дают контролируемые статусы. Без ключей — provider_not_configured, исправные ввод/сохранение мест и текста плана. Никаких фиктивных результатов.

Расчёты запускаются по изменению координат/выбору дня, не каждому рендеру. Deduplicate запросы, ограничить параллельность до 2–3, debounce поиск и abort/ignore устаревшие ответы, избежать лишнего повторного расчёта при переключении выбранного режима. Краткоживущий frontend session cache по координатам+режиму; отсутствие расписания на дату события объяснить возле транспорта. Любые transit оценки маркировать «примерно»/«без гарантии расписания»; no-route честно «нет данных». Attribution Geoapify + OSM + выбранной подложки видим. Не обещать отсутствие платного перерасхода по мягкому лимиту.

## 4. Порядок и начало/конец (R08–R12)

Pure planner использует существующие local wall clock, explicit end_day_id и legacy end_time<start_time semantics. Ночёвка в отеле: начало D из check_in<D<=check_out; конец D из check_in<=D<check_out. Ночные arrivals в D приоритетнее обычного отеля, конечная точка ночного departure из D приоритетнее отеля следующей ночи. Для ночного события использовать map_end_place или map_place, если нет отдельного конца; после ночного транспорта origin/destination не путать. Несколько равноправных кандидатов — ambiguous state с вариантами; произвольный отель не выбирать. Неизвестное место кандидата показать с возможностью уточнения. Автоматическое решение объяснить текстом. Ручной override start/end можно выбрать из вариантов/событий или задать собственным редактором места; «Автоматически» сбрасывает override.

Основной порядок — время начала, затем position/id для стабильности; события без времени имеют сохраняемый ручной порядок (контролы вверх/вниз). События не оптимизируются географически. Присутствие hotels/overnight маршрута не должно удваивать остановки. Начало/конец и отсутствующие места сохраняют identity; mode preferences key по identity узлов, не по порядковому индексу.

## 5. Сохранение и конфигурация (R18,R19i,R23i,R24i)

Текущий TripInput aggregate остаётся единым источником сохранения. Item добавляет map_place/map_end_place; Day добавляет map_start/map_end и map_leg_modes:[{from_key,to_key,mode}]. Никаких authoritative финансовых изменений. Новые поля nullable/default, старые данные открываются без миграции значения; Alembic добавляет JSONB колонки. Все новые поля проходят save→read→draft→repeat-save→duplicate. При duplicate ссылки узлов с item UUID обновляются. Сокращение диапазона с заполненными только map overrides/preferences требует существующего destructive-confirmation пути. Клиентский preview и auth границы сохранены.

Runtime env: GEOAPIFY_API_KEY (секрет backend для search/reverse/routing), GEOAPIFY_MAPS_API_KEY (публично видимый ограниченный browser tiles key). Пустые значения поддерживаются; ни ключей, ни серверных адресов не выдумывать. Compose local/deploy передают backend обе переменные, .env.example только пустые значения. Документация объясняет две разные защиты: public website origins для tiles, outbound server public IP для backend; ключи не в чат. Защищённый config возвращает enabled флаги и только browser key.

R25 — Обновить воспроизводимую инструкцию Geoapify: аккаунт/Free проект, создание двух ключей, браузерные origins и backend egress IP ограничения, точные переменные локального .env, применение конфигурации Compose и проверка подключения/Statistics. Для текущего пользователя заполнение ключей и server-origin проверки остаются после предоставления данных локально, без пересылки секретов.

## Границы и швы

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| Backend Trip aggregate | MapPlace/DayMap и целостность | прежние CRUD с новыми DTO полями | JSONB, duplicate remapping, date guard |
| Backend maps | Geoapify и безопасные Google URL | GET /api/maps/config → {maps_key:string|null,search_enabled:boolean,routing_enabled:boolean}; GET /api/maps/search?q=… → {places:MapPlace[]}; GET /api/maps/reverse?latitude=…&longitude=… → {place:MapPlace}; POST /api/maps/resolve-link {url} → {place:MapPlace|null,query:string|null}; POST /api/maps/route {from:MapPlace,to:MapPlace,mode} → {status:'ok'|'unavailable',distance_m:number|null,duration_s:number|null,geometry:GeoJSON LineString|null,approximate:boolean,message:string|null} | ключ backend, provider HTTP/redirects/normalization |
| Frontend trip-map domain | inference, порядок, узлы/legs/итоги | buildDayRoute(trip:TripInput,dayId:string):DayRoutePlan; shared MapPlace/TravelMode/MapLegMode types; pure helpers | календарные детали/priority/identity |
| Frontend map UI | tiles и ввод/сравнение | LocationPicker(value,onChange), DayRouteMap(trip,dayId,onChange) | map library lifecycle/async cache/requests |

Domain plan shape: {nodes:RouteNode[],legs:RouteLeg[],start:BoundaryResolution,end:BoundaryResolution,warnings:string[]}. Node {key,label,place:MapPlace|null,itemId?:string,kind:'start'|'event'|'arrival'|'departure'|'end'}. Leg {key,from:RouteNode,to:RouteNode,mode:TravelMode,kind:'connection'|'scheduled',itemId?:string}. BoundaryResolution {source:'manual'|'hotel'|'overnight'|'ambiguous'|'none',explanation:string,candidates:{key,label,place:MapPlace|null}[],place:MapPlace|null}. UI/domain may extend fields with coordinated documentation, without breaking these stable signatures. Preference keys item:{uuid}:start|end, day:start|end. Shared frontend types/serialization/domain owned by domain tasк; backend schemas own mirror.

Тестовые швы: существующие aggregate CRUD + maps endpoint/provider HTTP; pure planner public API; editor/place picker RTL + browser flow with isolated deterministic API fixtures. Browser fixtures только в тестах, не в приложении.

## 6. Проверки, ограничения и вне рамок

Локально: backend pytest + Ruff; frontend lint/typecheck/Vitest/production build; migrations clean DB и upgrade сохранённых данных; targeted constructor/map Playwright с authenticated local API и перехваченными тестовыми Geoapify responses. Ключи отсутствуют: live Geoapify/search/transit quality tests объективно отложены до ключей, а не объявлены пройденными. Серверный deploy/реальные server-origin ограничения (R22) отложены по прямой инструкции пользователя. Никаких внешних публикаций/платных подписок.

Не входят: автоматическая географическая оптимизация, traffic/live-timetable гарантии, client-preview map, новый booking/pricing, глобальная GTFS инфраструктура.

## Покрытие

R01–R03 §1; R04–R07 §3; R08–R12 §4; R13–R16 §2; R17,R18,R20 §3; R19i §5; R21,R22 §6; R23i §3,5; R24i §5,6; R25 §5. Ни одно требование не dropped. Новых A-возможностей нет.
