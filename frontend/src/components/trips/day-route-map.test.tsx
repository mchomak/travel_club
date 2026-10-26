import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {DayRouteMap,DayRouteBoundaries} from './day-route-map';
import {emptyDay,newTrip,newItem} from '@/lib/trip-ui';
import {mapsClient} from '@/lib/maps-client';
import type {MapPlace,TripInput} from '@/lib/contracts';
import {useState} from 'react';
import {planAutoTransfer} from '@/lib/auto-transfers';
import {buildDayRoute} from '@/lib/day-route';
const configState=vi.hoisted(()=>({config:{maps_key:null as string|null,search_enabled:false,routing_enabled:false}}));
vi.mock('@/lib/use-maps-config',()=>({useMapsConfig:()=>({...configState,error:null,retry:vi.fn()})}));
vi.mock('./map-canvas',()=>({MapCanvas:({nodes,geometries,label}:{nodes:unknown[];geometries:unknown[];label:string})=><div aria-label={label} data-nodes={JSON.stringify(nodes)} data-lines={JSON.stringify(geometries)}/> }));
afterEach(()=>{cleanup();vi.restoreAllMocks();configState.config.routing_enabled=false;configState.config.maps_key=null;});

test('separate boundaries and right map share aggregate updates and selection without duplicate provider requests',async()=>{
 configState.config.routing_enabled=true;
 const day=emptyDay('2026-10-01'),p:MapPlace={name:'Hotel',address:'Street',latitude:1,longitude:2,provider:'manual'};
 const hotel={...newItem('hotel',day,'RUB',day.date),id:'stay',title:'Hotel',check_in:'2026-09-30',check_out:'2026-10-02',map_place:p};
 const event={...newItem('activity',day,'RUB',day.date),id:'visit',title:'Visit',map_place:{...p,name:'Visit',latitude:3}};
 const route=vi.spyOn(mapsClient,'route').mockResolvedValue({status:'ok',distance_m:100,duration_s:60,geometry:null,approximate:false,message:''});
 const select=vi.fn();
 function Combined(){const [trip,setTrip]=useState<TripInput>({...newTrip(),days:[day],items:[hotel,event],rates:[]});const change=(patch:Partial<TripInput>)=>setTrip(value=>({...value,...patch}));return <><DayRouteBoundaries trip={trip} dayId={day.id} onChange={change}/><DayRouteMap trip={trip} dayId={day.id} onChange={change} hideBoundaries selectedItemId="visit" onSelectItem={select}/></>;}
 render(<Combined/>);
 expect(screen.getAllByRole('combobox',{name:'Начало дня'})).toHaveLength(1);
 expect(screen.getAllByRole('combobox',{name:'Конец дня'})).toHaveLength(1);
 await waitFor(()=>expect(route).toHaveBeenCalledTimes(4));
 const stop=screen.getByRole('button',{name:'Выбрать Visit'});expect(stop.closest('li')).toHaveAttribute('aria-current','true');
 fireEvent.click(stop);expect(select).toHaveBeenCalledWith('visit');
 await userEvent.setup().click(screen.getByRole('combobox',{name:'Начало дня'}));
 await userEvent.setup().click(screen.getByRole('option',{name:/^Visit/}));
 expect(document.querySelector('ol li')).toHaveTextContent('Visit');
 expect(screen.getByRole('combobox',{name:'Начало дня'})).toHaveValue('Visit');
});
test('unconfigured plan exposes controls and saves boundary, mode and untimed order through aggregate change',async()=>{
 vi.spyOn(mapsClient,'config').mockResolvedValue({maps_key:null,search_enabled:false,routing_enabled:false});
 const day=emptyDay('2026-10-01');const p:MapPlace={name:'Парк',address:'',latitude:1,longitude:2,provider:'manual'};
 const trip={...newTrip(),days:[day],rates:[],items:[{...newItem('activity',day,'RUB',day.date),title:'Парк',position:0,map_place:p},{...newItem('meal',day,'RUB',day.date),title:'Кафе',position:1,map_place:{...p,name:'Кафе',latitude:3}}]};
 const change=vi.fn(),route=vi.spyOn(mapsClient,'route'),user=userEvent.setup();
 render(<DayRouteMap trip={trip} dayId={day.id} onChange={change}/>);
 expect(await screen.findByText(/Карта ещё не настроена/)).toBeInTheDocument();
 expect(route).not.toHaveBeenCalled();
 const leg=screen.getByRole('group',{name:'Парк → Кафе'});
 await user.click(within(leg).getByRole('button',{name:/Пешком/}));
 expect(change).toHaveBeenLastCalledWith({days:[expect.objectContaining({map_leg_modes:[{from_key:`item:${trip.items[0].id}:start`,to_key:`item:${trip.items[1].id}:start`,mode:'walk'}]})]});
 await user.click(screen.getByRole('button',{name:'Переместить Кафе вверх'}));
 expect(change.mock.calls.at(-1)?.[0].items.map((i:{position:number})=>i.position)).toEqual([1,0]);
 await user.click(screen.getByRole('combobox',{name:'Начало дня'}));
 await user.click(screen.getByRole('option',{name:/^Парк/}));
 await waitFor(()=>expect(change).toHaveBeenLastCalledWith({days:[expect.objectContaining({map_start:p})]}));
 expect(within(leg).queryByRole('button',{name:/Общественный транспорт/})).not.toBeInTheDocument();
});

