import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImportDrafts } from "./import-drafts";
import { importDraftApi } from "@/lib/import-drafts";
import { ApiError } from "@/lib/api";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function renderDrafts() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><ImportDrafts /></QueryClientProvider>);
}
test("opens a saved draft, edits its JSON and shows validation after saving", async () => {
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: JSON.stringify({ title: "До" }), validation: { issues: [{ title: "Нет даты", message: "Укажите дату" }] } });
  const save = vi.spyOn(importDraftApi, "save").mockResolvedValue({ id: "draft-1", version: 2, source: JSON.stringify({ title: "После" }), validation: { issues: [] } });
  const user = userEvent.setup(); renderDrafts();
  await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  expect(await screen.findByText("Нет даты")).toBeInTheDocument();
  const editor = screen.getByLabelText("JSON черновика");
  await user.clear(editor); await user.type(editor, '{{"title":"После"}');
  await user.click(screen.getByRole("button", { name: "Сохранить и проверить" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith("draft-1", 1, JSON.stringify({ title: "После" })));
  expect(await screen.findByText("Замечаний не найдено.")).toBeInTheDocument();
});
test("version conflict preserves edited text and explains the conflict", async () => {
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01", updated_at: "2026-01-01" }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: "{}", validation: { issues: [] } });
  vi.spyOn(importDraftApi, "save").mockRejectedValue(new ApiError(409, "CONFLICT", "Конфликт"));
  const user = userEvent.setup(); renderDrafts();
  await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  const editor = await screen.findByLabelText("JSON черновика");
  await user.clear(editor); await user.type(editor, '{{"local":true}');
  await user.click(screen.getByRole("button", { name: "Сохранить и проверить" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("изменён в другом месте");
  expect(editor).toHaveValue('{"local":true}');
});

const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
import { TripList } from "./trip-list";
import { tripApi } from "@/lib/trips";

test("offers explicit draft saving after a rejected trip import", async () => {
  vi.spyOn(tripApi, "list").mockResolvedValue([]);
  vi.spyOn(tripApi, "import").mockRejectedValue(new ApiError(422, "INVALID", "Ошибка импорта"));
  vi.spyOn(importDraftApi, "list").mockResolvedValue([]);
  const create = vi.spyOn(importDraftApi, "create").mockResolvedValue({ id: "saved", version: 1, source: JSON.stringify({ title: "Маршрут" }), validation: { issues: [] } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup();
  const { container } = render(<QueryClientProvider client={client}><TripList /></QueryClientProvider>);
  const file = new File(['{"title":"Маршрут"}'], "trip.json", { type: "application/json" });
  file.text = async () => '{"title":"Маршрут"}';
  await user.upload(container.querySelector('input[type="file"]')!, file);
  expect(await screen.findByText(/Импорт не выполнен/)).toBeInTheDocument();
  expect(create).not.toHaveBeenCalled();
  expect(navigation.push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Сохранить исходник как черновик" }));
  await waitFor(() => expect(create).toHaveBeenCalledWith(JSON.stringify({ title: "Маршрут" })));
  expect(await screen.findByText(/Черновик saved · версия 1/)).toBeInTheDocument();
});

test("draft API sends raw source and the version used for concurrency", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "one", version: 2, source: '{"days":[]}', validation: { issues: [] } }), { status: 200, headers: { "Content-Type": "application/json" } }));
  await importDraftApi.save("one", 1, '{"days":[]}');
  expect(fetchMock).toHaveBeenCalledWith("/api/import-drafts/one?version=1", expect.objectContaining({ method: "PUT", body: '{"days":[]}', credentials: "same-origin" }));
});

test("requires saving edits before creating a trip, then opens the created trip", async () => {
  navigation.push.mockReset();
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01", updated_at: "2026-01-01", trip_id: null }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: "{}", trip_id: null, validation: { issues: [], document_checks_passed: true } });
  vi.spyOn(importDraftApi, "save").mockResolvedValue({ id: "draft-1", version: 2, source: '{"edited":true}', trip_id: null, validation: { issues: [], document_checks_passed: true } });
  const apply = vi.spyOn(importDraftApi, "apply").mockResolvedValue({ id: "trip-created" } as never);
  const user = userEvent.setup(); renderDrafts();
  await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  const editor = await screen.findByLabelText("JSON черновика");
  await user.clear(editor); await user.type(editor, '{{"edited":true}');
  expect(screen.getByRole("button", { name: "Создать поездку из черновика" })).toBeDisabled();
  expect(screen.getByText(/Сначала сохраните изменения/)).toBeInTheDocument();
  expect(editor).toHaveValue('{"edited":true}');
  await user.click(screen.getByRole("button", { name: "Сохранить и проверить" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Создать поездку из черновика" })).toBeEnabled());
  await user.click(screen.getByRole("button", { name: "Создать поездку из черновика" }));
  await waitFor(() => expect(apply).toHaveBeenCalledWith("draft-1", 2));
  expect(navigation.push).toHaveBeenCalledWith("/admin/trips/trip-created");
});
test("a previously applied draft opens its trip without applying again", async () => {
  navigation.push.mockReset();
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01", updated_at: "2026-01-01", trip_id: "existing" }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: "{}", trip_id: "existing", validation: { issues: [] } });
  const apply = vi.spyOn(importDraftApi, "apply"); const user = userEvent.setup(); renderDrafts();
  await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  await user.click(await screen.findByRole("button", { name: "Открыть поездку" }));
  expect(apply).not.toHaveBeenCalled(); expect(navigation.push).toHaveBeenCalledWith("/admin/trips/existing");
});
test("an invalid saved draft offers a safe partial import with an explicit warning", async () => {
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01", updated_at: "2026-01-01", trip_id: null }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: "{}", trip_id: null, validation: { issues: [], document_checks_passed: false } });
  const user = userEvent.setup(); renderDrafts(); await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  expect(await screen.findByText(/Остальное останется в исходном JSON/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Создать поездку из черновика" })).toBeEnabled();
});

test("failed trip creation keeps the draft and explains what needs correction", async () => {
  navigation.push.mockReset();
  vi.spyOn(importDraftApi, "list").mockResolvedValue([{ id: "draft-1", version: 1, created_at: "2026-01-01", updated_at: "2026-01-01", trip_id: null }]);
  vi.spyOn(importDraftApi, "get").mockResolvedValue({ id: "draft-1", version: 1, source: "{}", trip_id: null, validation: { issues: [], document_checks_passed: true } });
  vi.spyOn(importDraftApi, "apply").mockRejectedValue(new ApiError(422, "INVALID", "Ошибка"));
  const user = userEvent.setup(); renderDrafts();
  await user.click(await screen.findByRole("button", { name: /Открыть черновик/ }));
  await user.click(await screen.findByRole("button", { name: "Создать поездку из черновика" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Исправьте замечания");
  expect(screen.getByLabelText("JSON черновика")).toHaveValue("{}");
  expect(navigation.push).not.toHaveBeenCalled();
});
