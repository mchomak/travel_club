import {Modal} from './ui';
import {useState} from 'react';
import type {MapPlace} from '@/lib/contracts';
import {afterEach,expect,test,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {LocationPicker} from './location-picker';
import {mapsClient} from '@/lib/maps-client';
vi.mock('@/lib/use-maps-config',()=>({useMapsConfig:()=>({config:{maps_key:null,search_enabled:true,routing_enabled:false},error:null,retry:vi.fn()})}));
afterEach(()=>{cleanup();vi.restoreAllMocks();});
const place={name:'Selected pin',address:'Address',latitude:1,longitude:2,provider:'google_link' as const};
test('link-only input offers an exact candidate and confirms only after selection',async()=>{
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place,query:null});
 const onChange=vi.fn();
 render(<LocationPicker value={null} onChange={onChange}/>);
 expect(screen.queryByLabelText('Название или адрес')).not.toBeInTheDocument();
 expect(screen.queryByLabelText('Широта')).not.toBeInTheDocument();
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=1,2'}});
 const option=await screen.findByRole('option',{name:/Selected pin/});expect(onChange).not.toHaveBeenCalled();fireEvent.click(option);
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({...place,source_url:'https://maps.google.com/?q=1,2'}));
 expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});
test('link query automatically opens candidates and keyboard selection confirms and collapses them',async()=>{
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:null,query:'Museum'});
 vi.spyOn(mapsClient,'search').mockResolvedValue({places:[{...place,name:'Museum',address:'Main street'}]});
 const onChange=vi.fn(),user=userEvent.setup();
 render(<LocationPicker value={null} onChange={onChange}/>);
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=Museum'}});
 expect(await screen.findByRole('option',{name:/Museum.*Main street/})).toBeInTheDocument();
 const input=screen.getByRole('combobox');
 await user.click(input);await user.keyboard('{ArrowDown}{Enter}');
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({name:'Museum',address:'Main street'}));
 expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 expect(screen.getByLabelText('Ссылка Google Maps')).toHaveValue('https://maps.google.com/?q=Museum');
});

test('numeric Google point enriches its label without replacing the exact coordinates',async()=>{
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:{...place,name:'1, 2',address:''},query:null});
 const reverse=vi.spyOn(mapsClient,'reverse').mockResolvedValue({place:{...place,name:'Museum',address:'Main street',latitude:1.001,longitude:2.001,provider:'geoapify'}});
 const onChange=vi.fn();render(<LocationPicker value={null} onChange={onChange}/>);
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=1,2'}});
 fireEvent.click(await screen.findByRole('option',{name:/Museum/}));
 expect(reverse).toHaveBeenCalledWith(1,2,expect.anything());
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({name:'Museum',address:'Main street',latitude:1,longitude:2,provider:'google_link'}));
 expect(screen.queryByText('1, 2')).not.toBeInTheDocument();
});
test('unsupported link keeps the URL and reveals text fallback without changing a saved place',async()=>{
 vi.spyOn(mapsClient,'resolveLink').mockRejectedValue(new Error('Unsupported link'));
 vi.spyOn(mapsClient,'search').mockResolvedValue({places:[{...place,name:'Replacement'}]});
 const onChange=vi.fn(),user=userEvent.setup();render(<LocationPicker value={place} onChange={onChange}/>);
 expect(screen.getByText('Selected pin')).toBeInTheDocument();expect(screen.queryByLabelText('Широта')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://example.com/place'}});
 expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось определить место по ссылке');
 expect(screen.getByLabelText('Ссылка Google Maps')).toHaveValue('https://example.com/place');expect(onChange).not.toHaveBeenCalled();
 await user.type(screen.getByRole('combobox'),'Replacement');
 await user.click(await screen.findByRole('option',{name:/Replacement/}));
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({name:'Replacement'}));expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Удалить привязку'}));expect(onChange).toHaveBeenLastCalledWith(null);
});
test.each(['place','query','error'] as const)('late link %s cannot overwrite a newer URL or the saved selection',async(outcome)=>{
 let finish!:(value:{place:typeof place|null;query:string|null})=>void,fail!:(reason:Error)=>void;
 vi.spyOn(mapsClient,'resolveLink').mockReturnValue(new Promise((resolve,reject)=>{finish=resolve;fail=reject;}));
 const onChange=vi.fn(),user=userEvent.setup();render(<LocationPicker value={place} onChange={onChange}/>);
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=Old'}});
 await user.click(screen.getByRole('button',{name:'Найти'}));
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=New'}});
 await act(async()=>{if(outcome==='error')fail(new Error('Late error'));else finish(outcome==='query'?{place:null,query:'Old query'}:{place:{...place,name:'Old point'},query:null});});
 expect(screen.getByLabelText('Ссылка Google Maps')).toHaveValue('https://maps.google.com/?q=New');
 expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(screen.queryByRole('combobox')).not.toBeInTheDocument();expect(onChange).not.toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Оставить выбранное место'}));expect(screen.getByText('Selected pin')).toBeInTheDocument();
});
test('reverse failure preserves the exact usable point with a neutral human label',async()=>{
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:{...place,name:'1, 2',address:''},query:null});
 vi.spyOn(mapsClient,'reverse').mockRejectedValue(new Error('Offline'));
 const onChange=vi.fn();render(<LocationPicker value={null} onChange={onChange}/>);
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=1,2'}});
 fireEvent.click(await screen.findByRole('option',{name:/Точка из Google Maps/}));expect(screen.getByText('Адрес не определён')).toBeInTheDocument();
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({latitude:1,longitude:2}));
});

