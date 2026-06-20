"use client";

import { useState } from "react";
import BeneficiaryForm from "@/components/BeneficiaryForm";
import BeneficiaryList from "@/components/BeneficiaryList";
import OfflineIndicator from "@/components/OfflineIndicator";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-blue-700">
                Offline DMS
              </p>
              <h1 className="text-2xl font-semibold text-zinc-900">
                Beneficiary records
              </h1>
            </div>
            <OfflineIndicator />
          </div>
          <p className="text-sm text-zinc-600">
            Visit once while online to install. Records are stored on this
            device and work without internet.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-8 px-4 py-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            New record
          </h2>
          <BeneficiaryForm onSaved={() => setRefreshKey((key) => key + 1)} />
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Saved records
          </h2>
          <BeneficiaryList key={refreshKey} />
        </section>
      </main>
    </div>
  );
}
