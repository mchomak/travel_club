# Проверка расширенного номера

1. Intro: прежняя ожидающая обложка, активация фоном/журналом/клавиатурой, декоративные страницы, первый Hero, отсутствие canvas после остановки.
2. Reading turn: настоящий изгиб в середине движения вперёд и назад, правильные лица и текстуры, фиксация корешка, мягкий endpoint, источник виден до готовности, целевая страница pending → enter без вспышки.
3. Навигация: все6глав через оглавление и стрелки; прямые ссылки1–6; invalid/repeated query; Back/Forward; rapidclick; модифицированные клавиши; фокус/inert.
4. Reveal: шесть индивидуальных последовательностей, заметно медленнее прежних1050ms, несколько групп текста и фото, видимые якоря; повтор; reduced motion мгновенный финал; никаких бесконечных циклов.
5. Содержимое:12страниц в1280×768/1440×900/1920×1080; body14/meta11, навигация помещается; фактыChina4+2,Archive3поездки,POV3принципа; цены/иллюстративность/Startпрототип.
6. Lifecycle: ожидание загрузки, отказ WebGL/capture, contextloss, resize/reducedruntime, скрытая вкладка, unmount; никаких locks и idleGPU/rAF.
7. Production: полный lint/typecheck/unit, Dockerbuild/rebuild, новыеbrowserсценарии+23legacyregression; SHA256защищённыхстарыхфайлов; screenshotsfinalиcurvedmidturn.
8. Независимые Manifest/Spec/Craft и blindacceptance. Commitonlyownfiles, обычныйpushoriginmain, проверитьremoteHEAD. Никакогоforceиливнешнегодеплоя.
