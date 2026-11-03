"use client";
import {createContext,useContext,useEffect,useState,type ReactNode} from "react";
import {emptyPlan,validPlan,type Plan} from "@/lib/planner";
const KEY="paisaan-plan-v1";
const Context=createContext<{plan:Plan;setPlan:(p:Plan)=>void;message:string;save:()=>void;clear:()=>void;ready:boolean}|null>(null);
export function PlannerProvider({children}:{children:ReactNode}) {
 const [plan,setPlan]=useState<Plan>(emptyPlan),[message,setMessage]=useState("Session only · save when you choose"),[ready,setReady]=useState(false);
 useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const data:unknown=JSON.parse(raw);if(validPlan(data)){setPlan(data);setMessage("Restored from this device");}else setMessage("Saved plan could not be read. Your stored file has not been overwritten.");}}catch{setMessage("Device storage is unavailable. You can still plan in this session.");}setReady(true);});return()=>cancelAnimationFrame(frame);},[]);
 function change(p:Plan){setPlan(p);setMessage("Unsaved changes · save when you choose");}
 function save(){try{if(!validPlan(plan))throw Error();localStorage.setItem(KEY,JSON.stringify(plan));setMessage("Saved on this device · not synced or backed up");}catch{setMessage("Could not save. Keep this tab open; your changes are still here.");}}
 function clear(){try{localStorage.removeItem(KEY);setPlan(emptyPlan);setMessage("Saved plan deleted from this device");}catch{setMessage("Could not delete device storage. Nothing has been marked deleted.");}}
 return <Context.Provider value={{plan,setPlan:change,message,save,clear,ready}}>{children}</Context.Provider>;
}
export function usePlanner(){const c=useContext(Context);if(!c)throw Error("Missing planner provider");return c;}