test('only local connections are requested and late prior-day routes never appear after day selection',async()=>{
 configState.config={maps_key:'browser-test',routing_enabled:true,search_enabled:false};
 const one=emptyDay('2026-10-01'),two=emptyDay('2026-10-02');
 const p:MapPlace={name:'Отправление',address:'',latitude:1,longitude:2,provider:'manual'},arrival={...p,name:'Прибытие',latitude:5};
 const flight={...newItem('flight',one,'RUB',one.date),title:'Ночной рейс',start_time:'22:00',end_time:'06:00',end_day_id:two.id,map_place:p,map_end_place:arrival};
 const trip={...newTrip(),days:[one,two],rates:[],items:[{...newItem('activity',one,'RUB',one.date),title:'Встреча',start_time:'23:00',map_place:{...p,latitude:2}},flight]};
 let finish!:(result:import('@/lib/maps-client').MapRouteResult)=>void;
 const route=vi.spyOn(mapsClient,'route').mockImplementation(()=>new Promise(resolve=>{finish=resolve;}));
 const view=render(<DayRouteMap trip={trip} dayId={one.id} onChange={()=>{}}/>);
 expect(screen.getByText(/Пересечение расписания/)).toBeInTheDocument();
 await waitFor(()=>expect(route).toHaveBeenCalled());
 expect(route.mock.calls.every(([from,to])=>from.latitude!==5&&to.latitude!==5)).toBe(true);
 const markers=JSON.parse(screen.getByLabelText('Карта выбранного дня').getAttribute('data-nodes')!);
 expect(markers.every((node:{place:MapPlace|null})=>node.place?.latitude!==5)).toBe(true);
 view.rerender(<DayRouteMap trip={{...trip,items:[flight]}} dayId={two.id} onChange={()=>{}}/>);
 finish({status:'ok',distance_m:999000,duration_s:900,geometry:{type:'LineString',coordinates:[[2,1],[2,2]]},approximate:false,message:null});
 await waitFor(()=>expect(screen.getByLabelText('Карта выбранного дня')).toHaveAttribute('data-lines','[]'));
 expect(screen.queryByText(/999 км/)).not.toBeInTheDocument();
 expect(screen.getByText('Место прибытия после ночного события')).toBeInTheDocument();
});

