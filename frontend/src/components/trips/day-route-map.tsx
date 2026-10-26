"use client";
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {ItemInput,MapPlace,TripInput} from '@/lib/contracts';
import {buildDayRoute,setMapLegMode,summarizeDayRoute,formatRouteDistance,formatRouteDuration,type BoundaryResolution,type RouteLeg} from '@/lib/day-route';
import {mapsClient,mapsErrorMessage,routeCacheKey,travelModeLabels,type MapRouteResult} from '@/lib/maps-client';
import {autoTransferRouteKey,autoTransferStatus,planAutoTransfer,refreshAutoTransfer,type AutoTransferPlan} from '@/lib/auto-transfers';
import {getTripPlaceOptions,type TripPlaceOption} from '@/lib/trip-places';
import {useMapsConfig} from '@/lib/use-maps-config';
import {formatDate} from '@/lib/trip-ui';
import {LocationPicker} from './location-picker';
import {PlaceCombobox} from './place-combobox';
import {MapCanvas} from './map-canvas';
import styles from './day-route-map.module.css';

type Result=MapRouteResult|{error:string};
const localModes=['drive','walk'] as const;
export interface DayRouteMapProps {
 trip:TripInput;dayId:string;onChange:(patch:Partial<TripInput>)=>void;
 onAddTransfer?:(item:ItemInput)=>void;onOpenItem?:(itemId:string)=>void;
 hideBoundaries?:boolean;selectedItemId?:string|null;onSelectItem?:(itemId:string)=>void;
}
export function DayRouteMap({trip,dayId,onChange,onAddTransfer,onOpenItem,hideBoundaries=false,selectedItemId,onSelectItem}:DayRouteMapProps){
 const latest=useRef({trip,onChange,onAddTransfer});
 useLayoutEffect(()=>{latest.current={trip,onChange,onAddTransfer};},[trip,onChange,onAddTransfer]);
 const plan=useMemo(()=>buildDayRoute(trip,dayId),[trip,dayId]);
 const {config,error,retry:retryConfig}=useMapsConfig();
 const [attempt,setAttempt]=useState(0);
 const requestData=JSON.stringify([...new Map(plan.legs.filter(leg=>leg.kind==='connection'&&leg.from.place&&leg.to.place).flatMap(leg=>(leg.itemId?[leg.mode]:localModes).map(mode=>({from:leg.from.place!,to:leg.to.place!,mode}))).map(request=>[routeCacheKey(request.from,request.to,request.mode),request])).values()]);
 const signature=`${dayId}:${requestData}:${!!config?.routing_enabled}`;
 const [state,setState]=useState<{signature:string;values:Record<string,Result>}>({signature:'',values:{}});
 const results=state.signature===signature?state.values:{};
 useEffect(()=>{
  if(!config?.routing_enabled)return;
  let current=true;
  const requests=JSON.parse(requestData) as {from:MapPlace;to:MapPlace;mode:'drive'|'walk'}[];
  requests.forEach(({from,to,mode})=>{
   const key=routeCacheKey(from,to,mode);
   void mapsClient.route(from,to,mode).then(result=>{if(current)setState(old=>({signature,values:{...(old.signature===signature?old.values:{}),[key]:result}}));},error=>{if(current)setState(old=>({signature,values:{...(old.signature===signature?old.values:{}),[key]:{error:mapsErrorMessage(error)}}}));});
  });
  return()=>{current=false;};
 },[requestData,signature,config?.routing_enabled,attempt]);
 const day=trip.days.find(day=>day.id===dayId);
 if(!day)return null;
 const selected=Object.fromEntries(plan.legs.filter(leg=>leg.kind==='connection').map(leg=>{const result=leg.from.place&&leg.to.place?results[routeCacheKey(leg.from.place,leg.to.place,leg.mode)]:undefined;return [leg.key,result&&'status'in result?result:undefined];}));
 const summary=summarizeDayRoute(plan,selected);
 const geometries=Object.values(selected).flatMap(result=>result?.status==='ok'&&result.geometry?[result.geometry]:[]);
 const updateDay=(patch:Partial<TripInput['days'][number]>)=>onChange({days:trip.days.map(value=>value.id===dayId?{...value,...patch}:value)});
 const applyTransfer=(item:ItemInput)=>{const current=latest.current;return current.onAddTransfer?current.onAddTransfer(item):current.onChange({items:current.trip.items.some(value=>value.id===item.id)?current.trip.items.map(value=>value.id===item.id?item:value):[...current.trip.items,item]});};
 const untimed=trip.items.filter(item=>item.day_id===dayId&&!item.start_time&&item.type!=='hotel').sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 function move(index:number,direction:number){const ordered=[...untimed];[ordered[index],ordered[index+direction]]=[ordered[index+direction],ordered[index]];const positions=new Map(ordered.map((item,index)=>[item.id,index]));onChange({items:trip.items.map(item=>positions.has(item.id)?{...item,position:positions.get(item.id)!}:item)});}
 const savedTransfers=trip.items.filter(item=>item.auto_transfer&&item.day_id===dayId);
 return <section className={styles.section} aria-label="Маршрут дня"><div className={styles.heading}><h2>Маршрут дня</h2><time dateTime={day.date}>{formatDate(day.date)}</time></div>
  {!hideBoundaries&&<DayRouteBoundaries trip={trip} dayId={dayId} onChange={onChange}/>}
  {plan.warnings.map((warning,index)=><p key={index} role="status" className={styles.warning}>{warning}</p>)}
  {savedTransfers.map(item=>{const status=autoTransferStatus(trip,item);return status.stale?<div key={item.id} className={styles.notice} role="status"><strong>{item.title}</strong><p>{status.state==='source_missing'?'Исходное место удалено или не указано. Переезд сохранён: уточните его вручную.':'Исходные места или расписание изменились. Сохранённое время переезда осталось прежним.'}</p>{onOpenItem&&<button type="button" className="text-link" onClick={()=>onOpenItem(item.id)}>Редактировать {item.title}</button>}</div>:null;})}
  {!config&&!error&&<p role="status">Загружаем настройки карты…</p>}
  {!!error&&<p role="status" className={styles.notice}>{mapsErrorMessage(error)} <button type="button" className="text-link" onClick={retryConfig}>Повторить</button></p>}
  {config&&!config.maps_key&&<p className={styles.notice}>Карта ещё не настроена. Добавьте браузерный ключ Geoapify по инструкции настройки. Места и текстовый план можно сохранять сейчас.</p>}
  {config&&!config.routing_enabled&&<p>Расчёт расстояний пока не настроен. Нужен серверный ключ Geoapify.</p>}
  {config?.maps_key&&<MapCanvas label="Карта выбранного дня" mapsKey={config.maps_key} nodes={plan.nodes} geometries={geometries} selectedItemId={selectedItemId} onSelectItem={onSelectItem}/>}
  {!plan.nodes.some(node=>node.place)&&<p className={styles.notice}>Добавьте место к событию, чтобы увидеть маршрут выбранного дня.</p>}
  <ol className={styles.stops}>{plan.nodes.map((node,index)=><li key={`${node.key}:${index}`} aria-current={node.itemId&&selectedItemId===node.itemId?"true":undefined}>{onSelectItem&&node.itemId?<button type="button" className="text-link" aria-label={`Выбрать ${node.label}`} onClick={()=>onSelectItem(node.itemId!)}>{node.label}</button>:node.label}{node.place?<small>{[node.place.name,node.place.address].filter(Boolean).join(' · ')}</small>:<small>Место не указано — уточните его в событии или выберите границу дня.</small>}</li>)}</ol>
  <div aria-label="Участки маршрута">{plan.legs.map((leg,index)=>leg.kind==='scheduled'?<div className={styles.leg} key={`${leg.key}:${index}`}><h3>{leg.from.label} → {leg.to.label}</h3><p>Запланированный переезд · {leg.departureDate} {leg.departureTime?.slice(0,5)??'время не указано'} → {leg.arrivalDate} {leg.arrivalTime?.slice(0,5)??'время не указано'}. Местные часы, без пересчёта часовых поясов. В сумму местных участков не входит.</p></div>:<div role="group" aria-label={`${leg.from.label} → ${leg.to.label}`} className={styles.leg} key={`${leg.key}:${index}`}><h3>{leg.from.label} → {leg.to.label}</h3>
   {!leg.from.place||!leg.to.place?<p>Укажите оба места. Участок не рассчитан.</p>:<><div className={styles.modes}>{(leg.itemId?[leg.mode]:localModes).map(mode=>{const from=leg.from.place!,to=leg.to.place!,same=from.latitude===to.latitude&&from.longitude===to.longitude,result=results[routeCacheKey(from,to,mode)];return <button type="button" key={mode} aria-pressed={leg.mode===mode} className={styles.mode} disabled={!!leg.itemId} onClick={()=>updateDay({map_leg_modes:setMapLegMode(day.map_leg_modes??[],leg.from.key,leg.to.key,mode)})}>{travelModeLabels[mode]}<span>{same?'На месте':result&&'status'in result&&result.status==='ok'?`${formatRouteDistance(result.distance_m)} · ${formatRouteDuration(result.duration_s)}`:result&&'error'in result?result.error:result&&'status'in result?result.message||'Нет данных':config?.routing_enabled?'Рассчитываем…':'Нет данных'}</span></button>;})}</div>
   {config?.routing_enabled&&localModes.some(mode=>{const result=results[routeCacheKey(leg.from.place!,leg.to.place!,mode)];return result&&('error'in result||result.status==='unavailable');})&&<button type="button" className="text-link" onClick={()=>{localModes.forEach(mode=>mapsClient.retry(leg.from.place!,leg.to.place!,mode));setAttempt(value=>value+1);}}>Повторить расчёт участка</button>}
   <TransferAction key={`${dayId}:${leg.key}:${leg.mode}`} trip={trip} leg={leg} result={results[routeCacheKey(leg.from.place,leg.to.place,leg.mode)]} routingEnabled={!!config?.routing_enabled} onApply={applyTransfer} onOpenItem={onOpenItem}/></>}
  </div>)}</div>
  <div className={styles.summary} role="status">Местные участки: {formatRouteDistance(summary.distance_m)} · {formatRouteDuration(summary.duration_s)}{!summary.complete&&<p>Неполный итог · рассчитано {summary.resolved_legs} из {summary.total_legs} участков. Неизвестные места и переезды по расписанию не подменяются дорожным маршрутом.</p>}</div>
  {untimed.length>0&&<details><summary>Порядок событий без времени</summary><p>События со временем следуют расписанию. Порядок остальных можно изменить.</p>{untimed.map((item,index)=><div className={styles.actions} key={item.id}><span>{item.title}</span><button type="button" className="secondary-button" aria-label={`Переместить ${item.title} вверх`} disabled={index===0} onClick={()=>move(index,-1)}>↑</button><button type="button" className="secondary-button" aria-label={`Переместить ${item.title} вниз`} disabled={index===untimed.length-1} onClick={()=>move(index,1)}>↓</button></div>)}</details>}
 </section>;
}

