import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import { EventPlayground } from "./event-playground";
import { base, trip } from "./fixtures";
import { ItemForm } from "@/components/trips/item-form";
import { EventSummary } from "./compact-editor";
import { ValidationIssueContext } from "@/components/trips/trip-validation-panel";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test("validation navigation opens the compact stages section when a stage is unavailable", async () => {
  const issue = { id: "stage-issue", code: "missing_stage", category: "schedule", severity: "warning", title: "Этап", message: "Проверьте этап", path: "items/0/stages" };
  render(<ValidationIssueContext issue={issue} location={{ section: "stages", unavailable: true }} stale={false}><ItemForm initial={base} trip={{ ...trip, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} /></ValidationIssueContext>);
  const section = screen.getByText("Дополнительные настройки", { selector: "strong" }).closest("details")!;
  expect(await within(section).findByText(/Проверьте этап/)).toBeInTheDocument();
  expect(section).toHaveAttribute("open");
  expect(within(section).getByText(/Это поле недоступно/)).toBeInTheDocument();
});

test("validation navigation opens the compact schedule and focuses its field", async () => {
  const issue = { id: "time-issue", code: "invalid_time", category: "schedule", severity: "error", title: "Время", message: "Проверьте время", path: "items/0/start_time" };
  render(<ValidationIssueContext issue={issue} location={{ section: "schedule", field: "start_time" }} stale={false}><ItemForm initial={base} trip={{ ...trip, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} /></ValidationIssueContext>);
  const section = screen.getByText("Расписание", { selector: "strong" }).closest("details")!;
  const message = await within(section).findByText("Проверьте время");
  expect(section).toHaveAttribute("open");
  expect(section.querySelector('[name="start_time"]')).toHaveFocus();
  expect(message.closest('[role="status"]')).toBeInTheDocument();
});

test("summary shows clarification only for supplied findings or item validation warnings", () => {
  const { rerender } = render(<EventSummary item={base} trip={{ ...trip, items: [base] }} calculation={null} />);
  expect(screen.queryByText("Есть что уточнить")).not.toBeInTheDocument();
  rerender(<EventSummary item={base} trip={{ ...trip, items: [base] }} calculation={null} clarificationNotes={["Цена тестовая"]} />);
  expect(screen.getByText("Есть что уточнить")).toBeInTheDocument();
  rerender(<EventSummary item={{ ...base, price_pending: true }} trip={{ ...trip, items: [base] }} calculation={null} />);
  expect(screen.getByText("Есть что уточнить")).toBeInTheDocument();
});

test("sections open independently and the summary follows edits saved locally", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  render(<EventPlayground />);
  const dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  const route = within(dialog).getByText("Маршрут", { selector: "strong" }).closest("details")!;
  const schedule = within(dialog).getByText("Расписание", { selector: "strong" }).closest("details")!;
  expect(route).not.toHaveAttribute("open");
  expect(schedule).not.toHaveAttribute("open");
  await userEvent.click(within(route).getByText("Маршрут", { selector: "strong" }));
  await userEvent.click(within(schedule).getByText("Расписание"));
  expect(route).toHaveAttribute("open");
  expect(schedule).toHaveAttribute("open");
  const title = screen.getByLabelText("Название события");
  await userEvent.clear(title);
  await userEvent.type(title, "Тестовый поезд");
  expect(within(dialog).getByRole("group", { name: "Сводка события" })).toHaveTextContent("Тестовый поезд");
  await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(await screen.findByRole("status")).toHaveTextContent("только в песочнице");
  await userEvent.click(screen.getByRole("button", { name: "Открыть редактор" }));
  expect(screen.getByRole("group", { name: "Сводка события" })).toHaveTextContent("Тестовый поезд");
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("deletion requires confirmation", async () => {
  render(<EventPlayground />);
  await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(screen.getByLabelText("Дополнительные действия"));
  await userEvent.click(screen.getByRole("button", { name: "Удалить элемент" }));
  expect(screen.getByRole("dialog", { name: "Удалить элемент?" })).toBeInTheDocument();
  await userEvent.click(within(screen.getByRole("dialog", { name: "Удалить элемент?" })).getByRole("button", { name: "Отмена" }));
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

test("route points can be changed or unlinked without losing their names", async () => {
  render(<EventPlayground />);
  const dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Маршрут", { selector: "strong" }));
  expect(within(dialog).getByText("Станция отправления")).toBeInTheDocument();
  expect(within(dialog).getByText("Станция прибытия")).toBeInTheDocument();
  expect(within(dialog).queryByLabelText("Маршрут")).not.toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "Открыть на карте: Станция отправления" })).toHaveAttribute("href", "https://www.google.com/maps/search/?api=1&query=13.803%2C100.539");
  const pointMenu = within(dialog).getByLabelText("Действия: Станция отправления").closest("details")!;
  await userEvent.click(within(pointMenu).getByLabelText("Действия: Станция отправления"));
  await userEvent.click(within(pointMenu).getByRole("button", { name: "Удалить привязку" }));
  expect(within(dialog).getByText("Без привязки к карте")).toBeInTheDocument();
  expect(within(dialog).getAllByText("Krung Thep Aphiwat Central Terminal").length).toBeGreaterThan(0);
  await userEvent.click(within(pointMenu).getByLabelText("Действия: Станция отправления"));
  await userEvent.click(within(pointMenu).getByRole("button", { name: "Изменить место" }));
  const input = within(dialog).getByRole("combobox", { name: "Выбрать: станция отправления" });
  await userEvent.type(input, "Новая станция");
  await userEvent.click(within(dialog).getByRole("option", { name: /Использовать «Новая станция»/ }));
  expect(within(dialog).getAllByText("Новая станция").length).toBeGreaterThan(0);
  await userEvent.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await userEvent.click(await screen.findByRole("button", { name: "Открыть редактор" }));
  const reopened = screen.getByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(reopened).getByText("Маршрут", { selector: "strong" }));
  expect(within(reopened).getAllByText("Новая станция").length).toBeGreaterThan(0);
});

test("schedule groups show next day, elapsed time and invalid dates", async () => {
  render(<EventPlayground />);
  const dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Расписание", { selector: "strong" }));
  const departure = within(dialog).getByRole("group", { name: "Отправление" });
  const arrival = within(dialog).getByRole("group", { name: "Прибытие" });
  expect(within(departure).getByLabelText("Дата начала")).toHaveValue("2026-11-03");
  expect(within(arrival).getByText("Следующий день")).toBeInTheDocument();
  expect(within(dialog).getByText("Продолжительность").parentElement).toHaveTextContent("10 ч 33 мин");
  expect(within(dialog).getByText("UTC+07:00", { selector: "span" })).toBeInTheDocument();
  await userEvent.click(within(dialog).getByText("Часовые пояса"));
  await userEvent.selectOptions(within(dialog).getByLabelText("UTC при прибытии"), "480");
  expect(within(dialog).getByText("Продолжительность").parentElement).toHaveTextContent("9 ч 33 мин");
  expect(within(dialog).getByText("UTC+07:00 → UTC+08:00")).toBeInTheDocument();
  await userEvent.selectOptions(within(arrival).getByLabelText("Дата окончания"), "2026-11-03");
  expect(within(arrival).getByRole("status")).toHaveTextContent("окончание должно быть позже начала");
});

test("cost distinguishes all participants, manual count, unknown price and exclusion", async () => {
  render(<EventPlayground />);
  const dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Стоимость", { selector: "strong" }));
  const choice = within(dialog).getByLabelText("Участники");
  expect(choice).toHaveValue("all");
  expect(within(dialog).getByLabelText("Цена билета")).toHaveValue("1050");
  expect(within(dialog).queryByLabelText("Количество участников")).not.toBeInTheDocument();
  await userEvent.selectOptions(choice, "manual");
  const count = within(dialog).getByLabelText("Количество участников");
  await userEvent.clear(count);
  await userEvent.type(count, "3");
  expect(within(dialog).getByText("Итого за группу").parentElement).toHaveTextContent("3 150,00 THB");
  await userEvent.selectOptions(within(dialog).getByLabelText("Статус стоимости"), "pending");
  expect(within(dialog).getByText("Стоимость неизвестна", { selector: "strong" })).toBeInTheDocument();
  await userEvent.selectOptions(within(dialog).getByLabelText("Статус стоимости"), "known");
  await userEvent.clear(within(dialog).getByLabelText("Цена билета"));
  await userEvent.type(within(dialog).getByLabelText("Цена билета"), "0");
  expect(within(dialog).getByText("Итого за группу").parentElement).toHaveTextContent("0,00 THB");
  await userEvent.click(within(dialog).getByLabelText("Учитывать в стоимости поездки"));
  expect(within(dialog).getByText("Не учитывается в смете", { selector: "span" })).toBeInTheDocument();
});

test("all participants remain dynamic while an explicit count stays fixed", async () => {
  const save = vi.fn();
  const { rerender } = render(<ItemForm initial={base} trip={{ ...trip, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await userEvent.click(screen.getByText("Стоимость", { selector: "strong" }));
  expect(screen.getByLabelText("Участники")).toHaveValue("all");
  rerender(<ItemForm initial={base} trip={{ ...trip, participants: 8, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  expect(screen.getByText("Итого за группу").parentElement).toHaveTextContent("8 400,00 THB");
  await userEvent.selectOptions(screen.getByLabelText("Участники"), "manual");
  const count = screen.getByLabelText("Количество участников");
  await userEvent.clear(count);
  await userEvent.type(count, "3");
  rerender(<ItemForm initial={base} trip={{ ...trip, participants: 9, items: [base] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  expect(screen.getByText("Итого за группу").parentElement).toHaveTextContent("3 150,00 THB");
  await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ participants_override: 3 }), undefined);
});

test("quantity and currency update the existing calculation and persist", async () => {
  render(<EventPlayground />);
  let dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Стоимость", { selector: "strong" }));
  await userEvent.click(within(dialog).getByText("Дополнительные параметры"));
  const quantity = within(dialog).getByLabelText("Количество");
  await userEvent.clear(quantity);
  await userEvent.type(quantity, "2");
  expect(within(dialog).getByText("Итого за группу").parentElement).toHaveTextContent("12 600,00 THB");
  await userEvent.selectOptions(within(dialog).getByLabelText("Валюта цены"), "USD");
  expect(within(dialog).getByText("Укажите курс валюты", { selector: "strong" })).toBeInTheDocument();
  await userEvent.selectOptions(within(dialog).getByLabelText("Валюта цены"), "__custom");
  const code = within(dialog).getByLabelText("Код валюты");
  await userEvent.clear(code);
  await userEvent.type(code, "jpy");
  expect(code).toHaveValue("JPY");
  await userEvent.selectOptions(within(dialog).getByLabelText("Валюта цены"), "THB");
  await userEvent.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await userEvent.click(await screen.findByRole("button", { name: "Открыть редактор" }));
  dialog = screen.getByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Стоимость", { selector: "strong" }));
  expect(within(dialog).getByLabelText("Количество")).toHaveValue("2");
  expect(within(dialog).getByText("Итого за группу").parentElement).toHaveTextContent("12 600,00 THB");
});

test("links can be edited, removed and added with one shared visibility setting", async () => {
  render(<EventPlayground />);
  let dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  expect(within(dialog).getByText(/Ссылок: 3 · Скрыты от клиента/)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByText("Билеты и ссылки", { selector: "strong" }));
  expect(within(dialog).getByText("www.railway.co.th")).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "Открыть ссылку «Сайт перевозчика»" })).toHaveAttribute("href", "https://www.railway.co.th/");
  await userEvent.click(within(dialog).getByLabelText("Действия: Сайт перевозчика"));
  await userEvent.click(within(dialog).getByRole("button", { name: "Изменить ссылку «Сайт перевозчика»" }));
  const input = within(dialog).getByLabelText("Сайт перевозчика");
  expect(input).toHaveValue("https://www.railway.co.th/");
  await userEvent.clear(input);
  fireEvent.change(input, { target: { value: "не ссылка" } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Готово: Сайт перевозчика" }));
  expect(within(dialog).getByRole("alert")).toHaveTextContent("Введите полную ссылку");
  await userEvent.clear(input);
  fireEvent.change(input, { target: { value: "https://example.org/new-ticket" } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Готово: Сайт перевозчика" }));
  expect(within(dialog).getByText("example.org")).toBeInTheDocument();
  await userEvent.click(within(dialog).getByLabelText("Действия: Карта"));
  await userEvent.click(within(dialog).getByRole("button", { name: "Удалить ссылку «Карта»" }));
  await userEvent.click(within(dialog).getByText("Добавить ссылку"));
  await userEvent.click(within(dialog).getByRole("button", { name: "Добавить: Карта" }));
  const map = within(dialog).getByLabelText("Карта");
  fireEvent.change(map, { target: { value: "https://maps.example.org/place" } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Готово: Карта" }));
  await userEvent.click(within(dialog).getByLabelText("Показывать ссылки клиенту"));
  await userEvent.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await userEvent.click(await screen.findByRole("button", { name: "Открыть редактор" }));
  dialog = screen.getByRole("dialog", { name: /Редактирование/ });
  expect(within(dialog).getByText(/Ссылок: 3 · Видны клиенту/)).toBeInTheDocument();
  await userEvent.click(within(dialog).getByText("Билеты и ссылки", { selector: "strong" }));
  expect(within(dialog).getByText("example.org")).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "Открыть ссылку «Сайт перевозчика»" })).toHaveAttribute("href", "https://example.org/new-ticket");
  expect(within(dialog).getByText("maps.example.org")).toBeInTheDocument();
  expect(within(dialog).getByLabelText("Показывать ссылки клиенту")).toBeChecked();
});

test("client and private notes preserve paragraphs and expand long text independently", async () => {
  render(<EventPlayground />);
  let dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Описание для клиента", { selector: "strong" }));
  await userEvent.click(within(dialog).getByText("Внутренние заметки", { selector: "strong" }));
  const client = within(dialog).getByLabelText("Описание события");
  const privateNote = within(dialog).getByLabelText("Внутренняя заметка");
  expect(client).toHaveAttribute("rows", "2");
  Object.defineProperty(client, "scrollHeight", { configurable: true, value: 120 });
  fireEvent.input(client);
  expect(client).toHaveStyle({ height: "122px" });
  Object.defineProperty(client, "scrollHeight", { configurable: true, value: 500 });
  await userEvent.clear(client);
  await userEvent.type(client, "Первый абзац{enter}Второй абзац");
  const expand = within(dialog).getByRole("button", { name: "Показать полностью: Описание события" });
  expect(client).toHaveStyle({ height: "240px" });
  await userEvent.click(expand);
  expect(expand).toHaveAttribute("aria-expanded", "true");
  expect(client).toHaveStyle({ height: "502px" });
  await userEvent.clear(privateNote);
  await userEvent.type(privateNote, "Только для команды");
  await userEvent.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await userEvent.click(await screen.findByRole("button", { name: "Открыть редактор" }));
  dialog = screen.getByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Описание для клиента", { selector: "strong" }));
  await userEvent.click(within(dialog).getByText("Внутренние заметки", { selector: "strong" }));
  expect(within(dialog).getByLabelText("Описание события")).toHaveValue("Первый абзац\nВторой абзац");
  expect(within(dialog).getByLabelText("Внутренняя заметка")).toHaveValue("Только для команды");
});

test("stages remain compact and retain edits after closing and reopening", async () => {
  render(<EventPlayground />);
  let dialog = await screen.findByRole("dialog", { name: /Редактирование/ });
  const advanced = within(dialog).getByText("Дополнительные настройки", { selector: "strong" }).closest("details")!;
  await userEvent.click(within(advanced).getByText("Дополнительные настройки", { selector: "strong" }));
  expect(within(advanced).getByText("Этапов пока нет")).toBeInTheDocument();
  await userEvent.click(within(advanced).getByRole("button", { name: "Добавить этап" }));
  const title = within(advanced).getByLabelText("Название этапа 1");
  await userEvent.type(title, "Посадка");
  await userEvent.type(within(advanced).getByLabelText("Начало этапа 1"), "19:20");
  await userEvent.click(within(advanced).getByText("Посадка", { selector: "strong" }));
  await userEvent.click(within(advanced).getByText("Дополнительные настройки", { selector: "strong" }));
  await userEvent.click(within(advanced).getByText("Дополнительные настройки", { selector: "strong" }));
  expect(within(advanced).getByText("19:20", { exact: false })).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await userEvent.click(await screen.findByRole("button", { name: "Открыть редактор" }));
  dialog = screen.getByRole("dialog", { name: /Редактирование/ });
  await userEvent.click(within(dialog).getByText("Дополнительные настройки", { selector: "strong" }));
  expect(within(dialog).getByText("Посадка", { selector: "strong" }).closest("details")).not.toHaveAttribute("open");
  expect(within(dialog).getByText("19:20", { exact: false })).toBeInTheDocument();
});

test("editing a stage keeps its existing optional fields and precise times", async () => {
  const stage = { id: "stage-1", title: "Посадка", start_time: "19:20:15.123456", end_time: null, notes: "Заметка", location: "Вокзал", address: "Адрес", map_url: null };
  const item = { ...base, stages: [stage] };
  const save = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await userEvent.click(screen.getByText("Дополнительные настройки", { selector: "strong" }));
  await userEvent.click(screen.getByText("Посадка", { selector: "strong" }));
  const notes = screen.getByLabelText("Описание этапа 1");
  await userEvent.clear(notes);
  await userEvent.type(notes, "Новая заметка");
  await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ stages: [{ ...stage, notes: "Новая заметка" }] }), undefined);
});

test("existing stages remain available and unchanged when changing category", async () => {
  const stage = { id: "stage-1", title: "Посадка", start_time: "19:20", end_time: null, notes: "Заметка", location: "Вокзал" };
  const item = { ...base, stages: [stage] };
  const save = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={save} />);
  await userEvent.click(screen.getByLabelText("Дополнительные действия"));
  await userEvent.selectOptions(screen.getByLabelText("Тип события"), "meal");
  await userEvent.click(screen.getByText("Дополнительные настройки", { selector: "strong" }));
  expect(screen.getByText("Посадка", { selector: "strong" })).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ type: "meal", stages: [stage] }), undefined);
});

