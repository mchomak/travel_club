# Общие контракты

Прочитать полностью перед работой. Spec — spec.md. Только root обновляет этот файл.

## Границы, решённые в спецификации

- Trip aggregate: ItemInput map_place/map_end_place (nullable), DayInput map_start/map_end (nullable), map_leg_modes:[{from_key,to_key,mode}]. DB JSONB, DTO defaults, frontend новые свойства optional для legacy fixtures. DTO MapPlace {name:string<=200,address:string<=500,latitude:number [-90,90],longitude:number [-180,180],provider:'geoapify'|'manual'|'google_link',provider_place_id?:string<=300,source_url?:string<=2000}. TravelMode='drive'|'walk'|'transit'. Node keys item:{uuid}:start|end или day:start|end. Дополнительные свойства согласовать с root ДО записи.
- Backend maps: GET /api/maps/config → {maps_key:string|null,search_enabled:boolean,routing_enabled:boolean}; GET /api/maps/search?q → {places:MapPlace[]}; GET /api/maps/reverse?latitude&longitude → {place:MapPlace}; POST /api/maps/resolve-link {url} → {place:MapPlace|null,query:string|null}; POST /api/maps/route {from:MapPlace,to:MapPlace,mode} → {status:'ok'|'unavailable',distance_m:number|null,duration_s:number|null,geometry:GeoJSON LineString|null,approximate:boolean,message:string|null}. Все endpoints Admin. GEOAPIFY_API_KEY server-only secret; GEOAPIFY_MAPS_API_KEY runtime maps_key только authenticated config. Отсутствующие ключи intentional unconfigured state; не fake response.
- buildDayRoute(trip:TripInput,dayId:string):DayRoutePlan → {nodes:RouteNode[],legs:RouteLeg[],start:BoundaryResolution,end:BoundaryResolution,warnings:string[]}. RouteNode {key,label,place:MapPlace|null,itemId?:string,kind:'start'|'event'|'arrival'|'departure'|'end'}. RouteLeg {key,from,to,mode:TravelMode,kind:'connection'|'scheduled',itemId?:string}. BoundaryResolution {source:'manual'|'hotel'|'overnight'|'ambiguous'|'none',explanation:string,candidates:{key,label,place:MapPlace|null}[],place:MapPlace|null}. Optional additions допустимы с уведомлением root.
- LocationPicker(value:MapPlace|null,onChange): browser map/search/link/manual editor. DayRouteMap(trip,dayId,onChange): whole section under TripCalendar; per-leg details below map. No private provider data beyond maps_key. All persisted edits through existing change/DraftSession. Без координат — break connectivity; транспортные items scheduled, не рассчитывать дорожные маршруты между аэропортами.
- Тестовые швы: aggregate CRUD и maps APIs/provider HTTP; public pure planner; editor RTL/browser. Leaflet rendering stub permitted only in tests. Production no fixture routes.

## Правила

- FastAPI/SQLAlchemy/PostgreSQL/Alembic, existing httpx. Existing backend finance source untouched. Frontend Next16/React19/TS. frontend/AGENTS requires local Next guides before writing frontend integration.
- Названные заранее зависимости разрешены: leaflet latest stable 1.x и @types/leaflet (проверить npm registry), установить только исполнителю UI. Другие отсутствующие зависимости → BLOCKED, не устанавливать самовольно.
- Не читать/печатать .env и секреты. .env.example пустые значения; не запрашивать credentials. Нет деплоя/push/наружных публикаций. Существующие dirty public design-system/test_6 files не менять и не включать в commit.
- Команды frontend: npm.cmd run lint; npm.cmd run typecheck; npm.cmd test -- --run --testTimeout=15000; npm.cmd run build. Один Vitest файл: npm.cmd test -- --run src/lib/FILE.test.ts.
- Команды backend: docker compose exec -T backend pytest -q; ... ruff check . . Локальная .venv как запасной вариант. DB tests isolated existing fixture; не удалять production/local business data. Migrations clean DB verify in disposable database.
- Browser: existing e2e/constructor.spec.ts provides auth fixture strategy. npm.cmd exec playwright test e2e/constructor.spec.ts e2e/trip-map.spec.ts -- --workers=1. Test fixtures may mock provider APIs only in tests; local real backend persistence/auth required.
- Не создавать worktree с копией stale dirty sources: работаем в общей текущей папке по непересекающимся зонам. Коммиты только root, отдельно на таск после ревью/зелёных проверок.

## Из таска 01

- contracts.ts exports MapPlace, TravelMode, MapLegMode; nullable provider_place_id/source_url; ItemInput.map_place/map_end_place and DayInput.map_start/map_end/map_leg_modes optional for backward compatibility. tripInput/emptyDay/newItem preserve/init them.
- Backend identical defaults via Pydantic and JSONB. Revision c93f62a1b7d8 after f64a81e0c9d2. Bounded preferences 20002, duplicate/self/invalid pairs rejected; syntactically valid stale UUID keys retained.
- Backend59 tests (baseline54), frontend95 (baseline94), lint/typecheck/Ruff pass. Clean migration/downgrade/seeded legacy upgrade verified on disposable DB. Runtime backend needs final image rebuild before UI tests.

