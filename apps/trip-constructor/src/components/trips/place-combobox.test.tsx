import {useState} from 'react';
import {Modal} from './ui';
import {ItemForm} from './item-form';
import {emptyDay,newItem,newTrip} from '@/lib/trip-ui';
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {PlaceCombobox} from './place-combobox';
afterEach(cleanup);
test('keyboard navigates enabled choices, Home and End, selection closes and Escape preserves value',async()=>{
 const user=userEvent.setup(),onChange=vi.fn();
 render(<PlaceCombobox label="Место" value="a" options={[{key:'a',label:'Отель',description:'Улица 1'},{key:'b',label:'Закрыто',disabled:true},{key:'c',label:'Аэропорт',description:'Терминал 2'}]} onChange={onChange}/>);
 const input=screen.getByRole('combobox');await user.click(input);await user.keyboard('{End}{Enter}');
 expect(onChange).toHaveBeenCalledWith('c');expect(input).toHaveAttribute('aria-expanded','false');
 await user.click(input);await user.keyboard('{Home}{ArrowDown}{Enter}');expect(onChange).toHaveBeenLastCalledWith('c');
 await user.click(input);await user.type(input,'Отель');await user.keyboard('{Escape}');expect(input).toHaveValue('Отель');expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
});

test('Escape closes the place list before the real Radix item dialog and preserves typed fields',async()=>{
 const day=emptyDay('2026-10-01'),trip={...newTrip(),days:[day],items:[],rates:[]};
 const item={...newItem('transfer',day,'RUB',day.date),subtype:'taxi' as const};
 function Editor(){const [open,setOpen]=useState(true);return open?<Modal title="Редактировать событие" onClose={()=>setOpen(false)}><ItemForm initial={item} trip={trip} onSubmit={()=>{}} onCancel={()=>setOpen(false)}/></Modal>:null;}
 const user=userEvent.setup();render(<Editor/>);
 const title=screen.getByLabelText('Название элемента');await user.clear(title);await user.type(title,'Мой трансфер');
 const origin=screen.getByRole('combobox',{name:'Откуда'});await user.click(origin);await user.type(origin,'Свой адрес');
 expect(screen.getByRole('listbox',{name:'Откуда'})).toBeInTheDocument();
 await user.keyboard('{Escape}');
 expect(screen.getByRole('dialog',{name:'Редактировать событие'})).toBeInTheDocument();
 expect(title).toHaveValue('Мой трансфер');expect(origin).toHaveAttribute('aria-expanded','false');expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
 await user.keyboard('{Escape}');
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
});