test('a measured drive connection creates one real editable taxi and removal permits recreation',async()=>{
 configState.config={maps_key:'browser-test',routing_enabled:true,search_enabled:false};
 const day=emptyDay('2026-10-01'),p:MapPlace={name:'Парк',address:'Улица Парка',latitude:1,longitude:2,provider:'manual'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],rates:[],items:[{...newItem('activity',day,'RUB',day.date),title:'Парк',start_time:'12:00',end_time:'13:00',map_place:p},{...newItem('meal',day,'RUB',day.date),title:'Кафе',start_time:'15:00',end_time:'16:00',map_place:{...p,name:'Кафе',latitude:3}}]};
 const route=vi.spyOn(mapsClient,'route').mockResolvedValue({status:'ok',distance_m:900,duration_s:540,geometry:{type:'LineString',coordinates:[[2,1],[2,3]]},approximate:false,message:null});
 const added=vi.fn(),opened=vi.fn();
 function Harness(){const [draft,setDraft]=useState<TripInput>(trip);return <><DayRouteMap trip={draft} dayId={day.id} onChange={patch=>setDraft({...draft,...patch})} onAddTransfer={item=>{added(item);setDraft({...draft,items:[...draft.items.filter(value=>value.id!==item.id),item]});}} onOpenItem={opened}/><button onClick={()=>setDraft({...draft,items:draft.items.filter(item=>!item.auto_transfer)})}>Удалить автотрансфер</button></>;}
 const user=userEvent.setup();render(<Harness/>);
 const leg=screen.getByRole('group',{name:'Парк → Кафе'});
 await user.click(await within(leg).findByRole('button',{name:'Добавить трансфер в маршрут'}));
 await waitFor(()=>expect(added).toHaveBeenCalledTimes(1));
 expect(added.mock.calls[0][0]).toMatchObject({title:'Такси 1',start_time:'14:51',end_time:'15:00',day_id:day.id,subtype:'taxi',included:false,price_pending:true,auto_transfer:{mode:'drive'}});
 expect(route.mock.calls.every(([, , mode])=>mode!=='transit')).toBe(true);
 await user.click(screen.getByRole('button',{name:'Открыть трансфер'}));
 expect(opened).toHaveBeenCalledWith(added.mock.calls[0][0].id);
 expect(within(screen.getByLabelText('Участки маршрута')).queryByRole('button',{name:'Добавить трансфер в маршрут'})).not.toBeInTheDocument();
 const summary=screen.getAllByRole('status').find(element=>element.textContent?.startsWith('Местные участки:'))!;
 await waitFor(()=>expect(summary).toHaveTextContent('900 м · 9 мин'));
 await user.click(screen.getByRole('button',{name:'Удалить автотрансфер'}));
 await user.click(await screen.findByRole('button',{name:'Добавить трансфер в маршрут'}));
 await waitFor(()=>expect(added).toHaveBeenCalledTimes(2));
});

test('untimed destination keeps arrive-by inputs available and requires explicit confirmation for schedule conflicts',async()=>{
 configState.config={maps_key:null,routing_enabled:true,search_enabled:false};
 const day=emptyDay('2026-10-01'),p:MapPlace={name:'Парк',address:'',latitude:1,longitude:2,provider:'manual'};
 const trip={...newTrip(),start_date:day.date,end_date:day.date,days:[day],rates:[],items:[{...newItem('activity',day,'RUB',day.date),title:'Парк',start_time:'12:00',end_time:'13:00',map_place:p},{...newItem('meal',day,'RUB',day.date),title:'Кафе',map_place:{...p,name:'Кафе',latitude:3}}]};
 vi.spyOn(mapsClient,'route').mockResolvedValue({status:'ok',distance_m:900,duration_s:540,geometry:null,approximate:false,message:null});
 const added=vi.fn(),user=userEvent.setup();render(<DayRouteMap trip={trip} dayId={day.id} onChange={()=>{}} onAddTransfer={added}/>);
 const leg=screen.getByRole('group',{name:'Парк → Кафе'});
 const time=await within(leg).findByLabelText('Прибыть к — местное время');
 fireEvent.change(time,{target:{value:'15:00'}});
 expect(within(leg).getByLabelText('Прибыть к — местное время')).toHaveValue('15:00');
 fireEvent.change(time,{target:{value:'12:30'}});
 await user.click(within(leg).getByRole('button',{name:'Добавить трансфер в маршрут'}));
 expect(added).not.toHaveBeenCalled();
 expect(within(leg).getByRole('alert')).toHaveTextContent('Парк');
 await user.click(within(leg).getByRole('button',{name:'Подтверждаю добавление с конфликтом'}));
 expect(added).toHaveBeenCalledWith(expect.objectContaining({start_time:'12:21',end_time:'12:30'}));
});

