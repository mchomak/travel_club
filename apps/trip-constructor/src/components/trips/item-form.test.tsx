import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {mapsClient} from "@/lib/maps-client";
import { ItemForm } from "./item-form";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import {tripInput} from '@/lib/trips';
import type {TripDocument} from '@/lib/contracts';
import {calculateTrip} from '@/lib/pricing';
import { ValidationIssueContext } from './trip-validation-panel';

afterEach(cleanup);

test('saving an imported pending flight preserves its stored unit price and hidden fields', async () => {
  const day = emptyDay('2026-10-01');
  const item = {
    ...newItem('flight', day, 'EUR', day.date),
    title: 'Рейс из импорта', unit_price: '9123.4500', price_pending: true, included: false,
    start_time: '09:13:47', end_time: '12:32:19',
    location: 'Исходный маршрут', internal_note: 'Уточнить цену', rooms_override: 3,
    stages: [{ id: crypto.randomUUID(), title: 'Посадка', start_time: '09:20', end_time: null, notes: 'У выхода' }],
  };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [{ currency: 'EUR', rate: '96.213450' }] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('a westbound flight keeps both UTC offsets and same-day arrival through submit and reopening',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),start_time:'12:00',end_time:'10:00',departure_utc_offset_minutes:180,arrival_utc_offset_minutes:-240};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.getByLabelText('UTC при отправлении')).toHaveValue('180');
 expect(screen.getByLabelText('UTC при прибытии')).toHaveValue('-240');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({end_day_id:null,start_time:'12:00',end_time:'10:00',departure_utc_offset_minutes:180,arrival_utc_offset_minutes:-240}),undefined);
 const saved=onSubmit.mock.calls[0][0],calculation=calculateTrip({...trip,items:[saved]});
 const doc={...trip,id:crypto.randomUUID(),version:1,created_by:crypto.randomUUID(),created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',items:[{...saved,...calculation.items[0]}],calculation} as TripDocument;
 expect(tripInput(doc).items[0]).toMatchObject({departure_utc_offset_minutes:180,arrival_utc_offset_minutes:-240});
});

test.each([
  ['equal local endpoints without an explicit end day', '10:30', '10:30', null],
  ['positive UTC interval shorter than one minute', '10:30:15', '10:30:30', 180],
  ['fractional seconds returned by the API', '10:30:15.000001', '10:30:15.000002', 180],
] as const)('existing flight preserves %s', async (_label, start_time, end_time, offset) => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('flight', day, 'RUB', day.date), start_time, end_time,
    departure_utc_offset_minutes: offset, arrival_utc_offset_minutes: offset };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('an existing flight retains an API-supported hotel mode, Unicode limits and an imported stage title', async () => {
  const day = emptyDay('2026-10-01'), next = emptyDay('2026-10-02');
  const item = {
    ...newItem('flight', day, 'RUB', day.date), calculation_mode: 'hotel' as const,
    check_in: day.date, check_out: next.date, capacity: 2,
    title: 'a'.repeat(199) + '📍', internal_note: 'b'.repeat(9999) + '📍',
    stages: [{ id: crypto.randomUUID(), title: ' ', start_time: null, end_time: null, notes: '' }],
  };
  const trip = { ...newTrip(), start_date: day.date, end_date: next.date, days: [day, next], items: [item], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
  await userEvent.click(screen.getByText('Пересадки и этапы перелёта', { selector: 'summary span' }));
  await userEvent.type(screen.getByLabelText('Название этапа 1'), ' ');
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Укажите название этапа')).toBeVisible();
});

test('untouched new names are numbered and a pending taxi requires an explicit price including zero',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const old={...newItem('transfer',day,'RUB',day.date),subtype:'taxi' as const,title:'Такси 4'};
 const item={...old,id:crypto.randomUUID(),title:'Такси',price_pending:true,included:false};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[old],rates:[]};
 const view=render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.getByLabelText('Название элемента')).toHaveValue('Такси 5');
 expect(screen.getByLabelText('Цена машины')).toHaveValue('');
 expect(screen.getByText('Стоимость не указана')).toBeVisible();
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({price_pending:true,included:false,unit_price:'0',title:'Такси 5'}),undefined);
 await user.type(screen.getByLabelText('Цена машины'),'0');
 expect(screen.queryByText('Стоимость не указана')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({price_pending:false,included:true,unit_price:'0'}),undefined);
 view.unmount();
});

test('flight country and custom city choices survive submit and editable document conversion with independent airport data',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const airport={name:'Аэропорт',address:'Terminal',latitude:1,longitude:2,provider:'manual' as const};
 const item={...newItem('flight',day,'RUB',day.date),location:'Старый маршрут',map_place:airport,arrival_country_code:'JP',arrival_city:'Токио'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 const view=render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — страна'}),{target:{value:'Россия'}});
 fireEvent.click(screen.getByRole('option',{name:/Россия.*RU/}));
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — город'}),{target:{value:'Мой город'}});
 fireEvent.click(screen.getByRole('option',{name:/Использовать «Мой город»/}));
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({departure_country_code:'RU',departure_city:'Мой город',arrival_country_code:'JP',arrival_city:'Токио',map_place:airport,location:'Старый маршрут'}),undefined);
 const saved=onSubmit.mock.calls[0][0];
 const calculation=calculateTrip({...trip,items:[saved]});
 const document:TripDocument={...trip,id:crypto.randomUUID(),version:1,created_by:crypto.randomUUID(),created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',items:[{...saved,...calculation.items[0]}],calculation};
 const converted=tripInput(document);
 expect(converted.items[0]).toEqual(expect.objectContaining({departure_city:'Мой город',arrival_city:'Токио',departure_country_code:'RU'}));
 view.rerender(<ItemForm key="reopened-geography" initial={converted.items[0]} trip={converted} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.getByRole('combobox',{name:'Вылет — город'})).toHaveValue('Мой город');
 expect(screen.getByRole('combobox',{name:'Прилёт — страна'})).toHaveValue('Япония');
});

test('flight history fills the structured place fields while the legacy route stays hidden and preserved',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),location:'Старый маршрут'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 const flightHistory=[{countryCode:'RU',city:'Москва'}];
 render(<ItemForm initial={item} trip={trip} flightHistory={flightHistory} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.queryByLabelText('Маршрут / аэропорты')).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole('combobox',{name:'Вылет — город'}));
 fireEvent.click(screen.getByRole('option',{name:/Москва.*Из других перелётов/}));
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
  departure_country_code:'RU',departure_city:'Москва',location:'Старый маршрут',
 }),undefined);
});

