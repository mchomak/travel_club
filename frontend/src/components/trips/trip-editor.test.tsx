import { afterEach, expect, test, vi } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripEditor } from "./trip-editor";
import { TripProvider } from "./ui";
import { tripApi } from "@/lib/trips";
import { calculateTrip } from "@/lib/pricing";
import type { TripDocument, TripInput } from "@/lib/contracts";
import { vectors } from "../../test-fixtures";
import { emptyDay, newItem } from "@/lib/trip-ui";
import { buildCalendarEntries } from "@/lib/calendar";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
vi.mock("./trip-calendar", () => ({ TripCalendar: ({ days, items, calculation, baseCurrency, onCreateRange, onMoveItem, onMoveHotel, onEditDay, onOpenAirport, onOpenItem }: {
  days: TripInput["days"]; items: TripInput["items"]; calculation: TripDocument["calculation"] | null; baseCurrency: string;
  onCreateRange: (dayId: string, start: string, end: string) => void;
  onMoveItem: (itemId: string, dayId: string, start: string, end: string, endDayId: string | null) => void;
  onMoveHotel: (itemId: string, checkIn: string, checkOut: string, dayId: string) => void;
  onEditDay: (dayId: string) => void;
  onOpenAirport: (itemId: string, kind: "before" | "after") => void;
  onOpenItem: (itemId: string) => void;
}) => <div aria-label="Календарь поездки" data-currency={baseCurrency} data-total={calculation?.cost_total}>
  <button onClick={() => onCreateRange(days[0].id, "09:15", "10:45")}>Создать интервал</button>
  <button onClick={() => onMoveItem(items[0].id, days[1].id, "11:00", "12:00", null)}>Перенести событие</button>
  <button onClick={() => onMoveHotel(items[1].id, days[1].date, days[2].date, days[1].id)}>Перенести отель</button>
  <button onClick={() => onEditDay(days[1].id)}>Изменить день в календаре</button>
  <button onClick={() => onOpenAirport(items[0].id, "before")}>Настроить приезд в аэропорт</button>
  <button onClick={() => onOpenItem(items[0].id)}>Открыть первый пункт</button>
</div> }));

test("extra expense buttons create an unscheduled per-person item and keep legacy insurance visible", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.items = [{ ...newItem("insurance", null, input.base_currency, input.start_date), title: "Старая страховка", unit_price: "80" }];
  const calculation = calculateTrip(input);
  const document = { ...input, id: "expenses-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockImplementation(async (_id, update) => {
    const updatedCalculation = calculateTrip(update);
    return { ...document, ...update, version: update.version + 1, calculation: updatedCalculation,
      items: update.items.map(item => ({ ...item, ...updatedCalculation.items.find(result => result.id === item.id)! })) };
  });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="expenses-trip" /></TripProvider>);
  const events = await screen.findByRole("region", { name: "Добавить в маршрут" });
  expect(within(events).getAllByRole("button")).toHaveLength(5);
  expect(within(events).queryByRole("button", { name: /страховка/i })).not.toBeInTheDocument();
  const expenses = screen.getByRole("region", { name: "Дополнительные расходы" });
  expect(within(expenses).getByRole("button", { name: /Старая страховка/ })).toBeInTheDocument();
  await user.click(within(expenses).getByRole("button", { name: "SIM-карта" }));
  const panel = screen.getByRole("dialog");
  expect(within(panel).getByRole("combobox", { name: "Правило расчёта" })).toHaveValue("per_person");
  expect(within(panel).queryByRole("group", { name: "Время" })).not.toBeInTheDocument();
  expect(within(panel).getByRole("combobox", { name: "Подвид" })).toHaveValue("sim");
  await user.clear(within(panel).getByLabelText("Цена за единицу"));
  await user.type(within(panel).getByLabelText("Цена за единицу"), "10");
  await user.click(within(panel).getByRole("button", { name: "Сохранить элемент" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  const saved = save.mock.calls.at(-1)![1];
  expect(saved.items.find(item => item.subtype === "sim")).toMatchObject({ type: "other", day_id: null, start_time: null, end_time: null, calculation_mode: "per_person", unit_price: "10" });
  expect(saved.items.find(item => item.type === "insurance")).toMatchObject({ title: "Старая страховка", unit_price: "80" });
  expect(calculateTrip(saved).general_total).toBe("270.00");
});

test("calendar creation opens a type choice and leaves the draft untouched until save", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.end_date = "2026-10-03";
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02"), emptyDay("2026-10-03")];
  input.items = [];
  const calculation = calculateTrip(input);
  const document = { ...input, id: "test-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="test-trip" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Создать интервал" }));
  const panel = screen.getByRole("dialog");
  expect(within(panel).getByLabelText("Тип события")).toHaveValue("");
  expect(within(panel).getByRole("button", { name: "Сохранить элемент" })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
  await user.selectOptions(within(panel).getByLabelText("Тип события"), "activity");
  expect(within(panel).getByLabelText("Начало по местному времени")).toHaveValue("09:15");
  expect(within(panel).getByLabelText("Окончание по местному времени")).toHaveValue("10:45");
  await user.click(within(panel).getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});

