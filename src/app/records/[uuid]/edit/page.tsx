"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import FacedForm from "@/components/faced/FacedForm";
import type { FacedRecordData } from "@/lib/faced-types";
import {
  adminRecordToFormData,
  type FacedRecordAdminClient,
} from "@/lib/records-client";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { SkeletonFormCard, SkeletonScreen } from "@/components/ui/Skeleton";

const ADMIN_STORAGE_KEY = "dms_admin_password";

export default function RecordEditPage() {
  const params = useParams<{ uuid: string }>();
  const router = useRouter();
  const uuid = params.uuid?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [record, setRecord] = useState<FacedRecordAdminClient | null>(null);
  const [formData, setFormData] = useState<FacedRecordData | null>(null);

  const adminFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY) || password;
      return fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": stored,
          ...init?.headers,
        },
      });
    },
    [password],
  );

  const loadRecord = useCallback(async () => {
    if (!uuid) {
      setError("Record uuid is required.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await adminFetch(`/api/admin/records/${uuid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load record.");
      setRecord(data.record);
      setFormData(adminRecordToFormData(data.record));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load record.");
      if (err instanceof Error && err.message === "Unauthorized") {
        setUnlocked(false);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, [adminFetch, uuid]);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      setPassword(stored);
      setUnlocked(true);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!unlocked || !uuid) return;
    void loadRecord();
  }, [unlocked, uuid, loadRecord]);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/records/${uuid}`, {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid admin password.");
      sessionStorage.setItem(ADMIN_STORAGE_KEY, password);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
      setLoading(false);
    }
  }

  async function handleSyncedSave(data: FacedRecordData) {
    const res = await adminFetch(`/api/admin/records/${uuid}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    const payload = await res.json();
    if (!res.ok) {
      throw new Error(payload.error || "Failed to update record.");
    }
  }

  if (!uuid) {
    return (
      <div className={cn(ui.pageBg, "flex items-center justify-center p-4")}>
        <p className={ui.alertError}>Invalid record link.</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className={cn(ui.pageBg, "flex flex-col")}>
        <div className={cn(ui.appHeader, "py-5 text-center")}>
          <BrandEmblem size={72} className="mx-auto mb-2" />
          <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>Administration</p>
          <h1 className="text-xl font-bold text-white">Edit FACED record</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className={cn(ui.loginCard, "w-full max-w-md")}>
            <div className={cn(ui.sectionHeader, "justify-center")}>Admin access</div>
            <div className={cn(ui.sectionBody, "space-y-4 rounded-b-xl border-b border-faced-blue-border")}>
              <p className="text-sm text-zinc-600">
                Enter the admin password to edit this synced FACED record.
              </p>
              <form onSubmit={(e) => void handleUnlock(e)} className="space-y-3">
                <label className="block">
                  <span className={ui.label}>Admin password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={ui.input}
                    autoFocus
                    required
                  />
                </label>
                {error && <p className={ui.alertError}>{error}</p>}
                <button type="submit" className={cn(ui.btnPrimary, "w-full", ui.withIcon)} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className={ui.iconSm} aria-hidden />
                      Unlock editor
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.pageBg}>
      <header className={ui.appHeader}>
        <div className="mx-auto max-w-4xl px-4 py-5">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Edit FACED record</h1>
              <p className={cn(ui.subtitle, "text-sm")}>
                Update synced form details. Changes are saved directly to the server.
              </p>
            </div>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {error && <div className={ui.alertError}>{error}</div>}

        {loading ? (
          <SkeletonScreen label="Loading FACED record">
            <SkeletonFormCard fields={8} />
          </SkeletonScreen>
        ) : record && formData ? (
          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h2>Edit FACED record</h2>
              <p className="mt-1 text-xs font-normal text-white/85">
                UUID: <span className="font-mono">{record.uuid}</span>
              </p>
            </div>
            <div className="p-2 sm:p-4">
              <FacedForm
                syncedEditUuid={record.uuid}
                syncedInitialRecord={formData}
                onSyncedSave={handleSyncedSave}
                onSaved={() => router.push("/records")}
                onCancelEdit={() => router.push("/records")}
              />
            </div>
          </section>
        ) : (
          <p className="text-sm text-zinc-600">Record could not be loaded.</p>
        )}
      </main>
    </div>
  );
}
