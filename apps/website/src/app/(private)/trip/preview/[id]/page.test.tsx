import { render, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import Page from "./page";

const { getCookie } = vi.hoisted(() => ({ getCookie: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: getCookie }) }));

const id = "eb8b3786-b9cb-4f3f-a000-773c2abbef62";
const params = Promise.resolve({ id });
const notFound = { digest: "NEXT_HTTP_ERROR_FALLBACK;404" };

afterEach(() => {
  getCookie.mockReset();
  vi.unstubAllGlobals();
});

test("renders the itinerary using only the current admin session and the protected GET endpoint", async () => {
  getCookie.mockReturnValue({ name: "travel_session", value: "preview-test-session" });
  const fetcher = vi.fn().mockResolvedValue(Response.json({
    client_title: "Маршрут для клиента", start_date: "2026-11-20", end_date: "2026-11-20",
    participants: 2, days: [], general_items: [
      { type: "flight", title: "Перелёт", departure_city: "Москва", arrival_city: "Осака" },
    ],
  }));
  vi.stubGlobal("fetch", fetcher);
  const { container } = render(await Page({ params }));
  const view = within(container);
  expect(view.getByRole("heading", { name: "Маршрут для клиента" })).toBeVisible();
  expect(view.getByText("Москва → Осака")).toBeVisible();
  expect(view.getByRole("button", { name: "Распечатать программу" })).toBeVisible();
  expect(container).not.toHaveTextContent("preview-test-session");
  expect(getCookie).toHaveBeenCalledExactlyOnceWith("travel_session");
  expect(fetcher).toHaveBeenCalledOnce();
  const [url, options] = fetcher.mock.calls[0];
  expect(new URL(url).pathname).toBe(`/api/trips/${id}/public-preview`);
  expect(options).toMatchObject({ method: "GET", cache: "no-store", redirect: "error", headers: { Cookie: "travel_session=preview-test-session" } });
});

test("rejects a malformed trip ID or a missing session before contacting the backend", async () => {
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  await expect(Page({ params: Promise.resolve({ id: "../private" }) })).rejects.toMatchObject(notFound);
  expect(getCookie).not.toHaveBeenCalled();
  await expect(Page({ params })).rejects.toMatchObject(notFound);
  expect(fetcher).not.toHaveBeenCalled();
});

test.each([401, 404])("returns not found when the protected endpoint responds with %i", async status => {
  getCookie.mockReturnValue({ name: "travel_session", value: "preview-test-session" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("backend detail", { status })));
  await expect(Page({ params })).rejects.toMatchObject(notFound);
});


test("loads uploaded day photos through the authenticated preview endpoint", async () => {
  getCookie.mockReturnValue({ name: "travel_session", value: "preview-test-session" });
  const photoId = `upload-${"b".repeat(32)}`;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    client_title: "Trip", start_date: "2026-11-20", end_date: "2026-11-20", participants: 1,
    days: [{ date: "2026-11-20", photo_id: photoId, items: [] }], general_items: [],
  })));
  const { container } = render(await Page({ params }));
  expect(container.querySelector("img")).toHaveAttribute("src", `/api/trips/${id}/photos/${photoId}`);
});
