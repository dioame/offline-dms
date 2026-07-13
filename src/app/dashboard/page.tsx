"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import DashboardReports from "@/components/dashboard/DashboardReports";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  return (
    <div className={ui.pageBg}>
      <header className={ui.appHeader}>
        <div className="mx-auto flex max-w-[min(96rem,100%)] flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Dashboard &amp; Reports</h1>
              <p className={cn(ui.subtitle, "text-sm")}>
                Encoding summary, evacuation center info board, inside/outside EC data, and shelter reports.
              </p>
            </div>
          </div>
          <Link href="/" className={cn(ui.headerBtn, ui.withIcon)}>
            <PenLine className={ui.iconSm} aria-hidden />
            Encoding
          </Link>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-[min(96rem,100%)] px-4 py-6">
        <DashboardReports />
      </main>
    </div>
  );
}
