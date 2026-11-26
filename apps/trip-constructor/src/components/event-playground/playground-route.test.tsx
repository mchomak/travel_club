import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { ItemInput, TripInput } from "@/lib/contracts";
import { mapsClient } from "@/lib/maps-client";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import { PlaygroundRoute } from "./playground-route";
import { ItemForm } from "@/components/trips/item-form";
import { ValidationIssueContext } from "@/components/trips/trip-validation-panel";
import { base, trip as fixtureTrip } from "./fixtures";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("validation navigation opens the route and focuses the departure picker", async () => {
  const issue = { id: "place-issue", code: "missing_place", category: "route", severity: "warning", title: "Место", message: "Проверьте отправление", path: "items/0/departure_label" };
  render(<ValidationIssueContext issue={issue} location={{ section: "route", field: "departure_label" }} stale={false}><ItemForm initial={base} trip={{ ...fixtureTrip, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} /></ValidationIssueContext>);
  const picker = await screen.findByRole("combobox", { name: "Выбрать: станция отправления" });
  await waitFor(() => expect(picker).toHaveFocus());
  expect(screen.getByText("Маршрут", { selector: "strong" }).closest("details")).toHaveAttribute("open");
  expect(screen.queryByText(/Это поле недоступно/)).not.toBeInTheDocument();
  expect(picker).toBeVisible();
});
const day = emptyDay("2026-10-01");
const place = { name: "Аэропорт", address: "Терминал", latitude: 1, longitude: 2, provider: "manual" as const };
const hotel = { ...newItem("hotel", day, "RUB", day.date), map_place: { ...place, name: "Отель", latitude: 3 } };
const trip = { ...newTrip(), days: [day], items: [hotel], rates: [] } as TripInput;
function Harness({ initial, isNew = false, currentTrip = trip, onSave = () => {} }: { initial: ItemInput; isNew?: boolean; currentTrip?: TripInput; onSave?: (item: ItemInput) => void }) {
  const form = useForm<ItemInput>({ defaultValues: initial });
  const item = useWatch({ control: form.control }) as ItemInput;
  return <FormProvider {...form}><form onSubmit={form.handleSubmit(onSave)}><PlaygroundRoute item={item} trip={currentTrip} isNew={isNew} typeChosen requireTypeChoice={false} labels={{ location: "Место", placeholder: "Место", start: "Начало", end: "Конец" }} onManualTitle={() => {}} onChooseEndDay={() => {}} /><button type="button" onClick={() => form.setValue("day_id", currentTrip.days[1]?.id ?? null)}>Изменить день</button><button type="button" onClick={() => form.setValue("map_end_place", { ...hotel.map_place, latitude: 4 })}>Изменить точку прибытия</button><button type="submit">Проверить сохранение</button></form></FormProvider>;
}

test("flight labels remain independent of map bindings", async () => {
  const initial = { ...newItem("flight", day, "RUB", day.date), departure_label: "Терминал 1", arrival_label: "Терминал 2", map_place: place, map_end_place: hotel.map_place };
  const save = vi.fn();
  render(<Harness initial={initial} onSave={save} />);
  expect(screen.getByLabelText("Место вылета")).toHaveValue("Терминал 1");
  expect(screen.getByLabelText("Место прилёта")).toHaveValue("Терминал 2");
  const menu = screen.getByLabelText("Действия: Аэропорт отправления").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия: Аэропорт отправления"));
  await userEvent.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await userEvent.click(screen.getByRole("combobox", { name: "Выбрать: аэропорт отправления" }));
  await userEvent.click(screen.getByRole("option", { name: /Отель/ }));
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ departure_label: "Терминал 1", map_place: hotel.map_place }), expect.anything()));
  await userEvent.click(within(menu).getByLabelText("Действия: Аэропорт отправления"));
  await userEvent.click(within(menu).getByRole("button", { name: "Удалить привязку" }));
  await userEvent.clear(screen.getByLabelText("Место прилёта"));
  await userEvent.type(screen.getByLabelText("Место прилёта"), "Новый терминал");
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ departure_label: "Терминал 1", map_place: null, arrival_label: "Новый терминал", map_end_place: hotel.map_place }), expect.anything()));
});

