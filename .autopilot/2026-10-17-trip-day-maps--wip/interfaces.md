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
