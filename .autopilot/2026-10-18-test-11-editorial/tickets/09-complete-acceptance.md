# 09 — Шесть глав: приёмка, push и пересборка

Требования: G17,G18,G19,G20,G21,G22,G23,G24,G25,G26,G27
Blocked by: 07,08
Волна:6
Зона:09 QA/docs/capture

Прочитать prompts/executor.md, completion-spec.md и САМЫЙ ВЕРХ interfaces.md.

После07/08 обновитьvisualtests/capture/sourceREADME/QAпод6пар+медленныйcurvedturn/reveals; старыеlimitation3/450msзаменить. Вproductionснятьвсе6пар3размера,обложку,реальноеcurvedmidturnвобастороны. Проверить12страницbounds/body/meta/картинки/CTA/редакционноепроисхождение/навигация/reduced/noFlash/idlecleanup. Координаторвыполняетlint/type/unit/build/Docker/push;агентнеcommits/buildsservers. Собратьactualresultsбезвыдуманныхpass/FPS. Финалbrowserrefinement/регрессионныеhashes/independentacceptance;зафиксироватьlimitationGPUеслиесть.

Не коммитить; root делаетgitпослезелёныхпроверок. Новыезависимости/аккаунтынеустанавливать. Не менятьдругиемаршруты/userdirty. Contextceiling: еслинепомещается, handoffсрешениями/тупиками/остатком.

Подготовка scripts/tests/docs может идти параллельно07/08 по фиксированному контракту6глав. Итоговая visual-проверка и production evidence по-прежнему заблокированы до завершения обоих; не оценивать промежуточный код как готовый и не править app-файлы.


Итог: DONE. Manifest/Spec/Craft clear, G4 PASS. Commit db5523d. Финальные проверки: 48/48 production browser, 119 unit, 33 PNG. Source push origin/main подтверждён; после него Docker frontend пересобран, HTTP200.