test('custom transport endpoints and manually typed names survive subtype changes and submission',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const item=newItem('transfer',day,'RUB',day.date),trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 const view=render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.clear(screen.getByLabelText('Название элемента'));
 await user.type(screen.getByLabelText('Название элемента'),'Дорога к друзьям');
 await user.selectOptions(screen.getByRole('combobox',{name:'Подвид'}),'car');
 for(const [label,value] of [['Откуда','У вокзала'],['Куда','Дом друзей']]){
  fireEvent.change(screen.getByRole('combobox',{name:label}),{target:{value}});
  fireEvent.click(screen.getByRole('option',{name:new RegExp(`Использовать «${value}»`)}));
 }
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({title:'Дорога к друзьям',subtype:'car',departure_label:'У вокзала',arrival_label:'Дом друзей',map_place:null,map_end_place:null}),undefined);
 const saved=onSubmit.mock.calls[0][0];
 view.rerender(<ItemForm key="saved-transport" initial={saved} trip={{...trip,items:[saved]}} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.selectOptions(screen.getByRole('combobox',{name:'Подвид'}),'taxi');
 expect(screen.getByLabelText('Название элемента')).toHaveValue('Дорога к друзьям');
 expect(screen.getByRole('combobox',{name:'Откуда'})).toHaveValue('У вокзала');
 expect(screen.getByRole('combobox',{name:'Куда'})).toHaveValue('Дом друзей');
});

test('inline place editing saves departure and arrival without changing legacy fields', async () => {
 const day=emptyDay('2026-10-01'),next=emptyDay('2026-10-02');
 const item={...newItem('activity',day,'RUB',day.date),end_day_id:next.id,location:'Legacy address',external_url:'https://example.com'};
 const trip={...newTrip(),start_date:day.date,end_date:next.date,days:[day,next],items:[],rates:[]};
 const onSubmit=vi.fn(),user=userEvent.setup();
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 const departure=screen.getByRole('group',{name:'Место посещения / отправления'});
 const {within}=await import('@testing-library/react');
 const resolve=vi.spyOn(mapsClient,'resolveLink').mockResolvedValueOnce({place:{name:'Начало',address:'First address',latitude:55.75,longitude:37.61,provider:'google_link'},query:null}).mockResolvedValueOnce({place:{name:'Конец',address:'Last address',latitude:59.93,longitude:30.31,provider:'google_link'},query:null});
 fireEvent.change(within(departure).getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=55.75,37.61'}});
 await user.click(await within(departure).findByRole('option',{name:/Начало/}));
 const arrival=screen.getByRole('group',{name:'Место окончания / прибытия'});
 fireEvent.change(within(arrival).getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=59.93,30.31'}});
 await user.click(await within(arrival).findByRole('option',{name:/Конец/}));
 resolve.mockRestore();
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({map_place:expect.objectContaining({latitude:55.75,longitude:37.61}),map_end_place:expect.objectContaining({latitude:59.93}),location:'Legacy address',external_url:'https://example.com'}),undefined);
});

test("flight form saves and restores custom airport durations, including a hidden block", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const item = { ...newItem("flight", day, "RUB", day.date), start_time: "09:00", end_time: "11:00" };
  const view = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText("Время в аэропорту", { selector: "summary span" }));
  await user.click(screen.getByText("Своё значение до вылета"));
  await user.click(screen.getByText("Своё значение после прилёта"));
  expect(screen.getByLabelText("До вылета в аэропорту, минут")).toHaveValue(180);
  expect(screen.getByLabelText("После прилёта в аэропорту, минут")).toHaveValue(60);
  await user.clear(screen.getByLabelText("До вылета в аэропорту, минут"));
  await user.type(screen.getByLabelText("До вылета в аэропорту, минут"), "0");
  await user.clear(screen.getByLabelText("После прилёта в аэропорту, минут"));
  await user.type(screen.getByLabelText("После прилёта в аэропорту, минут"), "120");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ airport_before_minutes: 0, airport_after_minutes: 120 }), undefined);
  const saved = onSubmit.mock.calls[0][0];
  view.rerender(<ItemForm key="reopened-flight" initial={saved} trip={{ ...trip, items: [saved] }} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByLabelText("До вылета в аэропорту, минут")).toHaveValue(0);
  expect(screen.getByLabelText("После прилёта в аэропорту, минут")).toHaveValue(120);
});

test("invalid post-arrival duration marks the post-arrival field", async () => {
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const { container } = render(<ItemForm initial={newItem("flight", day, "RUB", day.date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  const before = screen.getByLabelText("До вылета в аэропорту, минут");
  const after = screen.getByLabelText("После прилёта в аэропорту, минут");
  fireEvent.change(after, { target: { value: "1441" } });
  fireEvent.submit(container.querySelector("form")!);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(before).toHaveAttribute("aria-invalid", "false");
  await waitFor(() => expect(after).toHaveAttribute("aria-invalid", "true"));
  expect(screen.getByRole("alert")).toHaveTextContent("от 0 до 1440");
});

test("transport subtype is saved and shown again when the item is reopened", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const item = newItem("transfer", day, "RUB", day.date);
  const { rerender } = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Подвид" }), "train");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "transfer", subtype: "train" }), undefined);
  const saved = onSubmit.mock.calls[0][0];
  rerender(<ItemForm key={saved.id + "-reopen"} initial={saved} trip={{ ...trip, items: [saved] }} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByRole("combobox", { name: "Подвид" })).toHaveValue("train");
});

test("invalid end time stays editable and blocks saving", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const item = { ...newItem("flight", days[0], "RUB", days[0].date), start_time: "18:00", end_time: "21:00" };
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.selectOptions(screen.getByLabelText("Дата прилёта"), days[0].id);
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "17:00");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));

  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Окончание должно быть позже начала")).toBeInTheDocument();
  expect(screen.getByLabelText("Прилёт по местному времени")).toHaveValue("17:00");

  await user.selectOptions(screen.getByLabelText("Дата прилёта"), days[1].id);
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  expect(screen.getByLabelText("Дата прилёта")).toHaveValue(days[1].id);
  await user.selectOptions(screen.getByLabelText("Дата прилёта"), days[2].id);
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "06:00");
  expect(screen.getByLabelText("Дата прилёта")).toHaveValue(days[2].id);
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  expect(screen.getByLabelText("Дата прилёта")).toHaveValue("");
  expect(screen.getByText(/2 октября.*за пределами поездки/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: null, check_out_time: null }), undefined);

  onSubmit.mockClear();
  await user.click(screen.getByRole("button", { name: "Подставить рекомендуемые часы" }));
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in_time: "15:00", check_out_time: "11:00" }), undefined);
});