test("flight endpoint validation explains why an oversized label cannot be saved", async () => {
  const save = vi.fn();
  render(<Harness initial={newItem("flight", day, "RUB", day.date)} onSave={save} />);
  fireEvent.change(screen.getByLabelText("Место вылета"), { target: { value: "а".repeat(201) } });
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  expect(await screen.findByText(/200/)).toBeVisible();
  expect(save).not.toHaveBeenCalled();
});

test("a flight's custom endpoint name preserves its existing map binding", async () => {
  const initial = { ...newItem("flight", day, "RUB", day.date), departure_label: "Терминал 1", map_place: place };
  const save = vi.fn();
  render(<Harness initial={initial} onSave={save} />);
  const menu = screen.getByLabelText("Действия: Аэропорт отправления").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия: Аэропорт отправления"));
  await userEvent.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await userEvent.type(screen.getByRole("combobox", { name: "Выбрать: аэропорт отправления" }), "Новый терминал");
  await userEvent.click(await screen.findByRole("option", { name: /Использовать «Новый терминал»/ }));
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ departure_label: "Новый терминал", map_place: place }), expect.anything()));
});

test("selecting another flight endpoint without coordinates clears the old map binding", async () => {
  const initial = { ...newItem("flight", day, "RUB", day.date), departure_label: "Терминал 1", map_place: place };
  const nearby = { ...newItem("activity", day, "RUB", day.date), title: "Площадь", map_place: null };
  const save = vi.fn();
  render(<Harness initial={initial} currentTrip={{ ...trip, items: [nearby] }} onSave={save} />);
  const menu = screen.getByLabelText("Действия: Аэропорт отправления").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия: Аэропорт отправления"));
  await userEvent.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await userEvent.click(screen.getByRole("combobox", { name: "Выбрать: аэропорт отправления" }));
  await userEvent.click(await screen.findByRole("option", { name: /Площадь/ }));
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ departure_label: "Площадь", map_place: null }), expect.anything()));
});

test("non-transport events can set an ending place", async () => {
  render(<Harness initial={newItem("activity", day, "RUB", day.date)} />);
  await userEvent.click(screen.getByText("Окончание в другом месте"));
  expect(screen.getByText("Место окончания")).toBeInTheDocument();
  const menu = screen.getByLabelText("Действия: Место окончания").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия: Место окончания"));
  await userEvent.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await userEvent.type(screen.getByRole("combobox", { name: "Выбрать: место окончания" }), "Причал");
  await userEvent.click(screen.getByRole("option", { name: /Использовать «Причал»/ }));
  expect(screen.getByText("Причал")).toBeVisible();
});

test("new transfers suggest calendar places and keep manual edits", async () => {
  const initial = { ...newItem("transfer", day, "RUB", day.date), start_time: "11:00" };
  const nextDay = emptyDay("2026-10-02");
  const nextHotel = { ...hotel, id: "next-hotel", day_id: nextDay.id, map_place: { ...place, name: "Новый отель", latitude: 5 } };
  const updatedTrip = { ...trip, days: [day, nextDay], items: [hotel, nextHotel] };
  const save = vi.fn();
  const view = render(<Harness initial={initial} isNew onSave={save} />);
  await waitFor(() => expect(screen.getByText("Отель")).toBeInTheDocument());
  const menu = screen.getByLabelText("Действия: Точка отправления").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия: Точка отправления"));
  await userEvent.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await userEvent.type(screen.getByRole("combobox", { name: "Выбрать: точка отправления" }), "У друзей");
  await userEvent.click(screen.getByRole("option", { name: /Использовать «У друзей»/ }));
  expect(screen.getByText("У друзей")).toBeInTheDocument();
  view.rerender(<Harness initial={initial} isNew currentTrip={updatedTrip} onSave={save} />);
  await userEvent.click(screen.getByRole("button", { name: "Изменить день" }));
  await userEvent.click(screen.getByRole("button", { name: "Проверить сохранение" }));
  await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ day_id: nextDay.id, departure_label: "У друзей", map_place: null }), expect.anything()));
});

