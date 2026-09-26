import json
import re
from pathlib import Path
from datetime import datetime

root = Path(__file__).resolve().parent
state = json.loads((root/'state.js').read_text(encoding='utf-8').split('\n',1)[1])
run = root/state['dir']
manifest = (run/'manifest.md').read_text(encoding='utf-8')
rows = re.findall(r'^\| (R\d+) \|.*?Бриф §(\d+);',manifest,re.M)
definitions = [
 ('01','Основа приложения и защищённый вход',[],1,['backend/','frontend/','shared/','compose.yaml','README.md','scripts/'],{0,2,3,4,5,20,30,31,32},
 '''Создать запускаемую основу, PostgreSQL migrations всей модели и строгие Pydantic/TypeScript контракты для всех следующих тасков. Полностью рабочая авторизация login/logout/me, bootstrap CLI, cookie/CSRF/rate limit; Next public placeholders и private server guard, аккуратный login. Здесь не реализовать trip pricing/CRUD или editor: это следующие таски. Дать точные сигнатуры и типы, чтобы backend и frontend потом работали независимо.

Разрешено устанавливать названные в спецификации зависимости из официальных реестров, создавать конфиги, lock files и Dockerfiles. Проверить актуальные стабильные версии через реестры. Хост Python 3.11.9, Node24.11.1, Docker29.2.1 доступны; Docker engine работает. Host ports 3000/8000/5432 свободны, другие чужие контейнеры не трогать. PostgreSQL поднять реально в проекте travel_club. .env.example не содержит действительных секретов. Для автоматических проверок допустимы генерируемые в памяти временные тестовые credentials, не выводить их и не записывать в отслеживаемые файлы; пользователь создаст постоянного администратора локальной командой. Тестовые постоянные пароли только явно фиктивные test fixtures. Не делать production trust auth.

Сразу включить все потребные зависимости для следующих тасков: decimal.js, React Hook Form, Zod, TanStack Query, доступные modal primitives (Radix Dialog приемлем), lucide-react при необходимости; Vitest, Testing Library, Playwright; backend pytest/httpx/Ruff. Установки следующих тасков заблокированы, кроме явно согласованного исправления. Финансовый shared JSON fixture contract с входным TripInput и expected totals. Заморозить transport names в contracts и возвратном INTERFACES. Не оставлять fake calculate реализацию — пока маршрута нет, отсутствует.
''',[
 'Compose PostgreSQL здоров, Alembic initial migration проходит чистую базу, таблицы/FK/Numeric соответствуют §20.',
 'Auth login/logout/me, 401 protection, CSRF, expiry, cookie flags, throttling и bootstrap имеют исполнимые meaningful tests.',
 'Next login и публичные placeholders работают, приватная пустая shell перенаправляет без server session.',
 'Backend schemas и TypeScript types фиксируют TripInput/TripDocument/Calculation/Preview; include item calculation_mode (забыто в перечне полей, обязательно).',
 'Frontend lint/typecheck/production build проходят; backend тесты не нулевые; README содержит фактические команды.'
 ]),
 ('02','Поездки, сохранение и точная смета',['01'],2,['backend/','shared/pricing-vectors.json'],{6,7,10,11,12,13,14,15,16,17,18,19,21,22,23,28,29},
 '''Реализовать весь backend trip aggregate и reusable pricing по утверждённым schemas. Все семь правил, ручные подгруппы и комнаты, FX snapshots, дневное распределение и general subtotal, markup vs margin. Auth dependency на каждом route. CRUD/duplicate/archive через status, preview allowlist, optimistic version и destructive dates protection. Инварианты проверяются сервером при каждом save и calculation. Сохранение транзакционное, не JSON blob; чужие вложенные UUID не допускаются. Дни обновляются при датах, заполненные отсутствующие дни не удаляются без confirm_date_removal. Все cases брифа исполняются against PostgreSQL.

После T01 любые неясные signatures согласуй с orchestrator до изменения shared contract; frontend будет строиться параллельно. Frontend/ не трогать. Можно расширять shared/pricing-vectors.json только дополнительными cases той же формы, сообщи о готовности финансовых контрольных векторов frontend агенту через orchestrator. Следовать нормативным уточнениям G2, особенно overnight и distribution by mode.
''',[
 'Семь формул и все числовые примеры брифа, rounding, zero/invalid bounds, mode inactive fields, per-person override проходят deterministic tests.',
 'day totals + general == cost_total; многодневные hotel нулевого/другого типа не дублируются; распределение до цента.',
 'create/get/list/update/delete/duplicate и status сохраняют весь aggregate, копия независима; повторное открытие сохраняет порядок/notes/FX.',
 'Версии атомарны: stale PUT 409 не теряет данные; date shrink требует согласия на заполненные дни; hotels outside ranges не обрезаются.',
 'API не раскрывает private data без session; preview только allowlist с client notes trip/day/item; валидация и ошибки русские.',
 'Backend Ruff/pytest полностью проходят с реальной PostgreSQL; обновить контракт actual signatures в возврате.'
 ]),
 ('03','Рабочий конструктор и клиентский просмотр',['01'],2,['frontend/'],{4,6,7,8,9,10,11,12,13,14,16,17,18,19,22,23,24,25,26,27,29},
 '''Построить весь frontend поверх фиксированных T01 types/REST. Использовать frontend-design и применимые локальные UI skills для цельного спокойного маршрута. Trip list/create/editor/preview; day rail/timeline, формы всех 9 типов/7 правил с defaults, notes, times including overnight, reordering/moving, general expenses. Редактирование полной поездки, currencies with custom code/manual FX, date changes confirmation, participants override, room override, included toggle. Sticky financial summary with all totals/categories, мгновенный calculateTrip via decimal.js с тем же contract и общими fixtures; сверять backend response. Autosave serialize/debounce, version conflict, stale response protection, retain draft on failure, beforeunload/dirty navigation and explicit Save, save before preview. Никаких финансовых Number/parseFloat arithmetic.

Backend в параллельной работе, не писать mock production API. Во время разработки unit-test contracts and UI; финальная интеграция будет проверена T04. Следовать всем normative уточнениям G2. Не менять backend/shared. Запрашивать изменения контрактов через orchestrator. Accessibility: labeled fields, keyboard, focus management via modal primitives, aria live. UI на русском без raw enums/IDs/JSON, mobile без недоступных действий. Нет маркетинговой витрины вместо рабочего инструмента.
''',[
 'Работают список/создание/editor/preview с loading/empty/errors, повторное открытие данных, duplicate/archive/delete confirm.',
 'Все элементы, все формулы и зависимые поля доступны, day/country/city/place/title/notes редактируются, move/reorder сохраняются.',
 'Autosave не теряет ввод между ответами, ошибки не сбрасывают draft; Save и preview ожидают успешный актуальный save.',
 'Все totals мгновенно меняются; money strings + decimal.js; общие vectors для Python/TS совпадают.',
 'Dates shrink предупреждает и требует явного confirm, mismatch версии понятен; FX direction объяснён и missing rate не выдаёт ложный итог.',
 'Preview fetches strict safe endpoint; никакие private notes/prices не рисуются и не подмешиваются в preview client state.',
 'ESLint/typecheck/unit tests/production build green; desktop/mobile формы доступны и гармоничны.'
 ]),
 ('04','Сквозная проверка и запуск по инструкции',['02','03'],3,['tests/','scripts/','README.md','docs/','compose.yaml','backend/','frontend/'],set(range(0,37)),
 '''Соединить готовые слои и проверить все 27 критериев брифа реальным браузерным e2e. Это integration/acceptance hardening: исправлять обнаруженные несовместимости и документировать, не переделывать продукт. Основа — публичные user actions, PostgreSQL, настоящие cookies/auth. Полный Compose build/start, fresh migration in isolated DB, e2e login/create/multiple days/multiple cities/types/currencies/rates/save/reopen/people recalculation/duplicate/preview/no auth; финансовые inputs включая 5 человек cap4 и hotel. Проверить mobile, network save failure and retry, no internal preview fields. Добавить meaningful Playwright regression tests и запуск в README.

Завершить README на русском: структура/таблицы/architecture/formulas, все команды Windows PowerShell и Docker, .env vars, безопасный bootstrap admin, backup/restore guidance без запуска destructive commands, production secure-cookie/TLS configuration, test commands/results. Seed production business data не создавать. Проверки используют собственную disposable тестовую базу, не чужие контейнеры и не пользовательские данные. Мутации/удаления допустимы лишь над данными созданными этим тестовым прогоном. Никакого deploy/push внешних сервисов. В return предоставить фактические проверки/ограничения и URL локального приложения. Набор приёмки сохранён в tests или docs, не только чат.
''',[
 'Docker Compose build и up здоровы, production Next обслуживает полный working flow; clean migration проходит.',
 'Все 27 критериев §34 покрыты проверкой через API или браузер, ключевой путь реальным браузером, результаты зафиксированы.',
 'Backend tests, frontend tests, lint, types, production build green; нет секретов/debug/mock leftovers.',
 'README команды воспроизводимы, admin bootstrap безопасен, будущие области явно перечислены.',
 'Исправлены реальные integration failures без ослабления tests/security; ошибки и mobile проверены.'
 ])
]
tickets=[]
for tid,title,blockers,wave,zones,sections,body,criteria in definitions:
    reqs=[rid for rid,section in rows if int(section) in sections]
    quote='Не останавливайся после создания структуры или мокапа. Цель — получить реально работающий первый модуль.'
    text=f'# {tid} — {title}\n\n**Требования:** '+', '.join(reqs)+f'\n\n**Blocked by:** {", ".join(blockers) or "нет"}\n**Зона:** '+', '.join(zones)+f'\n**Волна:** {wave}\n**Status:** ready\n\n## Что должно заработать\n\n{body}\n## Из брифа, дословно\n\n> {quote}\n\n## Разделы спецификации\n\n'+', '.join(f'§{s}' for s in sorted(sections))+'; Границы и швы; Уточнения независимой проверки G2.\n\n## Критерии приёмки\n\n'+'\n'.join('- [ ] '+c for c in criteria)+'\n'
    (run/'tickets'/f'{tid}-'+Path('unused')) if False else None
    (run/'tickets'/f'{tid}-task.md').write_text(text,encoding='utf-8')
    tickets.append(dict(id=tid,title=title,requirements=reqs,blockedBy=blockers,wave=wave,zone=zones,status='pending',retries=0,repairs=0,handoffs=0))
