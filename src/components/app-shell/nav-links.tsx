"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_SECTIONS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {NAV_SECTIONS.map((section) => {
        const active = section.href === "/" ? pathname === "/" : pathname.startsWith(section.href);
        return (
          <li key={section.href}>
            <Link
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-surface-muted",
              )}
            >
              <span>{section.label}</span>
              {!section.ready && (
                <span className={cn("text-xs", active ? "opacity-90" : "text-muted-foreground")}>
                  Pronto
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
