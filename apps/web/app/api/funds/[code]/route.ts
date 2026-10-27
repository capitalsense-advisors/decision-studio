import { NextResponse } from "next/server";

type MfApi = { meta?: Record<string,string|number>; data?: Array<{date:string;nav:string}> };
export async function GET(_:Request,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;if(!/^\d{3,12}$/.test(code))return NextResponse.json({detail:"Invalid scheme code."},{status:400});
  try{const response=await fetch("https://api.mfapi.in/mf/"+code,{next:{revalidate:86400},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("upstream");const payload=await response.json() as MfApi;const points=(payload.data??[]).map(item=>{const [day,month,year]=item.date.split("-");return {date:year+"-"+month+"-"+day,value:Number(item.nav)}}).filter(item=>Number.isFinite(item.value)).sort((a,b)=>a.date.localeCompare(b.date));return NextResponse.json({meta:payload.meta??{},points},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=172800"}})}catch{return NextResponse.json({detail:"NAV history is temporarily unavailable."},{status:503})}
}
