import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TripEditor } from "./trip-editor";
import { TripProvider } from "./ui";
import { tripApi, type TripValidation } from "@/lib/trips";
import { reimportApi, type ReimportResult } from "@/lib/trip-reimport";
import { calculateTrip } from "@/lib/pricing";
import type { TripDocument, TripInput } from "@/lib/contracts";
import { vectors } from "../../test-fixtures";
import { emptyDay, newItem } from "@/lib/trip-ui";
import { buildCalendarEntries } from "@/lib/calendar";
import { mapsClient } from '@/lib/maps-client';

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
const mapsConfig=vi.hoisted(()=>({routing_enabled:false}));
vi.mock('@/lib/use-maps-config',()=>({useMapsConfig:()=>({config:{maps_key:null,search_enabled:false,routing_enabled:mapsConfig.routing_enabled},error:null,retry:vi.fn()})}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); mapsConfig.routing_enabled=false; navigation.push.mockReset(); navigation.replace.mockReset(); history.replaceState(null, "", "/"); });
vi.mock("./trip-calendar", () => ({ TripCalendar: ({ days, items, calculation, baseCurrency, onCreateRange, onMoveItem, onMoveHotel, onEditDay, onOpenAirport, onOpenItem, onSelectDate }: {
  days: TripInput["days"]; items: TripInput["items"]; calculation: TripDocument["calculation"] | null; baseCurrency: string;
  onCreateRange: (dayId: string, start: string, end: string) => void;
  onMoveItem: (itemId: string, dayId: string, start: string, end: string, endDayId: string | null) => void;
  onMoveHotel: (itemId: string, checkIn: string, checkOut: string, dayId: string) => void;
  onEditDay: (dayId: string) => void;
  onOpenAirport: (itemId: string, kind: "before" | "after") => void;
  onOpenItem: (itemId: string) => void;
  onSelectDate: (dayId:string)=>void;
}) => <div aria-label="Календарь поездки" data-currency={baseCurrency} data-total={calculation?.cost_total}>
  <button onClick={()=>onSelectDate(days[1].id)}>Выбрать второй день</button>
  <button onClick={() => onCreateRange(days[0].id, "09:15", "10:45")}>Создать интервал</button>
  <button onClick={() => onMoveItem(items[0].id, days[1].id, "11:00", "12:00", null)}>Перенести событие</button>
  <button onClick={() => onMoveHotel(items[1].id, days[1].date, days[2].date, days[1].id)}>Перенести отель</button>
  <button onClick={() => onEditDay(days[1].id)}>Изменить день в календаре</button>
  <button onClick={() => onOpenAirport(items[0].id, "before")}>Настроить приезд в аэропорт</button>
  <button onClick={() => onOpenItem(items[0].id)}>Открыть первый пункт</button>
</div> }));

test.each(["editor", "builder"] as const)("%s opens the compact editor for a saved event", async mode => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
  const document = { ...input, id: "compact-integration", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} mode={mode} initialStep={2} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: mode === "builder" ? "Редактировать Рейс" : "Открыть первый пункт" }));
  expect(screen.getByRole("group", { name: "Сводка события" })).toHaveTextContent("Рейс");
  expect(screen.getByText("Маршрут", { selector: "strong" }).closest("details")).not.toHaveAttribute("open");
});

test.each(["editor", "builder"] as const)("%s keeps a changed event exchange rate when saving the trip", async mode => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.base_currency = "RUB";
  input.items = [{ ...newItem("flight", day, "RUB", day.date), title: "Рейс", unit_price: "100" }];
  const document = { ...input, id: "compact-rate", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} mode={mode} initialStep={2} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: mode === "builder" ? "Редактировать Рейс" : "Открыть первый пункт" }));
  await user.click(screen.getByText("Стоимость", { selector: "strong" }));
  await user.selectOptions(screen.getByLabelText("Валюта цены"), "USD");
  await user.type(screen.getByLabelText("Курс USD"), "90");
  const form = screen.getByRole("group", { name: "Сводка события" }).closest("form")!;
  await user.click(within(form).getByRole("button", { name: "Сохранить" }));
  await user.click(screen.getByRole("button", { name: "Сохранить" }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls.at(-1)![1].rates).toContainEqual({ currency: "USD", rate: "90" });
  expect(save.mock.calls.at(-1)![1].items[0]).toMatchObject({ currency: "USD", unit_price: "100" });
});