test("external link requires http or https and opens safely", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = newItem("flight", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  await user.click(screen.getByText("Ссылки и бронирование", { selector: "summary span" }));
  const airlineLink = "Сайт авиакомпании или информация о рейсе";
  const linkEditor = within(screen.getByLabelText(airlineLink).closest("details")!);
  expect(screen.getByLabelText(airlineLink)).not.toBeVisible();
  await user.click(screen.getByText("Добавить сайт или информацию о рейсе"));
  expect(screen.getByLabelText(airlineLink)).toHaveFocus();
  await user.type(screen.getByLabelText(airlineLink), "javascript:alert(1)");
  expect(screen.queryByRole("link", { name: `Открыть ссылку «${airlineLink}»` })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Введите полную ссылку http:// или https:// с адресом сайта")).toBeInTheDocument();

  await user.clear(screen.getByLabelText(airlineLink));
  await user.type(screen.getByLabelText(airlineLink), "https://example.com/ticket");
  await user.click(linkEditor.getByRole("button", { name: "Готово" }));
  expect(screen.getByLabelText(airlineLink)).not.toBeVisible();
  expect(screen.getByText("example.com")).toBeVisible();
  const link = screen.getByRole("link", { name: `Открыть ссылку «${airlineLink}»` });
  expect(link).toHaveAttribute("href", "https://example.com/ticket");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noopener noreferrer");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ external_url: "https://example.com/ticket" }), undefined);

  onSubmit.mockClear();
  await user.click(screen.getByText("Изменить", { selector: "summary" }));
  await user.clear(screen.getByLabelText(airlineLink));
  await user.type(screen.getByLabelText(airlineLink), "https://example.com/new-ticket");
  await user.click(linkEditor.getByRole("button", { name: "Готово" }));
  expect(screen.getByRole("link", { name: `Открыть ссылку «${airlineLink}»` })).toHaveAttribute("href", "https://example.com/new-ticket");
  await user.click(screen.getByRole("button", { name: `Удалить ссылку «${airlineLink}»` }));
  expect(screen.getByText("Добавить сайт или информацию о рейсе")).toHaveFocus();
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  await user.clear(screen.getByLabelText("Название перелёта"));
  await user.type(screen.getByLabelText("Название перелёта"), "Ночной перелёт");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));

  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Ночной перелёт", day_id: day.id, end_day_id: null, start_time: "22:00", end_time: "02:00" }), undefined);

  onSubmit.mockClear();
  await user.clear(screen.getByLabelText("Прилёт по местному времени"));
  await user.type(screen.getByLabelText("Прилёт по местному времени"), "03:00");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  expect(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ })).toBeDisabled();
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "flight");
  expect(screen.getByLabelText("Название перелёта")).toBeEnabled();
  expect(screen.getByLabelText("Название перелёта")).toHaveFocus();
  expect(screen.getByLabelText(/Вылет.*местному времени/)).toHaveValue("09:15");
  expect(screen.getByLabelText(/Прилёт.*местному времени/)).toHaveValue("10:45");
  expect(screen.getByRole("combobox", { name: "Правило расчёта" })).toHaveValue("per_person");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "flight", title: "Перелёт 1", start_time: "09:15", end_time: "10:45" }), undefined);
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
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    type: "hotel", start_time: null, end_time: null, end_day_id: null,
    check_in: "2026-10-01", check_out: "2026-10-02",
  }), undefined);
});

test("grid creation restores its selected interval after switching away from hotel", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02"), emptyDay("2026-10-03")];
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[2].date, days, items: [], rates: [] };
  const item = { ...newItem("other", days[0], "RUB", days[0].date), start_time: "23:15", end_time: "01:45", end_day_id: days[2].id };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} requireTypeChoice onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "hotel");
  await user.selectOptions(screen.getByRole("combobox", { name: "Тип события" }), "flight");
  expect(screen.getByLabelText("Вылет по местному времени")).toHaveValue("23:15");
  expect(screen.getByLabelText("Прилёт по местному времени")).toHaveValue("01:45");
  expect(screen.getByLabelText("Дата прилёта")).toHaveValue(days[2].id);
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
    type: "flight", start_time: "23:15", end_time: "01:45", end_day_id: days[2].id,
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
  const notes = within(screen.getByRole("group", { name: "Описание и заметки" }));
  expect(notes.getByLabelText("Описание события")).toBeVisible();
  expect(notes.getByLabelText("Важная информация для клиента")).toBeVisible();
  expect(notes.getByLabelText("Внутренняя заметка")).toBeVisible();
  expect(notes.getByLabelText("Внутренняя заметка")).toHaveAccessibleDescription("Только команда");
});

test("changing hotel check-in moves its itinerary day", async () => {
  const user = userEvent.setup();
  const days = [emptyDay("2026-10-01"), emptyDay("2026-10-02")];
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={newItem("hotel", days[0], "RUB", days[0].date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  fireEvent.change(screen.getByLabelText("Заезд — дата"), { target: { value: days[1].date } });
  fireEvent.change(screen.getByLabelText("Выезд — дата"), { target: { value: "2026-10-03" } });
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
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
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText("Режим «Номер за ночь» доступен только для проживания. Выберите другое правило расчёта.")).toBeInTheDocument();
  await user.selectOptions(screen.getByRole("combobox", { name: "Правило расчёта" }), "per_person");
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ calculation_mode: "per_person" }), undefined);
});


test("client link sharing requires an explicit choice", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const item = newItem("flight", day, "RUB", day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const { unmount } = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText("Ссылки и бронирование", { selector: "summary span" }));
  const share = screen.getByRole("checkbox", { name: "Показывать клиенту" });
  expect(share).not.toBeChecked();
  await user.click(screen.getByText("Добавить сайт или информацию о рейсе"));
  await user.type(screen.getByLabelText("Сайт авиакомпании или информация о рейсе"), "https://example.com/ticket");
  await user.click(share);
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ publish_external_url: true }), undefined);

  unmount();
  onSubmit.mockClear();
  render(<ItemForm initial={{ ...item, external_url: "https://example.com/ticket", publish_external_url: true }} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText("Ссылки и бронирование", { selector: "summary span" }));
  const reopened = screen.getByRole("checkbox", { name: "Показывать клиенту" });
  expect(reopened).toBeChecked();
  await user.click(reopened);
  await user.click(screen.getByRole("button", { name: /Сохранить (элемент|перелёт)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ publish_external_url: false }), undefined);
});

