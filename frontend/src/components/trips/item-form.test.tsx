import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ItemForm } from "./item-form";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";

afterEach(cleanup);

test("invalid end time stays editable and blocks saving", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const item = { ...newItem("flight", days[0], "RUB", days[0].date), start_time: "18:00", end_time: "21:00" };
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.selectOptions(screen.getByLabelText("Дата окончания"), days[0].id);
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "17:00");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Окончание должно быть позже начала")).toBeInTheDocument();
  expect(screen.getByLabelText("Прилёт по местному времени")).toHaveValue("17:00");

  await user.selectOptions(screen.getByLabelText("Дата окончания"), days[1].id);
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ end_day_id: days[1].id, start_time: "18:00", end_time: "17:00" }), undefined);
});

test("new overnight flight suggests the next trip day and preserves a chosen end day", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02"), emptyDay("2026-10-03")];
  const item = newItem("flight", days[0], "RUB", days[0].date);
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[2].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.type(screen.getByLabelText("Вылет по местному времени"), "22:00");
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "05:00");
  expect(screen.getByLabelText("Дата окончания")).toHaveValue(days[1].id);
  await user.selectOptions(screen.getByLabelText("Дата окончания"), days[2].id);
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "06:00");
  expect(screen.getByLabelText("Дата окончания")).toHaveValue(days[2].id);
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ end_day_id: days[2].id, start_time: "22:00", end_time: "06:00" }), undefined);
});

test("new overnight flight beyond the trip keeps entered times for correction", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const removedDay = emptyDay("2026-10-02");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day, removedDay], items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={newItem("flight", day, "RUB", day.date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.type(screen.getByLabelText("Вылет по местному времени"), "22:00");
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "05:00");
  expect(screen.getByLabelText("Дата окончания")).toHaveValue("");
  expect(screen.getByText(/2 октября.*за пределами поездки/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Вылет по местному времени")).toHaveValue("22:00");
  expect(screen.getByLabelText("Прилёт по местному времени")).toHaveValue("05:00");
});

test("existing hotel keeps unspecified times until the user chooses them", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const item = newItem("hotel", days[0], "RUB", days[0].date);
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  expect(screen.getByLabelText("Время заселения")).toHaveValue("");
  expect(screen.getByLabelText("Время выселения")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: null, check_out_time: null }), undefined);

  onSubmit.mockClear();
  await user.click(screen.getByRole("button", { name: "Подставить рекомендуемые часы" }));
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: "15:00", check_out_time: "11:00" }), undefined);
});

test("external link requires http or https and opens safely", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = newItem("flight", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.type(screen.getByLabelText("Ссылка"), "javascript:alert(1)");
  expect(screen.queryByRole("link", { name: "Открыть ссылку в новой вкладке" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Введите полную ссылку http:// или https:// с адресом сайта")).toBeInTheDocument();

  await user.clear(screen.getByLabelText("Ссылка"));
  await user.type(screen.getByLabelText("Ссылка"), "https://example.com/ticket");
  const link = screen.getByRole("link", { name: "Открыть ссылку в новой вкладке" });
  expect(link).toHaveAttribute("href", "https://example.com/ticket");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ external_url: "https://example.com/ticket" }), undefined);

  onSubmit.mockClear();
  await user.clear(screen.getByLabelText("Ссылка"));
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ external_url: null }), undefined);
});

test("new hotel suggests times and submits the edited check-in and check-out hours", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = newItem("hotel", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByLabelText("Время заселения")).toHaveValue("15:00");
  expect(screen.getByLabelText("Время выселения")).toHaveValue("11:00");
  await user.clear(screen.getByLabelText("Время заселения"));
  await user.type(screen.getByLabelText("Время заселения"), "14:30");
  await user.clear(screen.getByLabelText("Время выселения"));
  await user.type(screen.getByLabelText("Время выселения"), "10:15");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    check_in: "2026-10-01", check_in_time: "14:30",
    check_out: "2026-10-02", check_out_time: "10:15",
  }), undefined);
});

test("legacy overnight event on the last trip day saves unrelated edits unchanged", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = { ...newItem("flight", day, "RUB", day.date), start_time: "22:00", end_time: "02:00" };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  expect(screen.getByText(/2 октября.*за пределами поездки/)).toBeInTheDocument();
  await user.clear(screen.getByLabelText("Название элемента"));
  await user.type(screen.getByLabelText("Название элемента"), "Ночной перелёт");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Ночной перелёт", day_id: day.id, end_day_id: null, start_time: "22:00", end_time: "02:00" }), undefined);

  onSubmit.mockClear();
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "03:00");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Выберите дату окончания после даты начала")).toBeInTheDocument();
});

