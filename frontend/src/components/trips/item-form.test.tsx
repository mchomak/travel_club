import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {mapsClient} from "@/lib/maps-client";
import { ItemForm } from "./item-form";
import { emptyDay, newItem, newTrip } from "@/lib/trip-ui";
import {tripInput} from '@/lib/trips';
import type {TripDocument} from '@/lib/contracts';
import {calculateTrip} from '@/lib/pricing';

afterEach(cleanup);

test('untouched new names are numbered and a pending taxi requires an explicit price including zero',async()=>{
 const day=emptyDay('2026-10-01'),onSubmit=vi.fn(),user=userEvent.setup();
 const old={...newItem('transfer',day,'RUB',day.date),subtype:'taxi' as const,title:'Такси 4'};
 const item={...old,id:crypto.randomUUID(),title:'Такси',price_pending:true,included:false};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],items:[old],rates:[]};
 const view=render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={()=>{}}/>);
 expect(screen.getByLabelText('Название элемента')).toHaveValue('Такси 5');
 expect(screen.getByLabelText('Цена машины')).toHaveValue('');
 expect(screen.getByText('Стоимость не указана')).toBeVisible();
 await user.click(screen.getByRole('button',{name:'Сохранить элемент'}));
 expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({price_pending:true,included:false,unit_price:'0',title:'Такси 5'}),undefined);
 await user.type(screen.getByLabelText('Цена машины'),'0');
 expect(screen.queryByText('Стоимость не указана')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Сохранить элемент'}));
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
 await user.click(screen.getByRole('button',{name:'Сохранить элемент'}));
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
 await user.click(screen.getByRole('button',{name:'Сохранить элемент'}));
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
 await user.click(screen.getByRole('button',{name:'Сохранить элемент'}));
 expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({map_place:expect.objectContaining({latitude:55.75,longitude:37.61}),map_end_place:expect.objectContaining({latitude:59.93}),location:'Legacy address',external_url:'https://example.com'}),undefined);
});

test("flight form saves and restores custom airport durations, including a hidden block", async () => {
  const user = userEvent.setup();
  const day = emptyDay("2026-10-01");
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [], rates: [] };
  const onSubmit = vi.fn();
  const item = { ...newItem("flight", day, "RUB", day.date), start_time: "09:00", end_time: "11:00" };
  const view = render(<ItemForm initial={item} trip={trip} onSubmit={onSubmit} onCancel={() => {}} />);
  expect(screen.getByLabelText("До вылета в аэропорту, минут")).toHaveValue(180);
  expect(screen.getByLabelText("После прилёта в аэропорту, минут")).toHaveValue(60);
  await user.clear(screen.getByLabelText("До вылета в аэропорту, минут"));
  await user.type(screen.getByLabelText("До вылета в аэропорту, минут"), "0");
  await user.clear(screen.getByLabelText("После прилёта в аэропорту, минут"));
  await user.type(screen.getByLabelText("После прилёта в аэропорту, минут"), "120");
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
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
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
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
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
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
  expect(screen.getByLabelText("Дата окончания")).toHaveValue(days[2].id);
  await user.click(screen.getByRole("button", { name: "Сохранить элемент" }));
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
