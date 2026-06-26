"use client";

import { usePathname } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import AppModuleNav from "@/components/AppModuleNav";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/print");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      {!hideChrome ? <AppModuleNav /> : null}
      <div className="flex-1">{children}</div>
      {!hideChrome ? <AppFooter /> : null}
    </div>
  );
}
