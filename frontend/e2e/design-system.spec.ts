import { expect, test } from "@playwright/test";

test("playground exposes the rest of its scoped token controls and editorial sections", async ({ page }) => {
  await page.goto("/design-system");

  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview).toBeVisible();
  await expect(page.getByRole("group", { name: "Destination theme" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Preview viewport" })).toBeVisible();
  await expect(page.getByText("Layout", { exact: true })).toBeVisible();
  await expect(preview.getByText("МАРШРУТ", { exact: true })).toBeVisible();
  await expect(preview.getByRole("textbox", { name: "Ваше имя" })).toBeVisible();
  await expect(preview.getByRole("textbox", { name: "О пожеланиях" })).toBeVisible();
  await expect(preview.getByRole("combobox", { name: "Формат поездки" })).toBeVisible();
  await expect(preview.getByRole("textbox", { name: "Email with error" })).toHaveAttribute("aria-invalid", "true");
  await expect(preview.getByRole("textbox", { name: "Disabled field example" })).toBeDisabled();
  await expect(preview.getByRole("link", { name: /Обсудить поездку/ })).toBeVisible();
});

test("colors, type, spacing, layout, grid, themes and viewport controls update the preview immediately", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/design-system");

  const preview = page.getByRole("region", { name: "Live preview" });
  await page.getByText("Colors", { exact: true }).click();
  await page.getByRole("textbox", { name: "Cloud HEX" }).fill("#112233");
  await expect(preview).toHaveCSS("background-color", "rgb(17, 34, 51)");
  await expect(preview).toHaveAttribute("style", /--tc-color-cloud: #112233/);

  await page.getByText("H1", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "H1 line height" }).fill("1.2");
  await expect(preview).toHaveAttribute("style", /--tc-type-h1-line-height: 1.2/);

  await page.getByText("Spacing", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "Space S" }).fill("22");
  await expect(preview).toHaveAttribute("style", /--tc-space-s: 22px/);
  await expect(preview.getByText("Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ.", { exact: true })).toHaveCSS("margin-top", "22px");

  await page.getByText("Layout", { exact: true }).click();
  const canvasPage = preview.getByTestId("preview-page");
  await page.getByRole("spinbutton", { name: "Max container width" }).fill("900");
  await expect(preview).toHaveAttribute("style", /--tc-layout-container-width: 900px/);
  await expect(canvasPage).toHaveCSS("width", "900px");

  const beforeGrid = await preview.boundingBox();
  await page.getByRole("checkbox", { name: "Show grid overlay" }).check();
  await expect(preview.getByTestId("grid-overlay")).toBeVisible();
  const afterGrid = await preview.boundingBox();
  expect(afterGrid).toEqual(beforeGrid);

  const themeButtons = [
    {
      name: "CHINA", color: "#163A5F", photo: "beijing-hutong.jpg", secondaryPhoto: "shanghai-street.jpg",
      city: "ПЕКИН · КИТАЙ", context: "ХАНЧЖОУ · КИТАЙ", route: "ПЕКИН — ХАНЧЖОУ — ШАНХАЙ",
      coordinates: "39°54′ N / 116°24′ E · ПЕКИН", secondaryCaption: "ШАНХАЙ / ДРУГОЙ РИТМ ГОРОДА",
      heroAlt: "Улица старого Пекина", secondaryAlt: "Уличное движение на перекрёстке в Шанхае",
      galleryPhotos: ["shanghai-dumplings.jpg", "shanghai-evening.jpg", "shanghai-street.jpg", "beijing-hutong.jpg", "shanghai-night.jpg"],
    },
    {
      name: "THAILAND", color: "#27493B", photo: "bangkok-night.jpg", secondaryPhoto: "thailand-boat.jpg",
      city: "БАНГКОК · ТАИЛАНД", context: "ЧИАНГМАЙ · ТАИЛАНД", route: "БАНГКОК — ЧИАНГМАЙ — ОСТРОВА",
      coordinates: "13°45′ N / 100°30′ E · БАНГКОК", secondaryCaption: "ОСТРОВА / ПОСЛЕ ГОРОДА",
      heroAlt: "Вечерняя улица Бангкока", secondaryAlt: "Деревянная лодка у известняковых скал Таиланда",
      galleryPhotos: ["thailand-boat.jpg", "bangkok-night.jpg", "thailand-islands.jpg", "thailand-road.jpg", "bangkok-food.jpg"],
    },
    {
      name: "MADAGASCAR", color: "#7D3027", photo: "madagascar-baobabs.jpg", secondaryPhoto: "madagascar-lemur.jpg",
      city: "МОРОНДАВА · МАДАГАСКАР", context: "НОСИ-БЕ · МАДАГАСКАР", route: "АНТАНАНАРИВУ — МОРОНДАВА — НОСИ-БЕ",
      coordinates: "20°17′ S / 44°17′ E · МОРОНДАВА", secondaryCaption: "ДИКАЯ ПРИРОДА / МАДАГАСКАР",
      heroAlt: "Баобабы на Мадагаскаре", secondaryAlt: "Лемур среди зелени на Мадагаскаре",
      galleryPhotos: ["madagascar-sunset.jpg", "madagascar-baobabs.jpg", "madagascar-lemur.jpg", "madagascar-baobabs.jpg", "madagascar-lemur.jpg"],
    },
    {
      name: "TC", color: "#172f50", photo: "memory-dinner.jpg", secondaryPhoto: "club-evening.jpg",
      city: "ПУТЕШЕСТВИЯ В КОМПАНИИ", context: "FIELD NOTE / 2026", route: "ДРУЗЬЯ · ДОРОГА · ОБЩИЕ ИСТОРИИ",
      coordinates: "FIELD NOTE 01 · TRAVEL CLUB", secondaryCaption: "РАЗГОВОРЫ ПОСЛЕ ДОЛГОГО ДНЯ",
      heroAlt: "Друзья разговаривают за ужином при свете свечей", secondaryAlt: "Непринуждённый вечерний разговор друзей за столом под тёплым светом ламп",
      galleryPhotos: ["memory-dinner.jpg", "club-evening.jpg", "memory-dinner.jpg", "club-evening.jpg", "memory-dinner.jpg"],
    },
  ];
  for (const theme of themeButtons) {
    await page.getByRole("button", { name: theme.name, exact: true }).click();
    await expect(preview).toHaveAttribute("style", new RegExp(`--tc-theme-accent: ${theme.color}`));
    await expect(preview.getByTestId("frame-hero").locator("img")).toHaveAttribute("src", new RegExp(theme.photo.replaceAll(".", "\\.")));
    await expect(preview.getByTestId("frame-hero").locator("img")).toHaveAttribute("alt", theme.heroAlt);
    await expect(preview.getByTestId("frame-editorial-large").locator("img")).toHaveAttribute("src", new RegExp(theme.secondaryPhoto.replaceAll(".", "\\.")));
    await expect(preview.getByTestId("frame-editorial-large").locator("img")).toHaveAttribute("alt", theme.secondaryAlt);
    await expect(preview.getByTestId("theme-city")).toHaveText(theme.city);
    await expect(preview.getByTestId("theme-route-context")).toHaveText(theme.context);
    await expect(preview.getByTestId("theme-route")).toHaveText(theme.route);
    await expect(preview.getByTestId("theme-coordinates")).toHaveText(theme.coordinates);
    await expect(preview.getByTestId("theme-secondary-caption")).toHaveText(theme.secondaryCaption);
    const galleryImages = preview.locator('[aria-label="Image frame examples"] img');
    await expect(galleryImages).toHaveCount(theme.galleryPhotos.length);
    await expect.poll(() => galleryImages.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).alt.trim().length > 0))).toBe(true);
    for (const [index, filename] of theme.galleryPhotos.entries()) {
      await expect(galleryImages.nth(index)).toHaveAttribute("src", new RegExp(filename.replaceAll(".", "\\.")));
    }
  }

  for (const viewport of [
    { name: "Tablet viewport", label: "TABLET", width: "768px" },
    { name: "Mobile viewport", label: "MOBILE", width: "390px" },
    { name: "Desktop viewport", label: "DESKTOP", width: "1440px" },
  ]) {
    await page.getByRole("button", { name: viewport.name }).click();
    await expect(preview).toHaveCSS("width", viewport.width);
    await expect(page.getByText(new RegExp(`${viewport.width.replace("px", "")} px canvas`))).toBeVisible();
  }

  const previewLink = preview.getByRole("link", { name: /Обсудить поездку/ });
  const arrow = previewLink.locator("span").last();
  await previewLink.hover();
  await expect(arrow).toHaveCSS("background-color", "rgb(23, 47, 80)");
  await previewLink.focus();
  await expect(previewLink).toBeFocused();
});

