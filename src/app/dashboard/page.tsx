"use client";

import DashboardReports from "@/components/dashboard/DashboardReports";

export default function DashboardPage() {
  return (
    <div className="ph-page-bg min-h-full">
      <main className="dashboard-page mx-auto max-w-[90rem] px-4 py-4 sm:py-5">
        <header className="dashboard-page-header no-print">
          <h1 className="dashboard-page-title">Dashboard &amp; Reports</h1>
          <p className="dashboard-page-subtitle">
            Evacuation center info boards, inside/outside EC, sex/age/sectoral, and shelter data.
          </p>
        </header>
        <DashboardReports />
      </main>
    </div>
  );
}