test.each(["editor", "builder"] as const)("%s retains a dirty event when delete and discard are cancelled", async mode => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
  const document = { ...input, id: "compact-discard", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} mode={mode} initialStep={2} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: mode === "builder" ? "Редактировать Рейс" : "Открыть первый пункт" }));
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const title = screen.getByLabelText("Название события");
  await user.clear(title); await user.type(title, "Черновик");
  await user.click(screen.getByRole("button", { name: "Удалить элемент" }));
  const confirm = screen.getByRole("dialog", { name: "Удалить элемент?" });
  expect(within(confirm).getByText(/несохранённые изменения/i)).toBeVisible();
  await user.click(within(confirm).getByRole("button", { name: "Отмена" }));
  const form = title.closest("form")!;
  await user.click(within(form).getByRole("button", { name: "Отмена" }));
  await user.click(within(screen.getByRole("dialog", { name: "Закрыть без сохранения?" })).getByRole("button", { name: "Отмена" }));
  expect(title).toHaveValue("Черновик");
});

test("day photo upload uses the open trip in the builder", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  input.start_date = input.days[0].date; input.end_date = input.days[1].date; input.items = [];
  const doc = { ...input, id: "photo-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(doc);
  const upload = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "upload-0123456789abcdef0123456789abcdef" }), { status: 201 }));
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="photo-trip" mode="builder" initialStep={4} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Детали и заметки дня" }));
  await user.upload(screen.getByLabelText(/JPEG/), new File(["image"], "photo.jpg", { type: "image/jpeg" }));
  await waitFor(() => expect(upload).toHaveBeenCalledWith("/api/trips/photo-trip/photos", expect.objectContaining({ method: "POST" })));
});

test('day map immediately follows the calendar and changes date with its selection',async()=>{
 const input=structuredClone(vectors.cases[0].input) as TripInput;
 input.days=[emptyDay('2026-10-01'),emptyDay('2026-10-02')];input.start_date=input.days[0].date;input.end_date=input.days[1].date;input.items=[];
 const document={...input,id:'map-trip',version:1,created_at:'',updated_at:'',created_by:'user',calculation:calculateTrip(input)} as TripDocument;
 vi.spyOn(tripApi,'get').mockResolvedValue(document);
 render(<TripProvider><TripEditor id="map-trip"/></TripProvider>);
 const map=await screen.findByRole('region',{name:'Маршрут дня'});
 expect(screen.getByLabelText('Календарь поездки').nextElementSibling).toBe(map);
 expect(map.querySelector('time')).toHaveAttribute('datetime','2026-10-01');
 await userEvent.click(screen.getByRole('button',{name:'Выбрать второй день'}));
 expect(map.querySelector('time')).toHaveAttribute('datetime','2026-10-02');
});

test("editing a day from the full editor saves the draft before opening that day in the builder", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  input.start_date = input.days[0].date; input.end_date = input.days[1].date; input.items = [];
  const document = { ...input, id: "day-save-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockImplementation(async (_id, update) => ({ ...document, ...update, version: update.version + 1, calculation: calculateTrip(update) }) as TripDocument);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="day-save-trip" initialStep={5} /></TripProvider>);
  fireEvent.change(await screen.findByLabelText("Наценка, %"), { target: { value: "15" } });
  await user.click(screen.getByRole("button", { name: "Изменить день в календаре" }));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(`/admin/trips/day-save-trip/builder?step=4&day=${input.days[1].id}`));
  expect(save.mock.calls[0][1]).toMatchObject({ pricing_percent: "15" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("failed day transition keeps the draft in the full editor and can be retried", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  input.days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  input.start_date = input.days[0].date; input.end_date = input.days[1].date; input.items = [];
  const document = { ...input, id: "day-retry-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockRejectedValueOnce(new Error("Сохранение дня не удалось"))
    .mockImplementation(async (_id, update) => ({ ...document, ...update, version: update.version + 1, calculation: calculateTrip(update) }) as TripDocument);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id="day-retry-trip" initialStep={5} /></TripProvider>);
  fireEvent.change(await screen.findByLabelText("Наценка, %"), { target: { value: "19" } });
  await user.click(screen.getByRole("button", { name: "Изменить день в календаре" }));
  expect(await screen.findByText("Сохранение дня не удалось")).toBeVisible();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Наценка, %")).toHaveValue("19");
  await user.click(screen.getByRole("button", { name: "Изменить день в календаре" }));
  await waitFor(() => expect(navigation.push).toHaveBeenCalledWith(`/admin/trips/day-retry-trip/builder?step=4&day=${input.days[1].id}`));
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1][1]).toMatchObject({ pricing_percent: "19" });
});