test("legacy rental exposes both endpoints and its existing location", () => {
  render(<Harness initial={{ ...newItem("rental", day, "RUB", day.date), location: "Старый адрес" }} />);
  expect(screen.getByText("Точка отправления")).toBeInTheDocument();
  expect(screen.getByText("Точка прибытия")).toBeInTheDocument();
  expect(screen.getByLabelText("Описание маршрута")).toHaveValue("Старый адрес");
});

test("walking transfers show a route estimate", async () => {
  const route = vi.spyOn(mapsClient, "route").mockResolvedValue({ status: "ok", distance_m: 100, duration_s: 61, geometry: null, approximate: false, message: null });
  const initial = { ...newItem("transfer", day, "RUB", day.date), subtype: "walk" as const, map_place: place, map_end_place: hotel.map_place };
  render(<Harness initial={initial} />);
  expect(await screen.findByText("Пешком: около 2 мин. Стоимость укажите отдельно.")).toBeVisible();
  expect(route).toHaveBeenCalledWith(place, hotel.map_place, "walk");
});

test("unavailable estimates can be retried", async () => {
  vi.spyOn(mapsClient, "route")
    .mockResolvedValueOnce({ status: "unavailable", distance_m: null, duration_s: null, geometry: null, approximate: false, message: "offline" })
    .mockResolvedValueOnce({ status: "ok", distance_m: 100, duration_s: 120, geometry: null, approximate: false, message: null });
  const retry = vi.spyOn(mapsClient, "retry").mockImplementation(() => {});
  const initial = { ...newItem("transfer", day, "RUB", day.date), subtype: "taxi" as const, map_place: place, map_end_place: hotel.map_place };
  render(<Harness initial={initial} />);
  expect(await screen.findByText("Время пути недоступно. Укажите время вручную.")).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Повторить оценку" }));
  expect(retry).toHaveBeenCalledWith(place, hotel.map_place, "drive");
  expect(await screen.findByText("На машине: около 2 мин. Стоимость укажите отдельно.")).toBeVisible();
});

test("a late route response cannot replace the estimate for changed endpoints", async () => {
  let finish!: (value: Awaited<ReturnType<typeof mapsClient.route>>) => void;
  vi.spyOn(mapsClient, "route")
    .mockReturnValueOnce(new Promise(resolve => { finish = resolve; }))
    .mockResolvedValueOnce({ status: "ok", distance_m: 100, duration_s: 180, geometry: null, approximate: false, message: null });
  const initial = { ...newItem("transfer", day, "RUB", day.date), subtype: "walk" as const, map_place: place, map_end_place: hotel.map_place };
  render(<Harness initial={initial} />);
  await userEvent.click(screen.getByRole("button", { name: "Изменить точку прибытия" }));
  expect(await screen.findByText("Пешком: около 3 мин. Стоимость укажите отдельно.")).toBeVisible();
  await act(async () => finish({ status: "ok", distance_m: 100, duration_s: 60, geometry: null, approximate: false, message: null }));
  expect(screen.getByText("Пешком: около 3 мин. Стоимость укажите отдельно.")).toBeVisible();
  expect(screen.queryByText("Пешком: около 1 мин. Стоимость укажите отдельно.")).not.toBeInTheDocument();
});


test.each(["excursion", "activity"] as const)("compact %s excursion keeps its existing meeting place until the start point is edited", async type => {
  const item = { ...newItem(type, fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), subtype: "excursion" as const, title: "Экскурсия", location: "Старое место", departure_label: "Старая точка", map_place: place };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...fixtureTrip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenLastCalledWith(item, undefined);
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const menu = screen.getByLabelText("Действия: Место события").closest("details")!;
  await user.click(within(menu).getByLabelText("Действия: Место события"));
  await user.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await user.type(screen.getByRole("combobox", { name: "Выбрать: место события" }), "Новая площадь");
  await user.click(screen.getByRole("option", { name: /Использовать «Новая площадь»/ }));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ location: "Новая площадь", departure_label: "Новая площадь", map_place: null }), undefined);
});

