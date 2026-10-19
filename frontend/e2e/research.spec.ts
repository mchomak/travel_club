import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

function workbookXml(buffer: Buffer): string {
  const documents: string[] = [];
  let offset = 0;
  while (offset + 30 < buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) { offset += 1; continue; }
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    const dataStart = offset + 30 + nameLength + extraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);
    if (name.endsWith(".xml")) {
      const xml = method === 0 ? data.toString("utf8") : inflateRawSync(data).toString("utf8");
      documents.push(xml);
    }
    offset = dataStart + compressedSize;
  }
  return documents.join("\n");
}

test("TC Research covers creation, recoverable interview notes, history and whole-base export", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const login = process.env.RESEARCH_E2E_LOGIN ?? "tc_research_e2e";
  const password = process.env.RESEARCH_E2E_PASSWORD ?? "test-only-password-2026";
  const respondentName = `Test interview ${Date.now()}`;
  let originalG01 = "";

  await test.step("1. Sign in and create a fake respondent", async () => {
    await page.goto("/admin/login");
    await page.getByRole("button", { name: "Показать пароль" }).click();
    await expect(page.getByRole("textbox", { name: "Пароль" })).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Скрыть пароль" }).click();
    await expect(page.getByRole("textbox", { name: "Пароль" })).toHaveAttribute("type", "password");
    await page.getByLabel("Логин").fill(login);
    await page.getByRole("textbox", { name: "Пароль" }).fill(password);
    await page.getByRole("button", { name: "Войти в кабинет" }).click();
    await page.waitForURL(/\/admin\/trips/);
    await page.goto("/research/new");
    await page.evaluate(() => {
      window.scrollTo = ((target: ScrollToOptions | number) => {
        const behavior = typeof target === "number" ? "positional" : target.behavior ?? "auto";
        document.documentElement.setAttribute("data-research-scroll-behavior", behavior);
      }) as typeof window.scrollTo;
    });
    await page.getByLabel("Имя респондента или псевдоним").fill(respondentName);
  });

  await test.step("2. Save a screening questionnaire before the interview starts", async () => {
    await page.getByLabel("Возраст или возрастная категория").selectOption("23_29");
    await page.getByLabel("Город проживания").fill("Казань");
    await page.getByLabel("Количество самостоятельных зарубежных путешествий за последние 24 месяца").selectOption("3_plus");
    await page.getByRole("group", { name: "Опыт участия в организованных групповых путешествиях" }).getByLabel("Нет").check();
    await page.getByRole("group", { name: "Есть ли конкретные планы путешествий в ближайшие месяцы?" }).getByLabel("Нет").check();
    await page.getByRole("group", { name: "Пользовались ли платными услугами планирования или организации поездок?" }).getByLabel("Нет").check();
    await page.getByLabel("Как обычно организуете путешествия?").selectOption("self");
    await page.getByLabel("Какая часть подготовки поездки вызывает наибольшие трудности?").selectOption("coordination");
    await page.getByLabel(/Цель исследования/).selectOption("trips");
    await page.getByRole("button", { name: "Сохранить анкету и выбрать сценарий" }).click();
    await expect(page.getByText(respondentName)).toBeVisible();
    await expect(page.getByText("Анкета уже сохранена в базе. Статус: черновик.")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-research-scroll-behavior", "auto");
  });

  await test.step("3–5. Review a transparent recommendation, override it and start its route", async () => {
    await expect(page.getByRole("heading", { name: /Рекомендуем начать с/ })).toBeVisible();
    await expect(page.getByText(/Альтернативный сценарий:/)).toBeVisible();
    await page.getByLabel("Сценарий интервью").selectOption("travel_design");
    const configResponse = await page.evaluate(async () => await (await fetch("/api/research/config")).json());
    originalG01 = configResponse.bank.questions.find((question: { code: string }) => question.code === "G01").text;
    await page.route("**/api/research/config", async (route) => {
      const response = await route.fetch();
      const changed = await response.json();
      changed.bank.questions.find((question: { code: string }) => question.code === "G01").text = "Новое тестовое описание банка G01";
      await route.fulfill({ response, body: JSON.stringify(changed) });
    });
    await page.getByRole("button", { name: "Перейти к интервью" }).click();
    await expect(page).toHaveURL(/\/research\/.+/);
    await expect(page.getByRole("heading", { name: originalG01, exact: true })).toBeVisible();
    await expect(page.getByText("Новое тестовое описание банка G01", { exact: true })).toHaveCount(0);
  });

  const answer = page.getByLabel("Ответ G01");
  const answerCard = page.locator("#question-G01");
  const answerRoute = /\/api\/research\/interviews\/[^/]+\/answers\/G01$/;

  await test.step("6–7. Save a note on the server and restore it after reloading", async () => {
    await answer.fill("Последняя поездка — самостоятельный маршрут по Италии.");
    await expect(answerCard.getByText("Сохранено")).toBeVisible({ timeout: 7000 });
    await page.reload();
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Последняя поездка — самостоятельный маршрут по Италии.");
  });

  await test.step("8. Keep typing through a network failure and retry on reconnect", async () => {
    await page.route(answerRoute, (route) => route.abort());
    await page.getByLabel("Ответ G01").fill("Заметка, введённая при временном сбое связи.");
    await expect(answerCard.getByText(/Нет связи · черновик сохранён/)).toBeVisible({ timeout: 7000 });
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Заметка, введённая при временном сбое связи.");
    await page.unroute(answerRoute);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(answerCard.getByText("Сохранено")).toBeVisible({ timeout: 7000 });
  });

  await test.step("9. Warn when navigating away with an unsaved draft", async () => {
    const detailUrl = page.url();
    await page.getByRole("link", { name: "Респонденты", exact: true }).click();
    await expect(page).toHaveURL(/\/research$/);
    await page.evaluate(() => window.history.back());
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Заметка, введённая при временном сбое связи.");

    await page.route(answerRoute, (route) => route.abort());
    await page.getByLabel("Ответ G01").fill("Несохранённая заметка перед уходом.");
    await expect(answerCard.getByText(/Нет связи · черновик сохранён/)).toBeVisible({ timeout: 7000 });
    const navigationPrompt = page.waitForEvent("dialog");
    await page.getByRole("link", { name: "К списку" }).click();
    const navigationDialog = await navigationPrompt;
    expect(navigationDialog.message()).toContain("ещё не подтверждены сервером");
    await navigationDialog.dismiss();
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Несохранённая заметка перед уходом.");
    await expect(page).toHaveURL(/\/research\/.+/);

    const forwardPrompt = page.waitForEvent("dialog", { timeout: 5000 });
    await page.evaluate(() => window.history.forward());
    const forwardDialog = await forwardPrompt;
    expect(forwardDialog.message()).toContain("ещё не подтверждены сервером");
    await forwardDialog.dismiss();
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Несохранённая заметка перед уходом.");

    const historyPrompt = page.waitForEvent("dialog");
    await page.evaluate(() => window.history.back());
    const historyDialog = await historyPrompt;
    expect(historyDialog.message()).toContain("ещё не подтверждены сервером");
    await historyDialog.dismiss();
    await expect(page).toHaveURL(detailUrl);
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Несохранённая заметка перед уходом.");
    for (const sharedLink of ["Респонденты", "Travel Club"]) {
      const sharedPrompt = page.waitForEvent("dialog", { timeout: 1500 }).catch(() => null);
      await page.getByRole("link", { name: sharedLink, exact: true }).click();
      const sharedDialog = await sharedPrompt;
      expect(sharedDialog, `Shared link ${sharedLink} should warn before leaving a dirty answer`).not.toBeNull();
      if (!sharedDialog) break;
      expect(sharedDialog.message()).toContain("ещё не подтверждены сервером");
      await sharedDialog.dismiss();
      await expect(page.getByLabel("Ответ G01")).toHaveValue("Несохранённая заметка перед уходом.");
      await expect(page).toHaveURL(/\/research\/.+/);
    }
    const prevented = await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await page.unroute(answerRoute);
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect(answerCard.getByText("Сохранено")).toBeVisible({ timeout: 7000 });
  });

  await test.step("10–11. Confirm completion with empty questions and test cancellation first", async () => {
    await expect(page.getByText("Заполнено 1 из 11")).toBeVisible();
    await page.getByRole("button", { name: "Завершить интервью" }).click();
    await expect(page.getByRole("dialog")).toContainText("Некоторые вопросы могут остаться без ответа");
    const cancelButton = page.getByRole("button", { name: "Отмена" });
    const confirmButton = page.getByRole("button", { name: "Да, завершить" });
    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Завершить интервью" })).toBeFocused();
    await page.getByRole("button", { name: "Завершить интервью" }).click();
    await page.getByRole("button", { name: "Отмена" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Завершить интервью" }).click();
    await page.evaluate(() => {
      window.scrollTo = ((target: ScrollToOptions | number) => {
        const behavior = typeof target === "number" ? "positional" : target.behavior ?? "auto";
        document.documentElement.setAttribute("data-research-scroll-behavior", behavior);
      }) as typeof window.scrollTo;
      document.documentElement.removeAttribute("data-research-scroll-behavior");
    });
    await page.getByRole("button", { name: "Да, завершить" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Все заметки останутся доступны" })).toBeVisible({ timeout: 7000 });
    await expect(page.locator("html")).toHaveAttribute("data-research-scroll-behavior", "auto");
  });

  await test.step("12–15. Reopen, edit a completed answer and screening without replacing the snapshot", async () => {
    await page.goto("/research");
    await page.getByPlaceholder("Имя или псевдоним").fill(respondentName);
    await expect(page.getByRole("link", { name: respondentName })).toBeVisible();
    await page.getByLabel("Категория").selectOption("travel_design");
    await expect(page.getByRole("link", { name: respondentName })).toBeVisible();
    await page.getByRole("link", { name: respondentName }).click();
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Несохранённая заметка перед уходом.");
    await page.getByLabel("Ответ G01").fill("Позднее дополнение к завершённому интервью.");
    await expect(answerCard.getByText("Сохранено")).toBeVisible({ timeout: 7000 });
    await page.getByRole("button", { name: "Изменить анкету" }).click();
    await page.getByLabel("Город проживания").fill("Екатеринбург");
    await page.getByRole("button", { name: "Сохранить изменения анкеты" }).click();
    await expect(page.getByText(/Предложение пересчитано; текущий сценарий и ответы не менялись\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Обновить категорию по рекомендации" })).toBeVisible();
    await page.getByRole("button", { name: "Обновить категорию по рекомендации" }).click();
    await expect(page.getByRole("status")).toContainText("Сценарий и ответы проведённого интервью остались прежними.");
    await expect(page.getByText(/категория Trips \/ Опытный путешественник/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Travel Design" })).toBeVisible();
    await expect(page.getByRole("heading", { name: originalG01, exact: true })).toBeVisible();
    await expect(page.getByLabel("Ответ G01")).toHaveValue("Позднее дополнение к завершённому интервью.");
  });

  await test.step("16. Search and filter the respondent list", async () => {
    await page.goto("/research");
    await page.getByPlaceholder("Имя или псевдоним").fill(respondentName);
    await page.getByLabel("Категория").selectOption("trips_experienced");
    await page.getByLabel("Статус").selectOption("completed");
    await expect(page.getByRole("link", { name: respondentName })).toBeVisible();
  });

  await test.step("17–18. Export all records with actual answer data, then export after another edit", async () => {
    await page.getByLabel("Категория").selectOption("trips_beginner");
    await expect(page.getByRole("link", { name: respondentName })).toHaveCount(0);
    const firstDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Экспорт в Excel" }).click();
    const firstFile = await firstDownload;
    const firstBuffer = await readFile(await firstFile.path() ?? "");
    const firstXml = workbookXml(firstBuffer);
    expect(firstFile.suggestedFilename()).toMatch(/^tc-research-\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(firstXml).toContain(respondentName);
    expect(firstXml).toContain("Позднее дополнение к завершённому интервью.");
    expect(firstXml).toContain(originalG01);
    expect(firstXml).toContain("H01");

    await page.getByLabel("Категория").selectOption("trips_experienced");
    await expect(page.getByRole("link", { name: respondentName })).toBeVisible();
    await page.getByRole("link", { name: respondentName }).click();
    await page.getByLabel("Ответ G01").fill("Новая версия для повторной выгрузки.");
    await expect(page.locator("#question-G01").getByText("Сохранено")).toBeVisible({ timeout: 7000 });
    await page.goto("/research");
    await page.getByPlaceholder("Имя или псевдоним").fill(respondentName);
    const secondDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Экспорт в Excel" }).click();
    const secondFile = await secondDownload;
    const secondXml = workbookXml(await readFile(await secondFile.path() ?? ""));
    expect(secondXml).toContain("Новая версия для повторной выгрузки.");

  });
  await test.step("Responsive list and interview layout at phone widths", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("link", { name: respondentName })).toBeVisible();
    await expect(page.getByRole("list", { name: "Респонденты" })).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
    await expect(page.getByRole("listitem", { name: "Респондент " + respondentName })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.setViewportSize({ width: 320, height: 720 });
    await expect(page.getByRole("list", { name: "Респонденты" })).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
    await expect(page.getByRole("listitem", { name: "Респондент " + respondentName })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole("link", { name: respondentName }).click();
    await expect(page.getByLabel("Ответ G01")).toBeVisible();
    const stickyMeta = page.getByLabel("Сводка интервью");
    await expect(stickyMeta).toBeVisible();
    await expect(stickyMeta).toContainText("Самостоятельные поездки:");
    await expect(stickyMeta).toContainText("Итоговая категория:");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(stickyMeta).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route(answerRoute, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      await route.continue();
    });
    await page.getByLabel("Ответ G01").fill("Проверка системной настройки уменьшения движения.");
    const saving = page.getByText("Сохраняется").first();
    await expect(saving).toBeVisible();
    expect(await saving.locator("svg").evaluate((element) => getComputedStyle(element).animationName)).toBe("none");
    expect(await page.getByRole("progressbar").locator("div").evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  });
});
