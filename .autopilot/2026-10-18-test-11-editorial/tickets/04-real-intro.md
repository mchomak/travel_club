# 04 — Настоящее вступление test_8 и orchestration reveal

**Требования:** G01–G09,G15; retained R01–R55
**Blocked by:** none (fixed editorial props)
**Волна:** 3
**Зона:** new/current test_11 shell,magazine-experience.tsx,magazine-intro.tsx,magazine.module.css,local scene/capture helpers,e2e/test-11-magazine.spec.ts

> «ждем нажатия пользователя»
> «нажал в любое место на журнале или на фоне, начинается наша анимация с test_8»
> «пока анимация не останавливается на нашем первом развороте с hero и formats»

Read refinement-spec and latest interfaces; existing prior spec only historical where contradicted.

- [x] First reproduce old auto start/large close cover and reveal static-copy flash with meaningful red tests/screens.
- [x] Restore actual test_8/test_7 physical scene+fast preset+leaf deformation+timeline through read-only imports/local scene fork; no CSS substitute, no shared mutation. Actual newcovertexture and finalpendingleft texture; decorative interior onlyscene, inaccessible fromreader.
- [x] Closed cover distant/smaller, onlycover+colouredmattebackground; noidle rAF loop. Wait indefinitely; cover/background/keyboard activateonce. Retainearlyclickduringload and cancelasyncafterunmount/skip. Loadingstaticcover matchesclosedstage.
- [x] Real multi-leafopening/cameraapproach ends alignedfullHeroFormats; disposeGPU/canvas/RAF whenreading, no duplicatewebpage/scrollhandoff.
- [x] Coordinate reveal pending→enter forintro,450msturn/direct/history. Destinationbackcopiespending fromfirstpaint, neverfullyfinalthenhidden. Sourcepagefinalstatic. Focus/inert/query preserved.
- [x] Contextloss/capturefailure/skip/runtime reduced/resize/unmount+hiddenpause safe; directquery works; coverrevisit predictable.
- [x] New backdrop warmoxblood/plum, no graygrain. Maintainnearfullreadingdimensions andvisiblefocus.
- [x] Behavioraltestsevidence manualwait,clickcover/background,multipleleaves/targetHero,keyboard,earlyclick,rapidcommands,history,reduced,failures,cleanup,oldroutesprotection. Runfocusedtest/typecheck/lint, nofullbuild/serverstart.

Return contract <=25lines; no commits; coordinator owns integration/review/build.

Итог: DONE; Manifest/Spec/Craft passed; commit 32c91ea. Финальные проверки:119 unit,45 production browser checks,21 screenshots; подробности в docs/qa/test-11/README.md.
