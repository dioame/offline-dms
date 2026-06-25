"use client";

import { useEffect, useState } from "react";
import FacedForm from "@/components/faced/FacedForm";
import FacedRecordList from "@/components/FacedRecordList";
import LoginGate from "@/components/LoginGate";
import OfflineIndicator from "@/components/OfflineIndicator";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import { getFacedRecords } from "@/lib/db";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const [encodedCount, setEncodedCount] = useState(0);

  useEffect(() => {
    void getFacedRecords().then((records) => setEncodedCount(records.length));
  }, [refreshKey]);

  return (
    <LoginGate>
      <div className="ph-page-bg min-h-full">
        <header className="ph-app-header">
          <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <BrandEmblem size={64} className="hidden shrink-0 sm:block" />
                <div>
                  <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
                  <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    Family Assistance Card (FACED)
                  </h1>
                  <p className="ph-subtitle mt-2 max-w-xl text-sm" suppressHydrationWarning>
                    Collect FACED survey records offline on this device. Data is stored
                    locally, exported to Excel, and synced online when connected.
                  </p>
                </div>
              </div>
              <OfflineIndicator />
            </div>
          </div>
          <TricolorBar thick />
        </header>

        <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
          <section className="ph-card">
            <div className="ph-card-header flex flex-wrap items-center justify-between gap-2">
              <h2>{editId ? "Edit FACED record" : "New FACED record"}</h2>
              <p className="text-sm font-semibold text-[var(--ph-blue-dark)]">
                Total encoded:{" "}
                <span className="text-base font-bold">{encodedCount}</span>
              </p>
            </div>
            <div className="p-2 sm:p-4">
              <FacedForm
                editId={editId}
                onSaved={() => {
                  setRefreshKey((k) => k + 1);
                  if (editId) setEditId(null);
                }}
                onCancelEdit={() => setEditId(null)}
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-[var(--ph-yellow)]" aria-hidden />
              <h2 className="text-lg font-bold text-[var(--ph-blue-dark)]">Saved records</h2>
            </div>
            <FacedRecordList
              refreshKey={refreshKey}
              onEdit={(id) => {
                setEditId(id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onSynced={() => setRefreshKey((k) => k + 1)}
              onRecordsChanged={() => setRefreshKey((k) => k + 1)}
            />
          </section>
        </main>
      </div>
    </LoginGate>
  );
}
