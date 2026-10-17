"use client";
import { useEffect,useState } from 'react';
import { mapsClient,type MapsConfig } from './maps-client';
let pending:Promise<MapsConfig>|null=null;
let expires=0;
export function useMapsConfig() {
 const [state,setState]=useState<{config:MapsConfig|null;error:unknown}>({config:null,error:null});
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let current=true;
  if(!pending||expires<Date.now()){expires=Date.now()+30_000;pending=mapsClient.config();void pending.catch(()=>{pending=null;});}
  void pending.then(config=>{if(current)setState({config,error:null});},error=>{if(current)setState({config:null,error});});
  return()=>{current=false;};
 },[attempt]);
 return {...state,retry:()=>{pending=null;setAttempt(v=>v+1);}};
}
