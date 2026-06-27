"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardPen,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  SearchCheck,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";
import { logoutApp } from "@/lib/app-logout";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

const modules: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Encoding", icon: ClipboardPen },
  { href: "/verify", label: "Verifying", icon: SearchCheck },
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/records", label: "Records", icon: FolderOpen },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppModuleNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await logoutApp();
    window.location.assign("/");
  }

  function renderModuleLink(
    module: (typeof modules)[number],
    active: boolean,
    mobile: boolean,
  ) {
    const Icon = module.icon;
    return (
      <Link
        href={module.href}
        className={cn(
          mobile ? ui.topbarMobileLinkClass(active) : ui.topbarLinkClass(active),
          ui.withIcon,
        )}
        aria-current={active ? "page" : undefined}
        onClick={() => setMenuOpen(false)}
      >
        <Icon className={ui.iconSm} aria-hidden />
        {module.label}
      </Link>
    );
  }

  return (
    <nav className={ui.topbar} aria-label="Application modules">
      <div className={ui.topbarInner}>
        <p className={ui.topbarKicker}>DSWD · Offline DMS</p>

        <ul className={ui.topbarLinks} role="list">
          {modules.map((module) => {
            const active = isActive(pathname, module.href);
            return (
              <li key={module.href}>{renderModuleLink(module, active, false)}</li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={cn(ui.topbarLinkLogout, ui.withIcon)}
            >
              <LogOut className={ui.iconSm} aria-hidden />
              Logout
            </button>
          </li>
        </ul>

        <button
          type="button"
          className={ui.topbarMenuButton}
          aria-expanded={menuOpen}
          aria-controls="app-module-mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className={ui.iconMd} aria-hidden />
          ) : (
            <Menu className={ui.iconMd} aria-hidden />
          )}
        </button>
      </div>

      {menuOpen ? (
        <div id="app-module-mobile-nav" className={ui.topbarMobilePanel}>
          <ul className={ui.topbarMobileLinks} role="list">
            {modules.map((module) => {
              const active = isActive(pathname, module.href);
              return (
                <li key={module.href}>{renderModuleLink(module, active, true)}</li>
              );
            })}
            <li>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className={cn(ui.topbarMobileLinkLogout, ui.withIcon)}
              >
                <LogOut className={ui.iconSm} aria-hidden />
                Logout
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
}
