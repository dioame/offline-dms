"use client";

import { usePathname } from "next/navigation";
import AppFooter from "@/components/AppFooter";
import AppModuleNav from "@/components/AppModuleNav";
<<<<<<< HEAD
import ProjectConfigurationLoader from "@/components/ProjectConfigurationLoader";
=======
import { BatchPdfJobProvider } from "@/components/records/BatchPdfJobContext";
>>>>>>> b284f7872a8cb241d7109f24ac0208c283b5a05e

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith("/print");

  if (hideChrome) {
    return <>{children}</>;
  }

  return (
<<<<<<< HEAD
    <ProjectConfigurationLoader>
      <div className="flex min-h-full flex-1 flex-col">
        <AppModuleNav />
        <div className="flex-1">{children}</div>
        <AppFooter />
      </div>
    </ProjectConfigurationLoader>
=======
    <BatchPdfJobProvider>
      <div className="flex min-h-full flex-1 flex-col">
        {!hideChrome ? <AppModuleNav /> : null}
        <div className="flex-1">{children}</div>
        {!hideChrome ? <AppFooter /> : null}
      </div>
    </BatchPdfJobProvider>
>>>>>>> b284f7872a8cb241d7109f24ac0208c283b5a05e
  );
}