## Уточнения при разработке

- D01: deploy Compose internal:true не допускает внешние provider calls. Таск02 добавляет backend-only noninternal egress bridge без новых exposed ports; DB сохраняет internal network.
- Одобрены optional RouteNode.date/time и RouteLeg.departureDate/arrivalDate/departureTime/arrivalTime для подписи scheduled переездов, не provider routing. Общий итог — только connection legs; planned flight/train отдельно.
- Важное уточнение: день ночного ОТПРАВЛЕНИЯ заканчивается в map_place departure airport/station. Следующий день прибытия начинается в map_end_place. Дата прибытия не переносится на карту дня отправления как местная конечная точка.

## Из таска 03

- `buildDayRoute(trip:TripInput,dayId:string):DayRoutePlan` — pure planner.
- `summarizeDayRoute(plan:DayRoutePlan,results:Readonly<Record<string,RouteMeasurement|undefined>>):DayRouteSummary`.
- `RouteMeasurement={status:'ok'|'unavailable',distance_m:number|null,duration_s:number|null}`; `DayRouteSummary={distance_m:number|null,duration_s:number|null,complete:boolean,resolved_legs:number,total_legs:number}`.
- `setMapLegMode(preferences:readonly MapLegMode[],fromKey:string,toKey:string,mode:TravelMode):MapLegMode[]`; `formatRouteDistance(meters:number|null):string`; `formatRouteDuration(seconds:number|null):string`.
- RouteNode optional date/time; RouteLeg optional departureDate/arrivalDate/departureTime/arrivalTime. Scheduled legs may reference off-day endpoints: карта отображает только plan.nodes, provider вызывается только для connection legs. Возвращение в тот же отель может использовать один item key для начала и конца.
- После дозапроса1: 10 targeted tests, full Vitest105 (было95), lint/typecheck passed. Исправлены mapped untimed custom stops, explicit overnight dates без времени, предупреждение о пересечении события и scheduled transport. UI обязан показывать plan.warnings; scheduled transport остаётся группой. Manifest/Spec/Craft blocking закрыты. Неблокирующий concern отсутствующего дня записан в state.

## Из таска 02

- Все согласованные `/api/maps/*` DTO и paths сохранены, endpoints Admin-protected. Config возвращает только браузерный maps_key и enabled flags.
- Transit: первый `transit`; fallback `approximated_transit` только при пустом маршруте, не при429/network/auth/errors. `approximate:true`, нет обещания расписания.
- Google URL resolver: offline selected pin/query extraction, viewport не считается местом; короткие ссылки — allowlist, public DNS pinning/SNI, максимум3 redirects, без HTML scraping.
- `GEOAPIFY_API_KEY`/`GEOAPIFY_MAPS_API_KEY` runtime через обе Compose configs. Deploy backend-only egress network без exposed ports; DB internal.
- Исполнитель: backend102 (было59), maps43, Ruff green; backend image rebuilt/healthy; Compose config/isolation green. Проверена только no-key DNS/TLS connectivity; actual keys/search/transit/browser/server restrictions не проверены.
- Setup: docs/geoapify-setup.md; provider decision: docs/adr/0019-geoapify-day-map-provider.md.

## Из таска 04

- `DayRouteMap({trip,dayId,onChange})`, `LocationPicker({value,onChange,label?})`, browser-only `MapCanvas(MapCanvasProps)`; `useMapsConfig()`.
- `createMapsClient()` / singleton `mapsClient`: config/search/resolveLink/route/retry; MapRouteResult/MapsConfig; routeCacheKey; travelModes/travelModeLabels/mapsErrorMessage. Session cache TTL5мин, max400, concurrency3; stale responses ignored, explicit retry resets cache.
- Region «Маршрут дня», map «Карта выбранного дня»; boundaries «Выбрать начало/конец», «Автоматически»; three modes «Машина/Пешком/Транспорт», «Переместить {title} вверх/вниз», «Повторить расчёт участка».
- Inline pickers «Место посещения / отправления», «Место окончания / прибытия»; fields «Название точки», «Адрес точки», «Широта», «Долгота»; actions «Подтвердить место», «Удалить привязку», «Повторить загрузку карты».
- Leaflet1.9.4 + @types/leaflet1.9.22. Labels safe DOM; tile crossorigin/referrer + error hint/retry; plan.warnings visible. Scheduled/off-day provider routing excluded.
- Исполнитель: frontend113/26files (было105/22), lint/typecheck/build green. Production browser/responsive QA — таск05; actual Geoapify keys not tested.
- Дозапрос02: +OverflowError route normalization, +RecursionError parser boundary; malformed route200unavailable / search502 unchanged. Backend106/maps47/Ruff green, fresh image healthy; narrow review pending.
