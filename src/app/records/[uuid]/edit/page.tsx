"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import FacedForm from "@/components/faced/FacedForm";
import type { FacedRecordData } from "@/lib/faced-types";
import {
  adminRecordToFormData,
  type FacedRecordAdminClient,
} from "@/lib/records-client";

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
      <div className="ph-page-bg flex min-h-full items-center justify-center p-4">
        <p className="ph-alert-error">Invalid record link.</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="ph-page-bg flex min-h-full flex-col">
        <div className="ph-app-header py-5 text-center">
          <BrandEmblem size={72} className="mx-auto mb-2" />
          <p className="ph-kicker text-xs font-bold uppercase">Administration</p>
          <h1 className="text-xl font-bold text-white">Edit FACED record</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="ph-login-card ph-card w-full max-w-md">
            <div className="faced-section-header justify-center">Admin access</div>
            <div className="faced-section-body space-y-4 rounded-b-xl border-b border-[var(--faced-blue-border)]">
              <p className="text-sm text-zinc-600">
                Enter the admin password to edit this synced FACED record.
              </p>
              <form onSubmit={(e) => void handleUnlock(e)} className="space-y-3">
                <label className="block">
                  <span className="faced-label">Admin password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="faced-input"
                    autoFocus
                    required
                  />
                </label>
                {error && <p className="ph-alert-error">{error}</p>}
                <button type="submit" className="faced-btn-primary w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Unlock editor"}
                </button>
              </form>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/records" className="ph-link">
                  Back to records
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-page-bg min-h-full">
      <header className="ph-app-header">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Edit FACED record</h1>
              <p className="ph-subtitle text-sm">
                Update synced form details. Changes are saved directly to the server.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/records" className="ph-header-btn">
              Back to records
            </Link>
            <Link href="/admin" className="ph-header-btn">
              Admin
            </Link>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {error && <div className="ph-alert-error">{error}</div>}

        {loading ? (
          <p className="text-sm text-zinc-600">Loading record...</p>
        ) : record && formData ? (
          <section className="ph-card">
            <div className="ph-card-header">
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