export type DayRouteBoundariesProps=Pick<DayRouteMapProps,'trip'|'dayId'|'onChange'>;
/** Boundary controls have no map/provider state and derive from the same aggregate. */
export function DayRouteBoundaries({trip,dayId,onChange}:DayRouteBoundariesProps){
 const plan=useMemo(()=>buildDayRoute(trip,dayId),[trip,dayId]);
 const day=trip.days.find(value=>value.id===dayId);
 const options=getTripPlaceOptions(trip,dayId);
 if(!day)return null;
 return <div className={styles.boundaries}>{(['start','end']as const).map(side=><Boundary key={`${dayId}:${side}`} side={side} resolution={plan[side]} value={day[side==='start'?'map_start':'map_end']??null} options={options} onChange={(place,source)=>onChange({days:trip.days.map(value=>value.id===dayId?{...value,[side==='start'?'map_start':'map_end']:place}:value),...(source?.itemId&&place?{items:trip.items.map(item=>item.id===source.itemId?{...item,[source.endpoint==='end'?'map_end_place':'map_place']:place}:item)}:{})})}/>)}</div>;
}

function samePlace(a:MapPlace|null,b:MapPlace|null){return !!a&&!!b&&a.latitude===b.latitude&&a.longitude===b.longitude;}
function Boundary({side,resolution,value,options,onChange}:{side:'start'|'end';resolution:BoundaryResolution;value:MapPlace|null;options:TripPlaceOption[];onChange:(place:MapPlace|null,source?:TripPlaceOption)=>void}){
 const label=side==='start'?'Начало дня':'Конец дня';
 const [pending,setPending]=useState<TripPlaceOption|'new'|null>(null);
 const autoLabel=`Автоматически${resolution.source!=='manual'&&resolution.place?` · ${resolution.place.name}`:''}`;
 const own=value&&!options.some(option=>samePlace(option.place,value));
 const selected=value?(options.find(option=>samePlace(option.place,value))?.key??'own'):'auto';
 return <div className={styles.boundary}>
  <PlaceCombobox label={label} value={pending==='new'?'new':pending?.key??selected} options={[{key:'auto',label:autoLabel,description:resolution.source==='manual'?'По отелю или ночному прибытию':[resolution.place?.address,resolution.explanation].filter(Boolean).join(' · ')},...options,...(own?[{key:'own',label:value.name,description:value.address}]:[]),{key:'new',label:'Указать своё место',description:'Добавить ссылку Google Maps'}]} onChange={key=>{if(key==='auto'){setPending(null);onChange(null);}else if(key==='new'||key==='own'){setPending('new');}else{const option=options.find(option=>option.key===key);if(option?.place){setPending(null);onChange(option.place);}else if(option)setPending(option);}}}/>
  {resolution.source==='ambiguous'&&<p className={styles.warning}>Есть несколько вариантов. Выберите подходящее место.</p>}
  {pending&&<div className={styles.boundaryPicker}>{pending!=='new'&&<p>Укажите место события «{pending.label}». Оно сохранится и в событии, и как {label.toLowerCase()}.</p>}<LocationPicker label={pending==='new'?`${label} — своё место`:`Место события «${pending.label}»`} value={pending==='new'?value:null} onChange={place=>{if(place){onChange(place,pending==='new'?undefined:pending);setPending(null);}else if(pending==='new')onChange(null);}}/><button type="button" className="text-link" onClick={()=>setPending(null)}>Отмена</button></div>}
 </div>;
}

