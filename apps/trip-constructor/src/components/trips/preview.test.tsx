import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { TripPreview } from "./preview";
import { TripProvider } from "./ui";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function mockLinkApi(initiallyActive: boolean) {
  let active = initiallyActive;
  const token = "a".repeat(43);
  const replacement = "b".repeat(43);
  let current = token;
  const fetcher = vi.fn(async (url: string, options: RequestInit) => {
    if (url === "/api/trips/example/public-link/rotate" && options.method === "POST") {
      current = replacement;
      return Response.json({ token: current });
    }
    if (url !== "/api/trips/example/public-link") return new Response(null, { status: 404 });
    if (options.method === "POST") {
      active = true;
      return Response.json({ token: current });
    }
    if (options.method === "DELETE") {
      active = false;
      return new Response(null, { status: 204 });
    }
    return Response.json({ active, token: active ? current : null });
  });
  vi.stubGlobal("fetch", fetcher);
  render(<TripProvider><TripPreview id="example" /></TripProvider>);
  return { token, replacement, fetcher };
}

test("offers a private preview before a client link is issued", async () => {
  vi.stubEnv("NEXT_PUBLIC_WEBSITE_URL", undefined);
  const { fetcher } = mockLinkApi(false);
  expect(await screen.findByRole("button", { name: "Создать ссылку" })).toBeVisible();
  const preview = screen.getByRole("link", { name: "Открыть предпросмотр" });
  expect(preview).toHaveAttribute("href", "/trip/preview/example");
  expect(preview).toHaveAttribute("rel", "noopener noreferrer");
  expect(fetcher.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
});

test("opens the private preview at the configured Website origin", async () => {
  vi.stubEnv("NEXT_PUBLIC_WEBSITE_URL", "http://localhost:3100");
  mockLinkApi(false);
  expect(await screen.findByRole("link", { name: "Открыть предпросмотр" })).toHaveAttribute(
    "href", "http://localhost:3100/trip/preview/example",
  );
});

test("creates a link on request, opens the actual client URL, copies it and revokes access", async () => {
  const user = userEvent.setup();
  const { token } = mockLinkApi(false);
  await user.click(await screen.findByRole("button", { name: "Создать ссылку" }));
  const href = new URL(`/trip/${token}`, window.location.origin).href;
  expect(await screen.findByRole("link", { name: "Открыть клиентский вид" })).toHaveAttribute("href", href);
  await user.click(screen.getByRole("button", { name: "Скопировать ссылку" }));
  expect(await navigator.clipboard.readText()).toBe(href);
  await user.click(screen.getByRole("button", { name: "Отключить ссылку" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Отключить" }));
  expect(await screen.findByRole("button", { name: "Создать ссылку" })).toBeVisible();
  expect(screen.queryByRole("link", { name: "Открыть клиентский вид" })).toBeNull();
});

test("opening management for an existing link preserves it until replacement is confirmed", async () => {
  const user = userEvent.setup();
  const { token, replacement, fetcher } = mockLinkApi(true);
  const preview = await screen.findByRole("link", { name: "Открыть клиентский вид" });
  expect(preview).toHaveAttribute("href", new URL(`/trip/${token}`, window.location.origin).href);
  await user.click(await screen.findByRole("button", { name: "Заменить ссылку" }));
  const dialog = within(screen.getByRole("dialog"));
  expect(dialog.getByText(/Прежняя ссылка перестанет работать/)).toBeVisible();
  expect(fetcher.mock.calls.some(([, options]) => options.method === "POST")).toBe(false);
  await user.click(dialog.getByRole("button", { name: "Заменить" }));
  expect(await screen.findByDisplayValue(new URL(`/trip/${replacement}`, window.location.origin).href)).toBeVisible();
});
