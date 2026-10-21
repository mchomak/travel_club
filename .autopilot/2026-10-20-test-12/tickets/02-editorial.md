# 02 — Семь глав, услуги и основатели

**Требования:** R17–R52, R54–R64, R66–R70, G02
**Blocked by:** 01
**Зона:** test_12/data.ts, spreads.tsx, spreads.module.css, README.md
**Волна:** 2
**Status:** ready

## Что должно заработать
В уже скопированной TEST_12 обнови Hero/Formats и добавь полноценный равнозначный двухстраничный About с Василисой слева/Рамилем справа, 04–05. Семь entries SPREADS с title/navLabel и корректные folios 02–15. Все product/commercial/founder facts строго spec S3/S4, оригинал brief по пути доступен. Сохраняй контрольные главы целиком кроме folios. Сильная независимая редакционная композиция About, Cloud/Navy/Ink existing brand, большие имена, асимметрия, controlled whitespace. Проверенных портретов нет: честные эстетичные placeholders и централизованный FOUNDER_PHOTOS config src/alt/position, лёгкая замена двумя реальными фото. No stock faces/fiction. Не меняй shell/engine/CSS other than spreads, app/shared source/assets.

## Из брифа
> «Люди, с которых начался Travel Club».
> «Василиса и Рамиль.»
> «5 000 ₽ и 10 000 ₽ — стоимость услуг Travel Club, а не стоимость всего путешествия.»
> «Travel Design» / «Travel Ready» / «TC Trips»
> «Внутри самих разворотов сохраняй существующие редакционные названия.»

## Спецификация
spec.md S3, S4, S5, S6, S7. interfaces.md полный.

## Приёмка
- Все факты/роли/история/ограничения S3/S4 выполнены, CTA верх справа /start и отдельный /formats; повтор слева удалён.
- Seven chapters with Russian navLabel, page pairs 02–15; new component matrix seven; downstream unchanged except folios.
- About равноценен, не corporate cards; портреты явно временные; никаких неподтверждённых фактов.
- 1366×768,1440×900,1920×1080 без clipped text/CTA и overlap; existing mobile fallback сохранён.
- Unit/lint/typecheck; browser preview 3012 available from coordinator. README document data/photo replacement and actual structure, no unexecuted success claims.
