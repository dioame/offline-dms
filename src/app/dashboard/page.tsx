"use client";

import Link from "next/link";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import DashboardReports from "@/components/dashboard/DashboardReports";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export default function DashboardPage() {
  return (
    <div className="ph-page-bg min-h-full">
      <header className="ph-app-header">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Dashboard &amp; Reports</h1>
              <p className="ph-subtitle text-sm">
                Evacuation center info board, inside-EC data, sex/age/sectoral, and shelter reports.
              </p>
            </div>
          </div>
          <Link href="/" className="ph-header-btn">
            Encoding
          </Link>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <DashboardReports />
      </main>
    </div>
  );
}