test("group and global reset restore source values and group reset names stay distinct", async ({ page }) => {
  await page.goto("/design-system");
  const preview = page.getByRole("region", { name: "Live preview" });
  await page.getByText("Colors", { exact: true }).click();
  await page.getByRole("textbox", { name: "Cloud HEX" }).fill("#112233");
  await page.getByRole("button", { name: "Reset color group Core and destinations" }).click();
  await expect(preview).toHaveAttribute("style", /--tc-color-cloud: #F2F0EA/);
  await expect(page.getByRole("button", { name: "Reset color group Core and destinations" })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Reset color group Editorial source colors" })).toHaveCount(1);
  await page.getByRole("button", { name: "CHINA", exact: true }).click();
  await page.getByRole("button", { name: "Reset all" }).click();
  await expect(preview).toHaveAttribute("style", /--tc-theme-accent: #172f50/);
  await expect(preview).toHaveAttribute("style", /--tc-color-cloud: #F2F0EA/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("travel-club.design-system.draft.v3"))).toBeNull();
});

test("Copy CSS supports clipboard and manual fallback; JSON download contains current token categories", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/design-system");
  await page.getByText("Colors", { exact: true }).click();
  await page.getByRole("textbox", { name: "Cloud HEX" }).fill("#112233");

  await page.getByRole("button", { name: "Copy CSS" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("--tc-color-cloud: #112233;");

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("clipboard denied"); } },
    });
  });
  await page.getByRole("button", { name: "Copy CSS" }).click();
  await expect(page.getByRole("textbox", { name: "CSS output" })).toHaveValue(/--tc-color-cloud: #112233;/);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export tokens" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("travel-club-design-tokens.json");
  const path = await download.path();
  expect(path).toBeTruthy();
  const { readFile } = await import("node:fs/promises");
  const tokens = JSON.parse(await readFile(path!, "utf8")) as Record<string, unknown>;
  expect(tokens).toMatchObject({
    colors: { cloud: "#112233" },
    typography: { displayXL: { family: "TC Golos" } },
    spacing: { xs: 4, "2xl": 48 },
    layout: { columns: 12 },
    theme: "tc",
    viewport: "desktop",
    showGrid: false,
  });
  expect(tokens.frames).toBeDefined();
});