test('map creation persists a calendar taxi and its pending price opens the standard editor',async()=>{
 mapsConfig.routing_enabled=true;
 const day=emptyDay('2026-10-01');
 const input=structuredClone(vectors.cases[0].input) as TripInput;
 input.start_date=day.date;input.end_date=day.date;input.days=[day];input.rates=[];
 const point={name:'Парк',address:'',latitude:1,longitude:2,provider:'manual' as const};
 input.items=[{...newItem('activity',day,input.base_currency,day.date),title:'Парк',start_time:'12:00',end_time:'13:00',map_place:point},{...newItem('meal',day,input.base_currency,day.date),title:'Кафе',start_time:'15:00',end_time:'16:00',map_place:{...point,name:'Кафе',latitude:3}}];
 const document={...input,id:'map-save-trip',version:1,created_at:'',updated_at:'',created_by:'user',calculation:calculateTrip(input)} as TripDocument;
 vi.spyOn(tripApi,'get').mockResolvedValue(document);
 const save=vi.spyOn(tripApi,'save').mockImplementation(async(_id,update)=>({...document,...update,version:update.version+1,calculation:calculateTrip(update)}) as TripDocument);
 vi.spyOn(mapsClient,'route').mockResolvedValue({status:'ok',distance_m:900,duration_s:540,geometry:null,approximate:false,message:null});
 const user=userEvent.setup();render(<TripProvider><TripEditor id="map-save-trip"/></TripProvider>);
 const button=await screen.findByRole('button',{name:'Добавить трансфер в маршрут'});
 await waitFor(()=>expect(button).toBeEnabled());await user.click(button);
 await user.click(screen.getByRole('button',{name:/^Сохранить$/}));
 await waitFor(()=>expect(save).toHaveBeenCalled());
 expect(save.mock.calls.at(-1)![1].items.find(item=>item.auto_transfer)).toMatchObject({subtype:'taxi',start_time:'14:51',end_time:'15:00',price_pending:true,included:false});
 const finance=screen.getByRole('complementary',{name:'Финансовая сводка'});
 await user.click(within(finance).getByRole('button',{name:'Указать стоимость: Такси 1'}));
 const editor=screen.getByRole('dialog');
 expect(within(editor).getByRole('button',{name:'Сохранить'})).toBeVisible();
 await user.click(within(editor).getByText('Стоимость', { selector: 'strong' }));
 const price=within(editor).getByLabelText('Цена за единицу');
 await user.clear(price);await user.type(price,'500');
 await user.click(within(editor).getByRole('button',{name:'Сохранить'}));
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
 await user.click(screen.getByRole('button',{name:/^Сохранить$/}));
 await waitFor(()=>expect(save.mock.calls.at(-1)![1].items.find(item=>item.auto_transfer)).toMatchObject({unit_price:'500',price_pending:false,included:true}));
 expect(within(finance).queryByText('Смета неполная')).not.toBeInTheDocument();
});

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
  await user.click(within(panel).getByRole("button", { name: "Сохранить" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  const saved = save.mock.calls.at(-1)![1];
  expect(saved.items.find(item => item.subtype === "sim")).toMatchObject({ type: "other", day_id: null, start_time: null, end_time: null, calculation_mode: "per_person", unit_price: "10" });
  expect(saved.items.find(item => item.type === "insurance")).toMatchObject({ title: "Старая страховка", unit_price: "80" });
  expect(calculateTrip(saved).general_total).toBe("270.00");
});

test.each([
  ["activity", "Новый элемент", "Начало", "Окончание"],
  ["flight", "Новый перелёт", "Вылет", "Прилёт"],
])("calendar creation updates the dialog title after choosing %s and leaves the draft untouched", async (type, heading, start, end) => {
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
  expect(within(panel).getByRole("button", { name: "Сохранить" })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
  await user.selectOptions(within(panel).getByLabelText("Тип события"), type);
  await user.selectOptions(within(panel).getByLabelText("Подкатегория"), type === "flight" ? "none" : "activity");
  expect(screen.getByRole("dialog", { name: heading })).toBe(panel);
  const schedule = within(panel.querySelector('[data-editor-section="schedule"]') as HTMLElement);
  expect(within(schedule.getByRole("group", { name: start })).getByLabelText("Местное время")).toHaveValue("09:15");
  expect(within(schedule.getByRole("group", { name: end })).getByLabelText("Местное время")).toHaveValue("10:45");
  await user.click(within(panel).getByRole("button", { name: "Отмена" }));
  const discard = await screen.findByRole("dialog", { name: "Закрыть без сохранения?" });
  await user.click(within(discard).getByRole("button", { name: "Не сохранять" }));
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
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(persisted.items).toHaveLength(0));
  expect(buildCalendarEntries(persisted.days, persisted.items, persisted.days.map(day => day.date)).airportBlocks).toEqual([]);
});

test("flight deletion can be cancelled without losing changes in the panel", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
  const document = { ...input, id: "delete-flight", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Открыть первый пункт" }));
  const panel = screen.getByRole("dialog", { name: "Редактирование авиаперелёта" });
  await user.click(within(panel).getByText("Маршрут", { selector: "strong" }));
  const title = within(panel).getByLabelText("Название события");
  await user.clear(title); await user.type(title, "Изменённый рейс");
  await user.click(within(panel).getByRole("button", { name: "Удалить элемент" }));
  const confirm = await screen.findByRole("dialog", { name: "Удалить элемент?" });
  expect(within(confirm).getByText(/несохранённые изменения/i)).toBeVisible();
  await user.click(within(confirm).getByRole("button", { name: "Отмена" }));
  expect(within(screen.getByRole("dialog", { name: "Редактирование авиаперелёта" })).getByLabelText("Название события")).toHaveValue("Изменённый рейс");
});

test("inline flight deletion asks for confirmation and retains a cancelled edit", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
  const document = { ...input, id: "inline-delete-flight", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} mode="builder" initialStep={2} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Редактировать Рейс" }));
  expect(screen.getByRole("group", { name: "Сводка события" })).toHaveTextContent("Рейс");
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const title = screen.getByLabelText("Название события");
  await user.clear(title); await user.type(title, "Изменённый рейс");
  await user.click(screen.getByRole("button", { name: "Удалить элемент" }));
  const confirm = screen.getByRole("dialog", { name: "Удалить элемент?" });
  expect(within(confirm).getByText(/несохранённые изменения/i)).toBeVisible();
  await user.click(within(confirm).getByRole("button", { name: "Отмена" }));
  expect(screen.getByLabelText("Название события")).toHaveValue("Изменённый рейс");
});

