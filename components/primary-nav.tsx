"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/", "Overview"],
  ["/tools", "Decision tools"],
  ["/portfolio", "Holdings"],
  ["/risk", "Portfolio risk"],
  ["/mutual-funds", "Mutual funds"],
  ["/guide", "Guide"],
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
