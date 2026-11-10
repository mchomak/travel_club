"use client";
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import styles from './day-route-map.module.css';
export interface PlaceOption {key:string;label:string;description?:string;group?:string;disabled?:boolean}
export interface PlaceComboboxProps {
 label:string;value:string|null;options:readonly PlaceOption[];onChange:(key:string)=>void;
 placeholder?:string;disabled?:boolean;busy?:boolean;emptyText?:string;autoFocus?:boolean;filterOptions?:boolean;
 allowCustom?:boolean;onCustomValue?:(value:string)=>void;
 inputValue?:string;onInputChange?:(value:string)=>void;
}
export function PlaceCombobox({label,value,options,onChange,placeholder='Выберите место',disabled=false,busy=false,emptyText='Ничего не найдено',autoFocus=false,filterOptions=true,allowCustom=false,onCustomValue,inputValue,onInputChange}:PlaceComboboxProps){
 const host=useRef<HTMLDivElement>(null);
 const id=useId(),[open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(-1);
 const text=inputValue??query,selected=options.find(option=>option.key===value);
 const filtered=options.filter(option=>!filterOptions||!text.trim()||`${option.label} ${option.description??''} ${option.group??''}`.toLocaleLowerCase('ru').includes(text.trim().toLocaleLowerCase('ru')));
 const custom=allowCustom&&text.trim()&&!options.some(option=>option.label.toLocaleLowerCase('ru')===text.trim().toLocaleLowerCase('ru'));
 const count=filtered.length+(custom?1:0);
 useEffect(()=>{if(open&&active>=0)document.getElementById(id+'-option-'+active)?.scrollIntoView?.({block:'nearest'});},[active,open,id]);
 const close=useCallback(()=>{setOpen(false);setActive(-1);setQuery('');},[]);
 // Radix dismisses dialogs from document capture, before React input handlers.
 useEffect(()=>{
  if(!open)return;
  const ownerWindow=host.current?.ownerDocument.defaultView;if(!ownerWindow)return;
  const dismissList=(event:KeyboardEvent)=>{if(event.key==='Escape'&&host.current?.contains(event.target as Node)){event.preventDefault();event.stopPropagation();close();}};
  ownerWindow.addEventListener('keydown',dismissList,true);
  return()=>ownerWindow.removeEventListener('keydown',dismissList,true);
 },[open,close]);
 function choose(index:number){const option=filtered[index];if(option&&!option.disabled){onChange(option.key);close();}else if(index===filtered.length&&custom){onCustomValue?.(text.trim());close();}}
 function move(direction:number){for(let step=1;step<=count;step++){const origin=active<0?(direction===1?-1:count):active;const index=(origin+direction*step+count)%count;if(index===filtered.length||!filtered[index]?.disabled){setActive(index);return;}}}
 return <div ref={host} className={styles.combobox} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))close();}}>
  <label htmlFor={`${id}-input`}>{label}</label>
  <div className={styles.comboInput}><input id={`${id}-input`} role="combobox" autoFocus={autoFocus} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={open&&active>=0?`${id}-option-${active}`:undefined} disabled={disabled} placeholder={placeholder} value={open?text:(selected?.label??inputValue??'')} onClick={()=>setOpen(true)} onFocus={()=>{setOpen(true);setActive(-1);}} onChange={event=>{setQuery(event.target.value);onInputChange?.(event.target.value);setOpen(true);setActive(-1);}} onKeyDown={event=>{if(event.key==='Escape'&&open){event.preventDefault();event.stopPropagation();close();}else if(open&&(event.key==='Home'||event.key==='End')){event.preventDefault();const available=filtered.map((option,index)=>option.disabled?-1:index).filter(index=>index>=0);if(custom)available.push(filtered.length);setActive((event.key==='Home'?available[0]:available.at(-1))??-1);}else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();setOpen(true);move(event.key==='ArrowDown'?1:-1);}else if(event.key==='Enter'&&open){event.preventDefault();if(active>=0)choose(active);else if(filtered.filter(option=>!option.disabled).length===1)choose(filtered.findIndex(option=>!option.disabled));}}}/><span aria-hidden="true">⌄</span></div>
  {!open&&selected?.description&&<span className={styles.comboDescription}>{selected.description}</span>}
  {open&&<div className={styles.comboMenu}><ul id={`${id}-list`} role="listbox" aria-label={label} aria-busy={busy}>
   {filtered.map((option,index)=><li id={`${id}-option-${index}`} role="option" aria-label={[option.label,option.description,option.group].filter(Boolean).join(' · ')} aria-selected={option.key===value} aria-disabled={option.disabled||undefined} className={active===index?styles.comboActive:undefined} key={option.key} onMouseDown={event=>event.preventDefault()} onMouseMove={()=>setActive(index)} onClick={()=>choose(index)}>{option.group&&filtered[index-1]?.group!==option.group&&<span className={styles.comboGroup}>{option.group}</span>}<span className={styles.comboLabel}>{option.label}</span>{option.description&&<span className={styles.comboDescription}>{option.description}</span>}</li>)}
   {custom&&<li id={`${id}-option-${filtered.length}`} role="option" aria-selected={false} className={active===filtered.length?styles.comboActive:undefined} onMouseDown={event=>event.preventDefault()} onClick={()=>choose(filtered.length)}>Использовать «{text.trim()}»<span className={styles.comboDescription}>Место без адреса</span></li>}
  </ul>{busy?<p role="status">Ищем места…</p>:!count&&<p role="status">{emptyText}</p>}</div>}
 </div>;
}