test("grid creation requires category before editing and retains the selected interval", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const item = { ...newItem("other", day, "RUB", day.date), start_time: "09:15", end_time: "10:45" };
  render(<ItemForm initial={item} trip={trip} requireTypeChoice onSubmit={onSubmit} onCancel={() => {}} />);

  expect(screen.getByRole("combobox", { name: "Тип события" })).toHaveValue("");
  expect(screen.getByRole("group", { name: "Общие данные" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Сохранить элемент" })).toBeDisabled();
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "flight");
  expect(screen.getByRole("group", { name: "Общие данные" })).not.toBeDisabled();
  expect(screen.getByLabelText(/Вылет.*местному времени/)).toHaveValue("09:15");
  expect(screen.getByLabelText(/Прилёт.*местному времени/)).toHaveValue("10:45");
  expect(screen.getByRole("combobox", { name: "Правило расчёта" })).toHaveValue("per_person");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "flight", title: "Перелёт", start_time: "09:15", end_time: "10:45" }), undefined);
});

test("grid creation switched to hotel clears the hidden generic schedule", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const item = { ...newItem("other", day, "RUB", day.date), start_time: "09:15", end_time: "10:45" };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} requireTypeChoice onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "hotel");
  expect(screen.queryByLabelText(/Начало по местному времени/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    type: "hotel", start_time: null, end_time: null, end_day_id: null,
    check_in: "2026-10-01", check_out: "2026-10-02",
  }), undefined);
});

test("grid creation restores its selected interval after switching away from hotel", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const item = { ...newItem("other", days[0], "RUB", days[0].date), start_time: "23:15", end_time: "01:45" };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} requireTypeChoice onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "hotel");
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "flight");
  expect(screen.getByLabelText("Вылет по местному времени")).toHaveValue("23:15");
  expect(screen.getByLabelText("Прилёт по местному времени")).toHaveValue("01:45");
  expect(screen.getByLabelText("Дата окончания")).toHaveValue(days[1].id);
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    type: "flight", start_time: "23:15", end_time: "01:45", end_day_id: days[1].id,
    check_in: null, check_out: null,
  }), undefined);
});

test("hotel uses only check-in and check-out time fields and keeps notes visible", () => {
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  render(<ItemForm initial={newItem("hotel", day, "RUB", day.date)} trip={trip} onSubmit={() => {}} onCancel={() => {}} />);
  expect(screen.getByLabelText("Заезд — дата")).toHaveValue(day.date);
  expect(screen.getByLabelText("Выезд — дата")).toHaveValue("2026-10-02");
  expect(screen.getByLabelText("Время заселения")).toBeInTheDocument();
  expect(screen.getByLabelText("Время выселения")).toBeInTheDocument();
  expect(screen.queryByLabelText("Начало по местному времени")).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Дата окончания")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Описание для клиента")).toBeInTheDocument();
  expect(screen.getByLabelText("Заметка для клиента")).toBeVisible();
  expect(screen.getByLabelText("Внутренняя заметка")).toBeVisible();
});

test("changing hotel check-in moves its itinerary day", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={newItem("hotel", days[0], "RUB", days[0].date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText("Заезд — дата"), { target: { value: days[1].date } });
  fireEvent.change(screen.getByLabelText("Выезд — дата"), { target: { value: "2026-10-03" } });
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ day_id: days[1].id, check_in: days[1].date }), undefined);
});

test("hotel calculation is unavailable to other types and legacy values require correction", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const normal = newItem("flight", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const { rerender } = render(<ItemForm initial={normal} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.queryByRole("option", { name: "Номер за ночь" })).not.toBeInTheDocument();

  const legacy = { ...normal, id: crypto.randomUUID(), calculation_mode: "hotel" as const };
  rerender(<ItemForm key={legacy.id} initial={legacy} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByRole("combobox", { name: "Правило расчёта" })).toHaveValue("hotel");
  expect(screen.queryByLabelText("Заезд — дата")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Режим «Номер за ночь» доступен только для проживания. Выберите другое правило расчёта.")).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Правило расчёта" }), "per_person");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ calculation_mode: "per_person" }), undefined);
});

