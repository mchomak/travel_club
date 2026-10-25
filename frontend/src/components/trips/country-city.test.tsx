import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {useState} from 'react';
import {mapsClient} from '@/lib/maps-client';
import {CountryCity} from './country-city';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.useRealTimers();});
const place={name:'Москва',address:'Россия',latitude:55,longitude:37,provider:'geoapify' as const};
test('country selection filters remote city search; confirmed selection and country change are explicit',async()=>{
 const search=vi.spyOn(mapsClient,'searchCities').mockResolvedValue({places:[place]});
 const changed=vi.fn();
 function Harness(){const [value,setValue]=useState<{country:string|null;city:string}>({country:null,city:''});return <CountryCity label="Вылет" {...value} onChange={(country,city)=>{changed(country,city);setValue({country,city});}}/>;}
 render(<Harness/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — страна'}),{target:{value:'Россия'}});
 fireEvent.click(screen.getByRole('option',{name:/Россия.*RU/}));
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — город'}),{target:{value:'Моск'}});
 fireEvent.click(await screen.findByRole('option',{name:/Москва.*Россия/}));
 expect(search).toHaveBeenCalledWith('Моск','RU',expect.any(AbortSignal));
 expect(changed).toHaveBeenLastCalledWith('RU','Москва');
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — страна'}),{target:{value:'Япония'}});
 fireEvent.click(screen.getByRole('option',{name:/Япония.*JP/}));
 expect(changed).toHaveBeenLastCalledWith('JP','');
 expect(screen.getByRole('combobox',{name:'Вылет — город'})).toHaveValue('');
});

test('a failed city search keeps text available for explicit custom confirmation',async()=>{
 vi.spyOn(mapsClient,'searchCities').mockRejectedValue(new Error('offline'));
 const changed=vi.fn();
 render(<CountryCity label="Прилёт" country="JP" city="" onChange={changed}/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Прилёт — город'}),{target:{value:'Мой город'}});
 expect(await screen.findByText(/Не удалось найти города/)).toBeVisible();
 expect(screen.getByRole('combobox',{name:'Прилёт — город'})).toHaveValue('Мой город');
 expect(changed).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('option',{name:/Использовать «Мой город»/}));
 expect(changed).toHaveBeenCalledWith('JP','Мой город');
});

test('country change cancels pending city suggestions and ignores a late response',async()=>{
 let finish!:(value:{places:typeof place[]})=>void;
 const search=vi.spyOn(mapsClient,'searchCities').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 function Harness(){const [value,setValue]=useState<{country:string|null;city:string}>({country:'RU',city:''});return <CountryCity label="Вылет" {...value} onChange={(country,city)=>setValue({country,city})}/>;}
 render(<Harness/>);
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — город'}),{target:{value:'Моск'}});
 await waitFor(()=>expect(search).toHaveBeenCalledOnce());
 const signal=search.mock.calls[0][2];
 fireEvent.change(screen.getByRole('combobox',{name:'Вылет — страна'}),{target:{value:'Япония'}});
 fireEvent.click(screen.getByRole('option',{name:/Япония.*JP/}));
 expect(signal?.aborted).toBe(true);
 finish({places:[place]});
 fireEvent.focus(screen.getByRole('combobox',{name:'Вылет — город'}));
 await waitFor(()=>expect(screen.queryByRole('option',{name:/Москва.*Россия/})).not.toBeInTheDocument());
});

test('confirming a custom city ends pending loading and reopening ignores the cancelled search reply',async()=>{
 vi.useFakeTimers();
 let finish!:(value:{places:typeof place[]})=>void;
 const search=vi.spyOn(mapsClient,'searchCities').mockReturnValue(new Promise(resolve=>{finish=resolve;}));
 function Harness(){const [value,setValue]=useState<{country:string|null;city:string}>({country:'RU',city:''});return <CountryCity label="Вылет" {...value} onChange={(country,city)=>setValue({country,city})}/>;}
 render(<Harness/>);
 const input=screen.getByRole('combobox',{name:'Вылет — город'});
 fireEvent.change(input,{target:{value:'Мой город'}});
 await act(async()=>{await vi.advanceTimersByTimeAsync(350);});
 expect(screen.getByRole('listbox',{name:'Вылет — город'})).toHaveAttribute('aria-busy','true');
 fireEvent.click(screen.getByRole('option',{name:/Использовать «Мой город»/}));
 expect(search.mock.calls[0][2]?.aborted).toBe(true);
 fireEvent.click(input);
 expect(screen.getByRole('listbox',{name:'Вылет — город'})).toHaveAttribute('aria-busy','false');
 expect(screen.queryByText('Ищем места…')).not.toBeInTheDocument();
 await act(async()=>{finish({places:[place]});});
 expect(input).toHaveValue('Мой город');
 expect(screen.queryByRole('option',{name:/Москва.*Россия/})).not.toBeInTheDocument();
 expect(screen.getByRole('listbox',{name:'Вылет — город'})).toHaveAttribute('aria-busy','false');
});
