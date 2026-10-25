import {expect,test} from 'vitest';
import {getTripPlaceOptions} from './trip-places';
import {emptyDay,newItem,newTrip} from './trip-ui';
const days=['2026-10-01','2026-10-02','2026-10-03'].map((date,i)=>({...emptyDay(date),id:`d${i}`}));
const place={name:'Address name',address:'Main street',latitude:1,longitude:2,provider:'manual' as const};
const item=(id:string,day=days[1],time:string|null=null,located=true)=>({...newItem('activity',day,'RUB',days[0].date),id,title:'Same title',start_time:time,map_place:located?place:null});
test('calendar options order today by visit, other dates, then unlocated with stable distinct keys',()=>{
 const trip={...newTrip(),days,rates:[],items:[item('tomorrow',days[2],'10:00'),item('late',days[1],'18:00'),item('no-address',days[1],'08:00',false),item('early',days[1],'09:00'),item('yesterday',days[0],'12:00')]};
 const options=getTripPlaceOptions(trip,'d1');
 expect(options.map(option=>option.key)).toEqual(['item:early:start','item:late:start','item:yesterday:start','item:tomorrow:start','item:no-address:start']);
 expect(options[0]).toMatchObject({itemId:'early',endpoint:'start',date:'2026-10-02',time:'09:00',place});
 expect(options[0].group).toContain('Текущий день');expect(options[4].group).toBe('Без адреса');
 expect(options[4].description).toContain('Место без адреса');
 expect(options[0].description).not.toBe(options[1].description);
});
test('transport origin prefers preceding arrivals, destination prefers following starts, active hotel stays remain current',()=>{
 const flight={...item('flight',days[1],'08:00'),type:'flight' as const,end_time:'10:00',map_end_place:{...place,name:'Airport'}};
 const museum=item('museum',days[1],'15:00');
 const hotel={...newItem('hotel',days[0],'RUB',days[0].date),id:'hotel',title:'Hotel',check_in:'2026-10-01',check_out:'2026-10-03',map_place:place};
 const trip={...newTrip(),days,rates:[],items:[hotel,museum,flight]};
 expect(getTripPlaceOptions(trip,'d1',{endpoint:'start',time:'12:00'})[0].key).toBe('item:flight:end');
 expect(getTripPlaceOptions(trip,'d1',{endpoint:'end',time:'12:00'})[0].key).toBe('item:museum:start');
 expect(getTripPlaceOptions(trip,'d1').find(option=>option.key==='item:hotel:start')?.group).toContain('Текущий день');
 expect(getTripPlaceOptions(trip,'d1',{excludeItemId:'flight'}).some(option=>option.itemId==='flight')).toBe(false);
});
test('transport origin across midnight ranks a preceding arrival ahead of future places on the current day',()=>{
 const flight={...item('flight',days[0],'22:00'),type:'flight' as const,end_time:'23:50',map_end_place:place};
 const trip={...newTrip(),days,rates:[],items:[flight,item('future',days[1],'15:00')]};
 expect(getTripPlaceOptions(trip,'d1',{endpoint:'start',time:'00:10'})[0].key).toBe('item:flight:end');
});
test('transport direction and endpoint preference stay lexicographic across decades',()=>{
 const distantDays=['1990-10-01','2026-10-02','2050-10-03'].map((date,i)=>({...emptyDay(date),id:`long-${i}`}));
 const previous={...item('previous',distantDays[0],'08:00'),type:'flight' as const,end_time:'10:00',map_end_place:place};
 const following={...item('following',distantDays[2],'08:00'),type:'flight' as const,end_time:'10:00',map_end_place:place};
 const nearbyPast=item('past',distantDays[1],'11:59');
 const nearbyFuture=item('future',distantDays[1],'12:01');
 const input={...newTrip(),days:distantDays,rates:[],items:[previous,following,nearbyPast,nearbyFuture]};
 const origins=getTripPlaceOptions(input,'long-1',{endpoint:'start',time:'12:00'}).map(option=>option.key);
 expect(origins.indexOf('item:previous:end')).toBeLessThan(origins.indexOf('item:future:start'));
 const destinations=getTripPlaceOptions(input,'long-1',{endpoint:'end',time:'12:00'}).map(option=>option.key);
 expect(destinations.indexOf('item:following:start')).toBeLessThan(destinations.indexOf('item:past:start'));
 const overlappingFlight={...item('ongoing',distantDays[0],'11:00'),type:'flight' as const,end_day_id:distantDays[2].id,end_time:'12:00',map_end_place:place};
 const endpointInput={...input,items:[previous,overlappingFlight]};
 expect(getTripPlaceOptions(endpointInput,'long-1',{endpoint:'start',time:'12:00'})[0].key).toBe('item:previous:end');
});