test('an unlocated boundary option attaches the confirmed link place to its source event and day atomically',async()=>{
 const day=emptyDay('2026-10-01'),later=emptyDay('2026-10-02'),p:MapPlace={name:'Парк',address:'Адрес парка',latitude:1,longitude:2,provider:'manual'};
 const target={...newItem('activity',day,'RUB',day.date),title:'Музей',start_time:'15:00'};
 const trip={...newTrip(),days:[day,later],rates:[],items:[{...newItem('activity',later,'RUB',later.date),title:'Другой день',map_place:p},{...newItem('meal',day,'RUB',day.date),title:'Обед',start_time:'12:00',map_place:p},target]};
 const change=vi.fn(),user=userEvent.setup();vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:{...p,name:'Музей'},query:null});
 render(<DayRouteMap trip={trip} dayId={day.id} onChange={change}/>);
 await user.click(screen.getByRole('combobox',{name:'Начало дня'}));
 expect(screen.getAllByRole('option').map(option=>option.textContent)).toEqual([expect.stringContaining('Автоматически'),expect.stringContaining('Обед'),expect.stringContaining('Другой день'),expect.stringContaining('Музей'),expect.stringContaining('Указать своё место')]);
 await user.click(screen.getByRole('option',{name:/^Музей/}));
 expect(change).not.toHaveBeenCalled();
 await user.type(screen.getByLabelText('Ссылка Google Maps'),'https://maps.google.com/?q=museum');
 await user.click(screen.getByRole('button',{name:'Найти'}));
 await user.click(await screen.findByRole('option',{name:/^Музей · Адрес парка/}));
 expect(change).toHaveBeenCalledTimes(1);
 expect(change.mock.calls[0][0].days[0].map_start).toMatchObject({name:'Музей',source_url:'https://maps.google.com/?q=museum'});
 expect(change.mock.calls[0][0].items.find((item:{id:string})=>item.id===target.id).map_place).toMatchObject({name:'Музей',latitude:1});
});

test('source refresh rejects a late route response, then explicitly updates the saved snapshot while keeping price and notes',async()=>{
 configState.config={maps_key:null,routing_enabled:true,search_enabled:false};
 const day=emptyDay('2026-10-01'),p:MapPlace={name:'Парк',address:'',latitude:1,longitude:2,provider:'manual'};
 const base:TripInput={...newTrip(),start_date:day.date,end_date:day.date,days:[day],rates:[],items:[{...newItem('activity',day,'RUB',day.date),title:'Парк',start_time:'12:00',end_time:'13:00',map_place:p},{...newItem('meal',day,'RUB',day.date),title:'Кафе',start_time:'15:00',end_time:'16:00',map_place:{...p,name:'Кафе',latitude:3}}]};
 const measured={status:'ok' as const,distance_m:900,duration_s:540,geometry:null,approximate:false,message:null};
 const plan=planAutoTransfer(base,buildDayRoute(base,day.id).legs.find(leg=>leg.from.label==='Парк'&&leg.to.label==='Кафе')!,measured);if(!plan.ok)throw Error(plan.message);
 const saved={...plan.item,unit_price:'500',included:true,price_pending:false,internal_note:'Согласовано'};
 const moved:TripInput={...base,items:[base.items[0],{...base.items[1],start_time:'16:00',end_time:'17:00',map_place:{...p,name:'Кафе',latitude:9}},saved]};
 const route=vi.spyOn(mapsClient,'route').mockResolvedValue(measured),apply=vi.fn(),user=userEvent.setup();
 const view=render(<DayRouteMap trip={moved} dayId={day.id} onChange={()=>{}} onAddTransfer={apply}/>);
 expect(screen.getByText(/Сохранённое время переезда осталось прежним/)).toBeVisible();
 let finish!:(value:typeof measured)=>void;
 route.mockImplementation((from,to)=>from.latitude===1&&to.latitude===9?new Promise(resolve=>{finish=resolve;}):Promise.resolve(measured));
 await user.click(screen.getByRole('button',{name:'Обновить трансфер по исходным событиям'}));
 const newer={...moved,items:moved.items.map(item=>item.id===base.items[1].id?{...item,start_time:'17:00',end_time:'18:00',map_place:{...p,name:'Кафе',latitude:10}}:item)};
 view.rerender(<DayRouteMap trip={newer} dayId={day.id} onChange={()=>{}} onAddTransfer={apply}/>);
 finish(measured);
 expect(await screen.findByRole('alert')).toHaveTextContent(/Повторите расчёт/);
 expect(apply).not.toHaveBeenCalled();
 route.mockResolvedValue(measured);
 await user.click(screen.getByRole('button',{name:'Обновить трансфер по исходным событиям'}));
 await waitFor(()=>expect(apply).toHaveBeenCalledTimes(1));
 expect(apply.mock.calls[0][0]).toMatchObject({id:saved.id,start_time:'16:51',end_time:'17:00',unit_price:'500',included:true,price_pending:false,internal_note:'Согласовано',map_end_place:{latitude:10}});
 view.rerender(<DayRouteMap trip={{...newer,items:newer.items.filter(item=>item.id!==base.items[0].id)}} dayId={day.id} onChange={()=>{}}/>);
 expect(screen.getByText(/Исходное место удалено или не указано/)).toBeVisible();
});

