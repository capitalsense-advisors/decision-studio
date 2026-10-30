import type { ReactNode } from "react";

export function PageHeading({ kicker, title, copy }: { kicker: string; title: ReactNode; copy: string }) {
  return <section className="page-heading"><div><span className="eyebrow">{kicker}</span><h1>{title}</h1><p className="lede">{copy}</p></div></section>;
}

export function Metric({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

export function ResultNotes({ assumptions, warnings }: { assumptions: string[]; warnings: string[] }) {
  return <details className="result-notes"><summary>Assumptions and limits</summary>{warnings.map((item) => <p className="warning" key={item}>{item}</p>)}<ul>{assumptions.map((item) => <li key={item}>{item}</li>)}</ul></details>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
