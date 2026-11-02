"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallApp() {
  const [ready, setReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone), (display-mode: minimal-ui), (display-mode: fullscreen)");
    const updateInstalled = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const frame = requestAnimationFrame(() => {
      updateInstalled();
      setPlatform(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) ? "ios" : /Android/.test(navigator.userAgent) ? "android" : "other");
      setReady(true);
    });
    const capturePrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); setStatus(""); };
    const complete = () => { setInstalled(true); setPrompt(null); dialog.current?.close(); };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", complete);
    display.addEventListener("change", updateInstalled);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", complete);
      display.removeEventListener("change", updateInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) { dialog.current?.showModal(); return; }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setStatus(choice.outcome === "accepted" ? "Finish installation in your browser. Your device will add the app icon." : "Installation dismissed. You can try again from your browser menu.");
    } catch {
      setStatus("Browser installation is unavailable. Follow the installation instructions.");
      dialog.current?.showModal();
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }

  if (!ready || installed) return null;
  return <div className="app-install">
    <button type="button" className="install-app-button" onClick={() => void install()} disabled={busy} aria-label="Install Paisaan app"><span aria-hidden="true">↓</span><span>{busy ? "Opening…" : "Install app"}</span></button>
    {status && <span className="sr-only" role="status">{status}</span>}
    <dialog ref={dialog} className="install-app-dialog" aria-labelledby="install-app-title" aria-describedby="install-app-description">
      <div className="install-app-heading"><span>Paisaan on your phone</span><button type="button" aria-label="Close installation instructions" onClick={() => dialog.current?.close()}>×</button></div>
      <h2 id="install-app-title">Keep Paisaan one tap away.</h2>
      <p id="install-app-description">Install it from your browser, then open it from its own icon. No app store download is needed.</p>
      {platform === "ios" ? <>
        <ol><li>Open this site in Safari and tap <strong>Share</strong>.</li><li>Choose <strong>Add to Home Screen</strong>.</li><li>Keep <strong>Open as Web App</strong> enabled if shown, then tap <strong>Add</strong>.</li></ol>
        <p>Your Paisaan icon stays on your Home Screen until you remove it. If the option is missing, open the site directly in Safari.</p>
      </> : <>
        <ol><li>Open this site directly in {platform === "android" ? "Chrome or another browser that supports app installation" : "a browser that supports app installation"}.</li><li>Open the browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Choose <strong>Install</strong> when offered and confirm.</li></ol>
        <p>{platform === "android" ? "On supported Android browsers, installation adds Paisaan to your app drawer and usually your Home Screen. It stays installed until you uninstall it. A browser shortcut alone may only appear on the Home Screen." : "Your browser decides where installed apps appear. On Android, choose installation rather than a shortcut to add it to the app drawer."}</p>
      </>}
      <p className="install-app-note">An internet connection is needed for current data. Installing does not save your portfolio draft or create an account.</p>
      <form method="dialog"><button className="button" type="submit">Got it</button></form>
    </dialog>
  </div>;
}
