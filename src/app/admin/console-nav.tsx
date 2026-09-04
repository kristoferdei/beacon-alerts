"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTES = [
  { href: "/admin/events", label: "Events" },
  { href: "/admin/rules", label: "Rules" },
  { href: "/admin/deliveries", label: "Delivery attempts" },
  { href: "/admin/sources", label: "Source health" },
];

// Small client component so the current route can be highlighted — the
// only piece of this redesign that needs `usePathname`, not a switch to
// client rendering generally.
export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav className="console-nav">
      {ROUTES.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          aria-current={pathname === route.href ? "page" : undefined}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}
