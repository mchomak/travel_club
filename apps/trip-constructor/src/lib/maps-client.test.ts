import { afterEach, expect, test, vi } from 'vitest';
import { createMapsClient } from './maps-client';
import type { MapPlace } from './contracts';
afterEach(()=>vi.restoreAllMocks());

test('city search preserves ordinary search and passes country and abort signal', async () => {
  const fetcher=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>new Response(JSON.stringify({places:[]})));
  const client=createMapsClient(), controller=new AbortController();
  await client.search('hotel & museum',controller.signal);
  await client.searchCities('Москва','RU',controller.signal);
  await client.searchCities('Paris',null);
  expect(fetcher.mock.calls.map(([url])=>String(url))).toEqual([
    '/api/maps/search?q=hotel%20%26%20museum',
    '/api/maps/search?q=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0&kind=city&country_code=RU',
    '/api/maps/search?q=Paris&kind=city',
  ]);
  expect(fetcher.mock.calls[1][1]?.signal).toBe(controller.signal);
});

test('reverse geocoding returns the existing place DTO with abort support', async () => {
  const place:MapPlace={name:'Paris',address:'France',latitude:48.85,longitude:2.35,provider:'geoapify'};
  const fetcher=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(JSON.stringify({place})));
  const controller=new AbortController();
  expect(await createMapsClient().reverse(48.85,2.35,controller.signal)).toEqual({place});
  expect(fetcher.mock.calls[0][0]).toBe('/api/maps/reverse?latitude=48.85&longitude=2.35');
  expect(fetcher.mock.calls[0][1]?.signal).toBe(controller.signal);
});

test('route seam deduplicates coordinates and reuses all mode results during this session', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({status:'ok',distance_m:1200,duration_s:300,geometry:null,approximate:false,message:null})));
  const a:MapPlace={name:'A',address:'',latitude:1,longitude:2,provider:'manual'};
  const b={...a,name:'B',latitude:3};
  const client=createMapsClient();
  const [first,second]=await Promise.all([client.route(a,b,'drive'),client.route(a,b,'drive')]);
  expect(first).toMatchObject({status:'ok',distance_m:1200});
  expect(second).toEqual(first);
  await client.route({...a,name:'renamed'},b,'drive');
  expect(fetcher).toHaveBeenCalledTimes(1);
  fetcher.mockRestore();
});

test('route queue never exceeds three requests and explicit retry replaces unavailable cache',async()=>{
 let active=0,peak=0;
 const fetcher=vi.spyOn(globalThis,'fetch').mockImplementation(async()=>{
  active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,3));active--;
  return new Response(JSON.stringify({status:'unavailable',distance_m:null,duration_s:null,geometry:null,approximate:false,message:'Нет данных'}));
 });
 const p:MapPlace={name:'A',address:'',latitude:1,longitude:2,provider:'manual'},client=createMapsClient();
 await Promise.all(Array.from({length:8},(_,i)=>client.route(p,{...p,latitude:i+2},'walk')));
 expect(peak).toBe(3);
 const to={...p,latitude:2};
 await client.route(p,to,'walk');expect(fetcher).toHaveBeenCalledTimes(8);
 client.retry(p,to,'walk');
 await client.route(p,to,'walk');expect(fetcher).toHaveBeenCalledTimes(9);
 expect(await client.route(p,p,'transit')).toMatchObject({status:'ok',distance_m:0,duration_s:0});
 expect(fetcher).toHaveBeenCalledTimes(9);
});
