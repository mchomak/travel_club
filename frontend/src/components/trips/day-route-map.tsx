"use client";
import {useEffect,useId,useMemo,useState} from 'react';
import type {MapPlace,TripInput} from '@/lib/contracts';
import {buildDayRoute,setMapLegMode,summarizeDayRoute,formatRouteDistance,formatRouteDuration,type BoundaryResolution} from '@/lib/day-route';
import {mapsClient,mapsErrorMessage,routeCacheKey,travelModes,travelModeLabels,type MapRouteResult} from '@/lib/maps-client';
import {useMapsConfig} from '@/lib/use-maps-config';
import {formatDate} from '@/lib/trip-ui';
import {LocationPicker} from './location-picker';
import {MapCanvas} from './map-canvas';
import styles from './day-route-map.module.css';
type Result=MapRouteResult|{error:string};
export function DayRouteMap({trip,dayId,onChange}:{trip:TripInput;dayId:string;onChange:(patch:Partial<TripInput>)=>void}){
 const plan=useMemo(()=>buildDayRoute(trip,dayId),[trip,dayId]);
 const {config,error,retry:retryConfig}=useMapsConfig();
 const [attempt,setAttempt]=useState(0);
 const requestData=JSON.stringify(plan.legs.filter(leg=>leg.kind==='connection'&&leg.from.place&&leg.to.place).map(leg=>({from:leg.from.place!,to:leg.to.place!})));
 const signature=`${dayId}:${requestData}:${!!config?.routing_enabled}`;
 const [state,setState]=useState<{signature:string;values:Record<string,Result>}>({signature:'',values:{}});
 const results=state.signature===signature?state.values:{};
 useEffect(()=>{
  if(!config?.routing_enabled)return;
  let current=true;
  const requests=JSON.parse(requestData) as {from:MapPlace;to:MapPlace}[];
  requests.forEach(({from,to})=>travelModes.forEach(mode=>{
   const key=routeCacheKey(from,to,mode);
   void mapsClient.route(from,to,mode).then(result=>{if(current)setState(old=>({signature,values:{...(old.signature===signature?old.values:{}),[key]:result}}));},error=>{if(current)setState(old=>({signature,values:{...(old.signature===signature?old.values:{}),[key]:{error:mapsErrorMessage(error)}}}));});
  }));
  return()=>{current=false;};
 },[requestData,signature,config?.routing_enabled,attempt]);
 const day=trip.days.find(day=>day.id===dayId);
 if(!day)return null;
 const selected=Object.fromEntries(plan.legs.filter(leg=>leg.kind==='connection').map(leg=>{const result=leg.from.place&&leg.to.place?results[routeCacheKey(leg.from.place,leg.to.place,leg.mode)]:undefined;return [leg.key,result&&'status'in result?result:undefined];}));
 const summary=summarizeDayRoute(plan,selected);
 const geometries=Object.values(selected).flatMap(result=>result?.status==='ok'&&result.geometry?[result.geometry]:[]);
 const updateDay=(patch:Partial<TripInput['days'][number]>)=>onChange({days:trip.days.map(value=>value.id===dayId?{...value,...patch}:value)});
 const untimed=trip.items.filter(item=>item.day_id===dayId&&!item.start_time&&item.type!=='hotel').sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 function move(index:number,direction:number){const ordered=[...untimed];[ordered[index],ordered[index+direction]]=[ordered[index+direction],ordered[index]];const positions=new Map(ordered.map((item,index)=>[item.id,index]));onChange({items:trip.items.map(item=>positions.has(item.id)?{...item,position:positions.get(item.id)!}:item)});}
 const options=[...plan.start.candidates,...plan.end.candidates,...trip.items.flatMap(item=>[{key:`item:${item.id}:start`,label:item.title,place:item.map_place??null},...(item.map_end_place?[{key:`item:${item.id}:end`,label:`${item.title} — прибытие`,place:item.map_end_place}]:[])])].filter((value,index,all)=>all.findIndex(other=>other.key===value.key)===index);
 return <section className={styles.section} aria-label="Маршрут дня"><div className={styles.heading}><h2>Маршрут дня</h2><time dateTime={day.date}>{formatDate(day.date)}</time></div>
  <div className={styles.boundaries}>{(['start','end']as const).map(side=><Boundary key={side} side={side} resolution={plan[side]} value={day[side==='start'?'map_start':'map_end']??null} options={options} onChange={place=>updateDay({[side==='start'?'map_start':'map_end']:place})}/>)}</div>
  {plan.warnings.map((warning,index)=><p key={index} role="status" className={styles.warning}>{warning}</p>)}
  {!config&&!error&&<p role="status">Загружаем настройки карты…</p>}
  {!!error&&<p role="status" className={styles.notice}>{mapsErrorMessage(error)} <button type="button" className="text-link" onClick={retryConfig}>Повторить</button></p>}
  {config&&!config.maps_key&&<p className={styles.notice}>Карта ещё не настроена. Добавьте браузерный ключ Geoapify по инструкции настройки. Места, координаты и текстовый план можно сохранять сейчас.</p>}
  {config&&!config.routing_enabled&&<p>Расчёт расстояний пока не настроен. Нужен серверный ключ Geoapify.</p>}
  {config?.maps_key&&<MapCanvas label="Карта выбранного дня" mapsKey={config.maps_key} nodes={plan.nodes} geometries={geometries}/>}
  {!plan.nodes.some(node=>node.place)&&<p className={styles.notice}>Добавьте место к событию, чтобы увидеть маршрут выбранного дня.</p>}
  <ol className={styles.stops}>{plan.nodes.map((node,index)=><li key={`${node.key}:${index}`}>{node.label}{node.place?<small>{node.place.name} · {node.place.latitude}, {node.place.longitude}</small>:<small>Место не указано — уточните его в событии или выберите границу дня.</small>}</li>)}</ol>
  <div aria-label="Участки маршрута">{plan.legs.map((leg,index)=>leg.kind==='scheduled'?<div className={styles.leg} key={`${leg.key}:${index}`}><h3>{leg.from.label} → {leg.to.label}</h3><p>Запланированный переезд · {leg.departureDate} {leg.departureTime?.slice(0,5)??'время не указано'} → {leg.arrivalDate} {leg.arrivalTime?.slice(0,5)??'время не указано'}. Местные часы, без пересчёта часовых поясов. В сумму местных участков не входит.</p></div>:<div role="group" aria-label={`${leg.from.label} → ${leg.to.label}`} className={styles.leg} key={`${leg.key}:${index}`}><h3>{leg.from.label} → {leg.to.label}</h3>
   {!leg.from.place||!leg.to.place?<p>Укажите оба места. Участок не рассчитан.</p>:<><div className={styles.modes}>{travelModes.map(mode=>{const from=leg.from.place!,to=leg.to.place!,same=from.latitude===to.latitude&&from.longitude===to.longitude,result=results[routeCacheKey(from,to,mode)];return <button type="button" key={mode} aria-pressed={leg.mode===mode} className={styles.mode} onClick={()=>updateDay({map_leg_modes:setMapLegMode(day.map_leg_modes??[],leg.from.key,leg.to.key,mode)})}>{travelModeLabels[mode]}<span>{same?'На месте':result&&'status'in result&&result.status==='ok'?`${formatRouteDistance(result.distance_m)} · ${formatRouteDuration(result.duration_s)}`:result&&'error'in result?result.error:result&&'status'in result?result.message||'Нет данных':config?.routing_enabled?'Рассчитываем…':'Нет данных'}</span>{mode==='transit'&&<span>Примерно · без гарантии расписания</span>}</button>;})}</div>
   {config?.routing_enabled&&travelModes.some(mode=>{const result=results[routeCacheKey(leg.from.place!,leg.to.place!,mode)];return result&&('error'in result||result.status==='unavailable');})&&<button type="button" className="text-link" onClick={()=>{travelModes.forEach(mode=>mapsClient.retry(leg.from.place!,leg.to.place!,mode));setAttempt(value=>value+1);}}>Повторить расчёт участка</button>}</>}
  </div>)}</div>
  <div className={styles.summary} role="status">Местные участки: {formatRouteDistance(summary.distance_m)} · {formatRouteDuration(summary.duration_s)}{!summary.complete&&<p>Неполный итог · рассчитано {summary.resolved_legs} из {summary.total_legs} участков. Неизвестные места и переезды по расписанию не подменяются дорожным маршрутом.</p>}</div>
  {untimed.length>0&&<details><summary>Порядок событий без времени</summary><p>События со временем следуют расписанию. Порядок остальных можно изменить.</p>{untimed.map((item,index)=><div className={styles.actions} key={item.id}><span>{item.title}</span><button type="button" className="secondary-button" aria-label={`Переместить ${item.title} вверх`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" className="secondary-button" aria-label={`Переместить ${item.title} вниз`} disabled={index===untimed.length-1} onClick={()=>move(index,1)}>↓</button></div>)}</details>}
 </section>;
}
function Boundary({side,resolution,value,options,onChange}:{side:'start'|'end';resolution:BoundaryResolution;value:MapPlace|null;options:{key:string;label:string;place:MapPlace|null}[];onChange:(place:MapPlace|null)=>void}){
 const id=useId(),label=side==='start'?'Начало':'Конец';
 return <div className={styles.boundary}><h3>{label} дня{resolution.source==='manual'?' · выбрано вручную':''}</h3>{resolution.place&&<strong>{resolution.place.name}</strong>}<p>{resolution.explanation}</p>{resolution.source==='ambiguous'&&<p className={styles.warning}>Есть несколько вариантов. Выберите подходящий или уточните место вручную.</p>}
  <label htmlFor={id}>Выбрать {side==='start'?'начало':'конец'}</label><select id={id} value="" onChange={event=>{const option=options.find(value=>value.key===event.target.value);if(option?.place)onChange(option.place);}}><option value="">Из событий поездки…</option>{options.map(option=><option key={option.key} value={option.key} disabled={!option.place}>{option.label}{!option.place?' — место не указано':''}</option>)}</select>
  <div className={styles.actions}><button type="button" className="text-link" onClick={()=>onChange(null)}>Автоматически</button></div><details><summary>Указать своё место</summary><LocationPicker label={`${label} дня — своё место`} value={value} onChange={onChange}/></details>
 </div>;
}