test("valid browser draft reloads from localStorage and reset clears that browser draft", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/design-system");
  await page.getByRole("button", { name: "CHINA", exact: true }).click();
  await page.getByText("Colors", { exact: true }).click();
  await page.getByRole("textbox", { name: "Cloud HEX" }).fill("#d9e7ef");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("travel-club.design-system.draft.v3"))).not.toBeNull();

  await page.reload();
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview).toHaveAttribute("style", /--tc-theme-accent: #163A5F/);
  await expect(preview).toHaveAttribute("style", /--tc-color-cloud: #d9e7ef/);
  await page.getByRole("button", { name: "Reset all" }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("travel-club.design-system.draft.v3"))).toBeNull();
  expect(errors).toEqual([]);
});

test("a v2 browser draft migrates clamp defaults, survives reload, and Reset clears both versions", async ({ page }) => {
  await page.goto("/design-system");
  await expect(page.getByRole("button", { name: "Reset all" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("travel-club.design-system.draft.v3"))).not.toBeNull();

  await page.evaluate(() => {
    type StoredRole = { desktopSize: number; mobileSize: number; responsiveScale?: Record<string, number> };
    type StoredState = {
      theme: string;
      viewport: string;
      showGrid: boolean;
      tokens: {
        colors: Record<string, string>;
        spacing: Record<string, number>;
        layout: Record<string, number>;
        typography: Record<string, StoredRole>;
      };
    };
    const current = JSON.parse(localStorage.getItem("travel-club.design-system.draft.v3") ?? "null") as { state: StoredState } | null;
    if (!current) throw new Error("The current browser draft was not initialized");
    const state = current.state;
    state.theme = "china";
    state.viewport = "mobile";
    state.showGrid = true;
    state.tokens.colors.cloud = "#aabbcc";
    state.tokens.spacing.s = 19;
    state.tokens.layout.containerWidth = 1280;
    state.tokens.typography.displayL.desktopSize = 126;
    state.tokens.typography.displayL.mobileSize = 51;
    state.tokens.typography.displayL.responsiveScale = {
      desktopMin: 72, desktopVw: 10.7, mobileVw: 11.2, mobileReferenceWidth: 390,
    };
    state.tokens.typography.h1.desktopSize = 82;
    state.tokens.typography.h1.mobileSize = 47;
    state.tokens.typography.h1.responsiveScale = {
      desktopMin: 46, desktopVw: 4.8, mobileVw: 9.9, mobileReferenceWidth: 390,
    };
    localStorage.setItem("travel-club.design-system.draft.v2", JSON.stringify({ version: 2, state }));
    localStorage.removeItem("travel-club.design-system.draft.v3");
  });

  await page.reload();
  const preview = page.getByRole("region", { name: "Live preview" });
  await expect(preview).toHaveAttribute("style", /--tc-color-cloud: #aabbcc/);
  await expect(preview).toHaveAttribute("style", /--tc-theme-accent: #163A5F/);
  await expect(preview).toHaveAttribute("style", /--tc-space-s: 19px/);
  await expect(preview).toHaveAttribute("style", /--tc-layout-container-width: 1280px/);
  await expect(preview).toHaveAttribute("style", /--tc-type-display-l-desktop-size: 126/);
  await expect(preview).toHaveAttribute("style", /--tc-type-display-l-mobile-size: 51/);
  await expect(preview).toHaveAttribute("style", /--tc-type-display-l-mobile-resolved-size: clamp\(38px, 11\.2cqw, 76px\)/);
  await expect(preview).toHaveAttribute("style", /--tc-type-display-l-mobile-below-360-resolved-size: 10\.4cqw/);
  await expect(preview).toHaveAttribute("style", /--tc-type-h1-mobile-resolved-size: clamp\(35px, 9\.9cqw, 58px\)/);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("travel-club.design-system.draft.v3") ?? "null")?.version)).toBe(3);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("travel-club.design-system.draft.v2"))).toBeNull();

  await page.reload();
  await expect(page.getByRole("region", { name: "Live preview" })).toHaveAttribute("style", /--tc-type-display-l-mobile-resolved-size: clamp\(38px, 11\.2cqw, 76px\)/);
  await page.evaluate(() => localStorage.setItem("travel-club.design-system.draft.v2", "legacy draft"));
  await page.getByRole("button", { name: "Reset all" }).click();
  await expect.poll(() => page.evaluate(() => [
    localStorage.getItem("travel-club.design-system.draft.v2"),
    localStorage.getItem("travel-club.design-system.draft.v3"),
  ])).toEqual([null, null]);
});