test.each(["excursion", "activity"] as const)("manually editing the %s excursion meeting place clears the old map binding", async type => {
  const item = { ...newItem(type, fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), subtype: "excursion" as const, title: "Экскурсия", location: "Старое место", departure_label: "Старая точка", map_place: place };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...fixtureTrip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  fireEvent.change(screen.getByLabelText("Место встречи"), { target: { value: "Новое место" } });
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ location: "Новое место", departure_label: "Новое место", map_place: null }), undefined);
});

test("compact flight summary hides duration until changed UTC context is confirmed", async () => {
  const item = { ...newItem("flight", fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), title: "Перелёт", start_time: "12:00", end_time: "15:00", departure_label: "Аэропорт", departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 180 };
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...fixtureTrip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  const summary = screen.getByRole("group", { name: "Сводка события" });
  expect(summary).toHaveTextContent("3 ч 0 мин");
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  fireEvent.change(screen.getByLabelText("Место вылета"), { target: { value: "Другой аэропорт" } });
  expect(summary).not.toHaveTextContent("3 ч 0 мин");
  expect(summary).toHaveTextContent("Проверьте часовые пояса");
  await user.click(screen.getByText("Расписание", { selector: "strong" }));
  await user.click(screen.getByRole("button", { name: "Подтвердить" }));
  expect(summary).toHaveTextContent("3 ч 0 мин");
});

test("unlinking an excursion map point keeps its meeting place", async () => {
  const item = { ...newItem("excursion", fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), title: "Экскурсия", location: "Место встречи", departure_label: "Другое название", map_place: place };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...fixtureTrip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const menu = screen.getByLabelText("Действия: Место события").closest("details")!;
  await user.click(within(menu).getByLabelText("Действия: Место события"));
  await user.click(within(menu).getByRole("button", { name: "Удалить привязку" }));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ location: "Место встречи", map_place: null }), undefined);
});

test("selecting a mapped trip place updates the excursion meeting place", async () => {
  const item = { ...newItem("excursion", fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), title: "Экскурсия", location: "Старое место" };
  const nearbyHotel = { ...newItem("hotel", fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), title: "Отель", map_place: hotel.map_place };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...fixtureTrip, items: [item, nearbyHotel] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const menu = screen.getByLabelText("Действия: Место события").closest("details")!;
  await user.click(within(menu).getByLabelText("Действия: Место события"));
  await user.click(within(menu).getByRole("button", { name: "Изменить место" }));
  await user.click(screen.getByRole("combobox", { name: "Выбрать: место события" }));
  await user.click(screen.getByRole("option", { name: /Отель/ }));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ location: "Отель", departure_label: "Отель", map_place: hotel.map_place }), undefined);
});

test("reopening a saved map point allows editing its original Google link", async () => {
  const link = "https://maps.google.com/?q=1,2";
  vi.spyOn(mapsClient, "resolveLink").mockResolvedValue({ place, query: null });
  const item = { ...newItem("excursion", fixtureTrip.days[0], fixtureTrip.base_currency, fixtureTrip.start_date), title: "Экскурсия" };
  const save = vi.fn();
  const user = userEvent.setup();
  const renderItem = (initial: ItemInput) => render(<ItemForm initial={initial} trip={{ ...fixtureTrip, items: [initial] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  const editPoint = async () => {
    await user.click(screen.getByText("Маршрут", { selector: "strong" }));
    const menu = screen.getByLabelText("Действия: Место события").closest("details")!;
    await user.click(within(menu).getByLabelText("Действия: Место события"));
    await user.click(within(menu).getByRole("button", { name: "Изменить место" }));
  };
  const view = renderItem(item);
  await editPoint();
  fireEvent.change(screen.getAllByLabelText("Ссылка Google Maps")[0], { target: { value: link } });
  await user.click(await screen.findByRole("option", { name: /Аэропорт/ }));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  const saved = save.mock.calls[0][0] as ItemInput;
  expect(saved.map_place?.source_url).toBe(link);
  view.unmount();
  renderItem(saved);
  await editPoint();
  expect(screen.getAllByLabelText("Ссылка Google Maps")[0]).toHaveValue(link);
});
