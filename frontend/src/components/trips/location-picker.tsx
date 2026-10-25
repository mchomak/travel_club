"use client";
import {useEffect,useId,useRef,useState} from 'react';
import type {MapPlace} from '@/lib/contracts';
import {mapsClient,mapsErrorMessage} from '@/lib/maps-client';
import {useMapsConfig} from '@/lib/use-maps-config';
import {PlaceCombobox} from './place-combobox';
import styles from './day-route-map.module.css';
export interface LocationPickerProps {value:MapPlace|null;onChange:(value:MapPlace|null)=>void;label?:string}
export function LocationPicker(props:LocationPickerProps){return <Picker key={JSON.stringify(props.value)} {...props}/>;}
function Picker({value,onChange,label='Место на карте'}:LocationPickerProps){
 const id=useId(),{config}=useMapsConfig();
 const [pointCandidate,setPointCandidate]=useState<MapPlace|null>(null),[selected,setSelected]=useState(value),[editing,setEditing]=useState(!value),[url,setUrl]=useState(value?.source_url??'');
 const [query,setQuery]=useState(''),[fallback,setFallback]=useState(false),[results,setResults]=useState<MapPlace[]>([]);
 const [error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false),[searching,setSearching]=useState(false),[searchState,setSearchState]=useState('');
 const generation=useRef(0),urlTimer=useRef<ReturnType<typeof setTimeout>|null>(null),lastResolved=useRef('');
 useEffect(()=>()=>{generation.current++;if(urlTimer.current)clearTimeout(urlTimer.current);},[]);
 function invalidate(){generation.current++;setBusy(false);setSearching(false);if(urlTimer.current)clearTimeout(urlTimer.current);}
 function choose(place:MapPlace,sourceUrl=url){invalidate();const confirmed={...place,...(sourceUrl.trim()?{source_url:sourceUrl.trim()}:{})};setSelected(confirmed);setEditing(false);setError(null);onChange(confirmed);}
 async function resolve(link:string){
  if(!link.trim())return;
  if(urlTimer.current)clearTimeout(urlTimer.current);
  const attempt=++generation.current;lastResolved.current=link;setBusy(true);setError(null);setPointCandidate(null);setResults([]);setFallback(false);setQuery('');
  try{const result=await mapsClient.resolveLink(link.trim());if(attempt!==generation.current)return;
   if(result.place){
    let point=result.place;
    if(!point.name.trim()||numericLabel(point.name)){
     point={...point,name:'Точка из Google Maps'};
     if(config?.search_enabled){
      const controller=new AbortController();
      try{const {place:details}=await mapsClient.reverse(point.latitude,point.longitude,controller.signal);if(attempt!==generation.current)return;point={...point,name:details.name&&!numericLabel(details.name)?details.name:point.name,address:details.address};}catch{if(attempt!==generation.current)return;}
     }
    }
    setPointCandidate({...point,source_url:link.trim()});
   }
   else if(result.query){setQuery(result.query);setFallback(true);setSearchState('Выберите подходящее место.');}
   else{setFallback(true);setError('В ссылке нет выбранного места. Найдите его по названию или адресу.');}
  }catch{if(attempt===generation.current){setFallback(true);setError('Не удалось определить место по ссылке. Проверьте ссылку или найдите место по названию.');}}
  finally{if(attempt===generation.current)setBusy(false);}
 }
 useEffect(()=>{
  if(!fallback||query.trim().length<2||!config?.search_enabled)return;
  const attempt=generation.current,controller=new AbortController();let current=true;
  const timer=setTimeout(()=>{setSearching(true);setSearchState('');void mapsClient.search(query.trim(),controller.signal).then(({places})=>{if(current&&attempt===generation.current){setResults(places);setSearchState(places.length?'Выберите подходящее место.':'Места не найдены. Уточните название или адрес.');setSearching(false);}},error=>{if(current&&attempt===generation.current){setSearchState(mapsErrorMessage(error).replace('Можно указать координаты или ссылку Google Maps.','Попробуйте ссылку Google Maps.').replace('поиск или ручные координаты.','или уточните название.'));setSearching(false);}});},350);
  return()=>{current=false;clearTimeout(timer);controller.abort();};
 },[config?.search_enabled,fallback,query]);
 return <fieldset className={styles.picker}><legend>{label}</legend>
  {selected&&!editing?<div className={styles.selectedPlace}><div><strong>{numericLabel(selected.name)?'Точка из Google Maps':selected.name}</strong><span>{selected.address&&!numericLabel(selected.address)?selected.address:'Адрес не определён'}</span></div><button type="button" className="text-link" onClick={()=>{setEditing(true);if(url.trim())void resolve(url);}}>Изменить место</button></div>:<>
   <label htmlFor={`${id}-url`}>Ссылка Google Maps</label><div className={styles.urlRow}><input id={`${id}-url`} inputMode="url" placeholder="Вставьте ссылку на место" value={url} maxLength={2000} onChange={event=>{invalidate();setError(null);setPointCandidate(null);setResults([]);setFallback(false);const next=event.target.value;setUrl(next);urlTimer.current=setTimeout(()=>void resolve(next),500);}} onBlur={()=>{if(url.trim()&&url!==lastResolved.current)void resolve(url);}}/><button type="button" className="secondary-button" disabled={busy||!url.trim()} onClick={()=>void resolve(url)}>{busy?'Ищем…':'Найти'}</button></div>
   {selected&&<button type="button" className="text-link" onClick={()=>{invalidate();setEditing(false);}}>Оставить выбранное место</button>}
   {busy&&<p role="status">Определяем место по ссылке…</p>}
   {pointCandidate&&<PlaceCombobox autoFocus filterOptions={false} label="Выберите место" value={null} options={[{key:"point",label:pointCandidate.name,description:pointCandidate.address||"Адрес не определён"}]} onChange={()=>choose(pointCandidate)}/>}{fallback&&<><PlaceCombobox autoFocus filterOptions={false} label="Название или адрес" value={null} options={results.map((place,index)=>({key:String(index),label:place.name,description:place.address}))} inputValue={query} onInputChange={next=>{invalidate();setQuery(next);setResults([]);setSearchState('');}} onChange={key=>{const place=results[Number(key)];if(place)choose(place);}} busy={searching} emptyText={searchState||'Введите хотя бы два символа'}/>{!config?.search_enabled&&<p role="status">Поиск сейчас недоступен. Попробуйте ссылку с выбранной точкой.</p>}{searchState&&<p role="status">{searchState}</p>}</>}
   {error&&<p role="alert" className="text-danger">{error}</p>}
  </>}
  {selected&&<div className={styles.actions}><button type="button" className="text-link" onClick={()=>{invalidate();setSelected(null);setEditing(true);setUrl('');setFallback(false);setResults([]);onChange(null);}}>Удалить привязку</button></div>}
 </fieldset>;
}


function numericLabel(value:string){return /^\s*[+-]?\d+(?:\.\d+)?\s*[,;]\s*[+-]?\d+(?:\.\d+)?\s*$/.test(value);}
