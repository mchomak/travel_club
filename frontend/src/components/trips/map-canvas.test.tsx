import { act,cleanup,fireEvent,render,screen,waitFor } from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import { MapCanvas } from './map-canvas';
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
test('real map tiles carry origin/referrer attributes and labels never become HTML',async()=>{
 const {container}=render(<MapCanvas mapsKey="browser-test" nodes={[{key:'a',label:'<img src=x onerror=alert(1)>',place:{name:'A',address:'',latitude:1,longitude:2,provider:'manual'}}]}/>);
 await waitFor(()=>expect(container.querySelector('img.leaflet-tile')).not.toBeNull());
 const tile=container.querySelector('img.leaflet-tile')!;
 expect(tile).toHaveAttribute('crossorigin','anonymous');
 expect(tile).toHaveAttribute('referrerpolicy','strict-origin-when-cross-origin');
 fireEvent.click(container.querySelector('.leaflet-marker-icon')!);
 expect(container.querySelector('.leaflet-popup-content')).toHaveTextContent('<img src=x onerror=alert(1)>');
 expect(container.querySelector('.leaflet-popup-content img')).toBeNull();
 expect(container.querySelector('.leaflet-attribution-flag')).toBeNull();
 expect(container.querySelector('[onerror]')).toBeNull();
 expect(container).toHaveTextContent('Geoapify');
 fireEvent.error(container.querySelector('img.leaflet-tile')!);
 expect(await screen.findByText(/Подложка недоступна/)).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Повторить загрузку карты'})).toBeInTheDocument();
});

test.each([1440,320])('real map keeps every point inside padded bounds after resize from %ipx',async(initialWidth)=>{
 const L=await import('leaflet');
 let width=initialWidth,notify!:ResizeObserverCallback;
 vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('leaflet-container')?width:0;});
 vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockImplementation(function(this:HTMLElement){return this.classList.contains('leaflet-container')?280:0;});
 vi.stubGlobal('ResizeObserver',class {constructor(callback:ResizeObserverCallback){notify=callback;}observe(){}disconnect(){}});
 const fit=vi.spyOn(L.Map.prototype,'fitBounds');
 const nodes=[{key:'a',label:'West',place:{name:'West',address:'',latitude:31.2,longitude:121.2,provider:'manual' as const}},{key:'b',label:'East',place:{name:'East',address:'',latitude:31.3,longitude:121.6,provider:'manual' as const}}];
 render(<MapCanvas mapsKey="test-browser" nodes={nodes}/>);
 await waitFor(()=>expect(fit).toHaveBeenCalled());
 const map=fit.mock.contexts.at(-1)! as import('leaflet').Map;
 function expectVisible(){for(const node of nodes){const point=map.latLngToContainerPoint([node.place.latitude,node.place.longitude]);expect(point.x).toBeGreaterThanOrEqual(27);expect(point.x).toBeLessThanOrEqual(width-27);expect(point.y).toBeGreaterThanOrEqual(27);expect(point.y).toBeLessThanOrEqual(253);}}
 expectVisible();
 for(const next of [390,320]){width=next;act(()=>notify([],{} as ResizeObserver));expectVisible();}
});
