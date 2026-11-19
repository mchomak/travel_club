import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StartPage from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("Public lead form publication", () => {
  it.each([undefined, "false", "1"])("keeps the form closed with WEBSITE_LEAD_FORM_ENABLED=%s", async (enabled) => {
    vi.stubEnv("WEBSITE_LEAD_FORM_ENABLED", enabled);
    render(await StartPage({ searchParams: Promise.resolve({ format: "group", source: "home" }) }));

    expect(screen.getByRole("heading", { name: "Приём заявок пока закрыт." })).toBeVisible();
    expect(screen.getByRole("link", { name: "Документы об обработке данных" })).toHaveAttribute("href", "/legal");
    expect(screen.queryByRole("form", { name: "Заявка на поездку" })).not.toBeInTheDocument();
  });

  it("renders the selected travel product after explicitly enabling the form", async () => {
    vi.stubEnv("WEBSITE_LEAD_FORM_ENABLED", "true");
    render(await StartPage({ searchParams: Promise.resolve({ format: "group", source: "home" }) }));

    expect(screen.getByRole("form", { name: "Заявка на поездку" })).toBeVisible();
    expect(screen.getByLabelText("Что вам интересно?")).toHaveValue("group");
  });
});
