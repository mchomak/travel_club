import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3219";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL, trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm.cmd exec -- next dev --hostname 127.0.0.1 --port 3219",
    url: baseURL,
    env: {
      WEBSITE_LEAD_FORM_ENABLED: "true",
      WEBSITE_LEADS_API_URL: "http://127.0.0.1:1",
      NEXT_PUBLIC_YANDEX_METRIKA_ENABLED: process.env.WEBSITE_TEST_METRIKA_ENABLED === "true" ? "true" : "false",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
