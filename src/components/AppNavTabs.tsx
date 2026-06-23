"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Encoding" },
  { href: "/verify", label: "Verifying" },
] as const;

export default function AppNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="app-nav-tabs" aria-label="Main modules">
      {tabs.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`app-nav-tab ${active ? "app-nav-tab--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