test("settings cannot replace the dirty state of an inline event", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
  const document = { ...input, id: "inline-form-ownership", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} mode="builder" initialStep={2} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Редактировать Рейс" }));
  await user.click(screen.getByText("Маршрут", { selector: "strong" }));
  const title = screen.getByLabelText("Название события");
  await user.clear(title); await user.type(title, "Черновик рейса");
  await user.click(screen.getByRole("button", { name: "Параметры" }));
  expect(screen.queryByRole("dialog", { name: "Параметры поездки" })).not.toBeInTheDocument();
  expect(screen.getByText("Есть незавершённые изменения в форме")).toBeVisible();
  expect(title).toHaveValue("Черновик рейса");
  await user.click(screen.getByRole("button", { name: "Отмена" }));
  expect(screen.getByRole("dialog", { name: "Закрыть без сохранения?" })).toBeVisible();
});

test.each(["inline cancel", "inline close button", "panel cancel", "panel close button", "panel Escape"])(
  "a dirty event survives a declined discard via %s",
  async (action) => {
    const input = structuredClone(vectors.cases[0].input) as TripInput;
    const day = emptyDay("2026-10-01");
    input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
    input.items = [{ ...newItem("flight", day, input.base_currency, day.date), title: "Рейс" }];
    const document = { ...input, id: "discard-flight", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
    vi.spyOn(tripApi, "get").mockResolvedValue(document);
    const save = vi.spyOn(tripApi, "save");
    const user = userEvent.setup();
    const inline = action.startsWith("inline");
    render(<TripProvider><TripEditor id={document.id} mode={inline ? "builder" : "editor"} initialStep={2} /></TripProvider>);
    await user.click(await screen.findByRole("button", { name: inline ? "Редактировать Рейс" : "Открыть первый пункт" }));
    await user.click(screen.getByText("Маршрут", { selector: "strong" }));
    const title = screen.getByLabelText("Название события");
    await user.clear(title); await user.type(title, "Изменённый рейс");
    const requestClose = async () => {
      if (action === "panel Escape") await user.keyboard("{Escape}");
      else await user.click(screen.getByRole("button", { name: action === "inline close button" ? "Закрыть редактор перелёта" : action === "panel close button" ? "Закрыть" : "Отмена" }));
    };
    await requestClose();
    const confirm = await screen.findByRole("dialog", { name: "Закрыть без сохранения?" });
    await user.click(within(confirm).getByRole("button", { name: "Отмена" }));
    expect(title).toHaveValue("Изменённый рейс");
    expect(title).toBeVisible();
    await requestClose();
    await user.click(within(await screen.findByRole("dialog", { name: "Закрыть без сохранения?" })).getByRole("button", { name: "Не сохранять" }));
    await waitFor(() => expect(title).not.toBeInTheDocument());
    expect(save).not.toHaveBeenCalled();
  },
);

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

test("validation marks a different server version stale and does not generate a prompt", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 2, profile: "standard", issues: [{ id: "issue", code: "missing", category: "client", severity: "warning", title: "Описание", message: "Заполните описание", path: "/trip" }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  expect(await screen.findByText(/Результат устарел/)).toBeInTheDocument();
  await user.click(screen.getByRole("checkbox", { name: "Выбрать: Описание" }));
  expect(screen.getByRole("button", { name: "Сформировать промпт" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Перейти к замечанию: Описание" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("Результат устарел");
});

test("validation opens the existing item, reveals its field and displays the issue", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  const flight = { ...newItem("flight", day, input.base_currency, day.date), price_pending: true, included: false };
  input.items = [flight];
  const document = { ...input, id: "validation-field", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  const save = vi.spyOn(tripApi, "save").mockImplementation(async (_id, update) => ({ ...document, ...update, version: update.version + 1, calculation: calculateTrip(update) }) as TripDocument);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "issue", code: "price_pending", category: "finance", severity: "warning", title: "Стоимость", message: "Стоимость ожидает уточнения; смета неполная.", recommendation: "Уточните стоимость.", path: "/trip/items/0/price_pending", item_id: flight.id, day_id: day.id }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Перейти к замечанию: Стоимость" }));
  const dialog = await screen.findByRole("dialog");
  const field = dialog.querySelector<HTMLInputElement>('[name="unit_price"]')!;
  await waitFor(() => expect(field).toHaveFocus());
  expect(field.closest("details")).toHaveAttribute("open");
  expect(within(field.closest(".field") as HTMLElement).getByText("Стоимость ожидает уточнения; смета неполная.")).toBeVisible();
  expect(field).toHaveAccessibleDescription(/Смета неполная.*Уточните стоимость/s);
  const costSection = field.closest("details")!;
  const summary = costSection.querySelector("summary")!;
  await user.click(summary);
  expect(costSection).not.toHaveAttribute("open");
  expect(within(summary).getByText("Предупреждение проверки")).toBeVisible();
  await user.click(summary);
  await user.clear(field); await user.type(field, "100");
  expect(await within(dialog).findByText(/Замечание относится к сохранённой версии/)).toBeVisible();
  expect(field).not.toHaveAccessibleDescription(/Уточните стоимость/);
  expect(within(summary).queryByText("Предупреждение проверки")).not.toBeInTheDocument();
  await user.click(within(dialog).getByRole("button", { name: "Сохранить" }));
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Проверка маршрута · устарела" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: /^Сохранить$/ }));
  await waitFor(() => expect(save).toHaveBeenCalled());
  expect(save.mock.calls[0][1].items[0]).toMatchObject({ unit_price: "100", price_pending: false });
});

test.each([
  ["stages/1", "stage-1", "Начало этапа 1"],
  ["stages/1/notes", "stage-1", "Описание этапа 1"],
  ["stages/1/end_time", null, "Окончание этапа 2"],
  ["stages", null, null],
])("validation follows %s using a stable stage identity when available", async (path, stageId, label) => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  const flight = { ...newItem("flight", day, input.base_currency, day.date), stages: [
    { id: "stage-1", title: "Первый", start_time: "10:00", end_time: "11:00", notes: "" },
    { id: "stage-2", title: "Второй", start_time: "10:30", end_time: "11:30", notes: "" },
  ] };
  input.items = [flight];
  const document = { ...input, id: "validation-stage", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "stage-issue", code: "stage_overlap", category: "schedule", severity: "warning", title: "Пересечение этапов", message: "Время этапов пересекается.", path: `/trip/items/0/${path}`, stage_id: stageId }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  const issueLink = await screen.findByRole("button", { name: "Перейти к замечанию: Пересечение этапов" });
  await user.click(issueLink);
  const dialog = await screen.findByRole("dialog");
  const message = await within(dialog).findByText("Время этапов пересекается.");
  const target = label ? within(dialog).getByLabelText(label) : message.closest("[role=status]");
  await waitFor(() => expect(target).toHaveFocus());
  expect(target?.closest("details")).toHaveAttribute("open");
  if (label) expect(target).toHaveAccessibleDescription("Предупреждение Время этапов пересекается.");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(issueLink).toHaveFocus();
});

test("validation focuses the missing rate instead of the item currency", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  const flight = { ...newItem("flight", day, input.base_currency, day.date), currency: "USD", unit_price: "100" };
  input.items = [flight];
  const calculation = calculateTrip({ ...input, rates: [{ currency: "USD", rate: "90" }] });
  const document = { ...input, id: "validation-rate", version: 1, created_at: "", updated_at: "", created_by: "user", calculation } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "rate", code: "missing_exchange_rate", category: "finance", severity: "error", title: "Валютный курс", message: "Не указан валютный курс.", path: "/trip/items/0/currency", item_id: flight.id }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Перейти к замечанию: Валютный курс" }));
  const dialog = await screen.findByRole("dialog");
  const rate = within(dialog).getByLabelText("Курс USD");
  await waitFor(() => expect(rate).toHaveFocus());
  expect(rate).toHaveAccessibleDescription(/Не указан валютный курс/);
});

