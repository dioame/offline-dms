"use client";

import { useState } from "react";
import FacedForm from "@/components/faced/FacedForm";
import FacedRecordList from "@/components/FacedRecordList";
import OfflineIndicator from "@/components/OfflineIndicator";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-[var(--faced-blue-border)] bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--faced-blue)]">
                DSWD · Offline DMS
              </p>
              <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
                Family Assistance Card (FACED)
              </h1>
            </div>
            <OfflineIndicator />
          </div>
          <p className="text-sm text-zinc-600">
            Collect FACED survey records offline on this device. Data is stored
            locally in IndexedDB, exported to Excel, and synced online when
            connected.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 px-4 py-6">
        <section className="overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--faced-blue-border)] bg-[var(--faced-blue-light)] px-5 py-3">
            <h2 className="text-lg font-semibold text-zinc-900">
              {editId ? "Edit FACED record" : "New FACED record"}
            </h2>
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
          <h2 className="mb-3 text-lg font-semibold text-zinc-900">
            Saved records
          </h2>
          <FacedRecordList
            refreshKey={refreshKey}
            onEdit={(id) => {
              setEditId(id);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>
      </main>
    </div>
  );
}