test("saved stages open independently and meals can add their first stage", async () => {
  const stages = ["Первый", "Второй"].map((title, index) => ({ id: `stage-${index}`, title, start_time: null, end_time: null, notes: "" }));
  const item = { ...base, stages };
  const { unmount } = render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  await userEvent.click(screen.getByText("Дополнительные настройки", { selector: "strong" }));
  const first = screen.getByText("Первый", { selector: "strong" }).closest("details")!;
  const second = screen.getByText("Второй", { selector: "strong" }).closest("details")!;
  expect(first).not.toHaveAttribute("open");
  expect(second).not.toHaveAttribute("open");
  await userEvent.click(within(first).getByText("Первый"));
  expect(first).toHaveAttribute("open");
  expect(second).not.toHaveAttribute("open");
  const menu = screen.getByLabelText("Действия этапа 2").closest("details")!;
  await userEvent.click(within(menu).getByLabelText("Действия этапа 2"));
  await userEvent.click(within(menu).getByRole("button", { name: "Удалить" }));
  await userEvent.click(within(screen.getByRole("group", { name: "Удаление этапа 2" })).getByRole("button", { name: "Отмена" }));
  expect(screen.getByText("Второй", { selector: "strong" })).toBeInTheDocument();
  unmount();
  const meal = { ...base, type: "meal" as const, subtype: "restaurant" as const, stages: [] };
  render(<ItemForm initial={meal} trip={{ ...trip, items: [meal] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  await userEvent.click(screen.getByText("Дополнительные настройки", { selector: "strong" }));
  expect(screen.getByRole("button", { name: "Добавить этап" })).toBeInTheDocument();
});

test("a long program starts with twenty collapsed stage summaries", async () => {
  const stages = Array.from({ length: 20 }, (_, index) => ({ id: `stage-${index}`, title: `Этап ${index + 1}`, start_time: "09:00", end_time: "10:00", notes: "" }));
  const item = { ...base, stages };
  const { container } = render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  await userEvent.click(screen.getByText("Дополнительные настройки", { selector: "strong" }));
  const rows = container.querySelectorAll("[data-editor-stage]");
  expect(rows).toHaveLength(20);
  for (const row of rows) expect(row.querySelector("details")).not.toHaveAttribute("open");
  expect(screen.getByText("Изменить подвид").parentElement).toHaveTextContent("Поезд");
});