test.each([
  ["/trip/client_title", "Параметры поездки", "Название для клиента"],
  ["/trip/cover_photo_id", "Параметры поездки", "Фото обложки"],
  ["/trip/days/0/title", "Детали дня", "Название дня"],
])("validation opens and describes %s", async (path, dialogName, fieldLabel) => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-details", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "issue", code: "missing_title", category: "client", severity: "info", title: "Название", message: "Добавьте название.", path }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Перейти к замечанию: Название" }));
  const field = within(await screen.findByRole("dialog", { name: dialogName })).getByLabelText(fieldLabel);
  await waitFor(() => expect(field).toHaveFocus());
  expect(field).toHaveAccessibleDescription(/Добавьте название/);
});

test.each([null, "b5dfc30d-43e3-40e3-ba5e-d044fc782e0b"])("unapplied imports link to source %s instead of opening an unrelated saved item", async (draftId) => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-unapplied-source", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input), unapplied_import_id: draftId } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "import", code: "unapplied_unknown_item_type", category: "import", severity: "error", title: "Данные не применены при импорте", message: "Исходное значение сохранено в черновике импорта.", path: "/trip/items/0/type" }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  const issue = (await screen.findByText("Данные не применены при импорте")).closest("li")!;
  expect(within(issue).getByRole("link", { name: "Открыть исходный JSON и отчёт" })).toHaveAttribute("href", draftId ? `/admin/trips#import-draft-${draftId}` : "/admin/trips#import-drafts-title");
  if (draftId) expect(issue).toHaveTextContent(draftId);
  expect(within(issue).queryByRole("button", { name: /Перейти к замечанию/ })).not.toBeInTheDocument();
});