test('event stages can be added and saved within an excursion', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const trip={...newTrip(), start_date:day.date, end_date:day.date, days:[day], items:[], rates:[]};
 render(<ItemForm initial={newItem('excursion',day,'RUB',day.date)} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByRole('button',{name:'Добавить этап'}));
 await user.type(screen.getByLabelText('Название этапа 1'), 'Остров');
 await user.click(screen.getByRole('button',{name:'Сохранить экскурсию'}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({stages:[expect.objectContaining({title:'Остров'})]}),undefined);
});

test('choosing excursion under activities opens its editor and saves the activity subtype', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const item = newItem('activity', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByRole('combobox', { name: 'Подвид' }), 'excursion');
  expect(screen.getByRole('group', { name: 'Сводка экскурсии' })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Добавить этап' }));
  await user.type(screen.getByLabelText('Название этапа 1'), 'Остров');
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'activity', subtype: 'excursion', stages: [expect.objectContaining({ title: 'Остров' })] }), undefined);
});

test('opening and saving a legacy excursion does not change its type', async () => {
  const day = emptyDay('2026-10-01'), onSubmit = vi.fn();
  const item = newItem('excursion', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('excursion program collapses stages, duplicates and reorders without losing data', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const first = { id: crypto.randomUUID(), title: 'Пристань', start_time: '09:00', end_time: '10:00', notes: 'Встреча' };
  const second = { id: crypto.randomUUID(), title: 'Остров', start_time: '09:30', end_time: '11:00', notes: '' };
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [first, second] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByText('Пристань')).toBeVisible();
  expect(screen.getByLabelText('Название этапа 1')).not.toBeVisible();
  expect(screen.getAllByText(/пересека/iu)[0]).toBeVisible();
  await user.click(screen.getByText('Пристань'));
  await user.click(screen.getByRole('button', { name: 'Дублировать этап 1' }));
  await user.click(screen.getByRole('button', { name: 'Опустить этап 2' }));
  await user.click(screen.getByRole('button', { name: 'Удалить этап 3' }));
  await user.click(screen.getByRole('button', { name: 'Подтвердить удаление' }));
  await user.click(screen.getByRole('button', { name: /Сохранить (элемент|экскурсию)/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [first, second] }), undefined);
});

test('overnight excursion does not claim stage clocks are in the wrong order', () => {
  const day = emptyDay('2026-10-01'), next = emptyDay('2026-10-02');
  const item = { ...newItem('excursion', day, 'RUB', day.date), end_day_id: next.id, start_time: '22:00', end_time: '02:00', stages: [
    { id: crypto.randomUUID(), title: 'Ночью', start_time: '23:00', end_time: '01:00', notes: '' },
    { id: crypto.randomUUID(), title: 'Утром', start_time: '01:00', end_time: '02:00', notes: '' },
  ] };
  const trip = { ...newTrip(), start_date: day.date, end_date: next.date, days: [day, next], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={() => {}} onCancel={() => {}} />);
  expect(screen.queryByText(/этапов пересекается|раньше предыдущего|не позже начала/i)).not.toBeInTheDocument();
});

test('validator opens a collapsed excursion stage and focuses its field', async () => {
  const day = emptyDay('2026-10-01'), stage = { id: crypto.randomUUID(), title: 'Причал', start_time: '09:00', end_time: '10:00', notes: '' };
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [stage] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const issue = { id: 'issue', code: 'stage_overlap', category: 'schedule', severity: 'warning', title: 'Время', message: 'Проверьте время', path: '/trip/items/0/stages/0/start_time' };
  render(<ValidationIssueContext issue={issue} location={{ section: 'stages', stageId: stage.id, field: 'stages.0.start_time' }} stale={false}><ItemForm initial={item} trip={trip} onSubmit={() => {}} onCancel={() => {}} /></ValidationIssueContext>);
  await waitFor(() => expect(screen.getByLabelText('Начало этапа 1')).toHaveFocus());
  expect(screen.getByText('Проверьте время')).toBeVisible();
});

test('excursion stages can all be expanded and collapsed without losing edits', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const stage = (title: string) => ({ id: crypto.randomUUID(), title, start_time: null, end_time: null, notes: '' });
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [stage('Причал'), stage('Остров')] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Раскрыть все этапы' }));
  expect(screen.getByLabelText('Название этапа 1')).toBeVisible();
  expect(screen.getByLabelText('Название этапа 2')).toBeVisible();
  await user.type(screen.getByLabelText('Описание этапа 1'), 'Встреча');
  await user.click(screen.getByRole('button', { name: 'Свернуть все этапы' }));
  expect(screen.getByLabelText('Название этапа 1')).not.toBeVisible();
  expect(screen.getByLabelText('Название этапа 2')).not.toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [expect.objectContaining({ notes: 'Встреча' }), item.stages[1]] }), undefined);
});

test('excursion warns when a stage falls outside the event and opens it from the warning', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup();
  const stage = { id: crypto.randomUUID(), title: 'Причал', start_time: '08:30', end_time: '10:30', notes: '' };
  const item = { ...newItem('excursion', day, 'RUB', day.date), start_time: '09:00', end_time: '10:00', stages: [stage] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={() => {}} onCancel={() => {}} />);
  await user.click(screen.getByText('За пределами времени экскурсии'));
  expect(screen.getByLabelText('Начало этапа 1')).toBeVisible();
});

test('expanding all keeps newly added stages open', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup();
  const item = newItem('excursion', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={() => {}} onCancel={() => {}} />);
  await user.click(screen.getByRole('button', { name: 'Добавить этап' }));
  await user.type(screen.getByLabelText('Название этапа 1'), 'Причал');
  await user.click(screen.getByRole('button', { name: 'Добавить этап' }));
  expect(screen.getByLabelText('Название этапа 1')).toBeVisible();
  expect(screen.getByLabelText('Название этапа 2')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Раскрыть все этапы' }));
  expect(screen.getByLabelText('Название этапа 1')).toBeVisible();
  expect(screen.getByLabelText('Название этапа 2')).toBeVisible();
});

test('stage time accepts minutes and retains an imported seconds value until edited', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const stage = { id: crypto.randomUUID(), title: 'Причал', start_time: '09:00:15', end_time: '10:00', notes: '' };
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [stage] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText('Причал'));
  const start = screen.getByLabelText('Начало этапа 1');
  expect(start).toHaveValue('09:00:15');
  await user.type(screen.getByLabelText('Описание этапа 1'), 'Заметка');
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [{ ...stage, notes: 'Заметка' }] }), undefined);
  fireEvent.change(start, { target: { value: '09:00:30' } });
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Укажите время в формате ЧЧ:ММ.')).toBeVisible();
});