test("theme and token changes remain scoped when returning to existing routes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const routes = ["/", "/test", "/test_2", "/test_3", "/test_4"];
  const signatures: Record<string, unknown> = {};
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    signatures[route] = await page.evaluate(() => {
      const sample = document.querySelector("main h1, h1, main") ?? document.body;
      const style = getComputedStyle(sample);
      const bounds = sample.getBoundingClientRect();
      return {
        bodyFont: getComputedStyle(document.body).fontFamily,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        background: style.backgroundColor,
        padding: style.padding,
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    });
  }

  await page.goto("/design-system");
  await page.getByRole("button", { name: "MADAGASCAR", exact: true }).click();
  await page.getByText("Colors", { exact: true }).click();
  await page.getByRole("textbox", { name: "Cloud HEX" }).fill("#d9e7ef");
  await page.getByText("Spacing", { exact: true }).click();
  await page.getByRole("spinbutton", { name: "Space 2XL" }).fill("120");

  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const after = await page.evaluate(() => {
      const sample = document.querySelector("main h1, h1, main") ?? document.body;
      const style = getComputedStyle(sample);
      const bounds = sample.getBoundingClientRect();
      return {
        bodyFont: getComputedStyle(document.body).fontFamily,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        color: style.color,
        background: style.backgroundColor,
        padding: style.padding,
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    });
    expect(after, `route ${route} stays isolated`).toEqual(signatures[route]);
  }
});

