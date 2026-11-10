import {expect,test} from 'vitest';
import {countries} from './countries';

test('country choices contain every ISO alpha-2 region with readable Russian labels',()=>{
 expect(countries).toHaveLength(249);
 expect(new Set(countries.map(country=>country.key)).size).toBe(249);
 expect(countries).toContainEqual({key:'RU',label:'Россия',description:'RU'});
 expect(countries).toContainEqual({key:'JP',label:'Япония',description:'JP'});
 expect(countries.every(country=>/^[A-Z]{2}$/.test(country.key)&&country.label.length>2)).toBe(true);
});
