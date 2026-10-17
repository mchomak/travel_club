import { afterEach, expect, test, vi } from 'vitest';
import { createMapsClient } from './maps-client';
import type { MapPlace } from './contracts';
afterEach(()=>vi.restoreAllMocks());

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
