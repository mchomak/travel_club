"use client";
import {useEffect,useRef,useState} from 'react';
import type {ItemInput,MapPlace,TripInput} from '@/lib/contracts';
import {mapsClient,type MapRouteResult} from '@/lib/maps-client';
import {getTripPlaceOptions} from '@/lib/trip-places';
import {PlaceCombobox} from './place-combobox';
import {LocationPicker} from './location-picker';

export function TransportEndpoints({item,trip,isNew,onChange}:{item:ItemInput;trip:TripInput;isNew:boolean;onChange:(patch:Partial<ItemInput>)=>void}){
 const manual=useRef({start:!isNew||!!item.map_place||!!item.departure_label,end:!isNew||!!item.map_end_place||!!item.arrival_label});
 const changeRef=useRef(onChange);useEffect(()=>{changeRef.current=onChange;},[onChange]);
 const [estimate,setEstimate]=useState<{signature:string;result:MapRouteResult|null;error:boolean}|null>(null),[retry,setRetry]=useState(0);
 const starts=getTripPlaceOptions(trip,item.day_id??'',{endpoint:'start',time:item.start_time,excludeItemId:item.id});
 const ends=getTripPlaceOptions(trip,item.end_day_id??item.day_id??'',{endpoint:'end',time:item.end_time??item.start_time,excludeItemId:item.id});
 useEffect(()=>{
  const patch:Partial<ItemInput>={};
  const start=starts.find(option=>option.place),end=ends.find(option=>option.place&&(option.place.latitude!==start?.place?.latitude||option.place.longitude!==start?.place?.longitude));
  if(!manual.current.start&&start?.place&&JSON.stringify(item.map_place)!==JSON.stringify(start.place)){patch.map_place=start.place;patch.departure_label=start.place.name;}
  if(!manual.current.end&&end?.place&&JSON.stringify(item.map_end_place)!==JSON.stringify(end.place)){patch.map_end_place=end.place;patch.arrival_label=end.place.name;}
  if(Object.keys(patch).length)changeRef.current(patch);
 },[starts,ends,item.map_place,item.map_end_place]);
 const mode=item.subtype==='taxi'||item.subtype==='car'?'drive':item.subtype==='walk'?'walk':null;
 const from=item.map_place,to=item.map_end_place;
 const signature=mode&&from&&to?`${mode}:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}`:'';
 useEffect(()=>{
  if(!signature||!from||!to||!mode)return;
  let current=true;
  void mapsClient.route(from,to,mode).then(result=>{if(current)setEstimate({signature,result,error:false});},()=>{if(current)setEstimate({signature,result:null,error:true});});
  return()=>{current=false;};
 },[signature,from,to,mode,retry]);
 function endpoint(side:'start'|'end'){
  const origin=side==='start',place=origin?from:to,label=origin?item.departure_label:item.arrival_label,options=origin?starts:ends;
  const selected=place?{key:'selected',label:place.name,description:place.address}:label?{key:'selected',label,description:'Место без адреса'}:null;
  function change(place:MapPlace|null,label:string){manual.current[side]=true;onChange(origin?{map_place:place,departure_label:label}:{map_end_place:place,arrival_label:label});}
  return <div style={{minWidth:0}}><PlaceCombobox label={origin?'Откуда':'Куда'} value={selected?'selected':null} options={[...(selected?[selected]:[]),...options]} allowCustom onCustomValue={value=>change(null,value.slice(0,200))} onChange={key=>{const option=options.find(option=>option.key===key);if(option)change(option.place,option.place?.name??option.label);}}/>
   <details><summary>{place?'Изменить привязку на карте':'Добавить адрес по ссылке'}</summary><LocationPicker label={origin?'Место отправления транспорта':'Место прибытия транспорта'} value={place??null} onChange={value=>change(value,value?.name??label??'')}/></details>
  </div>;
 }
 const current=estimate?.signature===signature?estimate:null;
 const duration=current?.result?.status==='ok'&&current.result.duration_s!==null&&Number.isFinite(current.result.duration_s)&&current.result.duration_s>=0?Math.ceil(current.result.duration_s/60):null;
 return <div className="field-wide"><div className="form-grid">{endpoint('start')}{endpoint('end')}</div>
  {mode?(!signature?<p className="field-hint">Для оценки пути нужны два места с адресом на карте.</p>:duration!==null?<p role="status" className="field-hint">{mode==='drive'?'На машине':'Пешком'}: около {duration} мин. Стоимость укажите отдельно.</p>:current?<div><p role="status" className="field-hint">Время пути недоступно. Укажите время вручную.</p><button type="button" className="text-link" onClick={()=>{if(from&&to)mapsClient.retry(from,to,mode);setRetry(value=>value+1);}}>Повторить оценку</button></div>:<p role="status" className="field-hint">Оцениваем время пути…</p>):<p className="field-hint">Время общественного транспорта укажите вручную.</p>}
 </div>;
}