test("validation mutations wait for rechecking before using the refreshed result", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-check-in-flight", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  const result: TripValidation = { trip_id: document.id, version: 1, profile: "standard", issues: [
    { id: "active", code: "missing_client_title", category: "client", severity: "info", title: "Название", message: "Добавьте название.", path: "/trip/client_title" },
    { id: "ignored", code: "missing_cover", category: "client", severity: "info", title: "Обложка", message: "Добавьте обложку.", path: "/trip/cover_photo_id", ignored: true },
  ] };
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  let finishCheck!: (value: TripValidation) => void;
  const recheck = new Promise<TripValidation>(resolve => { finishCheck = resolve; });
  const validate = vi.spyOn(tripApi, "validate").mockResolvedValueOnce(result).mockReturnValueOnce(recheck);
  const ignore = vi.spyOn(tripApi, "ignoreValidationIssue");
  const restore = vi.spyOn(tripApi, "restoreValidationIssue");
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Пропустить: Название" }));
  await user.type(screen.getByRole("textbox", { name: "Причина пропуска: Название" }), "Позже");
  await user.click(screen.getByRole("button", { name: "Проверить снова" }));
  expect(validate).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("button", { name: "Подтвердить пропуск" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Восстановить: Обложка" })).toBeDisabled();
  expect(ignore).not.toHaveBeenCalled();
  expect(restore).not.toHaveBeenCalled();
  await act(async () => finishCheck({ ...result, issues: result.issues.slice(1) }));
  expect(screen.queryByRole("button", { name: "Пропустить: Название" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Восстановить: Обложка" })).toBeEnabled();
});

test("a changed validation decision keeps the old report stale until refresh succeeds", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-refresh-failed", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  const result: TripValidation = { trip_id: document.id, version: 1, profile: "standard", issues: [
    { id: "title", code: "missing_client_title", category: "client", severity: "info", title: "Название", message: "Добавьте название.", path: "/trip/client_title" },
    { id: "cover", code: "missing_cover", category: "client", severity: "info", title: "Обложка", message: "Добавьте обложку.", path: "/trip/cover_photo_id" },
  ] };
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValueOnce(result).mockRejectedValueOnce(new Error("GET failed")).mockResolvedValueOnce({ ...result, issues: result.issues.slice(1) });
  let finishIgnore!: (version: { version: number }) => void;
  vi.spyOn(tripApi, "ignoreValidationIssue").mockReturnValue(new Promise(resolve => { finishIgnore = resolve; }));
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  const selected = await screen.findByRole("checkbox", { name: "Выбрать: Обложка" });
  await user.click(selected);
  const generate = screen.getByRole("button", { name: "Сформировать промпт" });
  await user.click(generate);
  const copy = screen.getByRole("button", { name: "Скопировать промпт" });
  await user.click(screen.getByRole("button", { name: "Пропустить: Название" }));
  await user.type(screen.getByRole("textbox", { name: "Причина пропуска: Название" }), "Позже");
  await user.click(screen.getByRole("button", { name: "Подтвердить пропуск" }));
  expect(generate).toBeDisabled();
  expect(copy).toBeDisabled();
  await act(async () => finishIgnore({ version: document.version }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Не удалось проверить маршрут");
  expect(screen.getByText(/Результат устарел/)).toBeVisible();
  expect(selected).toBeChecked();
  expect(generate).toBeDisabled();
  expect(copy).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Проверить снова" }));
  await waitFor(() => expect(screen.queryByText(/Результат устарел/)).not.toBeInTheDocument());
  expect(screen.queryByRole("button", { name: "Пропустить: Название" })).not.toBeInTheDocument();
});

test("a late validation response cannot overwrite the report after restoring a route", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-after-restore", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  const initial: TripValidation = { trip_id: document.id, version: 1, profile: "standard", issues: [] };
  const fresh: TripValidation = { ...initial, version: 2, issues: [{ id: "fresh", code: "missing_cover", category: "client", severity: "info", title: "Обложка восстановленной поездки", message: "Добавьте обложку.", path: "/trip/cover_photo_id" }] };
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(reimportApi, "backups").mockResolvedValue([{ id: "backup", trip_version: 1, created_at: "2026-10-01" }]);
  let finishRestore!: (value: ReimportResult) => void;
  const restore = vi.spyOn(reimportApi, "restore").mockReturnValue(new Promise(resolve => { finishRestore = resolve; }));
  let finishOldCheck!: (value: TripValidation) => void;
  const oldCheck = new Promise<TripValidation>(resolve => { finishOldCheck = resolve; });
  const validate = vi.spyOn(tripApi, "validate").mockResolvedValueOnce(initial).mockReturnValueOnce(oldCheck).mockResolvedValueOnce(fresh);
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Загрузить исправленный JSON" }));
  const dialog = screen.getByRole("dialog", { name: "Обновление маршрута" });
  await user.selectOptions(await within(dialog).findByLabelText("Резервная версия"), "backup");
  await user.click(within(dialog).getByRole("button", { name: "Восстановить прежнюю версию" }));
  await user.click(within(dialog).getByRole("button", { name: "Подтвердить восстановление" }));
  expect(restore).toHaveBeenCalledTimes(1);
  await user.click(within(dialog).getByRole("button", { name: "Закрыть" }));
  await user.click(screen.getByRole("button", { name: "Проверить снова" }));
  expect(validate).toHaveBeenCalledTimes(2);
  await act(async () => finishRestore({ trip: { ...document, version: 2 }, backup_snapshot_id: "latest-backup" }));
  expect(await screen.findByText("Обложка восстановленной поездки")).toBeVisible();
  await act(async () => finishOldCheck(initial));
  expect(screen.getByText("Обложка восстановленной поездки")).toBeVisible();
  expect(screen.queryByText(/Результат устарел/)).not.toBeInTheDocument();
});

test("validation navigation preserves an open unsaved item form", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "validation-dirty", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  const item = input.items[0];
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "issue", code: "zero_price", category: "finance", severity: "warning", title: "Цена", message: "Указана нулевая цена услуги.", path: "/trip/items/0/unit_price", item_id: item.id }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  const navigate = await screen.findByRole("button", { name: "Перейти к замечанию: Цена" });
  await user.click(screen.getByRole("button", { name: "Открыть первый пункт" }));
  const panel = await screen.findByRole("dialog");
  await user.click(within(panel).getByText("Маршрут", { selector: "strong" }));
  const title = within(panel).getByLabelText("Название события");
  await user.clear(title); await user.type(title, "Несохранённое название");
  fireEvent.click(navigate);
  expect(title).toHaveValue("Несохранённое название");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("validation focuses the transport departure picker", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  const item = newItem("train_bus", day, input.base_currency, day.date);
  input.items = [item];
  const document = { ...input, id: "validation-unavailable", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "issue", code: "missing_departure_label", category: "completeness", severity: "warning", title: "Точка отправления", message: "Не указана точка отправления.", path: "/trip/items/0/departure_label", item_id: item.id }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Перейти к замечанию: Точка отправления" }));
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect(within(dialog).getByRole("combobox", { name: "Выбрать: точка отправления" })).toHaveFocus());
  expect(within(dialog).getByText("Не указана точка отправления.")).toBeVisible();
});

