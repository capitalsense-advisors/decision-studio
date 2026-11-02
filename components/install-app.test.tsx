// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallApp } from "./install-app";

let standalone = false;
beforeEach(() => {
 vi.stubGlobal("matchMedia",vi.fn(()=>({matches:standalone,addEventListener:vi.fn(),removeEventListener:vi.fn()})));
 Object.defineProperties(HTMLDialogElement.prototype,{
  showModal:{configurable:true,value:function(this:HTMLDialogElement){this.open=true;}},
  close:{configurable:true,value:function(this:HTMLDialogElement){this.open=false;}},
 });
});
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();standalone=false;Reflect.deleteProperty(HTMLDialogElement.prototype,"showModal");Reflect.deleteProperty(HTMLDialogElement.prototype,"close");});
const ready = ()=>screen.findByRole("button",{name:"Install Paisaan app"});
describe("app installation",()=>{
 it("offers Android app drawer instructions when a native prompt is not available",async()=>{
  vi.spyOn(navigator,"userAgent","get").mockReturnValue("Mozilla Android Chrome");
  render(<InstallApp/>);fireEvent.click(await ready());
  expect(screen.getByRole("dialog").hasAttribute("open")).toBe(true);
  expect(screen.getByText(/installation adds Paisaan to your app drawer/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Close installation instructions"}));
  expect(screen.queryByRole("dialog")).toBeNull();
 });
 it("shows iOS Share instructions instead of promising an Android app drawer",async()=>{
  vi.spyOn(navigator,"userAgent","get").mockReturnValue("iPhone Safari");
  render(<InstallApp/>);fireEvent.click(await ready());
  expect(screen.getByText("Add to Home Screen")).toBeTruthy();
  expect(screen.getByText("Open as Web App")).toBeTruthy();
  expect(screen.queryByText(/installation adds Paisaan to your app drawer/)).toBeNull();
 });
 it("invokes the browser install prompt on a user click and hides after confirmed installation",async()=>{
  render(<InstallApp/>);await ready();
  const prompt=vi.fn().mockResolvedValue(undefined);const event=new Event("beforeinstallprompt",{cancelable:true});
  Object.assign(event,{prompt,userChoice:Promise.resolve({outcome:"accepted"})});
  fireEvent(window,event);expect(event.defaultPrevented).toBe(true);
  expect(prompt).not.toHaveBeenCalled();fireEvent.click(await ready());
  await waitFor(()=>expect(prompt).toHaveBeenCalledTimes(1));
  fireEvent(window,new Event("appinstalled"));
  expect(screen.queryByRole("button",{name:"Install Paisaan app"})).toBeNull();
 });
 it("allows another attempt after dismissal without claiming installation",async()=>{
  render(<InstallApp/>);await ready();const prompt=vi.fn().mockResolvedValue(undefined);
  const event=new Event("beforeinstallprompt",{cancelable:true});Object.assign(event,{prompt,userChoice:Promise.resolve({outcome:"dismissed"})});
  fireEvent(window,event);fireEvent.click(await ready());
  expect((await screen.findByRole("status")).textContent).toContain("dismissed");
  fireEvent.click(await ready());expect(screen.getByRole("dialog")).toBeTruthy();expect(prompt).toHaveBeenCalledTimes(1);
 });
 it("hides in an installed standalone window",async()=>{
  standalone=true;render(<InstallApp/>);
  await act(async()=>{await new Promise(resolve=>setTimeout(resolve,30));});
  expect(screen.queryByRole("button",{name:"Install Paisaan app"})).toBeNull();
 });
});
