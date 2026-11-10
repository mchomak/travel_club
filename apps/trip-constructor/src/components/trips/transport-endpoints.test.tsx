import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {useState} from 'react';
import {emptyDay,newItem,newTrip} from '@/lib/trip-ui';
import {mapsClient} from '@/lib/maps-client';
import type {ItemInput,TripInput} from '@/lib/contracts';
import {TransportEndpoints} from './transport-endpoints';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const place={name:'Аэропорт',address:'Terminal A',latitude:1,longitude:2,provider:'manual' as const};
test('transport suggests calendar places once, accepts custom text and never invents coordinates',async()=>{
 const day=emptyDay('2026-10-01');
 const flight={...newItem('flight',day,'RUB',day.date),end_time:'10:00',map_end_place:place};
 const hotel={...newItem('hotel',day,'RUB',day.date),map_place:{...place,name:'Отель',latitude:3}};
 const trip={...newTrip(),days:[day],items:[flight,hotel],rates:[]} as TripInput;
 const changed=vi.fn();
 function Harness(){const [item,setItem]=useState<ItemInput>({...newItem('transfer',day,'RUB',day.date),start_time:'11:00'});return <TransportEndpoints item={item} trip={trip} isNew onChange={patch=>{changed(patch);setItem(value=>({...value,...patch}));}}/>;}
 render(<Harness/>);
 await waitFor(()=>expect(screen.getByRole('combobox',{name:'Откуда'})).toHaveValue('Аэропорт'));
 fireEvent.change(screen.getByRole('combobox',{name:'Откуда'}),{target:{value:'У друзей'}});
 fireEvent.click(screen.getByRole('option',{name:/Использовать «У друзей»/}));
 expect(screen.getByRole('combobox',{name:'Откуда'})).toHaveValue('У друзей');
 expect(changed).toHaveBeenLastCalledWith({departure_label:'У друзей',map_place:null});
 expect(screen.getAllByText('Место без адреса').length).toBeGreaterThan(0);
});

test('taxi and car use drive estimates, obsolete replies are ignored and public transit is manual',async()=>{
 const day=emptyDay('2026-10-01'),trip={...newTrip(),days:[day],items:[],rates:[]} as TripInput;
 let finish!:(value:Awaited<ReturnType<typeof mapsClient.route>>)=>void;
 const route=vi.spyOn(mapsClient,'route').mockReturnValueOnce(new Promise(resolve=>{finish=resolve;})).mockResolvedValue({status:'unavailable',distance_m:null,duration_s:null,geometry:null,approximate:false,message:'offline'});
 const item={...newItem('transfer',day,'RUB',day.date),subtype:'taxi' as const,map_place:place,map_end_place:{...place,name:'Отель',latitude:3}};
 const view=render(<TransportEndpoints item={item} trip={trip} isNew={false} onChange={()=>{}}/>);
 expect(route).toHaveBeenCalledWith(item.map_place,item.map_end_place,'drive');
 view.rerender(<TransportEndpoints item={{...item,subtype:'car',map_end_place:{...item.map_end_place,latitude:4}}} trip={trip} isNew={false} onChange={()=>{}}/>);
 expect(await screen.findByText('Время пути недоступно. Укажите время вручную.')).toBeVisible();
 finish({status:'ok',distance_m:10,duration_s:61,geometry:null,approximate:false,message:null});
 await waitFor(()=>expect(screen.queryByText(/около 2 мин/)).not.toBeInTheDocument());
 view.rerender(<TransportEndpoints item={{...item,subtype:'bus'}} trip={trip} isNew={false} onChange={()=>{}}/>);
 expect(screen.getByText('Время общественного транспорта укажите вручную.')).toBeVisible();
 expect(route).toHaveBeenCalledTimes(2);
});

test('walking estimate rounds provider seconds up and saved endpoints survive calendar edits',async()=>{
 const day=emptyDay('2026-10-01'),next=emptyDay('2026-10-02');
 const route=vi.spyOn(mapsClient,'route').mockResolvedValue({status:'ok',distance_m:100,duration_s:61,geometry:null,approximate:false,message:null});
 const item={...newItem('transfer',day,'RUB',day.date),subtype:'walk' as const,map_place:place,map_end_place:{...place,name:'Отель',latitude:3}};
 const nearby={...newItem('activity',next,'RUB',next.date),map_place:{...place,name:'Другое место',latitude:4},start_time:'15:00'};
 const trip={...newTrip(),days:[day,next],items:[nearby],rates:[]} as TripInput,onChange=vi.fn();
 const view=render(<TransportEndpoints item={item} trip={trip} isNew={false} onChange={onChange}/>);
 expect(await screen.findByText('Пешком: около 2 мин. Стоимость укажите отдельно.')).toBeVisible();
 expect(route).toHaveBeenCalledWith(item.map_place,item.map_end_place,'walk');
 view.rerender(<TransportEndpoints item={{...item,day_id:next.id,start_time:'16:00'}} trip={trip} isNew={false} onChange={onChange}/>);
 expect(screen.getByRole('combobox',{name:'Откуда'})).toHaveValue('Аэропорт');
 expect(screen.getByRole('combobox',{name:'Куда'})).toHaveValue('Отель');
 expect(onChange).not.toHaveBeenCalled();
});
