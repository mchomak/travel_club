"use client";
import {useEffect,useId,useRef,useState} from 'react';
import type {MapPlace} from '@/lib/contracts';
import {mapsClient,mapsErrorMessage} from '@/lib/maps-client';
import {useMapsConfig} from '@/lib/use-maps-config';
import {MapCanvas} from './map-canvas';
import styles from './day-route-map.module.css';
interface Props {value:MapPlace|null;onChange:(value:MapPlace|null)=>void;label?:string}
export function LocationPicker(props:Props){return <Picker key={JSON.stringify(props.value)} {...props}/>;}
function Picker({value,onChange,label='Место на карте'}:Props){
 const id=useId();
 const {config,error:configError,retry}=useMapsConfig();
 const [query,setQuery]=useState(''),[url,setUrl]=useState('');
 const [name,setName]=useState(value?.name??''),[address,setAddress]=useState(value?.address??'');
 const [lat,setLat]=useState(value?String(value.latitude):''),[lng,setLng]=useState(value?String(value.longitude):'');
 const [candidate,setCandidate]=useState<MapPlace|null>(value),[results,setResults]=useState<MapPlace[]>([]);
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const [searchState,setSearchState]=useState('');
 const generation=useRef(0);
 useEffect(()=>()=>{generation.current++;},[]);
 function invalidate(){generation.current++;setBusy(false);}
 useEffect(()=>{
  if(!config?.search_enabled||query.trim().length<2)return;
  let current=true;const controller=new AbortController();
  const timer=setTimeout(()=>{setSearchState('Ищем места…');void mapsClient.search(query.trim(),controller.signal).then(({places})=>{if(current){setResults(places);setSearchState(places.length?'Выберите и подтвердите место.':'Места не найдены. Уточните адрес или введите координаты.');}},error=>{if(current)setSearchState(mapsErrorMessage(error));});},350);
  return()=>{current=false;clearTimeout(timer);controller.abort();};
 },[config?.search_enabled,query]);
 function choose(place:MapPlace){invalidate();setCandidate(place);setName(place.name);setAddress(place.address);setLat(String(place.latitude));setLng(String(place.longitude));setError(null);}
 const valid=lat.trim()!==''&&lng.trim()!==''&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lng))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lng))<=180;
 const preview:MapPlace|null=valid?{name:name||'Точка на карте',address,latitude:Number(lat),longitude:Number(lng),provider:'manual'}:null;
 function confirm(){
  invalidate();
  if(!preview){setError('Укажите широту от −90 до 90 и долготу от −180 до 180.');return;}
  onChange({...preview,...(candidate&&candidate.latitude===preview.latitude&&candidate.longitude===preview.longitude?{provider:candidate.provider,provider_place_id:candidate.provider_place_id,source_url:candidate.source_url}:{}),name:name.trim()||'Точка на карте',address:address.trim()});
 }
 async function resolve(){
  const attempt=++generation.current;
  setBusy(true);setError(null);
  try{
   const result=await mapsClient.resolveLink(url);
   if(attempt!==generation.current)return;
   if(result.place)choose(result.place);
   else if(result.query){setQuery(result.query);setError('Из ссылки получен адрес. Найдите место или уточните координаты и подтвердите.');}
   else setError('В ссылке нет выбранного места. Используйте поиск или координаты.');
  }catch(error){if(attempt===generation.current)setError(mapsErrorMessage(error));}
  finally{if(attempt===generation.current)setBusy(false);}
 }
 return <fieldset className={styles.picker}><legend>{label}</legend>
  {value&&<p>Сохранено: {value.name} · {value.latitude}, {value.longitude}</p>}
  <details><summary>Найти место или вставить Google Maps ссылку</summary>
   <label htmlFor={`${id}-search`}>Название или адрес<input id={`${id}-search`} value={query} onChange={e=>{invalidate();setQuery(e.target.value);setResults([]);setSearchState('');}} placeholder="Город, название, адрес"/></label>
   {!config?.search_enabled&&<p>Поиск пока не настроен. Координаты и ссылки с выбранной точкой доступны.</p>}
   <p role="status">{searchState}</p>
   <div className={styles.results}>{results.map((place,i)=><button type="button" className="secondary-button" key={`${place.provider_place_id??place.name}-${i}`} onClick={()=>choose(place)}>{place.name} — {place.address}</button>)}</div>
   <label htmlFor={`${id}-url`}>Ссылка Google Maps<input id={`${id}-url`} inputMode="url" value={url} maxLength={2000} onChange={e=>{invalidate();setUrl(e.target.value);}}/></label>
   <button type="button" className="secondary-button" disabled={busy||!url.trim()} onClick={()=>void resolve()}>{busy?'Разбираем ссылку…':'Получить место из ссылки'}</button>
  </details>
  <label htmlFor={`${id}-name`}>Название точки<input id={`${id}-name`} maxLength={200} value={name} onChange={e=>{invalidate();setName(e.target.value);}}/></label>
  <label htmlFor={`${id}-address`}>Адрес точки<input id={`${id}-address`} maxLength={500} value={address} onChange={e=>{invalidate();setAddress(e.target.value);}}/></label>
  <div className={styles.coords}><label htmlFor={`${id}-lat`}>Широта<input id={`${id}-lat`} inputMode="decimal" value={lat} onChange={e=>{invalidate();setLat(e.target.value);}} placeholder="−90…90"/></label><label htmlFor={`${id}-lng`}>Долгота<input id={`${id}-lng`} inputMode="decimal" value={lng} onChange={e=>{invalidate();setLng(e.target.value);}} placeholder="−180…180"/></label></div>
  {config?.maps_key&&<><p>Нажмите на карту или переместите пин. Затем подтвердите место.</p><MapCanvas mapsKey={config.maps_key} nodes={preview?[{key:'pin',label:preview.name,place:preview}]:[]} onPick={(latitude,longitude)=>{invalidate();setLat(String(latitude));setLng(String(longitude));setCandidate(null);}}/></>}
  {!!configError&&<p role="status">{mapsErrorMessage(configError)} <button type="button" className="text-link" onClick={retry}>Повторить загрузку настроек</button></p>}
  {error&&<p role="alert" className="text-danger">{error}</p>}
  <div className={styles.actions}><button type="button" className="secondary-button" onClick={confirm}>Подтвердить место</button>{value&&<button type="button" className="text-link" onClick={()=>{invalidate();onChange(null);}}>Удалить привязку</button>}</div>
 </fieldset>;
}
