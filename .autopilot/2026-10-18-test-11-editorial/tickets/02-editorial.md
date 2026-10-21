# 02 — Обложка и три художественных разворота

**Требования:** see plan.md, all Art direction/Hero/Next/Thailand/Photography/Content/Motion composition requirements.
**Blocked by:** none, public interface fixed
**Зона:** frontend/src/components/test_11/spreads.tsx, spreads.module.css, data.ts, cover.tsx if wanted; frontend/public/test_11/
**Волна:** 1

## Что должно заработать

Одна смелая цельная концепция «Между строк». Новый изобразительный язык, не recolor test_10. Крупная левая обложка главы и редакционная правая. Герой с реальным SVG logo и сильным слоганом, продукты справа. Next — graphic typography + aperture, редакционный анонс без вымышленных данных. Thailand — forest green, THAI/LAND photo typography, правый материал и фотоколлаж. Красивая самостоятельная cover для физического открытия. Новые реальные photos из проверенных источников, source/license manifest.

> «изображение может проходить сквозь буквы, перекрывать текст или становиться частью типографической композиции»
> «Каждый разворот должен иметь собственный характер, но весь журнал должен восприниматься как цельное издание»
> «Не придумывай факты о поездках, цены, даты, условия или уже оказанные коммерческие услуги»

Read full spec + interfaces. Study supplied reference descriptions and actual user attached images if inherited. Use frontend-design and impeccable skill guidance; announce them to coordinator. Browse for photos, verified source pages/author/license mandatory, no unsupported attribution. Can retain appropriate existing images but independently find and include new suitable photographs. Source provenance and local optimization required.

## Acceptance

- [ ] Exports match exact interfaces. Actual SVG logo; TC Golos/Lora identity and blue preserved amid own colors.
- [ ] Cover printable, photo + huge type + issue metadata, not loading splash. Fills portrait parent.
- [ ] Three distinct compelling spreads with dense but readable composition, strong negative space and fine metadata.
- [ ] Thailand photo-text interplay clearly visible; nature/islands/city/everyday people depicted with illustrative labels.
- [ ] Facts/prices/product names match source; no invented destinations/dates or first-person trip diary. CTA working links.
- [ ] Several distinct finite reveals: clipping text, photo iris, stagger strips/letters/notes. animate=false final static; reduced motion final visible. Reentry predictable.
- [ ] Responsive desktop page internals use container units or fluid scaling to fit 1280×768 through1920×1080; body about14+ and meta11+ at smallest supported desktop.
- [ ] Manifest + README contain author/source/license/verification for each new photograph; label all illustrative, never claims team.
- [ ] Targeted lint/typecheck; do not touch shell-owned CSS/files.


**Требования (точная привязка):** R03, R04, R06, R07, R08, R09, R10, R11, R12, R13, R15, R16, R17, R19, R20, R21, R22, R25, R26, R27, R28, R29, R30, R31, R32, R33, R34, R35, R36, R38, R40, R50, R51, R53, R55
