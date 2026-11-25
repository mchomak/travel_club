import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripReimport } from "./trip-reimport";
import { reimportApi } from "@/lib/trip-reimport";
import { ApiError } from "@/lib/api";

beforeEach(() => { vi.spyOn(reimportApi, "backups").mockResolvedValue([{ id: "backup", trip_version: 3, created_at: "2026-01-01T00:00:00Z" }]); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const file = (value: unknown) => { const f = new File([JSON.stringify(value)], "route.json", { type: "application/json" }); f.text = async () => JSON.stringify(value); return f; };
const valid = { format: "travel-club-trip", version: 1, reimport: { trip_id: "trip-1", snapshot_id: "snapshot-1" }, trip: { participants: 5 } };
const preview = { version: 3, changes: [
  { path: "/participants", operation: "replace", base: 2, current: 2, proposed: 5, base_present: true, current_present: true, proposed_present: true, conflict: false },
  { path: "/client_title", operation: "replace", base: "A", current: "B", proposed: "C", base_present: true, current_present: true, proposed_present: true, conflict: true },
], validation_before: [{ id: "old", message: "Старая ошибка" }], validation_after: [{ id: "new", message: "Новая ошибка" }] };

test("rejects a file without lineage without requesting preview", async () => {
  const request = vi.spyOn(reimportApi, "preview"); const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file({ format: "travel-club-trip", version: 1, trip: {} }));
  expect(await screen.findByRole("alert")).toHaveTextContent("метаданные"); expect(request).not.toHaveBeenCalled();
});
test("shows conflict and validation changes, and requires explicit selection and confirmation", async () => {
  vi.spyOn(reimportApi, "preview").mockResolvedValue(preview);
  const apply = vi.spyOn(reimportApi, "apply").mockResolvedValue({ trip: { version: 4 } as never, backup_snapshot_id: "backup" });
  const onApplied = vi.fn(), user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={onApplied} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  expect(await screen.findByText("Новая ошибка")).toBeInTheDocument(); expect(screen.getByText("Старая ошибка")).toBeInTheDocument();
  expect(screen.getByRole("checkbox", { name: /client_title/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Применить выбранное" })).toBeDisabled();
  await user.click(screen.getByRole("checkbox", { name: /participants/ }));
  await user.click(screen.getByRole("button", { name: "Применить выбранное" }));
  expect(apply).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Подтвердить применение" }));
  await waitFor(() => expect(apply).toHaveBeenCalledWith("trip-1", expect.objectContaining({ snapshot_id: "snapshot-1", expected_version: 3, selected_paths: ["/participants"], confirm_date_removal: false })));
  expect(onApplied).toHaveBeenCalled(); expect(await screen.findByRole("button", { name: "Восстановить прежнюю версию" })).toBeInTheDocument();
});
test("a version conflict requires a new preview and keeps the uploaded file", async () => {
  const check = vi.spyOn(reimportApi, "preview").mockResolvedValue(preview);
  vi.spyOn(reimportApi, "apply").mockRejectedValue(new ApiError(409, "CONFLICT", "Конфликт"));
  const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  await user.click(await screen.findByRole("checkbox", { name: /participants/ }));
  await user.click(screen.getByRole("button", { name: "Применить выбранное" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить применение" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("повторно сравните");
  await user.click(screen.getByRole("button", { name: "Сравнить снова" }));
  await waitFor(() => expect(check).toHaveBeenCalledTimes(2));
});

test("restoration requires confirmation and uses the applied version", async () => {
  vi.spyOn(reimportApi, "preview").mockResolvedValue(preview);
  vi.spyOn(reimportApi, "apply").mockResolvedValue({ trip: { version: 4 } as never, backup_snapshot_id: "backup" });
  const restore = vi.spyOn(reimportApi, "restore").mockResolvedValue({ trip: { version: 5 } as never, backup_snapshot_id: "next" });
  const onApplied = vi.fn(), user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={onApplied} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  await user.click(await screen.findByRole("checkbox", { name: /participants/ }));
  await user.click(screen.getByRole("button", { name: "Применить выбранное" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить применение" }));
  await user.selectOptions(await screen.findByLabelText("Резервная версия"), "backup");
  await user.click(await screen.findByRole("button", { name: "Восстановить прежнюю версию" }));
  expect(restore).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Подтвердить восстановление" }));
  await waitFor(() => expect(restore).toHaveBeenCalledWith("trip-1", { snapshot_id: "backup", expected_version: 4, confirm_date_removal: false }));
  expect(onApplied).toHaveBeenCalledTimes(2);
});
test("explains when validation after comparison cannot run", async () => {
  vi.spyOn(reimportApi, "preview").mockResolvedValue({ ...preview, validation_after: null });
  const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  expect(await screen.findByText(/Сравнение замечаний невозможно/)).toBeInTheDocument();
});

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TripList } from "./trip-list";
import { tripApi } from "@/lib/trips";
import * as exporter from "@/lib/trip-export";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
test("trip list export includes snapshot lineage and preserves photos", async () => {
  vi.spyOn(tripApi, "list").mockResolvedValue([{ id: "trip-1", internal_title: "Trip", status: "draft", updated_at: "2026-01-01", countries: [], cities: [], start_date: "2026-01-01", end_date: "2026-01-01", participants: 2, cost_total: "0", client_price: "0", base_currency: "RUB" }] as never);
  vi.spyOn(tripApi, "get").mockResolvedValue({ id: "trip-1", version: 3 } as never);
  vi.spyOn(reimportApi, "exportSnapshot").mockResolvedValue({ snapshot_id: "snap", version: 3, trip: {} });
  vi.spyOn(exporter, "serializeTripExport").mockResolvedValue({ text: async () => JSON.stringify({ format: "travel-club-trip", version: 1, trip: {}, photos: { photo: "abc" } }) } as Blob);
  const create = vi.fn().mockReturnValue("blob:test"); vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup(); render(<QueryClientProvider client={client}><TripList /></QueryClientProvider>);
  await user.click(await screen.findByRole("button", { name: "Экспорт JSON" }));
  await waitFor(() => expect(create).toHaveBeenCalledOnce());
  const text = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsText(create.mock.calls[0][0]); });
  expect(JSON.parse(text)).toMatchObject({ reimport: { trip_id: "trip-1", snapshot_id: "snap" }, photos: { photo: "abc" } });
  vi.unstubAllGlobals();
});

test("rejects a file belonging to another trip", async () => {
  const request = vi.spyOn(reimportApi, "preview"); const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file({ ...valid, reimport: { trip_id: "another", snapshot_id: "snapshot-1" } }));
  expect(await screen.findByRole("alert")).toHaveTextContent("другой поездке"); expect(request).not.toHaveBeenCalled();
});

test("asks separately before applying removal of populated dates", async () => {
  vi.spyOn(reimportApi, "preview").mockResolvedValue(preview);
  const apply = vi.spyOn(reimportApi, "apply").mockRejectedValueOnce(new ApiError(409, "DATE_REMOVAL_REQUIRED", "Подтвердите удаление", { dates: ["2026-10-05"] })).mockResolvedValueOnce({ trip: { version: 4 } as never, backup_snapshot_id: "backup" });
  const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  await user.click(await screen.findByRole("checkbox", { name: /participants/ }));
  await user.click(screen.getByRole("button", { name: "Применить выбранное" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить применение" }));
  expect(await screen.findByText(/2026-10-05/)).toBeInTheDocument();
  expect(apply).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Подтвердить удаление дней и применение" }));
  await waitFor(() => expect(apply).toHaveBeenLastCalledWith("trip-1", expect.objectContaining({ expected_version: 3, selected_paths: ["/participants"], confirm_date_removal: true })));
});
test("asks separately before restoring removal of populated dates", async () => {
  vi.spyOn(reimportApi, "preview").mockResolvedValue(preview);
  vi.spyOn(reimportApi, "apply").mockResolvedValue({ trip: { version: 4 } as never, backup_snapshot_id: "backup" });
  const restore = vi.spyOn(reimportApi, "restore").mockRejectedValueOnce(new ApiError(409, "DATE_REMOVAL_REQUIRED", "Подтвердите удаление", { dates: ["2026-11-01"] })).mockResolvedValueOnce({ trip: { version: 5 } as never, backup_snapshot_id: "next" });
  const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.upload(screen.getByLabelText("Исправленный JSON"), file(valid));
  await user.click(await screen.findByRole("checkbox", { name: /participants/ }));
  await user.click(screen.getByRole("button", { name: "Применить выбранное" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить применение" }));
  await user.selectOptions(await screen.findByLabelText("Резервная версия"), "backup");
  await user.click(await screen.findByRole("button", { name: "Восстановить прежнюю версию" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить восстановление" }));
  expect(await screen.findByText(/2026-11-01/)).toBeInTheDocument(); expect(restore).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Подтвердить удаление дней и восстановление" }));
  await waitFor(() => expect(restore).toHaveBeenLastCalledWith("trip-1", { snapshot_id: "backup", expected_version: 4, confirm_date_removal: true }));
});

test("opens saved backup history after reload and restores the explicitly selected snapshot using the current version", async () => {
  vi.mocked(reimportApi.backups).mockResolvedValue([{ id: "history-1", trip_version: 2, created_at: "2026-10-01T10:00:00Z" }]);
  const restore = vi.spyOn(reimportApi, "restore").mockResolvedValue({ trip: { version: 10 } as never, backup_snapshot_id: "next" });
  const user = userEvent.setup(); render(<TripReimport tripId="trip-1" currentVersion={9} onApplied={vi.fn()} />);
  await user.selectOptions(await screen.findByLabelText("Резервная версия"), "history-1");
  await user.click(screen.getByRole("button", { name: "Восстановить прежнюю версию" }));
  expect(restore).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Подтвердить восстановление" }));
  await waitFor(() => expect(restore).toHaveBeenCalledWith("trip-1", { snapshot_id: "history-1", expected_version: 9, confirm_date_removal: false }));
});

test("uses the latest saved version and reports a stale-version conflict", async () => {
  const restore = vi.spyOn(reimportApi, "restore").mockRejectedValue(new ApiError(409, "VERSION_CONFLICT", "Конфликт"));
  const user = userEvent.setup(); const view = render(<TripReimport tripId="trip-1" currentVersion={4} onApplied={vi.fn()} />);
  await user.selectOptions(await screen.findByLabelText("Резервная версия"), "backup");
  view.rerender(<TripReimport tripId="trip-1" currentVersion={8} onApplied={vi.fn()} />);
  await user.click(screen.getByRole("button", { name: "Восстановить прежнюю версию" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить восстановление" }));
  await waitFor(() => expect(restore).toHaveBeenCalledWith("trip-1", expect.objectContaining({ expected_version: 8 })));
  expect(await screen.findByRole("alert")).toHaveTextContent("Восстановление не выполнено");
});
