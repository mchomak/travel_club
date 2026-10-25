"use client";
import {useEffect,useState} from 'react';
import {countries} from '@/lib/countries';
import {mapsClient} from '@/lib/maps-client';
import {PlaceCombobox,type PlaceOption} from './place-combobox';

export function CountryCity({label,country,city,onChange}:{label:string;country:string|null;city:string;onChange:(country:string|null,city:string)=>void}){
 const [query,setQuery]=useState(city),[options,setOptions]=useState<PlaceOption[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  if(query.trim().length<2||query===city)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   setBusy(true);setError(false);
   void mapsClient.searchCities(query.trim(),country,controller.signal).then(({places})=>{
    if(!controller.signal.aborted)setOptions(places.map((place,index)=>({key:String(index),label:place.name,description:place.address})));
   },()=>{if(!controller.signal.aborted){setOptions([]);setError(true);}}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  },350);
  return()=>{clearTimeout(timer);controller.abort();setBusy(false);};
 },[query,country,city]);
 const selected=city?{key:'selected',label:city}:null;
 return <fieldset className="field-wide" style={{minWidth:0,border:0,padding:0,margin:0}} aria-label={label}><legend>{label}</legend><div className="form-grid">
  <PlaceCombobox label={`${label} — страна`} value={country} options={[{key:'',label:'Без страны'},...countries]} onChange={key=>{if(key===(country??''))return;setQuery('');setOptions([]);setError(false);setBusy(false);onChange(key||null,'');}} placeholder="Найдите страну"/>
  <div><PlaceCombobox label={`${label} — город`} value={city?'selected':null} options={[...(selected?[selected]:[]),...options]} inputValue={query} onInputChange={value=>{setQuery(value.slice(0,120));setOptions([]);setError(false);setBusy(false);}} filterOptions={false} busy={busy} allowCustom onCustomValue={value=>{onChange(country,value.slice(0,120));setQuery(value.slice(0,120));setOptions([]);}} onChange={key=>{const option=key==='selected'?selected:options.find(option=>option.key===key);if(option){onChange(country,option.label.slice(0,120));setQuery(option.label.slice(0,120));setOptions([]);}}} placeholder="Найдите город" emptyText={query.trim().length<2?'Введите хотя бы две буквы':'Город не найден. Можно использовать своё название.'}/>
   {error&&<p role="status" className="field-hint">Не удалось найти города. Повторите ввод или используйте своё название.</p>}
  </div>
 </div>{country&&city&&<p className="field-hint">При выборе другой страны город сбросится. Аэропорт выбирается отдельно.</p>}</fieldset>;
}
