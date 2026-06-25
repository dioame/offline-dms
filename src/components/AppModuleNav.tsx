"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutApp } from "@/lib/app-logout";

const modules = [
  { href: "/", label: "Encoding" },
  { href: "/verify", label: "Verifying" },
  { href: "/admin", label: "Admin" },
  { href: "/records", label: "Records" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppModuleNav() {
  const pathname = usePathname();

  async function handleLogout() {
    await logoutApp();
    window.location.assign("/");
  }

  return (
    <nav className="app-module-topbar" aria-label="Application modules">
      <div className="app-module-topbar-inner">
        <p className="app-module-topbar-kicker">DSWD · Offline DMS</p>
        <ul className="app-module-topbar-links" role="list">
          {modules.map((module) => {
            const active = isActive(pathname, module.href);
            return (
              <li key={module.href}>
                <Link
                  href={module.href}
                  className={`app-module-topbar-link ${active ? "app-module-topbar-link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {module.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="app-module-topbar-link app-module-topbar-link--logout"
            >
              Logout
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