test('compatibility onChange refresh preserves unrelated item edits made while routing is pending',async()=>{
 configState.config={maps_key:null,routing_enabled:true,search_enabled:false};
 const day=emptyDay('2026-10-01'),point:MapPlace={name:'Парк',address:'',latitude:1,longitude:2,provider:'manual'};
 const base:TripInput={...newTrip(),start_date:day.date,end_date:day.date,days:[day],rates:[],items:[{...newItem('activity',day,'RUB',day.date),title:'Парк',start_time:'12:00',end_time:'13:00',map_place:point},{...newItem('meal',day,'RUB',day.date),title:'Кафе',start_time:'15:00',end_time:'16:00',map_place:{...point,name:'Кафе',latitude:3}},{...newItem('insurance',null,'RUB',day.date),title:'Страховка',internal_note:'Прежняя заметка'}]};
 const measured={status:'ok' as const,distance_m:900,duration_s:540,geometry:null,approximate:false,message:null};
 const planned=planAutoTransfer(base,buildDayRoute(base,day.id).legs.find(leg=>leg.from.label==='Парк'&&leg.to.label==='Кафе')!,measured);if(!planned.ok)throw Error(planned.message);
 const trip:TripInput={...base,items:[...base.items.map(item=>item.id===base.items[1].id?{...item,start_time:'16:00',end_time:'17:00'}:item),planned.item]};
 const changed=vi.fn(),route=vi.spyOn(mapsClient,'route').mockResolvedValue(measured),user=userEvent.setup();
 function Harness(){const [draft,setDraft]=useState(trip);return <><DayRouteMap trip={draft} dayId={day.id} onChange={patch=>{changed(patch);setDraft(current=>({...current,...patch}));}}/><button onClick={()=>setDraft(current=>({...current,items:current.items.map(item=>item.type==='insurance'?{...item,internal_note:'Новая заметка'}:item)}))}>Изменить страховку</button><output aria-label="Заметка страховки">{draft.items.find(item=>item.type==='insurance')?.internal_note}</output></>;}
 render(<Harness/>);
 await waitFor(()=>expect(route).toHaveBeenCalled());
 let finish!:(value:typeof measured)=>void;
 route.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
 await user.click(screen.getByRole('button',{name:'Обновить трансфер по исходным событиям'}));
 await user.click(screen.getByRole('button',{name:'Изменить страховку'}));
 expect(screen.getByLabelText('Заметка страховки')).toHaveTextContent('Новая заметка');
 finish(measured);
 await waitFor(()=>expect(changed).toHaveBeenCalledTimes(1));
 expect(changed.mock.calls[0][0].items.find((item:{type:string})=>item.type==='insurance')).toMatchObject({internal_note:'Новая заметка'});
 expect(changed.mock.calls[0][0].items.find((item:{id:string})=>item.id===planned.item.id)).toMatchObject({start_time:'15:51',end_time:'16:00'});
 expect(screen.getByLabelText('Заметка страховки')).toHaveTextContent('Новая заметка');
});