test('excursion stage location fields survive editing and saving', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const stage = { id: crypto.randomUUID(), title: 'Причал', start_time: '09:00', end_time: '10:00', notes: 'Встреча', location: 'Марина', address: 'Улица 1', map_url: 'https://example.com/map' };
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [stage] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText('Причал'));
  await user.clear(screen.getByLabelText('Описание этапа 1'));
  await user.type(screen.getByLabelText('Описание этапа 1'), 'Новая заметка');
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [{ ...stage, notes: 'Новая заметка' }] }), undefined);
});

test('editing an old stage preserves its explicit empty map link', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const stage = { id: crypto.randomUUID(), title: 'Причал', start_time: '09:00', end_time: '10:00', notes: '', map_url: null };
  const item = { ...newItem('excursion', day, 'RUB', day.date), stages: [stage] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByText('Причал'));
  await user.type(screen.getByLabelText('Описание этапа 1'), 'Новая заметка');
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [{ ...stage, notes: 'Новая заметка' }] }), undefined);
});

test('excursion selects existing trip places for meeting and ending and preserves them on reopening', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const meeting = { name: 'Причал', address: 'Набережная', latitude: 10, longitude: 20, provider: 'manual' as const };
  const ending = { name: 'Музей', address: 'Площадь', latitude: 11, longitude: 21, provider: 'manual' as const };
  const first = { ...newItem('activity', day, 'RUB', day.date), title: 'Прогулка', map_place: meeting };
  const second = { ...newItem('activity', day, 'RUB', day.date), title: 'Осмотр музея', map_place: ending };
  const item = { ...newItem('excursion', day, 'RUB', day.date), location: 'Старое место' };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [first, second, item], rates: [] };
  const view = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.click(screen.getByRole('combobox', { name: 'Место встречи' }));
  await user.click(screen.getByRole('option', { name: /Прогулка.*Причал/ }));
  await user.click(screen.getByRole('combobox', { name: 'Место окончания' }));
  await user.click(screen.getByRole('option', { name: /Осмотр музея.*Музей/ }));
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ location: 'Причал', map_place: meeting, map_end_place: ending }), undefined);
  const saved = onSubmit.mock.calls[0][0];
  view.rerender(<ItemForm key="reopened-excursion" initial={saved} trip={{ ...trip, items: [first, second, saved] }} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByRole('combobox', { name: 'Место встречи' })).toHaveValue('Причал');
  expect(screen.getByRole('combobox', { name: 'Место окончания' })).toHaveValue('Музей');
});

test('typing a meeting place saves it without requiring an option selection', async () => {
  const day = emptyDay('2026-10-01'), user = userEvent.setup(), onSubmit = vi.fn();
  const item = newItem('excursion', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.type(screen.getByRole('combobox', { name: 'Место встречи' }), 'У маяка');
  await user.click(screen.getByRole('button', { name: 'Сохранить экскурсию' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ location: 'У маяка', map_place: null }), undefined);
});

test("flight stages describe a single booking and keep their values and order on submit", async () => {
  const day = emptyDay("2026-10-01"), user = userEvent.setup(), onSubmit = vi.fn();
  const first = { id: crypto.randomUUID(), title: "Посадка", start_time: "07:15", end_time: "07:40", notes: "Через выход 5" };
  const second = { id: crypto.randomUUID(), title: "Пересадка", start_time: "10:00", end_time: null, notes: "" };
  const item = { ...newItem("flight", day, "RUB", day.date), unit_price: "8000", stages: [first, second] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  const summary = screen.getByText("Пересадки и этапы перелёта", { selector: "summary span" }).closest("summary")!;
  expect(summary).toHaveTextContent("Этапов: 2 · Посадка, Пересадка");
  await user.click(summary);
  expect(screen.getByText(/Самостоятельные бронирования добавляйте отдельными событиями/)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Добавить этап" }));
  await user.type(screen.getByLabelText("Название этапа 3"), "Получение багажа");
  await user.click(screen.getByRole("button", { name: "Поднять этап 3" }));
  await user.click(screen.getByRole("button", { name: "Поднять этап 2" }));
  await user.click(screen.getByRole("button", { name: "Удалить этап 3" }));
  const notes = screen.getByLabelText("Описание этапа 2");
  await user.clear(notes);
  await user.type(notes, "Новый выход 8");
  expect(summary).toHaveTextContent("Этапов: 2 · Получение багажа, Посадка");
  await user.click(screen.getByRole("button", { name: "Сохранить перелёт" }));
  expect(onSubmit).toHaveBeenCalledWith({ ...item, stages: [
    { id: expect.any(String), title: "Получение багажа", start_time: null, end_time: null, notes: "" },
    { ...first, notes: "Новый выход 8" },
  ] }, undefined);
});

test('typed links survive form submission and editable document conversion', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const trip={...newTrip(), start_date:day.date, end_date:day.date, days:[day], items:[], rates:[]};
 render(<ItemForm initial={newItem('excursion',day,'RUB',day.date)} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Ссылки и бронирование', { selector: 'summary span' }));
 await user.click(screen.getByText('Добавить ссылку на карту'));
 await user.type(screen.getByLabelText('Ссылка на карту'), 'https://example.com/map');
 await user.click(screen.getByText('Добавить ссылку на бронирование или оплату'));
 await user.type(screen.getByLabelText('Ссылка на бронирование или оплату'), 'https://example.com/book');
 await user.click(screen.getByRole('button',{name:'Сохранить экскурсию'}));
 const saved=onSubmit.mock.calls[0][0];
 expect(saved).toMatchObject({map_url:'https://example.com/map',booking_url:'https://example.com/book'});
 const doc={...trip,items:[saved]} as unknown as TripDocument;
 expect(tripInput(doc).items[0]).toMatchObject({map_url:saved.map_url,booking_url:saved.booking_url});
});

test("the flight map link can explicitly reuse a route point without changing either route point", async () => {
  const day = emptyDay("2026-10-01"), user = userEvent.setup(), onSubmit = vi.fn();
  const map_place = { name: "Пулково", address: "", latitude: 59.8, longitude: 30.3, provider: "google_link" as const, source_url: "https://maps.google.com/?q=Pulkovo" };
  const map_end_place = { name: "Внуково", address: "", latitude: 55.6, longitude: 37.3, provider: "google_link" as const, source_url: "https://maps.google.com/?q=Vnukovo" };
  const item = { ...newItem("flight", day, "RUB", day.date), map_url: null, map_place, map_end_place };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);

  const save = screen.getByRole("button", { name: "Сохранить перелёт" });
  await user.click(save);
  expect(onSubmit).toHaveBeenLastCalledWith(item, undefined);

  await user.click(screen.getByText("Ссылки и бронирование", { selector: "summary span" }));
  await user.click(screen.getByText("Добавить ссылку на карту"));
  await user.click(screen.getByRole("button", { name: "Использовать ссылку места прибытия" }));
  expect(screen.getByLabelText("Карта")).toHaveValue(map_end_place.source_url);
  expect(screen.getAllByRole("link", { name: "Открыть ссылку «Карта»" })).toHaveLength(1);
  expect(screen.getAllByRole("checkbox", { name: "Показывать клиенту" })).toHaveLength(1);
  await user.click(screen.getByRole("checkbox", { name: "Показывать клиенту" }));
  await user.click(save);
  expect(onSubmit).toHaveBeenLastCalledWith({ ...item, map_url: map_end_place.source_url, publish_external_url: true }, undefined);

  await user.click(screen.getByRole("button", { name: "Удалить ссылку «Карта»" }));
  await user.click(save);
  expect(onSubmit).toHaveBeenLastCalledWith({ ...item, map_url: null, publish_external_url: true }, undefined);
});

test('flight editor groups secondary details without changing saved hidden values', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),title:'Рейс',description:'Описание',client_note:'Условия перелёта',internal_note:'Заметка',map_url:'https://example.com/map',airport_before_minutes:125};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.getByText('Маршрут и расписание')).toBeVisible();
 expect(screen.getByText('Стоимость', {selector:'summary span'}).closest('details')).not.toHaveAttribute('open');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(item, undefined);
 await user.click(screen.getByText('Описание и заметки', { selector: 'summary span' }));
 const notes = within(screen.getByRole('group', { name: 'Описание и заметки' }));
 expect(notes.getByLabelText('Описание события')).toHaveValue('Описание');
 expect(notes.getByLabelText('Важная информация для клиента')).toHaveValue('Условия перелёта');
 const internalNote = notes.getByLabelText('Внутренняя заметка');
 expect(internalNote).toHaveAccessibleDescription('Только команда');
 await user.clear(internalNote);
 await user.type(internalNote, 'Служебные условия');
 await user.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
 expect(onSubmit).toHaveBeenLastCalledWith({ ...item, internal_note: 'Служебные условия' }, undefined);
});