test("calendar moves keep other item fields and save through the draft session", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.end_date = "2026-10-03";
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02"), emptyDay("2026-10-03")];
  input.items = [
    { ...newItem("flight", input.days[0], "RUB", input.start_date), title: "Рейс", start_time: "09:00", end_time: "10:00", unit_price: "100", internal_note: "Сохранить заметку" },
    { ...newItem("hotel", input.days[0], "RUB", input.start_date), title: "Отель", check_out: "2026-10-02", unit_price: "200", check_in_time: "15:00", check_out_time: "11:00" },
  ];
  const asDocument = (value: TripInput, version: number): TripDocument => {
    const calculation = calculateTrip(value);
    return { ...value, id: "move-trip", version, created_at: "", updated_at: "", created_by: "user", calculation, items: value.items.map(item => ({ ...item, ...calculation.items.find(result => result.id === item.id)! })) };
  };
  vi.spyOn(tripApi, "get").mockResolvedValue(asDocument(input, 1));
  const save = vi.spyOn(tripApi, "save").mockImplementation(async (_id, update) => asDocument(update, update.version + 1));
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="move-trip" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Перенести событие" }));
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  const flight = save.mock.calls[0][1].items[0];
  expect(flight).toMatchObject({ day_id: input.days[1].id, end_day_id: null, start_time: "11:00", end_time: "12:00", internal_note: "Сохранить заметку", unit_price: "100" });
  await user.click(screen.getByRole("button", { name: "Перенести отель" }));
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  const hotel = save.mock.calls[1][1].items[1];
  expect(hotel).toMatchObject({ day_id: input.days[1].id, check_in: "2026-10-02", check_out: "2026-10-03", check_in_time: "15:00", check_out_time: "11:00", unit_price: "200" });
  expect(screen.getByLabelText("Календарь поездки")).toHaveAttribute("data-currency", "RUB");
});

test("airport boundary persists through reopening, follows a moved flight, and disappears with deletion", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.end_date = "2026-10-03";
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02"), emptyDay("2026-10-03")];
  input.items = [{ ...newItem("flight", input.days[0], "RUB", input.start_date), title: "Ночной рейс", start_time: "23:00", end_time: "01:00", end_day_id: input.days[1].id, unit_price: "100" }];
  const documentFor = (value: TripInput, version: number): TripDocument => {
    const calculation = calculateTrip(value);
    return { ...value, id: "airport-trip", version, created_at: "", updated_at: "", created_by: "user", calculation, items: value.items.map(item => ({ ...item, ...calculation.items.find(result => result.id === item.id)! })) };
  };
  let persisted = documentFor(input, 1);
  vi.spyOn(tripApi, "get").mockImplementation(async () => persisted);
  const save = vi.spyOn(tripApi, "save").mockImplementation(async (_id, update) => { persisted = documentFor(update, update.version + 1); return persisted; });
  const user = userEvent.setup();
  const view = render(<TripProvider><TripEditor id="airport-trip" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Настроить приезд в аэропорт" }));
  const panel = screen.getByRole("dialog");
  expect(within(panel).getByLabelText("Время приезда")).toHaveValue("20:00");
  await user.clear(within(panel).getByLabelText("Время приезда"));
  await user.type(within(panel).getByLabelText("Время приезда"), "21:30");
  await user.click(within(panel).getByRole("button", { name: "Сохранить время" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(persisted.items[0].airport_before_minutes).toBe(90));
  expect(persisted.items).toHaveLength(1);
  expect(buildCalendarEntries(persisted.days, persisted.items, persisted.days.map(day => day.date)).airportBlocks.find(block => block.airportKind === "before")).toMatchObject({ startMinute: 1290, endMinute: 1380 });
  view.unmount();

  render(<TripProvider><TripEditor id="airport-trip-reopen" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Настроить приезд в аэропорт" }));
  expect(within(screen.getByRole("dialog")).getByLabelText("Время приезда")).toHaveValue("21:30");
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Отмена" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Перенести событие" }));
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  const moved = buildCalendarEntries(persisted.days, persisted.items, persisted.days.map(day => day.date));
  expect(moved.airportBlocks.find(block => block.airportKind === "before")).toMatchObject({ date: "2026-10-02", startMinute: 570, endMinute: 660 });
  expect(moved.airportBlocks.find(block => block.airportKind === "after")).toMatchObject({ date: "2026-10-02", startMinute: 720, endMinute: 780 });
  await user.click(screen.getByRole("button", { name: "Открыть первый пункт" }));
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Удалить элемент" }));
  await user.click((await screen.findByText("Удалить элемент?")).closest("[role=dialog]")!.querySelector<HTMLButtonElement>(".danger-button")!);
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(persisted.items).toHaveLength(0));
  expect(buildCalendarEntries(persisted.days, persisted.items, persisted.days.map(day => day.date)).airportBlocks).toEqual([]);
});

test("changing base currency clears previous FX and asks for rates in the new base", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.rates = [{ currency: "USD", rate: "90" }];
  const calculation = calculateTrip(input);
  const document = { ...input, id: "test-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation, items: input.items.map(i => ({ ...i, ...calculation.items.find(c => c.id === i.id)! })) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockRejectedValue(new Error("Курс отсутствует"));
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="test-trip" /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Параметры" }));
  const dialog = screen.getByRole("dialog");
  const currency = within(dialog).getByLabelText("Базовая валюта", { exact: false });
  await user.clear(currency); await user.type(currency, "USD");
  expect(within(dialog).getByText(/Курсы нужно ввести заново/)).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Применить изменения" }));
  expect(await screen.findByText(/Укажите курс RUB/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Валюты и курсы" }));
  expect(screen.getByLabelText("1 RUB в USD")).toHaveValue("");
  expect(save).not.toHaveBeenCalled();
});
