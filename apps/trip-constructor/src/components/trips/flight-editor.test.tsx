import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { buildCalendarEntries } from "@/lib/calendar";
import type { ItemInput } from "@/lib/contracts";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import { ItemForm } from "./item-form";

afterEach(cleanup);

function setupFlight(overrides: Partial<ItemInput> = {}, isNew = false) {
  const days = [emptyDay("2026-11-01"), emptyDay("2026-11-02")];
  const item = { ...newItem("flight", days[0], "RUB", days[0].date), ...overrides };
  const trip = { ...newTrip(), days, start_date: days[0].date, end_date: days[1].date, items: isNew ? [] : [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={vi.fn()} />);
  return { days, item, onSubmit, user: userEvent.setup() };
}

test("the flight type selector opens from the heading actions with the keyboard", async () => {
  const { user } = setupFlight({ title: "Билет из импорта" });
  expect(screen.getByRole("heading", { name: "Редактирование авиаперелёта" })).toBeVisible();
  expect(screen.getByLabelText("Тип события")).not.toBeVisible();

  const trigger = screen.getByText("Дополнительные действия");
  trigger.focus();
  await user.keyboard("{Enter}{Tab}");
  const select = screen.getByRole("combobox", { name: "Тип события" });
  expect(select).toHaveFocus();
  await user.selectOptions(select, "hotel");
  const dialog = screen.getByRole("dialog", { name: "Изменить тип события?" });
  await user.click(within(dialog).getByRole("button", { name: "Отмена" }));

  expect(select).toHaveValue("flight");
  expect(screen.getByDisplayValue("Билет из импорта")).toBeVisible();
  await waitFor(() => expect(select).toHaveFocus());
  await user.tab({ shift: true });
  expect(trigger).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(select).not.toBeVisible();
});

test("the flight summary shows both local endpoints and computes elapsed time only with both offsets", async () => {
  const { user } = setupFlight({
    departure_city: "Москва", departure_label: "Шереметьево",
    arrival_city: "Бангкок", arrival_label: "Суварнабхуми",
    start_time: "01:15", end_time: "14:15",
    departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420,
  });
  const summary = screen.getByRole("group", { name: "Сводка перелёта" });
  expect(summary).toHaveTextContent("Москва");
  expect(summary).toHaveTextContent("Шереметьево");
  expect(summary).toHaveTextContent("Вылет: 1 ноября, 01:15");
  expect(summary).toHaveTextContent("Бангкок");
  expect(summary).toHaveTextContent("Суварнабхуми");
  expect(summary).toHaveTextContent("Прилёт: 1 ноября, 14:15");
  expect(summary).toHaveTextContent("9 ч 0 мин");
  expect(summary).not.toHaveTextContent(/Прямой перелёт|Пересадок нет/);

  const offset = screen.getByLabelText("UTC при прибытии");
  expect(offset).not.toBeVisible();
  await user.click(screen.getByText("Часовые пояса"));
  await user.selectOptions(offset, "");
  expect(summary).not.toHaveTextContent("9 ч 0 мин");
  expect(screen.getByText(/Укажите оба смещения UTC для расчёта длительности/)).toBeVisible();
});

test("editing a place prompts a UTC check without changing the saved offset or imported title", async () => {
  const { user } = setupFlight({
    title: "Название из импорта", departure_city: "Москва", departure_label: "Шереметьево",
    arrival_city: "Бангкок", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420,
  });
  const place = screen.getByLabelText("Место вылета");
  await user.clear(place);
  await user.type(place, "Внуково");

  expect(screen.getByText(/Место или дата изменились/)).toBeVisible();
  expect(screen.getByLabelText("UTC при отправлении")).toHaveValue("180");
  expect(screen.getByLabelText("Название перелёта")).toHaveValue("Название из импорта");
  await user.click(screen.getByText("Часовые пояса"));
  await user.click(screen.getByRole("button", { name: "Подтвердить текущие смещения" }));
  expect(screen.queryByText(/Место или дата изменились/)).not.toBeInTheDocument();
});

test("a new flight uses the route name and stops updating it after a manual edit", async () => {
  const { user } = setupFlight({ departure_label: "SVO", arrival_label: "BKK" }, true);
  const title = screen.getByLabelText("Название перелёта");
  const place = screen.getByLabelText("Место прилёта");
  expect(title).toHaveValue("SVO — BKK");
  await user.clear(place);
  await user.type(place, "DMK");
  expect(title).toHaveValue("SVO — DMK");

  await user.clear(title);
  await user.type(title, "Рейс группы");
  await user.clear(place);
  await user.type(place, "BKK");
  expect(title).toHaveValue("Рейс группы");
});

test.each(["Место вылета", "Место прилёта"])("changing %s hides elapsed time everywhere until UTC offsets are confirmed", async label => {
  const { user, onSubmit } = setupFlight({
    departure_label: "SVO", arrival_label: "BKK", start_time: "01:15", end_time: "14:15",
    departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420,
  });
  const summary = screen.getByRole("group", { name: "Сводка перелёта" });
  expect(summary).toHaveTextContent("9 ч 0 мин");
  await user.clear(screen.getByLabelText(label));
  await user.type(screen.getByLabelText(label), "Другой аэропорт");

  expect(screen.getByText(/Место или дата изменились/)).toBeVisible();
  expect(summary).not.toHaveTextContent("9 ч 0 мин");
  expect(screen.queryByText("9 ч 0 мин")).not.toBeInTheDocument();
  await user.click(screen.getByText("Часовые пояса"));
  await user.click(screen.getByRole("button", { name: "Подтвердить текущие смещения" }));
  expect(summary).toHaveTextContent("9 ч 0 мин");
  expect(screen.queryByText(/Место или дата изменились/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420 }), undefined);
});