test('the flight editor puts the expanded itinerary first and preserves changes across disclosures', async () => {
  const day = emptyDay('2026-10-01');
  const item = newItem('flight', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const onSubmit = vi.fn();
  const { container } = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  const sections = [...container.querySelectorAll<HTMLElement>('[data-editor-section]')];
  expect(sections.map(section => section.dataset.editorSection)).toEqual(['route', 'cost', 'airport', 'links', 'notes', 'stages']);
  expect(within(sections[0]).getByLabelText('Дата вылета')).toBeVisible();
  expect(within(sections[0]).getByLabelText('Дата прилёта')).toBeVisible();
  expect(sections.at(-1)).not.toHaveAttribute('open');
  expect(sections.at(-1)).toHaveTextContent('Нет этапов');
  expect(screen.getByLabelText('Место вылета')).toBeVisible();
  expect(screen.getByLabelText('Цена билета')).not.toBeVisible();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Место вылета'), 'Терминал B');
  await user.click(within(sections[0]).getByText('Маршрут и расписание'));
  expect(screen.getByLabelText('Место вылета')).not.toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
  expect(onSubmit).toHaveBeenCalledWith({ ...item, departure_label: 'Терминал B' }, undefined);
});

test('airport presets show local interval across midnight and preserve the selected minutes', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),start_time:'01:00',end_time:'05:00'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Время в аэропорту',{selector:'summary span'}));
 await user.click(screen.getByRole('button',{name:'До вылета: 120 минут'}));
 expect(screen.getByText(/30 сентября.*23:00/)).toBeVisible();
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({airport_before_minutes:120}),undefined);
});

test('flight endpoint labels can be edited independently of map points', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const point={name:'Точка на карте',address:'Terminal',latitude:1,longitude:2,provider:'manual' as const};
 const item={...newItem('flight',day,'RUB',day.date),map_place:point,departure_label:'Старый терминал',arrival_label:'Зал прилёта'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.clear(screen.getByLabelText('Место вылета'));
 await user.type(screen.getByLabelText('Место вылета'),'Новый терминал');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({departure_label:'Новый терминал',arrival_label:'Зал прилёта',map_place:point}),undefined);
});

test('saving an unchanged legacy overnight flight preserves its missing end day', async () => {
 const day=emptyDay('2026-10-01'), next=emptyDay('2026-10-02'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),start_time:'23:00',end_time:'01:00',end_day_id:null};
 const trip={...newTrip(),start_date:day.date,end_date:next.date,days:[day,next],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({end_day_id:null,start_time:'23:00',end_time:'01:00'}),undefined);
});

test('entering a price after marking a known flight price pending saves the entered value', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),unit_price:'100',price_pending:false,included:true};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Стоимость', {selector:'summary span'}));
 await user.selectOptions(screen.getByLabelText('Статус стоимости'),'pending');
 await user.clear(screen.getByLabelText('Цена билета'));
 await user.type(screen.getByLabelText('Цена билета'),'250');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({unit_price:'250',price_pending:false,included:true}),undefined);
});

test.each([true, false])('toggling unknown price off restores the previous inclusion state (%s)', async (included) => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),unit_price:'100',price_pending:false,included};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Стоимость', {selector:'summary span'}));
 await user.selectOptions(screen.getByLabelText('Статус стоимости'),'pending');
 await user.selectOptions(screen.getByLabelText('Статус стоимости'),'known');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({unit_price:'100',price_pending:false,included}),undefined);
});

test('flight duration requires both UTC offsets and calculates actual elapsed time', async () => {
 const day=emptyDay('2026-10-01'), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),start_time:'12:00',end_time:'10:00',departure_utc_offset_minutes:180,arrival_utc_offset_minutes:-240};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 const summary=within(screen.getByRole('group',{name:'Сводка перелёта'}));
 expect(summary.getByText(/5 ч 0 мин/)).toBeVisible();
 await user.click(screen.getByText('Часовые пояса'));
 await user.selectOptions(screen.getByLabelText('UTC при прибытии'),'');
 expect(screen.queryByText(/5 ч 0 мин/)).not.toBeInTheDocument();
 expect(screen.getByText(/Укажите оба смещения UTC для расчёта длительности/)).toBeVisible();
});

test('airport presets include half-hour choices and flag an interval beyond trip dates', async () => {
 const day=emptyDay('2026-10-01'), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),start_time:'01:00',end_time:'05:00'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Время в аэропорту',{selector:'summary span'}));
 await user.click(screen.getByRole('button',{name:'До вылета: 90 минут'}));
 expect(screen.getByText(/30 сентября.*23:30/)).toBeVisible();
 expect(screen.getByText(/за пределами дат поездки/)).toBeVisible();
});