test("validation explains when a reported field is unavailable in the item form", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const day = emptyDay("2026-10-01");
  input.start_date = day.date; input.end_date = day.date; input.days = [day]; input.rates = [];
  const item = { ...newItem("activity", day, input.base_currency, day.date), calculation_mode: "fixed" as const, participants_override: input.participants + 1 };
  input.items = [item];
  const calculation = calculateTrip({ ...input, items: [{ ...item, participants_override: null }] });
  const document = { ...input, id: "validation-hidden-field", version: 1, created_at: "", updated_at: "", created_by: "user", calculation } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [{ id: "issue", code: "too_many_participants", category: "finance", severity: "error", title: "Участники", message: "Участников события больше, чем участников поездки.", path: "/trip/items/0/participants_override", item_id: item.id }] });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Перейти к замечанию: Участники" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/Это поле недоступно в текущей форме события/)).toHaveTextContent("Участников события больше, чем участников поездки.");
});

test("export refuses a snapshot from a different version", async () => {
  const input = structuredClone(vectors.cases[0].input) as TripInput;
  const document = { ...input, id: "snapshot-trip", version: 1, created_at: "", updated_at: "", created_by: "user", calculation: calculateTrip(input) } as TripDocument;
  vi.spyOn(tripApi, "get").mockResolvedValue(document);
  vi.spyOn(tripApi, "validate").mockResolvedValue({ trip_id: document.id, version: 1, profile: "standard", issues: [] });
  vi.spyOn(tripApi, "exportSnapshot").mockResolvedValue({ snapshot_id: "snapshot", version: 2, trip: input });
  const user = userEvent.setup();
  render(<TripProvider><TripEditor id={document.id} /></TripProvider>);
  await user.click(await screen.findByRole("button", { name: "Проверка маршрута" }));
  await user.click(await screen.findByRole("button", { name: "Скачать актуальный JSON" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Версия маршрута изменилась");
});
