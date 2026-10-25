import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
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