test("public routes and the playground load without browser errors or failed local requests", async ({ page }) => {
  const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000").origin;
  await page.setViewportSize({ width: 1880, height: 1180 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(localOrigin) && response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const route of ["/", "/test", "/test_2", "/test_3", "/test_4", "/design-system"]) {
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok(), `${route} responds successfully`).toBeTruthy();
    await page.evaluate(() => document.fonts.ready);
    if (route === "/design-system") {
      await expect(page.getByRole("region", { name: "Live preview" })).toBeVisible();
      const frameImages = page.locator('[aria-label="Image frame examples"] img');
      await expect(frameImages).toHaveCount(5);
      await expect.poll(() => frameImages.evaluateAll((images) => images.every((image) => {
        const loaded = image as HTMLImageElement;
        return loaded.complete && loaded.naturalWidth > 0;
      }))).toBe(true);
      await page.screenshot({ path: "test-results/design-system-refinement-1440.png", fullPage: false });

      const themeScreenshots = ["TC", "CHINA", "THAILAND", "MADAGASCAR"];
      for (const theme of themeScreenshots) {
        await page.getByRole("button", { name: theme, exact: true }).click();
        const themedPhotos = page.getByRole("region", { name: "Live preview" }).locator('[data-testid="frame-hero"] img, [data-testid="frame-editorial-large"] img, [aria-label="Image frame examples"] img');
        await expect.poll(() => themedPhotos.evaluateAll((images) => images.length === 7 && images.every((image) => {
          const loaded = image as HTMLImageElement;
          return loaded.complete && loaded.naturalWidth > 0;
        }))).toBe(true);
        await themedPhotos.evaluateAll((images) => Promise.all(images.map((image) => (image as HTMLImageElement).decode())));
        await page.screenshot({ path: `test-results/design-system-theme-${theme.toLowerCase()}.png`, fullPage: true });
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/design-system", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Mobile viewport" }).click();
  const mobileFrameImages = page.locator('[aria-label="Image frame examples"] img');
  await expect.poll(() => mobileFrameImages.evaluateAll((images) => images.length === 5 && images.every((image) => {
    const loaded = image as HTMLImageElement;
    return loaded.complete && loaded.naturalWidth > 0;
  }))).toBe(true);
  await page.screenshot({ path: "test-results/design-system-refinement-mobile.png", fullPage: true });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});
