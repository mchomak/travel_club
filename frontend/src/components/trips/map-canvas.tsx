"use client";
import type { MapPlace } from '@/lib/contracts';
import {useEffect,useRef,useState} from 'react';
import 'leaflet/dist/leaflet.css';
import styles from './day-route-map.module.css';
export interface MapCanvasProps { mapsKey:string; nodes:{key:string;label:string;place:MapPlace|null}[]; geometries?:{type:'LineString';coordinates:number[][]}[]; onPick?:(latitude:number,longitude:number)=>void;label?:string }
export function MapCanvas({mapsKey,nodes,geometries=[],onPick,label='Карта маршрута'}:MapCanvasProps) {
 const host=useRef<HTMLDivElement>(null);
 const pick=useRef(onPick);
 useEffect(()=>{pick.current=onPick;},[onPick]);
 const [error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 const data=JSON.stringify({nodes,geometries});
 useEffect(()=>{
  let cancelled=false,dispose:(()=>void)|undefined;
  void import('leaflet').then(L=>{
   if(cancelled||!host.current)return;
   setError(null);
   const {nodes,geometries}=JSON.parse(data) as Pick<MapCanvasProps,'nodes'|'geometries'>;
   const map=L.map(host.current,{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([20,0],2);
   map.attributionControl.setPrefix(false);
   const tiles=L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(mapsKey)}`,{maxZoom:20,crossOrigin:'anonymous',referrerPolicy:'strict-origin-when-cross-origin',attribution:'<a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openmaptiles.org/">OpenMapTiles</a>'});
   tiles.on('tileloadstart',(event:import('leaflet').TileEvent)=>event.tile.setAttribute('referrerpolicy','strict-origin-when-cross-origin'));
   tiles.addTo(map);
   tiles.on('tileerror',()=>setError('Подложка недоступна. Проверьте сеть и ограничения браузерного ключа Geoapify. Координаты и текстовый маршрут доступны.'));
   const points:import('leaflet').LatLngExpression[]=[];
   nodes.forEach((node,index)=>{
    if(!node.place)return;
    const point:import('leaflet').LatLngExpression=[node.place.latitude,node.place.longitude];points.push(point);
    const iconText=document.createElement('span');iconText.textContent=String(index+1);
    const label=document.createElement('span');label.textContent=`${index+1}. ${node.label}`;
    const marker=L.marker(point,{title:node.label,draggable:!!pick.current,icon:L.divIcon({html:iconText,className:styles.pin,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(label).addTo(map);
    marker.on('dragend',()=>{const p=marker.getLatLng();pick.current?.(p.lat,p.lng);});
   });
   geometries?.forEach(geometry=>{const line=geometry.coordinates.map(([lng,lat])=>[lat,lng] as [number,number]);L.polyline(line,{color:'#225740',weight:4}).addTo(map);points.push(...line);});
   if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[28,28],maxZoom:15,animate:false});
   map.on('click',(event:import('leaflet').LeafletMouseEvent)=>pick.current?.(event.latlng.lat,event.latlng.lng));
   const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>map.invalidateSize({pan:false}));observer?.observe(host.current);
   dispose=()=>{observer?.disconnect();map.remove();};
  }).catch(()=>{if(!cancelled)setError('Не удалось загрузить карту. Координаты и текстовый маршрут доступны.');});
  return()=>{cancelled=true;dispose?.();};
 },[mapsKey,data,attempt]);
 return <div className={styles.canvasWrap}><div className={styles.canvas} ref={host} aria-label={label}/>{error&&<p role="status">{error} <button type="button" className="text-link" onClick={()=>setAttempt(value=>value+1)}>Повторить загрузку карты</button></p>}</div>;
}
