"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardPen,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  SearchCheck,
  Settings,
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

  async function handleLogout() {
    await logoutApp();
    window.location.assign("/");
  }

  return (
    <nav className={ui.topbar} aria-label="Application modules">
      <div className={ui.topbarInner}>
        <p className={ui.topbarKicker}>DSWD · Offline DMS</p>
        <ul className={ui.topbarLinks} role="list">
          {modules.map((module) => {
            const active = isActive(pathname, module.href);
            const Icon = module.icon;
            return (
              <li key={module.href}>
                <Link
                  href={module.href}
                  className={cn(ui.topbarLinkClass(active), ui.withIcon)}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className={ui.iconSm} aria-hidden />
                  {module.label}
                </Link>
              </li>
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
      </div>
    </nav>
  );
}
