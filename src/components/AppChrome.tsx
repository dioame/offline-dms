"use client";

import { usePathname } from "next/navigation";
import AppModuleNav from "@/components/AppModuleNav";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/print");

  return (
    <>
      {!hideNav ? <AppModuleNav /> : null}
      {children}
    </>
  );
}
