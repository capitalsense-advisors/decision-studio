"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "Home"],
  ["/tools", "Future Me"],
  ["/portfolio", "Money Mirror"],
  ["/mutual-funds", "Fund Match"],
  ["/risk", "Deep Dive"],
  ["/smallcases", "Smallcases"],
  ["/guide", "How we math"],
] as const;

export function PrimaryNav() {
  const pathname = usePathname();
  return (
    <nav className="primary-nav" aria-label="Primary navigation">
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