test('entering a price after marking an excluded flight pending keeps it excluded', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),unit_price:'100',price_pending:false,included:false};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Стоимость', {selector:'summary span'}));
 await user.selectOptions(screen.getByLabelText('Статус стоимости'),'pending');
 await user.clear(screen.getByLabelText('Цена билета'));
 await user.type(screen.getByLabelText('Цена билета'),'250');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({unit_price:'250',price_pending:false,included:false}),undefined);
});

test('editing a resolved pending price does not undo a manual exclusion', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),unit_price:'0',price_pending:true,included:false};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Стоимость', {selector:'summary span'}));
 const price=screen.getByLabelText('Цена билета');
 await user.type(price,'100');
 await user.click(screen.getByLabelText('Учитывать в стоимости поездки'));
 await user.type(price,'0');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({unit_price:'1000',price_pending:false,included:false}),undefined);
});

test('switching from flight to transport and back preserves flight fields and notes', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),departure_country_code:'RU',departure_city:'Москва',arrival_country_code:'JP',arrival_city:'Токио',departure_label:'Шереметьево',start_time:'10:00',end_time:'12:00',internal_note:'Сохранить'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.selectOptions(screen.getByLabelText('Тип события'),'transfer');
 await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Изменить тип'}));
 await user.selectOptions(screen.getByLabelText('Тип события'),'flight');
 expect(screen.getByLabelText('Место вылета')).toHaveValue('Шереметьево');
 expect(screen.getByRole('combobox',{name:'Вылет — город'})).toHaveValue('Москва');
 await user.click(screen.getByRole('button',{name:/Сохранить (элемент|перелёт)/}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({departure_city:'Москва',arrival_city:'Токио',departure_label:'Шереметьево',start_time:'10:00',end_time:'12:00',internal_note:'Сохранить'}),undefined);
});

test.each([
 ['fixed', false], ['capacity', false], ['fixed', true], ['capacity', true],
] as const)('returning to a flight restores its %s pricing and capacity before saving (new: %s)', async (calculation_mode, isNew) => {
 const day = emptyDay('2026-10-01'), onSubmit = vi.fn(), user = userEvent.setup();
 const item = { ...newItem('flight', day, 'RUB', day.date), calculation_mode, capacity: 7, unit_price: '100', price_pending: false, included: true };
 const trip = { ...newTrip(), participants: 8, start_date: day.date, end_date: day.date, days: [day], items: isNew ? [] : [item], rates: [] };
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
 await user.click(screen.getByText('Дополнительные действия'));
 await user.selectOptions(screen.getByLabelText('Тип события'), 'transfer');
 await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Изменить тип' }));
 await user.selectOptions(screen.getByLabelText('Тип события'), 'flight');
 expect(screen.getByLabelText('Правило расчёта')).toHaveValue(calculation_mode);
 await user.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ calculation_mode, capacity: 7 }), undefined);
 expect(calculateTrip({ ...trip, items: [onSubmit.mock.calls[0][0]] }).items[0].normalized_amount).toBe(calculation_mode === 'fixed' ? '100.00' : '200.00');
});

test('flight airport controls are collapsed and retain custom minutes', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),airport_before_minutes:125};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 const summary=screen.getByText('Время в аэропорту',{selector:'summary span'});
 expect(summary.closest('details')).not.toHaveAttribute('open');
 await user.click(summary);
 expect(screen.getByLabelText('До вылета в аэропорту, минут')).toHaveValue(125);
 await user.click(screen.getByRole('button',{name:'Сохранить перелёт'}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({airport_before_minutes:125}),undefined);
});

test('manual airport minutes stay editable when a typed prefix matches a preset', async () => {
 const day=emptyDay('2026-10-01'), onSubmit=vi.fn(), user=userEvent.setup();
 const item=newItem('flight',day,'RUB',day.date);
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 await user.click(screen.getByText('Время в аэропорту',{selector:'summary span'}));
 await user.click(screen.getByText('Своё значение до вылета'));
 const input=screen.getByLabelText('До вылета в аэропорту, минут');
 await user.clear(input);
 await user.type(input,'1205');
 expect(input).toBeVisible();
 await user.clear(input);
 await user.type(input,'125');
 await user.click(screen.getByRole('button',{name:'Сохранить перелёт'}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({airport_before_minutes:125}),undefined);
});

test('native invalid airport minutes open every enclosing disclosure', () => {
 const day=emptyDay('2026-10-01');
 const item={...newItem('flight',day,'RUB',day.date),airport_before_minutes:1500};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 const input=screen.getByLabelText('До вылета в аэропорту, минут');
 const inner=input.closest('details')!;
 const outer=inner.parentElement!.closest('details')!;
 inner.open=false;
 expect(outer).not.toHaveAttribute('open');
 fireEvent.invalid(input);
 expect(inner).toHaveAttribute('open');
 expect(outer).toHaveAttribute('open');
 expect(input).toBeVisible();
});

test('flight summary shows arrival, participants and pending price from the form', () => {
 const day=emptyDay('2026-10-01'), next=emptyDay('2026-10-02');
 const item={...newItem('flight',day,'RUB',day.date),end_day_id:next.id,start_time:'23:00',end_time:'02:00',participants_override:2,price_pending:true,included:false};
 const trip={...newTrip(),participants:4,start_date:day.date,end_date:next.date,days:[day,next],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 expect(screen.getByRole('heading',{name:'Редактирование авиаперелёта'})).toBeVisible();
 const summary=screen.getByRole('group',{name:'Сводка перелёта'});
 expect(summary).toHaveTextContent('Прилёт: 2 октября, 02:00');
 expect(summary).toHaveTextContent('Участников: 2');
 expect(summary).toHaveTextContent('Цена не указана');
});

test('changing a flight category requires confirmation and cancellation preserves its values', async () => {
 const day=emptyDay('2026-10-01'), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),departure_label:'Терминал',departure_utc_offset_minutes:180,arrival_utc_offset_minutes:180};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 await user.selectOptions(screen.getByLabelText('Тип события'),'hotel');
 expect(screen.getByRole('dialog',{name:'Изменить тип события?'})).toBeVisible();
 await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Отмена'}));
 expect(screen.getByLabelText('Тип события')).toHaveValue('flight');
 expect(screen.getByLabelText('Место вылета')).toHaveValue('Терминал');
 expect(screen.getByLabelText('UTC при отправлении')).toHaveValue('180');
});