test("editing an arrival date hides duration until its UTC offset is checked", async () => {
  const { user, days } = setupFlight({ start_time: "01:15", end_time: "14:15", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420 });
  const summary = screen.getByRole("group", { name: "Сводка перелёта" });
  await user.selectOptions(screen.getByLabelText("Дата прилёта"), days[1].id);
  expect(screen.getByText(/Место или дата изменились/)).toBeVisible();
  expect(screen.queryByText("33 ч 0 мин")).not.toBeInTheDocument();
  expect(summary).not.toHaveTextContent("9 ч 0 мин");
  await user.click(screen.getByText("Часовые пояса"));
  await user.selectOptions(screen.getByLabelText("UTC при прибытии"), "360");
  expect(summary).toHaveTextContent("34 ч 0 мин");
  expect(screen.queryByText(/Место или дата изменились/)).not.toBeInTheDocument();
});

test.each(["place", "date"])("saving an edited %s requires an explicit UTC check before reopening", async edit => {
  const { user, days, onSubmit, item } = setupFlight({
    departure_label: "SVO", arrival_label: "BKK", start_time: "01:15", end_time: "14:15",
    departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420,
  });
  if (edit === "place") {
    await user.clear(screen.getByLabelText("Место прилёта"));
    await user.type(screen.getByLabelText("Место прилёта"), "NRT");
  } else {
    await user.selectOptions(screen.getByLabelText("Дата прилёта"), days[1].id);
  }
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText(/Чтобы сохранить без расчёта длительности, очистите оба смещения/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Подтвердить текущие смещения" })).toBeVisible();
  if (edit === "place") expect(screen.getByLabelText("Место прилёта")).toHaveValue("NRT");

  await user.click(screen.getByRole("button", { name: "Подтвердить текущие смещения" }));
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  const saved = onSubmit.mock.calls[0][0] as ItemInput;
  expect(saved).toMatchObject({ departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420 });
  cleanup();
  const trip = { ...newTrip(), days, start_date: days[0].date, end_date: days[1].date, items: [saved], rates: [] };
  render(<ItemForm initial={saved} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);
  expect(screen.getByRole("group", { name: "Сводка перелёта" })).toHaveTextContent(edit === "place" ? "9 ч 0 мин" : "33 ч 0 мин");
  expect(screen.getByLabelText("Место прилёта")).toHaveValue(edit === "place" ? "NRT" : item.arrival_label);
});

test("an edited flight can be saved and reopened without UTC when offsets are explicitly cleared", async () => {
  const { user, days, onSubmit } = setupFlight({
    arrival_label: "BKK", start_time: "01:15", end_time: "14:15",
    departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 420,
  });
  await user.clear(screen.getByLabelText("Место прилёта"));
  await user.type(screen.getByLabelText("Место прилёта"), "NRT");
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByLabelText("UTC при отправлении"), "");
  await user.selectOptions(screen.getByLabelText("UTC при прибытии"), "");
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  const saved = onSubmit.mock.calls[0][0] as ItemInput;
  expect(saved).toMatchObject({ arrival_label: "NRT", departure_utc_offset_minutes: null, arrival_utc_offset_minutes: null });
  cleanup();
  const trip = { ...newTrip(), days, start_date: days[0].date, end_date: days[1].date, items: [saved], rates: [] };
  render(<ItemForm initial={saved} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);
  expect(screen.getByRole("group", { name: "Сводка перелёта" })).not.toHaveTextContent("9 ч 0 мин");
  expect(screen.getByText(/Укажите оба смещения UTC для расчёта длительности/)).toBeVisible();
  expect(screen.getByLabelText("Место прилёта")).toHaveValue("NRT");
});

test("the airport preview shows local dates across midnight and stops counting at zero", async () => {
  const { days, onSubmit, user } = setupFlight({ start_time: "01:15", end_time: "14:15" });
  await user.click(screen.getByText("Время в аэропорту", { selector: "summary span" }));
  expect(screen.getByText(/31 октября, 22:15.*1 ноября, 01:15/)).toBeVisible();
  expect(screen.getByText(/Интервал выходит за пределами дат поездки/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "До вылета: не учитывать" }));
  expect(screen.queryByText(/31 октября, 22:15/)).not.toBeInTheDocument();
  expect(screen.queryByText(/Интервал выходит за пределами дат поездки/)).not.toBeInTheDocument();
  expect(screen.getByText(/1 ноября, 14:15.*1 ноября, 15:15/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  const saved: ItemInput = onSubmit.mock.calls[0][0];
  const checkIn = {
    ...newItem("activity", days[0], "RUB", days[0].date),
    title: "Регистрация на рейс", start_time: "00:15", end_time: "01:15",
  };
  const calendar = buildCalendarEntries(days, [saved, checkIn], [days[0].date]);
  expect(calendar.airportBlocks.map(block => block.airportKind)).toEqual(["after"]);
  expect(calendar.events.filter(event => event.itemId === checkIn.id)).toHaveLength(1);
});

test("flight save blocks repeated submissions and allows retry after an error", async () => {
  const { onSubmit, user } = setupFlight();
  let rejectUpdate!: (error: Error) => void;
  onSubmit.mockReturnValueOnce(new Promise<void>((_resolve, reject) => { rejectUpdate = reject; }));
  const save = screen.getByRole("button", { name: "Сохранить перелёт" });
  await user.click(save);

  const pending = screen.getByRole("button", { name: "Сохраняем…" });
  expect(pending).toBeDisabled();
  fireEvent.submit(pending.closest("form")!);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  rejectUpdate(new Error("Не удалось сохранить перелёт"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось сохранить перелёт");
  await waitFor(() => expect(save).toBeEnabled());
  await user.click(save);
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
