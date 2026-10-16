"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/scheduling", label: "CPU Scheduling" },
  { href: "/deadlock", label: "Deadlock Avoidance" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="h-[48px] border-b border-hairline bg-surface flex items-center px-6 gap-8"
      aria-label="Main Navigation"
    >
      {links.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`text-[14px] font-medium h-full flex items-center border-b-2 ${
              active
                ? "text-accent border-accent"
                : "text-ink-muted border-transparent hover:text-ink"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
