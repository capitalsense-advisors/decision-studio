import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest){
  const query=(request.nextUrl.searchParams.get("q")??"").trim().slice(0,80);
  if(query.length<3)return NextResponse.json([]);
  try{const response=await fetch("https://api.mfapi.in/mf/search?q="+encodeURIComponent(query),{next:{revalidate:86400},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error("upstream");const payload=await response.json() as Array<{schemeCode:number;schemeName:string}>;return NextResponse.json(payload.slice(0,20),{headers:{"Cache-Control":"public, s-maxage=86400"}})}catch{return NextResponse.json({detail:"Fund search is temporarily unavailable."},{status:503})}
}
