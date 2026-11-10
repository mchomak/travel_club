import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripEditor } from "./trip-editor";
import { TripProvider } from "./ui";
import { tripApi } from "@/lib/trips";
import { calculateTrip } from "@/lib/pricing";
import { emptyDay, newItem } from "@/lib/trip-ui";
import type { TripDocument, TripInput } from "@/lib/contracts";
import { vectors } from "../../test-fixtures";
const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("@/lib/use-maps-config", () => ({ useMapsConfig: () => ({ config: { maps_key: null, search_enabled: false, routing_enabled: false }, error: null, retry: vi.fn() }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); navigation.push.mockReset(); history.replaceState(null, "", "/"); });
function fixture() {
  const trip = structuredClone(vectors.cases[0].input) as TripInput;
  trip.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  trip.start_date = trip.days[0].date; trip.end_date = trip.days[1].date;
  trip.items = [{ ...newItem("activity", trip.days[0], trip.base_currency, trip.start_date), title: "Музей", internal_note: "Исходная заметка" }];
  return { ...trip, id: "builder", version: 1, created_by: "user", created_at: "", updated_at: "", calculation: calculateTrip(trip) } as TripDocument;
}

test("day planning keeps full calendar, day navigation and all columns before stage transitions", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=4");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const fullCalendar = await screen.findByRole("region", { name: "Календарь поездки" });
  const dayNavigation = screen.getByRole("navigation", { name: "Дни поездки" });
  const dayCalendar = screen.getByRole("region", { name: "Календарь выбранного дня" });
  const program = screen.getByRole("region", { name: "Программа дня" });
  const map = screen.getByRole("region", { name: "Маршрут дня" });
  const stages = screen.getByRole("navigation", { name: "Этапы поездки" });
  for (const [before, after] of [[fullCalendar, dayNavigation], [dayNavigation, dayCalendar], [dayCalendar, program], [program, map], [map, stages]]) {
    expect(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

test("browser back retains the builder on failed save and waits for the latest revision before leaving", async () => {
  const document = fixture(), dayId = document.days[1].id;
  history.replaceState({ previous: true }, "", "/admin/trips");
  history.pushState({ builder: true }, "", `/admin/trips/builder/builder?step=5&day=${dayId}`);
  vi.spyOn(window, "confirm").mockReturnValue(false);
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const requests: { resolve: (value: TripDocument) => void; reject: (error: Error) => void }[] = [];
  const save = vi.spyOn(tripApi, "save").mockImplementation(() => new Promise((resolve, reject) => requests.push({ resolve, reject })));
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  fireEvent.change(await screen.findByLabelText("Наценка, %"), { target: { value: "10" } });
  const nativeRoutes: string[] = [];
  const route = () => nativeRoutes.push(location.pathname);
  // Like the App Router, this listener must not see a blocked popstate.
  window.addEventListener("popstate", route);
  try {
    history.back();
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(location.pathname).toBe("/admin/trips/builder/builder");
    expect(nativeRoutes).toEqual([]);
    requests[0].reject(new Error("Back save failed"));
    expect(await screen.findByText("Back save failed")).toBeVisible();
    expect(location.pathname).toBe("/admin/trips/builder/builder");
    expect(new URL(location.href).searchParams.get("day")).toBe(dayId);
    expect(screen.getByLabelText("Наценка, %")).toHaveValue("10");
    expect(nativeRoutes).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Повторить" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    fireEvent.change(screen.getByLabelText("Наценка, %"), { target: { value: "20" } });
    history.back();
    await waitFor(() => expect(location.pathname).toBe("/admin/trips/builder/builder"));
    requests[1].resolve({ ...document, ...save.mock.calls[1][1], version: 2 } as TripDocument);
    await waitFor(() => expect(save).toHaveBeenCalledTimes(3));
    expect(save.mock.calls[2][1]).toMatchObject({ pricing_percent: "20", version: 2 });
    expect(nativeRoutes).toEqual([]);
    const latest = save.mock.calls[2][1];
    requests[2].resolve({ ...document, ...latest, version: 3, calculation: calculateTrip(latest) } as TripDocument);
    await waitFor(() => expect(nativeRoutes).toEqual(["/admin/trips"]));
    expect(location.pathname).toBe("/admin/trips");
    expect(navigation.push).not.toHaveBeenCalled();
  } finally { window.removeEventListener("popstate", route); }
});
test("builder resumes URL day, keeps form input across stage switches and reuses one fetched draft", async () => {
  const document = fixture(); history.replaceState(null, "", `/admin/trips/builder/builder?step=4&day=${document.days[0].id}`);
  const get = vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  expect(await screen.findByRole("navigation", { name: "Этапы поездки" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Программа дня" })).toBeVisible();
  expect(screen.getByRole("region", { name: "Маршрут дня" })).toBeVisible();
  await user.click(within(screen.getByRole("region", { name: "Программа дня" })).getByRole("button", { name: /Редактировать Музей/ }));
  const title = within(screen.getByRole("dialog")).getByLabelText("Название элемента");
  await user.clear(title); await user.type(title, "Новый музей");
  // A stage selection must never unmount an unfinished modal.
  screen.getByText(/Расходы и стоимость/).closest("button")!.click();
  expect(title).toHaveValue("Новый музей");
  expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Сохранить элемент" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "3. Проживание" }));
  await user.click(screen.getByRole("button", { name: "4. Программа по дням" }));
  expect(within(screen.getByRole("region", { name: "Программа дня" })).getByText("Новый музей")).toBeVisible();
  expect(get).toHaveBeenCalledOnce();
  expect(new URL(location.href).searchParams.get("step")).toBe("4");
});

test.each(["Полный редактор", "Клиентский вид", "Завершить и открыть полный редактор"])("%s keeps the draft on save failure and only navigates after a successful retry", async action => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=5");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockRejectedValueOnce(new Error("Нет связи. Повторите сохранение.")).mockImplementation(async (_id, update) => ({ ...document, ...update, version: update.version + 1, calculation: calculateTrip(update) }) as TripDocument);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const percent = await screen.findByLabelText("Наценка, %");
  fireEvent.change(percent, { target: { value: "17" } });
  if (action.startsWith("Завершить")) await user.click(screen.getByRole("button", { name: "6. Проверка" }));
  await user.click(screen.getByRole("button", { name: action }));
  expect(await screen.findByText("Нет связи. Повторите сохранение.")).toBeVisible();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(save.mock.calls[0][1]).toMatchObject({ pricing_percent: "17" });
  await user.click(screen.getByRole("button", { name: action }));
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(action === "Клиентский вид" ? "/admin/trips/builder/preview" : "/admin/trips/builder"));
  expect(save.mock.calls[1][1]).toMatchObject({ pricing_percent: "17", version: 1 });
});

test("finish waits for changes made while saving and never shows saved before their acknowledgement", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=5");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const releases: ((value: TripDocument) => void)[] = [];
  const save = vi.spyOn(tripApi, "save").mockImplementation(() => new Promise(resolve => releases.push(resolve)));
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  fireEvent.change(await screen.findByLabelText("Наценка, %"), { target: { value: "10" } });
  await user.click(screen.getByRole("button", { name: "6. Проверка" }));
  await user.click(screen.getByRole("button", { name: "Завершить и открыть полный редактор" }));
  await user.click(screen.getByRole("button", { name: "5. Расходы и стоимость" }));
  fireEvent.change(screen.getByLabelText("Наценка, %"), { target: { value: "20" } });
  releases[0]({ ...document, ...save.mock.calls[0][1], version: 2 } as TripDocument);
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.queryByText("Сохранено")).not.toBeInTheDocument();
  expect(save.mock.calls[1][1]).toMatchObject({ pricing_percent: "20", version: 2 });
  const update = save.mock.calls[1][1];
  releases[1]({ ...document, ...update, version: 3, calculation: calculateTrip(update) } as TripDocument);
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/admin/trips/builder"));
});

test("adding a trip expense retains the selected day when returning to the program", async () => {
  const document = fixture(), dayId = document.days[1].id;
  history.replaceState(null, "", `/admin/trips/builder/builder?step=5&day=${dayId}`);
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "SIM-карта" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "4. Программа по дням" }));
  expect(screen.getByRole("region", { name: "Программа дня" })).toBeVisible();
  expect(new URL(location.href).searchParams.get("day")).toBe(dayId);
});

