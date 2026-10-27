"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <section className="state-panel"><span className="eyebrow">Temporary state</span><h1>This workspace could not load.</h1><p>Your entered data has not been sent or stored.</p><button className="button" onClick={reset}>Try again</button></section>; }
