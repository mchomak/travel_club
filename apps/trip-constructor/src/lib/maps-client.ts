import type { MapPlace, TravelMode } from './contracts';
import { apiRequest, ApiError } from './api';
export interface MapCity extends MapPlace { country_code:string }
export interface MapsConfig { maps_key:string|null; search_enabled:boolean; routing_enabled:boolean }
export interface MapRouteResult { status:'ok'|'unavailable'; distance_m:number|null; duration_s:number|null; geometry:{type:'LineString';coordinates:number[][]}|null; approximate:boolean; message:string|null }
export const travelModes:TravelMode[]=['drive','walk','transit'];
export const travelModeLabels:Record<TravelMode,string>={drive:'Машина',walk:'Пешком',transit:'Транспорт'};
export function routeCacheKey(from:MapPlace,to:MapPlace,mode:TravelMode) { return `${from.latitude},${from.longitude}:${to.latitude},${to.longitude}:${mode}`; }
export function mapsErrorMessage(error:unknown) {
  if(error instanceof ApiError && (error.status===429||error.code==='provider_rate_limited')) return 'Слишком много запросов. Подождите и повторите.';
  if(error instanceof ApiError && /not_configured/i.test(error.code)) return 'Сервис карт ещё не настроен. Можно указать координаты или ссылку Google Maps.';
  if(error instanceof ApiError && error.status===422) return 'Не удалось определить место. Используйте ссылку Google Maps с выбранной точкой, поиск или ручные координаты.';
  return 'Не удалось получить данные карты. Проверьте соединение и повторите.';
}
export function createMapsClient() {
  const cache=new Map<string,{expires:number;value:Promise<MapRouteResult>}>();
  let active=0;
  const queue:(()=>void)[]=[];
  async function limited<T>(task:()=>Promise<T>) {
    if(active>=3) await new Promise<void>(resolve=>queue.push(resolve));
    else active++;
    try{return await task();}finally{const next=queue.shift();if(next)next();else active--;}
  }
  return {
    config:()=>apiRequest<MapsConfig>('/maps/config'),
    search:(query:string,signal?:AbortSignal)=>apiRequest<{places:MapPlace[]}>(`/maps/search?q=${encodeURIComponent(query)}`,{signal}),
    searchCities:(query:string,countryCode:string|null,signal?:AbortSignal)=>apiRequest<{places:MapCity[]}>(`/maps/search?q=${encodeURIComponent(query)}&kind=city${countryCode?`&country_code=${encodeURIComponent(countryCode)}`:''}`,{signal}),
    reverse:(latitude:number,longitude:number,signal?:AbortSignal)=>apiRequest<{place:MapPlace}>(`/maps/reverse?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`,{signal}),
    resolveLink:(url:string)=>apiRequest<{place:MapPlace|null;query:string|null}>('/maps/resolve-link',{method:'POST',body:JSON.stringify({url})}),
    route(from:MapPlace,to:MapPlace,mode:TravelMode):Promise<MapRouteResult> {
      if(from.latitude===to.latitude && from.longitude===to.longitude) return Promise.resolve({status:'ok',distance_m:0,duration_s:0,geometry:null,approximate:mode==='transit',message:null});
      const key=routeCacheKey(from,to,mode), old=cache.get(key);
      if(old && old.expires>Date.now()) return old.value;
      const value=limited(()=>apiRequest<MapRouteResult>('/maps/route',{method:'POST',body:JSON.stringify({from,to,mode})}));
      cache.set(key,{expires:Date.now()+5*60_000,value});
      if(cache.size>400) cache.delete(cache.keys().next().value!);
      void value.catch(()=>{if(cache.get(key)?.value===value)cache.delete(key);});
      return value;
    },
    retry(from:MapPlace,to:MapPlace,mode:TravelMode){cache.delete(routeCacheKey(from,to,mode));},
  };
}
// One short-lived cache shared by the private editor and its inline pickers.
export const mapsClient=createMapsClient();
