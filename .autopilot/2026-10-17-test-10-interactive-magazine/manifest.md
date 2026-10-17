# Манифест требований

Источник — полный неизменённый `2026-10-17-brief.md`. Только пользователь может отменить требование. G1/G2 пройдены; точные тексты — также в `copy-contract.md`.

| ID | Из брифа | Статус | Таск / проверка |
|---|---|---|---|
| R01 | «Создай новую экспериментальную страницу» | done | 01: /test_10 |
| R02 | «полностью работоспособным и визуально неизменным» | done | 01: /test_8 regression |
| R03 | «Сначала исследуй проект» | done | 01: scene/camera/tokens/assets |
| R04 | «Не создавай параллельную дизайн-систему» | done | 02: существующие tokens/fonts |
| R05 | «Используй существующую анимацию Living Issue» | done | 01: test_7 scene |
| R06 | «Автоматически перелистывает несколько страниц» | done | 01: существующие восемь листов |
| R07 | «Журнал не должен исчезать» | done | 01: остановка целого разворота |
| R08 | «Сохраняй геометрическую и визуальную непрерывность» | done | 01: projection/handoff |
| R09 | «Предусмотри кнопку пропуска» | done | 01: skip/fallback/cleanup |
| R10 | «создай только три разворота» | done | 01+02: ровно три |
| R11 | «1280, 1440, 1728, 1920 px» | done | 01: четыре ширины × две высоты |
| R12 | «без вертикальной прокрутки» | done | 01+02: geometry/legibility/overflow |
| R13 | «300–600 мс на переход» | done | 01: 450ms turn |
| R14 | «Клик по правому краю разворота» | done | 01: edge controls |
| R15 | «ArrowRight» | done | 01: arrows/focus/turn lock |
| R16 | «Back / Forward» | done | 01: contents/query/history |
| R17 | «prefers-reduced-motion» | done | 01: intro/turns |
| R18 | «должен доминировать фирменный логотип» | done | 02: настоящий SVG/new photo |
| R19 | «Куда — важно. С кем — важнее» | done | 02: точный Hero copy |
| R20 | «Обсудить поездку» | done | 02: /start |
| R21 | «5 000 ₽» | done | 02: три точных продукта/цены |
| R22 | «компактную редакционную таблицу» | done | 02: три видимые строки/hover |
| R23 | «Подробнее о форматах» | done | 02: /formats/unified grid |
| R24 | «ISSUE 01 / BUILDING» | done | 02: честный статус/interest CTA |
| R25 | «глубокий Navy» | done | 02: отдельная NEXT атмосфера |
| R26 | «FIELD NOTE, а не коммерческий тур TC» | done | 02: Thailand,4 friends,2026 |
| R27 | «Используй три фотографии» | done | 02: landscape/people/city |
| R28 | «Читать историю» | done | 02: /archive+honest note |
| R29 | «Deep Green» | done | 02: зелёная Thailand identity |
| R30 | «найди новые подходящие изображения» | done | 02: новые local assets/licenses |
| R31 | «Отдельно храни данные разворотов» | done | 01+02: shared geometry,data.ts |
| R32 | «НЕ нужно делать полноценную мобильную версию» | done | 01: small-screen fallback |
| R33 | «обязательно проведи visual QA» | done | 01: screenshots, intro, controls |
| R34 | «отдельный визуальный refinement pass» | done | 01+02: actual screenshot review |
| R35 | «Итоговый отчёт» | done | 01+02: все восемь пунктов |

ASSUMPTIONS: подтверждённого коммерческого направления нет — BUILDING; личные фотографии не подтверждены — иллюстративные; detail Thailand отсутствует — /archive с пояснением. Wheel опционален, не используется. Требования не отменены.

G4: independent live browser acceptance passed 18 October 2026; no drift. Code commits226c23e (spreads/assets),e37297c (intro/shell/QA). Verification recorded in docs/qa/test-10/README.md.
