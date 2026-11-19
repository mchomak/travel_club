import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThanksConfirmation } from "./thanks-confirmation";

vi.mock("next/link", () => ({ default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a> }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear(); });

describe("Thanks confirmation", () => {
  it("does not claim success when the page is opened directly", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    vi.stubGlobal("fetch", fetchMock);
    render(<ThanksConfirmation token="" />);
    expect(await screen.findByText(/Не видим действующее подтверждение/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("проверить заявку");
    expect(screen.queryByText(/Заявка сохранена/)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/leads/receipt?confirmation=", expect.anything());
  });

  it("shows confirmation only after the server verifies the opaque receipt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lead_number: "TC-000123" }) }));
    render(<ThanksConfirmation token="signed-receipt" />);
    expect((await screen.findByText(/Заявка сохранена/)).textContent).toContain("Заявка сохранена");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Спасибо");
    expect(screen.getByText("TC-000123")).toBeInTheDocument();
    expect(screen.getByText(/Заявка сохранена/)).toBeInTheDocument();
  });

  it("verifies the cookie receipt again after a reload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ lead_number: "TC-000123" }) });
    vi.stubGlobal("fetch", fetchMock);
    const first = render(<ThanksConfirmation token="" confirmation="abc" />);
    expect(await screen.findByText("TC-000123")).toBeInTheDocument();
    first.unmount();
    render(<ThanksConfirmation token="" confirmation="abc" />);
    expect(await screen.findByText("TC-000123")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith("/api/leads/receipt?confirmation=abc", expect.anything());
    expect(screen.getByText("TC-000123").closest(".ym-hide-content")).not.toBeNull();
  });

  it("shows checking while the receipt is being verified", async () => {
    let resolveResponse!: (value: { ok: boolean; json: () => Promise<{ lead_number: string }> }) => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise((resolve) => { resolveResponse = resolve; })));
    render(<ThanksConfirmation token="" />);
    expect(screen.getByRole("heading", { level: 1 }).closest("[aria-busy]")).toHaveAttribute("aria-busy", "true");
    resolveResponse({ ok: true, json: async () => ({ lead_number: "TC-000123" }) });
    expect(await screen.findByText("TC-000123")).toBeInTheDocument();
  });

  it("keeps an expired receipt in a neutral state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<ThanksConfirmation token="expired-receipt" />);
    expect((await screen.findByText(/Не видим действующее подтверждение/)).textContent).toContain("Не видим");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("проверить заявку");
    expect(screen.queryByText(/Заявка сохранена/)).not.toBeInTheDocument();
  });
});
