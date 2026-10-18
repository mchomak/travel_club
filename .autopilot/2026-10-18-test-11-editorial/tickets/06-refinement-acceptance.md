# 06 — Проверка и пересборка доработки

**Требования:** G01–G16
**Blocked by:**04,05
**Волна:**4
**Зона:** test_11 QA scripts/tests/docs/screens; sourcechanges only delegated toowner

- [x] Live actualwaitingcover smaller, noautostart,onlycover/background; backgroundclick+coverclick+keyboard independentlychecked. Early/repeatedclicksafe.
- [x] Actualmulti-leafscene frames/camera; decorativepagesinaccessible; finalHeroalignednearfullheight;GPUresourcesgone.
- [x] Samplebefore/during/afterreadturns+introhandoff: nofullyvisiblefuturecontentthenreset, someobjectsremainvisible. Checkforward/back/contents/repeat/direct/reduced.
- [x] IA/type/icons/colours/microinteractions inspectedall3spreads+cover; actualbounds6pages at1280/1440/1920, appropriatecontrastandclips.
- [x] Relevantlint/typecheck/Vitest/build,productionbrowsernewcases+test8/test10regressions;protectedhashesunchanged. CoordinatorbuildsDockerlocallythenfinalcaptureproduction3000.
- [x] UpdateQA/sourceREADME/captures showingwaitingdistantcover,turnsequence,3finalspreads. NooldclaimsCSSonly/manualautotimer remain. Reportactualoutcomes/limits.

Итог: DONE; Manifest/Spec/Craft passed; commit 196d72d. Финальные проверки:119 unit,45 production browser checks,21 screenshots; подробности в docs/qa/test-11/README.md.