test("transport stage excludes local travel, lodging stays map-free, and day transport keeps all subtypes", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Добавить дальний переезд" }));
  let panel = within(screen.getByRole("dialog"));
  expect(within(panel.getByLabelText("Подвид")).queryByRole("option", { name: "Такси" })).not.toBeInTheDocument();
  expect(within(panel.getByLabelText("Подвид")).queryByRole("option", { name: "Пеший переход" })).not.toBeInTheDocument();
  expect(within(panel.getByLabelText("Тип события")).queryByRole("option", { name: "Проживание" })).not.toBeInTheDocument();
  await user.click(panel.getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "3. Проживание" }));
  await user.click(screen.getByRole("button", { name: "Добавить отель" }));
  const lodging = within(screen.getByRole("region", { name: "Отели поездки" }));
  expect(lodging.getAllByLabelText("Ссылка Google Maps").length).toBeGreaterThan(0);
  expect(screen.queryByRole("region", { name: "Маршрут дня" })).not.toBeInTheDocument();
  expect(lodging.getByLabelText("Название элемента").closest("form")?.querySelector("canvas")).toBeNull();
  await user.click(lodging.getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(lodging.queryByLabelText("Название элемента")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "4. Программа по дням" }));
  await user.click(within(screen.getByLabelText("Добавить событие дня")).getByRole("button", { name: "Транспорт" }));
  panel = within(screen.getByRole("dialog"));
  expect(within(panel.getByLabelText("Подвид")).getByRole("option", { name: "Такси" })).toBeInTheDocument();
  expect(within(panel.getByLabelText("Подвид")).getByRole("option", { name: "Пеший переход" })).toBeInTheDocument();
});

