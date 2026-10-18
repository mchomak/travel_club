# 05 — Без вспышки, ясная редакция и типографика

**Требования:** G01,G02,G10–G15; retained R01–R55
**Blocked by:** none (fixed parent props)
**Волна:** 3
**Зона:** test_11/spreads.tsx,spreads.module.css,data.ts,e2e/test-11-reveal.spec.ts

> «какие то объекты уже видны, а остальные плавно повляются»
> «поработай еще над архитектурой информации и типографией»
> «некоторые надписи лучше писать в одну строку, где-то добавить иконки где-то цвета, где-то мелкие анимации»

Read refinement-spec/latest interfaces. No shell/cssintro edits, communicate with Task04.

- [x] Reproduce old destination-back finalstate→reveal flash with actualframes. Extend export `RevealPhase` and phaseprop withcompatibility; pending mustmatch initialkeyframepose,deferred hiddenfromfirstpaint, enter finite, static fullyprintvisible. Keep intentionallyvisibleanchors.
- [x] Diverseexistingmasks/iris/strips improved withoutsameeffecteverywhere, predictable reentry, noidleloop. Runtime/reduced finalvisible includingclippingshapes.
- [x] Improve IA all3spreads: groupserviceidentity/price/details/action, reduceforcedbreaks and repetitivehierarchy;Nextshortmetadataone-linewherefit;Thaihierarchy/rightnotes betterbalanced. Actualfacts/prices/illustrativephotosunchanged.
- [x] Meaningfulfewlucideicons/semanticcolouraccents/micro-hoverselectionanimations; no newdependencies/visualclutter.
- [x] Metafloor11/body14, allsixpagestext/CTAfit1280×768,1440×900,1920×1080. Preservephoto-letterartdirection and actualcoverlogo.
- [x] Focusedreal tests forphaseinitialvisibility+earlyrevealframes,finite positiveiteration(anyfinite,notexact1),reducedclipping/text visibility,IA copy/links. No mirrorsonlydataflag. Visualinspectscreens, targetedlint/typecheck.

No commits/servers/builds. Return shortcontract and screenshots/findings/expectedparentwiring.

Итог: DONE; Manifest/Spec/Craft passed; commit 296b8ef. Финальные проверки:119 unit,45 production browser checks,21 screenshots; подробности в docs/qa/test-11/README.md.