test('a real parent update retains the URL and reopens candidates for replacement',async()=>{
 const replacement={...place,name:'Another museum',address:'Other street'};
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:null,query:'Museum'});
 vi.spyOn(mapsClient,'search').mockResolvedValue({places:[{...place,name:'Museum'},replacement]});
 function Parent(){const [value,setValue]=useState<MapPlace|null>(null);return <LocationPicker value={value} onChange={setValue}/>;}
 const user=userEvent.setup();render(<Parent/>);
 fireEvent.change(screen.getByLabelText('Ссылка Google Maps'),{target:{value:'https://maps.google.com/?q=Museum'}});
 await user.click(await screen.findByRole('option',{name:/^Museum/}));
 expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 expect(screen.getByLabelText('Ссылка Google Maps')).toHaveValue('https://maps.google.com/?q=Museum');
 await user.click(await screen.findByRole('option',{name:/Another museum/}));
 expect(screen.getByText('Another museum')).toBeInTheDocument();expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

test('reopened candidates can close inside the dialog and keep the saved place or reselect',async()=>{
 const saved={...place,source_url:'https://maps.google.com/?q=Museum'},replacement={...place,name:'Replacement'};
 vi.spyOn(mapsClient,'resolveLink').mockResolvedValue({place:replacement,query:null});
 const onChange=vi.fn(),onClose=vi.fn(),user=userEvent.setup();
 render(<Modal title="Место события" onClose={onClose}><LocationPicker value={saved} onChange={onChange}/></Modal>);
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 const candidate=await screen.findByRole('option',{name:/Replacement/});expect(candidate).toBeInTheDocument();
 const keep=screen.getByRole('button',{name:'Оставить выбранное место'}),combo=screen.getByRole('combobox');
 expect(keep.compareDocumentPosition(combo)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 await user.keyboard('{Escape}');expect(onClose).not.toHaveBeenCalled();expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 await user.click(keep);expect(screen.getByText('Selected pin')).toBeInTheDocument();expect(onChange).not.toHaveBeenCalled();
 await user.click(screen.getByRole('button',{name:'Изменить место'}));
 await user.click(await screen.findByRole('option',{name:/Replacement/}));
 expect(onChange).toHaveBeenCalledWith(expect.objectContaining({name:'Replacement'}));expect(onClose).not.toHaveBeenCalled();
});
