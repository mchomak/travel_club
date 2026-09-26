# 03 — Рабочий конструктор и клиентский просмотр

**Требования:** R053, R054, R055, R056, R057, R058, R059, R060, R061, R062, R063, R080, R081, R082, R083, R084, R085, R086, R087, R088, R089, R090, R091, R092, R093, R094, R095, R096, R097, R098, R099, R100, R101, R102, R103, R104, R105, R106, R107, R108, R109, R110, R111, R112, R113, R114, R115, R116, R117, R118, R119, R120, R121, R122, R123, R124, R125, R126, R127, R128, R129, R130, R131, R132, R133, R134, R135, R136, R137, R138, R139, R140, R141, R142, R143, R144, R145, R146, R147, R148, R149, R150, R151, R152, R153, R154, R155, R156, R157, R158, R159, R160, R161, R162, R163, R164, R165, R166, R167, R168, R169, R170, R171, R172, R173, R174, R175, R176, R177, R178, R179, R180, R181, R182, R183, R184, R185, R186, R187, R188, R189, R190, R191, R192, R193, R194, R195, R196, R197, R198, R199, R200, R201, R202, R203, R204, R205, R206, R207, R208, R209, R210, R211, R212, R213, R214, R215, R216, R217, R218, R219, R220, R221, R222, R223, R224, R225, R226, R227, R228, R229, R230, R231, R232, R233, R234, R235, R236, R237, R238, R239, R240, R241, R242, R243, R244, R245, R246, R247, R248, R249, R250, R251, R252, R253, R254, R255, R256, R257, R258, R259, R260, R261, R262, R263, R264, R265, R266, R267, R268, R269, R270, R271, R272, R273, R274, R275, R276, R277, R278, R279, R280, R281, R282, R283, R284, R285, R286, R287, R288, R307, R308, R309, R310, R311, R312, R313, R314, R315, R316, R317, R318, R319, R320, R321, R322, R323, R324, R325, R326, R327, R328, R329, R330, R331, R332, R333, R334, R335, R336, R337, R338, R339, R340, R341, R342, R343, R344, R345, R346, R347, R348, R349, R350, R351, R352, R353, R354, R395, R396, R397, R398, R399, R400, R401, R402, R403, R404, R405, R406, R407, R408, R409, R410, R411, R412, R413, R414, R415, R416, R417, R418, R419, R420, R421, R422, R423, R424, R425, R426, R427, R428, R429, R430, R431, R432, R433, R434, R435, R436, R437, R438, R439, R440, R441, R442, R443, R444, R445, R446, R447, R448, R449, R450, R451, R452, R453, R454, R455, R475, R476, R477, R478, R479, R480, R481, R482, R483

**Blocked by:** 01
**Зона:** frontend/
**Волна:** 2
**Status:** ready

## Что должно заработать

Построить весь frontend поверх фиксированных T01 types/REST. Использовать frontend-design и применимые локальные UI skills для цельного спокойного маршрута. Trip list/create/editor/preview; day rail/timeline, формы всех 9 типов/7 правил с defaults, notes, times including overnight, reordering/moving, general expenses. Редактирование полной поездки, currencies with custom code/manual FX, date changes confirmation, participants override, room override, included toggle. Sticky financial summary with all totals/categories, мгновенный calculateTrip via decimal.js с тем же contract и общими fixtures; сверять backend response. Autosave serialize/debounce, version conflict, stale response protection, retain draft on failure, beforeunload/dirty navigation and explicit Save, save before preview. Никаких финансовых Number/parseFloat arithmetic.

Backend в параллельной работе, не писать mock production API. Во время разработки unit-test contracts and UI; финальная интеграция будет проверена T04. Следовать всем normative уточнениям G2. Не менять backend/shared. Запрашивать изменения контрактов через orchestrator. Accessibility: labeled fields, keyboard, focus management via modal primitives, aria live. UI на русском без raw enums/IDs/JSON, mobile без недоступных действий. Нет маркетинговой витрины вместо рабочего инструмента.

## Из брифа, дословно

> Не останавливайся после создания структуры или мокапа. Цель — получить реально работающий первый модуль.

## Разделы спецификации

§4, §6, §7, §8, §9, §10, §11, §12, §13, §14, §16, §17, §18, §19, §22, §23, §24, §25, §26, §27, §29; Границы и швы; Уточнения независимой проверки G2.

## Критерии приёмки

- [ ] Работают список/создание/editor/preview с loading/empty/errors, повторное открытие данных, duplicate/archive/delete confirm.
- [ ] Все элементы, все формулы и зависимые поля доступны, day/country/city/place/title/notes редактируются, move/reorder сохраняются.
- [ ] Autosave не теряет ввод между ответами, ошибки не сбрасывают draft; Save и preview ожидают успешный актуальный save.
- [ ] Все totals мгновенно меняются; money strings + decimal.js; общие vectors для Python/TS совпадают.
- [ ] Dates shrink предупреждает и требует явного confirm, mismatch версии понятен; FX direction объяснён и missing rate не выдаёт ложный итог.
- [ ] Preview fetches strict safe endpoint; никакие private notes/prices не рисуются и не подмешиваются в preview client state.
- [ ] ESLint/typecheck/unit tests/production build green; desktop/mobile формы доступны и гармоничны.