test("adding a flight opens its form inline beneath the stage row", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const flights = await screen.findByRole("region", { name: "Дальние переезды" });
  await user.click(within(flights).getByRole("button", { name: "Добавить перелёт" }));
  expect(within(flights).getByLabelText("Название элемента")).toBeVisible();
  expect(within(flights).queryByRole("dialog")).not.toBeInTheDocument();
});

test("adding a hotel opens its form inline beneath the lodging row", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=3");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const hotels = await screen.findByRole("region", { name: "Отели поездки" });
  await user.click(within(hotels).getByRole("button", { name: "Добавить отель" }));
  expect(within(hotels).getByLabelText("Название элемента")).toBeVisible();
  expect(within(hotels).queryByRole("dialog")).not.toBeInTheDocument();
});

test("saving flights keeps each item in the rows and shared calendar for the next addition", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const flightRegion = await screen.findByRole("region", { name: "Дальние переезды" });
  const flights = within(flightRegion);
  const calendar = screen.getByRole("region", { name: "Календарь поездки" });
  for (const title of ["Первый перелёт", "Второй перелёт"]) {
    await user.click(flights.getByRole("button", { name: "Добавить перелёт" }));
    const form = flights.getByLabelText("Название элемента").closest("form")!;
    await user.clear(within(form).getByLabelText("Название элемента"));
    await user.type(within(form).getByLabelText("Название элемента"), title);
    await user.type(within(form).getByLabelText("Вылет по местному времени"), "09:00");
    await user.type(within(form).getByLabelText("Прилёт по местному времени"), "11:00");
    await user.clear(within(form).getByLabelText("Цена билета"));
    await user.type(within(form).getByLabelText("Цена билета"), "500");
    await user.click(within(form).getByRole("button", { name: "Сохранить элемент" }));
    await waitFor(() => expect(flights.queryByLabelText("Название элемента")).not.toBeInTheDocument());
    expect(flights.getByText(title)).toBeVisible();
    expect(calendar).toHaveTextContent(title);
  }
});

test("cancelling a new flight keeps saved rows and discards only the unsaved form", async () => {
  const initial = fixture();
  const savedFlight = { ...newItem("flight", initial.days[0], initial.base_currency, initial.start_date), title: "Сохранённый рейс", start_time: "09:00", end_time: "11:00" };
  const document = { ...initial, items: [...initial.items, savedFlight] } as TripDocument;
  document.calculation = calculateTrip(document);
  history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "save").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const flightRegion = await screen.findByRole("region", { name: "Дальние переезды" });
  const flights = within(flightRegion);
  const calendar = screen.getByRole("region", { name: "Календарь поездки" });
  await user.click(flights.getByRole("button", { name: "Добавить перелёт" }));
  const form = flights.getByLabelText("Название элемента").closest("form")!;
  await user.clear(within(form).getByLabelText("Название элемента"));
  await user.type(within(form).getByLabelText("Название элемента"), "Черновик перелёта");
  await user.click(within(form).getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(flights.queryByLabelText("Название элемента")).not.toBeInTheDocument());
  expect(flightRegion).toHaveTextContent("Сохранённый рейс");
  expect(flightRegion).not.toHaveTextContent("Черновик перелёта");
  expect(calendar).toHaveTextContent("Сохранённый рейс");
  expect(calendar).not.toHaveTextContent("Черновик перелёта");
});

test("inline flight forms receive unique places from saved flights", async () => {
  const initial = fixture();
  const savedFlight = { ...newItem("flight", initial.days[0], initial.base_currency, initial.start_date), title: "Рейс в Токио", departure_country_code: "JP", departure_city: "Токио", arrival_country_code: "JP", arrival_city: "Токио" };
  const document = { ...initial, items: [...initial.items, savedFlight] } as TripDocument;
  document.calculation = calculateTrip(document);
  history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const flights = within(await screen.findByRole("region", { name: "Дальние переезды" }));
  await user.click(flights.getByRole("button", { name: "Добавить перелёт" }));
  const form = flights.getByLabelText("Название элемента").closest("form")!;
  await user.click(within(form).getByRole("combobox", { name: "Вылет — город" }));
  expect(screen.getAllByRole("option", { name: /Токио/ })).toHaveLength(1);
});

test("adding another flight does not replace an open inline form", async () => {
  const document = fixture(); history.replaceState(null, "", "/admin/trips/builder/builder?step=2");
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup(); render(<TripProvider><TripEditor id="builder" mode="builder" /></TripProvider>);
  const flights = within(await screen.findByRole("region", { name: "Дальние переезды" }));
  await user.click(flights.getByRole("button", { name: "Добавить перелёт" }));
  const firstTitle = flights.getByLabelText("Название элемента");
  await user.clear(firstTitle); await user.type(firstTitle, "Черновик первого рейса");
  await user.click(flights.getByRole("button", { name: "Добавить перелёт" }));
  expect(flights.getAllByLabelText("Название элемента")).toHaveLength(1);
  expect(flights.getByLabelText("Название элемента")).toHaveValue("Черновик первого рейса");
  expect(screen.getByText("Сначала сохраните или отмените открытую форму.")).toBeVisible();
});
