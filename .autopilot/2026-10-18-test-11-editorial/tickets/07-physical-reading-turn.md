# 07 — Пластичный лист и шесть пунктов навигации

Требования: G17,G18
Blocked by: none
Волна:5
Зона:07 shell/turnengine

Прочитать prompts/executor.md, completion-spec.md и САМЫЙ ВЕРХ interfaces.md.

Реализовать curvedleaf с сохранением принятого ручногоintro. Новаянавигация1–6безhardcode3. Зона/exportsстрогоinterfaces. Передкодомtestreproduce flat450ms/нетcurvature; затемреальнаядеформациянавершинахсвет/тень/двусторона. Необычныйпрыжокоглавлениядопускаетодинсимволическийлист, новерныйконтентобоихсторон. Не flatrotateYсбольшейduration. DOMлевый/правыйsource+target, pendingмаскибезreset,источникстабиленпокаtexturesготовятся. Safe fallbackGPU/capture/resize/contextloss/runtime reduce/popstate/hidden/rapidinput; доступныйfocus/inert/cleanup. Отдельныеproductionframes/QАпослезавершения. Проверитьmeaningfultestначало/середина/конецкривизны,дванаправления,endpointexact,realcontenttextures,1..6history/direct/normalize,unmount/race/cleanup/reduced. Тестынесбрасываюттребованиянастарое450ms. Scopedlint/typecheck+intro/turntestsdev. Вернутьконтракт≤12строк.

Не коммитить; root делаетgitпослезелёныхпроверок. Новыезависимости/аккаунтынеустанавливать. Не менятьдругиемаршруты/userdirty. Contextceiling: еслинепомещается, handoffсрешениями/тупиками/остатком.


Итог: DONE. Manifest/Spec/Craft clear, G4 PASS. Commit e39aa81. Финальные проверки: 48/48 production browser, 119 unit, 33 PNG. Source push origin/main подтверждён; после него Docker frontend пересобран, HTTP200.
