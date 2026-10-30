"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const items = [
  ["/", "Home"],
  ["/tools", "Plan"],
  ["/portfolio", "Portfolio"],
  ["/mutual-funds", "Funds"],
  ["/smallcases", "Baskets"],
  ["/guide", "Learn"],
] as const;

export function PrimaryNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav className="primary-nav" aria-label="Primary navigation" ref={navRef}>
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