test('returning to flight before saving restores incompatible UTC offsets', async () => {
 const day=emptyDay('2026-10-01'), user=userEvent.setup();
 const item={...newItem('flight',day,'RUB',day.date),departure_utc_offset_minutes:180,arrival_utc_offset_minutes:240,start_time:'09:00',end_time:'12:00'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[item],rates:[]};
 render(<ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>{}}/>);
 await user.selectOptions(screen.getByLabelText('Тип события'),'hotel');
 await user.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Изменить тип'}));
 await user.selectOptions(screen.getByLabelText('Тип события'),'flight');
 expect(screen.getByLabelText('UTC при отправлении')).toHaveValue('180');
 expect(screen.getByLabelText('UTC при прибытии')).toHaveValue('240');
 expect(screen.getByLabelText('Вылет по местному времени')).toHaveValue('09:00');
});

test('hotel dates drive per-person nightly pricing and invalid stays cannot be saved', async () => {
  const user = userEvent.setup(), days = [emptyDay('2026-10-01'), emptyDay('2026-10-02'), emptyDay('2026-10-03')];
  const trip = { ...newTrip(), participants: 3, start_date: days[0].date, end_date: days[2].date, days, items: [], rates: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={newItem('hotel', days[0], 'RUB', days[0].date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  await user.selectOptions(screen.getByLabelText('Правило расчёта'), 'per_person_per_day');
  fireEvent.change(screen.getByLabelText('Выезд — дата'), { target: { value: '2026-10-03' } });
  fireEvent.change(screen.getByLabelText('Цена за человека за ночь'), { target: { value: '100' } });
  await user.click(screen.getByRole('button', { name: /Сохранить элемент/ }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ duration_days: 2, calculation_mode: 'per_person_per_day' }), undefined);
  expect(calculateTrip({ ...trip, items: [onSubmit.mock.calls[0][0]] }).cost_total).toBe('600.00');
  fireEvent.change(screen.getByLabelText('Выезд — дата'), { target: { value: '2026-10-01' } });
  await user.click(screen.getByRole('button', { name: /Сохранить элемент/ }));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Выезд должен быть позже заезда')).toBeVisible();
});

test('existing hotel retains hidden schedule offsets and stages when edited', async () => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('hotel', day, 'RUB', day.date), start_time: '08:00', end_time: '09:00', departure_utc_offset_minutes: 180, arrival_utc_offset_minutes: 180, stages: [{ id: crypto.randomUUID(), title: 'Старый этап', start_time: null, end_time: null, notes: '' }] };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] }, onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.queryByText('Этапы события')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Описание события'), { target: { value: 'Описание' } });
  await userEvent.click(screen.getByRole('button', { name: /Сохранить элемент/ }));
  expect(onSubmit).toHaveBeenCalledWith({ ...item, description: 'Описание' }, undefined);
});

test('hotel room count switches between automatic and remembered manual values', async () => {
  const user = userEvent.setup(), day = emptyDay('2026-10-01');
  const trip = { ...newTrip(), participants: 5, start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] }, onSubmit = vi.fn();
  render(<ItemForm initial={newItem('hotel', day, 'RUB', day.date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByText('Автоматически: 3 номеров')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Расчёт числа номеров'), 'manual');
  fireEvent.change(screen.getByLabelText('Число номеров вручную'), { target: { value: '4' } });
  await user.selectOptions(screen.getByLabelText('Расчёт числа номеров'), 'auto');
  expect(screen.getByText('Автоматически: 3 номеров')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Расчёт числа номеров'), 'manual');
  expect(screen.getByLabelText('Число номеров вручную')).toHaveValue(4);
  await user.click(screen.getByRole('button', { name: 'Сохранить элемент' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rooms_override: 4 }), undefined);
});

test('hotel can reuse a trip place and explicitly apply its name', async () => {
  const user = userEvent.setup(), day = emptyDay('2026-10-01');
  const place = { name: 'Отель Море', address: 'Набережная 1', latitude: 45, longitude: 20, provider: 'manual' as const };
  const other = { ...newItem('hotel', day, 'RUB', day.date), title: 'Старый отель', map_place: place };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [other], rates: [] }, onSubmit = vi.fn();
  render(<ItemForm initial={newItem('hotel', day, 'RUB', day.date)} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  const title = screen.getByLabelText('Название элемента');
  fireEvent.change(title, { target: { value: 'Моё название' } });
  await user.click(screen.getByRole('combobox', { name: 'Объект из поездки' }));
  await user.click(screen.getByRole('option', { name: /Старый отель/ }));
  expect(title).toHaveValue('Моё название');
  await user.click(screen.getByRole('button', { name: 'Использовать название объекта' }));
  expect(title).toHaveValue('Отель Море · номеров: 1 · ночей: 1');
  await user.click(screen.getByRole('button', { name: 'Сохранить элемент' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Отель Море · номеров: 1 · ночей: 1', map_place: place }), undefined);
});

test('hotel occupancy remains editable for a total stay price and preserves general expenses', async () => {
  const user = userEvent.setup(), days = [emptyDay('2026-10-01'), emptyDay('2026-10-02')];
  const item = { ...newItem('hotel', days[0], 'RUB', days[0].date), day_id: null, calculation_mode: 'manual' as const };
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [item], rates: [] }, onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByLabelText('Гостей в номере')).toBeVisible();
  expect(screen.getByLabelText('Участники элемента')).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Расчёт числа номеров'), 'manual');
  fireEvent.change(screen.getByLabelText('Число номеров вручную'), { target: { value: '3' } });
  fireEvent.change(screen.getByLabelText('Выезд — дата'), { target: { value: '2026-10-03' } });
  fireEvent.change(screen.getByLabelText('Заезд — дата'), { target: { value: '2026-10-02' } });
  await user.click(screen.getByRole('button', { name: 'Сохранить элемент' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ day_id: null, rooms_override: 3 }), undefined);
});

test('changing a legacy hotel mode keeps its original option and aligns the pricing day with check-in', async () => {
  const user = userEvent.setup(), days = [emptyDay('2026-10-01'), emptyDay('2026-10-02')];
  const item = { ...newItem('hotel', days[0], 'RUB', days[0].date), check_in: days[1].date, check_out: '2026-10-03', calculation_mode: 'fixed' as const };
  const trip = { ...newTrip(), start_date: days[0].date, end_date: days[1].date, days, items: [item], rates: [] }, onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  const mode = screen.getByLabelText('Правило расчёта');
  await user.selectOptions(mode, 'per_person_per_day');
  expect(within(mode).getByRole('option', { name: /За всю группу \(сохранённое правило\)/ })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Сохранить элемент' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ calculation_mode: 'per_person_per_day', day_id: days[1].id, duration_days: 1 }), undefined);
});
