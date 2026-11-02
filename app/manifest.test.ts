import { expect,it } from "vitest";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import manifest from "./manifest";
it("provides a stable standalone app identity and correctly sized PNG installation icons",async()=>{
 const app=manifest();expect(app.id).toBe("/");expect(app.scope).toBe("/");expect(app.display).toBe("standalone");expect(app.start_url).toBe("/");expect(app.prefer_related_applications).toBe(false);
 for(const icon of app.icons??[]){
  const bytes=await readFile(resolve("public",icon.src.slice(1)));expect(bytes.subarray(1,4).toString()).toBe("PNG");
  const [width,height]=icon.sizes!.split("x").map(Number);expect(bytes.readUInt32BE(16)).toBe(width);expect(bytes.readUInt32BE(20)).toBe(height);
 }
 expect(app.icons?.some(icon=>icon.sizes==="192x192")).toBe(true);expect(app.icons?.some(icon=>icon.sizes==="512x512"&&icon.purpose==="maskable")).toBe(true);
});
