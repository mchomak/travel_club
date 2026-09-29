# 02 — Поездки, сохранение и точная смета

**Требования:** R080, R081, R082, R083, R084, R085, R086, R087, R088, R089, R090, R091, R092, R093, R094, R095, R096, R097, R098, R099, R100, R101, R102, R103, R104, R105, R106, R107, R108, R109, R110, R111, R112, R113, R114, R161, R162, R163, R164, R165, R166, R167, R168, R169, R170, R171, R172, R173, R174, R175, R176, R177, R178, R179, R180, R181, R182, R183, R184, R185, R186, R187, R188, R189, R190, R191, R192, R193, R194, R195, R196, R197, R198, R199, R200, R201, R202, R203, R204, R205, R206, R207, R208, R209, R210, R211, R212, R213, R214, R215, R216, R217, R218, R219, R220, R221, R222, R223, R224, R225, R226, R227, R228, R229, R230, R231, R232, R233, R234, R235, R236, R237, R238, R239, R240, R241, R242, R243, R244, R245, R246, R247, R248, R249, R250, R251, R252, R253, R254, R255, R256, R257, R258, R259, R260, R261, R262, R263, R264, R265, R266, R267, R268, R269, R270, R271, R272, R273, R274, R275, R276, R277, R278, R279, R280, R281, R282, R283, R284, R285, R286, R287, R288, R289, R290, R291, R292, R293, R294, R295, R296, R297, R298, R299, R300, R301, R302, R303, R304, R305, R306, R307, R308, R309, R310, R311, R312, R313, R314, R315, R316, R317, R318, R319, R320, R321, R322, R323, R324, R325, R326, R327, R328, R329, R330, R331, R332, R333, R334, R335, R336, R337, R338, R339, R340, R341, R342, R343, R344, R345, R346, R347, R348, R349, R350, R351, R352, R353, R354, R369, R370, R371, R372, R373, R374, R375, R376, R377, R378, R379, R380, R381, R382, R383, R384, R385, R386, R387, R388, R389, R390, R391, R392, R393, R394, R395, R396, R397, R398, R399, R400, R401, R402, R403, R404, R405, R406, R407, R408, R456, R457, R458, R459, R460, R461, R462, R463, R464, R465, R466, R467, R468, R469, R470, R471, R472, R473, R474, R475, R476, R477, R478, R479, R480, R481, R482, R483

**Blocked by:** 01
**Зона:** backend/, shared/pricing-vectors.json; согласованное дополнение: только backend.build в compose.yaml для named shared build context
**Волна:** 2
**Status:** ready

## Что должно заработать

Реализовать весь backend trip aggregate и reusable pricing по утверждённым schemas. Все семь правил, ручные подгруппы и комнаты, FX snapshots, дневное распределение и general subtotal, markup vs margin. Auth dependency на каждом route. CRUD/duplicate/archive через status, preview allowlist, optimistic version и destructive dates protection. Инварианты проверяются сервером при каждом save и calculation. Сохранение транзакционное, не JSON blob; чужие вложенные UUID не допускаются. Дни обновляются при датах, заполненные отсутствующие дни не удаляются без confirm_date_removal. Все cases брифа исполняются against PostgreSQL.

После T01 любые неясные signatures согласуй с orchestrator до изменения shared contract; frontend будет строиться параллельно. Frontend/ не трогать. Можно расширять shared/pricing-vectors.json только дополнительными cases той же формы, сообщи о готовности финансовых контрольных векторов frontend агенту через orchestrator. Следовать нормативным уточнениям G2, особенно overnight и distribution by mode.

## Из брифа, дословно

> Не останавливайся после создания структуры или мокапа. Цель — получить реально работающий первый модуль.

## Разделы спецификации

§6, §7, §10, §11, §12, §13, §14, §15, §16, §17, §18, §19, §21, §22, §23, §28, §29; Границы и швы; Уточнения независимой проверки G2.

## Критерии приёмки

- [ ] Семь формул и все числовые примеры брифа, rounding, zero/invalid bounds, mode inactive fields, per-person override проходят deterministic tests.
- [ ] day totals + general == cost_total; многодневные hotel нулевого/другого типа не дублируются; распределение до цента.
- [ ] create/get/list/update/delete/duplicate и status сохраняют весь aggregate, копия независима; повторное открытие сохраняет порядок/notes/FX.
- [ ] Версии атомарны: stale PUT 409 не теряет данные; date shrink требует согласия на заполненные дни; hotels outside ranges не обрезаются.
- [ ] API не раскрывает private data без session; preview только allowlist с client notes trip/day/item; валидация и ошибки русские.
- [ ] Backend Ruff/pytest полностью проходят с реальной PostgreSQL; обновить контракт actual signatures в возврате.
