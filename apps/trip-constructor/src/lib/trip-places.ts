import type {TripInput,MapPlace} from './contracts';
import {nextDate} from './pricing';
export interface TripPlaceOption {key:string;label:string;description:string;group:string;place:MapPlace|null;itemId?:string;endpoint?:'start'|'end';date?:string;time?:string}
export interface TripPlaceOptions {endpoint?:'start'|'end';time?:string|null;excludeItemId?:string}
export function getTripPlaceOptions(trip:TripInput,dayId:string,options:TripPlaceOptions={}):TripPlaceOption[]{
 const day=trip.days.find(day=>day.id===dayId);if(!day)return [];
 const result:TripPlaceOption[]=[];
 for(const item of trip.items){
  if(item.id===options.excludeItemId)continue;
  const startDate=item.type==='hotel'?(item.check_in??trip.days.find(day=>day.id===item.day_id)?.date):trip.days.find(day=>day.id===item.day_id)?.date;
  if(!startDate&&item.type!=='hotel')continue;
  const transport=['flight','train_bus','transfer'].includes(item.type);
  const endDate=trip.days.find(day=>day.id===item.end_day_id)?.date??(startDate&&item.start_time&&item.end_time&&item.end_time<item.start_time?nextDate(startDate):startDate);
  const endpoints:('start'|'end')[]=transport||item.map_end_place?['start','end']:['start'];
  for(const endpoint of endpoints){
   const place=endpoint==='start'?item.map_place??null:item.map_end_place??null;
   const activeHotel=item.type==='hotel'&&item.check_in&&item.check_out&&item.check_in<=day.date&&day.date<=item.check_out;
   const date=activeHotel?day.date:endpoint==='start'?startDate:endDate;
   const time=(endpoint==='start'?item.start_time:item.end_time)?.slice(0,5);
   const endpointLabel=transport?(endpoint==='start'?'Отправление':'Прибытие'):'';
   const customLabel=item[endpoint==='start'?'departure_label':'arrival_label'];
   result.push({key:`item:${item.id}:${endpoint}`,label:customLabel||item.title||place?.name||'Без названия',description:[dateLabel(date),time,endpointLabel,place?.name!==item.title?place?.name:'',place?.address||(!place?'Место без адреса':'')].filter(Boolean).join(' · '),group:!place?'Без адреса':date===day.date?`Текущий день · ${dateLabel(date)}`:`Другие дни · ${dateLabel(date)}`,place,itemId:item.id,endpoint,date,time});
  }
 }
 const group=(option:TripPlaceOption)=>!option.place?2:option.date===day.date?0:1;
 const rank=(option:TripPlaceOption):readonly [number,number,number]=>{
  if(!options.endpoint)return [0,0,0];
  const item=trip.items.find(item=>item.id===option.itemId)!;
  const transport=['flight','train_bus','transfer'].includes(item.type);
  const endpointMismatch=Number(transport&&option.endpoint!==(options.endpoint==='start'?'end':'start'));
  const time=option.time??(item.type!=='hotel'&&options.endpoint==='start'?item.end_time?.slice(0,5):undefined);
  if(!time||!option.date)return [1,endpointMismatch,0];
  const target=Date.parse(day.date+'T'+(options.time||(options.endpoint==='start'?'23:59':'00:00'))+':00Z');
  const instant=Date.parse(option.date+'T'+time+':00Z');
  if(!Number.isFinite(target)||!Number.isFinite(instant))return [1,endpointMismatch,0];
  const wrongDirection=options.endpoint==='start'?instant>target:instant<target;
  return [wrongDirection?2:0,endpointMismatch,Math.abs(target-instant)];
 };
 const compareRank=(a:TripPlaceOption,b:TripPlaceOption)=>{
  const left=rank(a),right=rank(b);
  return left[0]-right[0]||left[1]-right[1]||left[2]-right[2];
 };
 return result.sort((a,b)=>(options.endpoint?Number(!a.place)-Number(!b.place)||compareRank(a,b):group(a)-group(b))||(a.date??'9999').localeCompare(b.date??'9999')||(a.time??'99:99').localeCompare(b.time??'99:99')||a.key.localeCompare(b.key));
}
function dateLabel(date:string|undefined){return date?`${date.slice(8,10)}.${date.slice(5,7)}`:'Без даты';}