function TransferAction({trip,leg,result,routingEnabled,onApply,onOpenItem}:{trip:TripInput;leg:RouteLeg;result:Result|undefined;routingEnabled:boolean;onApply:(item:ItemInput)=>void;onOpenItem?:DayRouteMapProps['onOpenItem']}){
 const latest=useRef(trip),active=useRef(true);
 useLayoutEffect(()=>{latest.current=trip;},[trip]);
 useEffect(()=>{active.current=true;return()=>{active.current=false;};},[]);
 const [arrivalDate,setArrivalDate]=useState(leg.to.date??trip.days[0]?.date??trip.start_date),[arrivalTime,setArrivalTime]=useState('');
 const [failure,setFailure]=useState<Extract<AutoTransferPlan,{ok:false}>|null>(null),[busy,setBusy]=useState(false);
 const [notice,setNotice]=useState(''),[arrivalRequested,setArrivalRequested]=useState(false);
 const duplicate=planAutoTransfer(trip,leg,{status:'unavailable',distance_m:null,duration_s:null});
 const savedId=leg.itemId??(!duplicate.ok?duplicate.existingItemId:undefined);
 const saved=trip.items.find(item=>item.id===savedId);
 const status=saved?autoTransferStatus(trip,saved):null;
 const measurement=result&&'status'in result?result:undefined;
 const routeKey=autoTransferRouteKey(leg);
 const options={arrivalDate,arrivalTime:arrivalTime||undefined,routeKey:routeKey??undefined};
 const preview=!saved&&measurement?planAutoTransfer(trip,leg,measurement,options):null;
 const initialPlan=!saved&&measurement?planAutoTransfer(trip,leg,measurement,{routeKey:routeKey??undefined}):null;
 const needsArrival=initialPlan&&!initialPlan.ok&&initialPlan.requiresArrivalTime||arrivalRequested;
 const same=samePlace(leg.from.place,leg.to.place);
 function apply(plan:AutoTransferPlan){if(plan.ok){setFailure(null);setNotice('');onApply(plan.item);}else{if(plan.requiresArrivalTime)setArrivalRequested(true);setFailure(plan);setNotice('');}}
 async function submit(allowConflict=false){
  if(saved){
   const current=autoTransferStatus(latest.current,saved);
   if(!current.leg?.from.place||!current.leg.to.place){setNotice('Исходное место не найдено. Переезд сохранён; уточните его вручную.');return;}
   const requestedKey=autoTransferRouteKey(current.leg)!;
   setBusy(true);setNotice('');
   try{const fresh=await mapsClient.route(current.leg.from.place,current.leg.to.place,current.leg.mode);if(!active.current)return;const actual=latest.current.items.find(item=>item.id===saved.id);if(!actual){setNotice('Переезд уже удалён. Выберите участок заново.');return;}apply(refreshAutoTransfer(latest.current,actual,fresh,{arrivalDate,arrivalTime:arrivalTime||undefined,allowConflict,routeKey:requestedKey}));}
   catch(error){setNotice(mapsErrorMessage(error));}finally{setBusy(false);}
  }else if(measurement)apply(planAutoTransfer(latest.current,leg,measurement,{...options,allowConflict}));
 }
 if(same&&!saved)return null;
 return <div className={styles.transferAction}>
  {needsArrival&&<div className={styles.arrivalInputs}><label>Прибыть к — дата<input type="date" value={arrivalDate} min={trip.start_date} max={trip.end_date} onChange={event=>{setArrivalDate(event.target.value);setFailure(null);}}/></label><label>Прибыть к — местное время<input type="time" value={arrivalTime} onChange={event=>{setArrivalTime(event.target.value);setFailure(null);}}/></label></div>}
  {saved?<><p><strong>{saved.title}</strong> · {saved.start_time?.slice(0,5)}–{saved.end_time?.slice(0,5)}{saved.price_pending?' · Стоимость не указана':''}</p>{onOpenItem&&<button type="button" className="text-link" onClick={()=>onOpenItem(saved.id)}>Открыть трансфер</button>}{status?.stale&&status.leg&&<button type="button" className="secondary-button" disabled={busy||!routingEnabled} onClick={()=>void submit()}>Обновить трансфер по исходным событиям</button>}</>:<>
   {preview?.ok&&<p>{preview.item.start_time}–{preview.item.end_time} · {leg.mode==='drive'?'Такси · стоимость нужно указать отдельно':'Пеший переход · бесплатно'}</p>}
   <button type="button" className="secondary-button" disabled={!measurement||measurement.status!=='ok'||busy} onClick={()=>void submit()}>Добавить трансфер в маршрут</button>
  </>}
  {failure&&<div className={styles.warning} role="alert"><p>{failure.message}</p>{failure.conflicts.length>0&&<ul>{failure.conflicts.map(conflict=><li key={conflict.itemId}>{conflict.title}: {conflict.message}</li>)}</ul>}{failure.reason==='conflict'&&<button type="button" className="secondary-button" disabled={busy} onClick={()=>void submit(true)}>Подтверждаю добавление с конфликтом</button>}{failure.existingItemId&&onOpenItem&&<button type="button" className="text-link" onClick={()=>onOpenItem(failure.existingItemId!)}>Открыть существующий трансфер</button>}</div>}
  {notice&&<p role="alert" className={styles.warning}>{notice}</p>}{busy&&<p role="status">Обновляем маршрут…</p>}
 </div>;
}