for rid,section in rows:
    targets=[t['id'] for t in tickets if rid in t['requirements']]
    assert targets
    pattern=rf'(^\| {rid} \|.*?)\| in-spec \|(.*?)\| spec §(\d+) \|$'
    manifest=re.sub(pattern,lambda m:m[1]+'| in-ticket |'+m[2]+'| spec §'+m[3]+' → '+', '.join('T'+t for t in targets)+' |',manifest,flags=re.M)
(run/'manifest.md').write_text(manifest,encoding='utf-8')
spec=(run/'spec.md').read_text(encoding='utf-8')
spec+='\n| Требование | Раздел |\n|---|---|\n'+''.join(f'| {rid} | §{section} |\n' for rid,section in rows)
(run/'spec.md').write_text(spec,encoding='utf-8')
boundaries=spec.split('## §21. Контракты и границы\n',1)[1].split('## §22',1)[0]
interfaces='''# Общий контракт Travel Club

## Правила
- Прочитать до первого изменения. Пользовательский AGENTS.md обязателен, внешние части не редактировать.
- Стек и поведение заданы spec; ниже границы скопированы дословно.
- Таск 01 владеет установкой зависимостей и всей shared схемой; после него missing dependency возвращать BLOCKED с именем, не устанавливать молча.
- Все пути относительны C:/Users/McHomak/Projects/travel_club. PowerShell. UTF8 использовать явно; для Python скриптов с русским текстом предпочтительно файлы, не pipe с системной кодировкой.
- Только orchestrator меняет этот файл и state/manifest. Исполнители не коммитят и не создают ветки/worktrees: disjoint zones в общей рабочей копии, commits после независимого review.
- Тестовые команды уточняет T01; план: docker compose exec backend pytest; frontend npm.cmd test / run lint / run typecheck / run build. Один backend файл: pytest tests/<file>.py.
- Не трогать чужие контейнеры. Docker project travel_club, порты 3000/8000/5432 свободны при подготовке. Dashboard 8765 зарезервирован.
- Секреты не запрашивать/печатать/коммитить. Действительный user admin отсутствует; bootstrap локальной командой с getpass. Test credentials явно фиктивные либо генерируются в памяти.
- Нормативные исправления G2: распределение по mode=hotel, preview client_note trip/day/item, end_time раньше start означает следующий день. Отдельные restore и client_price_per_person не обязательны.

## Границы, решённые в спецификации

'''+boundaries
(run/'interfaces.md').write_text(interfaces,encoding='utf-8')
now=datetime.now().astimezone().isoformat(timespec='seconds')
state['tier']='T2';state['tickets']=tickets
state['coverage']=dict(found=5,fixed=5,deferred=0,notes='3 неоднозначности уточнены, 2 лишних обязательства исключены; повторная проверка запрошена')
state['reviewers']['manifestSpec']='/root/spec_coverage'
state['requirements']['inSpec']=0;state['requirements']['inTicket']=len(rows)
state['stages'][3].update(status='done',finishedAt=now)
state['stages'][4].update(status='active',startedAt=now,note='T2: четыре таска, три волны')
state['updatedAt']=now
(root/'state.js').write_text('window.STATE =\n'+json.dumps(state,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('G3: all source fragments assigned, 4 tasks, 3 waves, zones 02/03 disjoint.')
