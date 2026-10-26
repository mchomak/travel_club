"use client";
import type {MapPlace} from '@/lib/contracts';
import {useEffect,useRef,useState} from 'react';
import 'leaflet/dist/leaflet.css';
import styles from './day-route-map.module.css';
export interface MapCanvasProps {mapsKey:string;nodes:{key:string;label:string;place:MapPlace|null;itemId?:string}[];selectedItemId?:string|null;onSelectItem?:(itemId:string)=>void;geometries?:{type:'LineString';coordinates:number[][]}[];onPick?:(latitude:number,longitude:number)=>void;label?:string}
type LayerData=Pick<MapCanvasProps,'nodes'|'geometries'|'selectedItemId'>;
export function MapCanvas({mapsKey,nodes,geometries=[],onPick,selectedItemId,onSelectItem,label='Карта маршрута'}:MapCanvasProps){
 const host=useRef<HTMLDivElement>(null),pick=useRef(onPick),select=useRef(onSelectItem);
 const latest=useRef<LayerData>({nodes,geometries,selectedItemId}),runtime=useRef<{update:(data:LayerData)=>void;retry:()=>void}|null>(null);
 const [error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 const data=JSON.stringify({nodes,geometries,selectedItemId});
 useEffect(()=>{pick.current=onPick;select.current=onSelectItem;},[onPick,onSelectItem]);
 useEffect(()=>{latest.current=JSON.parse(data) as LayerData;runtime.current?.update(latest.current);},[data]);
 useEffect(()=>{
  let cancelled=false,dispose:(()=>void)|undefined;
  void import('leaflet').then(L=>{
   if(cancelled||!host.current)return;
   setError(null);
   const map=L.map(host.current,{scrollWheelZoom:false,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([20,0],2);
   map.attributionControl.setPrefix(false);
   const tiles=L.tileLayer(`https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${encodeURIComponent(mapsKey)}`,{maxZoom:20,crossOrigin:'anonymous',referrerPolicy:'strict-origin-when-cross-origin',attribution:'<a href="https://www.geoapify.com/">Geoapify</a> | © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openmaptiles.org/">OpenMapTiles</a>'});
   tiles.on('tileloadstart',(event:import('leaflet').TileEvent)=>event.tile.setAttribute('referrerpolicy','strict-origin-when-cross-origin'));
   tiles.on('tileerror',()=>{if(!cancelled)setError('Подложка недоступна. Проверьте соединение и повторите. Места и текстовый маршрут сохранены.');});
   tiles.addTo(map);
   const layers=L.layerGroup().addTo(map);
   let points:import('leaflet').LatLngExpression[]=[],boundsSignature='';
   const fit=()=>{if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[28,28],maxZoom:15,animate:false});};
   function update({nodes,geometries,selectedItemId}:LayerData){
    layers.clearLayers();points=[];
    nodes.forEach((node,index)=>{
     if(!node.place)return;
     const point:import('leaflet').LatLngExpression=[node.place.latitude,node.place.longitude];points.push(point);
     const iconText=document.createElement('span');iconText.textContent=String(index+1);
     const popup=document.createElement('span');popup.textContent=`${index+1}. ${node.label}`;
     const marker=L.marker(point,{title:node.label,draggable:!!pick.current,icon:L.divIcon({html:iconText,className:`${styles.pin}${node.itemId&&node.itemId===selectedItemId?` ${styles.selectedPin}`:""}`,iconSize:[30,30],iconAnchor:[15,15]})}).bindPopup(popup).addTo(layers);
     if(node.itemId&&selectedItemId!=null)marker.getElement()?.setAttribute('aria-pressed',String(node.itemId===selectedItemId));
     marker.on('click',()=>{if(node.itemId)select.current?.(node.itemId);});
     marker.on('dragend',()=>{const p=marker.getLatLng();pick.current?.(p.lat,p.lng);});
    });
    geometries?.forEach(geometry=>{const line=geometry.coordinates.map(([lng,lat])=>[lat,lng] as [number,number]);L.polyline(line,{color:'#225740',weight:4}).addTo(layers);points.push(...line);});
    const signature=JSON.stringify({nodes:nodes.map(node=>[node.key,node.place?.latitude,node.place?.longitude]),geometries});
    if(signature!==boundsSignature){boundsSignature=signature;fit();}
   }
   runtime.current={update,retry:()=>{setError(null);tiles.redraw();}};
   update(latest.current);
   map.on('click',(event:import('leaflet').LeafletMouseEvent)=>pick.current?.(event.latlng.lat,event.latlng.lng));
   let width=host.current.clientWidth,height=host.current.clientHeight;
   const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>{if(!host.current)return;const nextWidth=host.current.clientWidth,nextHeight=host.current.clientHeight;if(nextWidth===width&&nextHeight===height)return;width=nextWidth;height=nextHeight;map.invalidateSize({pan:false});fit();});
   observer?.observe(host.current);
   dispose=()=>{runtime.current=null;observer?.disconnect();map.remove();};
  }).catch(()=>{if(!cancelled)setError('Не удалось загрузить карту. Текстовый маршрут доступен.');});
  return()=>{cancelled=true;dispose?.();};
 },[mapsKey,attempt]);
 return <div className={styles.canvasWrap}><div className={styles.canvas} ref={host} aria-label={label}/>{error&&<p role="status">{error} <button type="button" className="text-link" onClick={()=>{if(runtime.current)runtime.current.retry();else setAttempt(value=>value+1);}}>Повторить загрузку карты</button></p>}</div>;
}
