"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import {
  FormField,
  SelectInput,
  TextInput,
} from "@/components/faced/FormField";
import { exportFacedToExcel } from "@/lib/export-excel";
import type { FacedRecord } from "@/lib/faced-types";
import {
  barangayOptions,
  municipalityOptions,
  SARANGANI_PROVINCE,
} from "@/lib/sarangani-locations";
import {
  clearVerifyCache,
  downloadVerifyCache,
  getAllVerifyCacheEntries,
  getVerifyCacheCount,
  getVerifyCacheMeta,
  searchCachedBeneficiary,
  type VerifyDownloadProgress,
} from "@/lib/verify-cache";
import type { VerifyCacheMeta } from "@/lib/db";

type VerifyTab = "search" | "export" | "offline";
type SearchSource = "online" | "offline";

type VerifyMatch = {
  uuid: string;
  headName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthdate: string;
  barangay: string;
  cityMunicipality: string;
  enumeratorName: string;
  dateRegistered: string;
  encodedAt: string;
  matchLabel: string;
};

type SearchForm = {
  last_name: string;
  first_name: string;
  middle_name: string;
  birthdate: string;
  city_municipality: string;
  barangay: string;
};

type ExportFilter = {
  city_municipality: string;
  barangay: string;
};

type ExportRecordJson = Omit<FacedRecord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

const VERIFY_STORAGE_KEY = "dms_verify_password";

const emptySearchForm: SearchForm = {
  last_name: "",
  first_name: "",
  middle_name: "",
  birthdate: "",
  city_municipality: "",
  barangay: "",
};

const emptyExportFilter: ExportFilter = {
  city_municipality: "",
  barangay: "",
};

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatDate(value: string): string {
  if (!value) return "—";
  return value;
}

function slugify(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
}

function toFacedRecords(records: ExportRecordJson[]): FacedRecord[] {
  return records.map((record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));
}

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export default function VerifyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [activeTab, setActiveTab] = useState<VerifyTab>("search");

  const [form, setForm] = useState<SearchForm>(emptySearchForm);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [matches, setMatches] = useState<VerifyMatch[] | null>(null);
  const [lastQuery, setLastQuery] = useState<SearchForm | null>(null);
  const [searchSource, setSearchSource] = useState<SearchSource | null>(null);

  const [cacheMeta, setCacheMeta] = useState<VerifyCacheMeta | undefined>();
  const [cacheCount, setCacheCount] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<VerifyDownloadProgress | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [downloadError, setDownloadError] = useState("");

  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );

  const [exportFilter, setExportFilter] = useState<ExportFilter>(emptyExportFilter);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [exportMessage, setExportMessage] = useState("");

  const verifyFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const stored = sessionStorage.getItem(VERIFY_STORAGE_KEY) ?? password;
      return fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-verify-password": stored,
          ...init?.headers,
        },
      });
    },
    [password],
  );

  useEffect(() => {
    const stored = sessionStorage.getItem(VERIFY_STORAGE_KEY);
    if (!stored) return;

    void verifyFetch("/api/verify/auth")
      .then((res) => {
        if (res.ok) setUnlocked(true);
        else sessionStorage.removeItem(VERIFY_STORAGE_KEY);
      })
      .catch(() => sessionStorage.removeItem(VERIFY_STORAGE_KEY));
  }, [verifyFetch]);

  const refreshCacheStatus = useCallback(async () => {
    const [meta, count] = await Promise.all([getVerifyCacheMeta(), getVerifyCacheCount()]);
    setCacheMeta(meta);
    setCacheCount(count);
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    void refreshCacheStatus();
  }, [unlocked, refreshCacheStatus]);

  const searchBarangays = useMemo(
    () => barangayOptions(form.city_municipality),
    [form.city_municipality],
  );

  const exportBarangays = useMemo(
    () => barangayOptions(exportFilter.city_municipality),
    [exportFilter.city_municipality],
  );

  async function handleUnlock(event: FormEvent) {
    event.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const res = await fetch("/api/verify/auth", {
        headers: { "x-verify-password": password },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid password.");
      }
      sessionStorage.setItem(VERIFY_STORAGE_KEY, password);
      setUnlocked(true);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : "Could not unlock.");
    } finally {
      setUnlocking(false);
    }
  }

  async function handleDownloadOffline() {
    setDownloadError("");
    setDownloadMessage("");
    setDownloading(true);
    setDownloadProgress({ downloaded: 0, total: 0 });

    try {
      if (!isOnline) {
        throw new Error("Connect to the internet to download the latest verify data.");
      }

      const result = await downloadVerifyCache(
        (offset, limit) => verifyFetch(`/api/verify/sync?offset=${offset}&limit=${limit}`),
        setDownloadProgress,
      );

      await refreshCacheStatus();
      setDownloadMessage(
        `Downloaded ${result.totalRecords} record(s). You can verify duplicates offline until the next download.`,
      );
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloading(false);
      setDownloadProgress(null);
    }
  }

  async function handleClearOffline() {
    await clearVerifyCache();
    await refreshCacheStatus();
    setDownloadMessage("Offline verify data cleared.");
    setDownloadError("");
  }

  function updateSearchField<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "city_municipality") {
        next.barangay = "";
      }
      return next;
    });
  }

  function updateExportField<K extends keyof ExportFilter>(
    key: K,
    value: ExportFilter[K],
  ) {
    setExportFilter((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "city_municipality") {
        next.barangay = "";
      }
      return next;
    });
    setExportMessage("");
    setExportError("");
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setSearchError("");
    setSearching(true);
    setMatches(null);
    setSearchSource(null);

    try {
      if (!form.last_name.trim() || !form.first_name.trim()) {
        throw new Error("Please enter the beneficiary's first and last name.");
      }

      if (isOnline) {
        const res = await verifyFetch("/api/verify/search", {
          method: "POST",
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Search failed.");
        }
        setMatches(data.matches ?? []);
        setSearchSource("online");
      } else {
        if (cacheCount === 0) {
          throw new Error(
            "No offline data on this device. Download the latest records while online first.",
          );
        }
        const entries = await getAllVerifyCacheEntries();
        const result = searchCachedBeneficiary(entries, form);
        setMatches(result.matches);
        setSearchSource("offline");
      }

      setLastQuery({ ...form });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function handleClearSearch() {
    setForm(emptySearchForm);
    setMatches(null);
    setLastQuery(null);
    setSearchError("");
  }

  async function handleExport(event: FormEvent) {
    event.preventDefault();
    setExportError("");
    setExportMessage("");
    setExporting(true);

    try {
      if (!exportFilter.city_municipality.trim()) {
        throw new Error("Please select a city / municipality.");
      }
      if (!exportFilter.barangay.trim()) {
        throw new Error("Please select a barangay.");
      }

      const res = await verifyFetch("/api/verify/export", {
        method: "POST",
        body: JSON.stringify(exportFilter),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Export failed.");
      }

      const records = toFacedRecords((data.records ?? []) as ExportRecordJson[]);
      if (records.length === 0) {
        setExportMessage(
          `No synced records found for ${exportFilter.barangay}, ${exportFilter.city_municipality}.`,
        );
        return;
      }

      const filename = `FACED_${slugify(exportFilter.city_municipality)}_${slugify(exportFilter.barangay)}.xlsx`;
      exportFacedToExcel(records, filename);
      setExportMessage(
        `Downloaded ${records.length} record(s) for ${exportFilter.barangay}, ${exportFilter.city_municipality}.`,
      );
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const queryLabel = lastQuery
    ? [lastQuery.first_name, lastQuery.middle_name, lastQuery.last_name]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(" ")
    : "";

  if (!unlocked) {
    return (
      <div className="ph-page-bg min-h-full">
        <header className="ph-app-header">
          <div className="mx-auto max-w-lg px-4 py-8 text-center">
            <BrandEmblem size={72} className="mx-auto mb-3" />
            <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Verify & export</h1>
            <p className="ph-subtitle mx-auto mt-2 max-w-md text-sm">
              Check for duplicate beneficiaries or export synced FACED records by area.
            </p>
          </div>
          <TricolorBar thick />
        </header>

        <main className="mx-auto max-w-md px-4 py-8">
          <div className="ph-card">
            <div className="ph-card-header">
              <h2>Enter verify password</h2>
            </div>
            <form onSubmit={handleUnlock} className="space-y-4 p-5">
              {unlockError ? <div className="ph-alert-error">{unlockError}</div> : null}
              <FormField label="Password" required>
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Verify password"
                  autoComplete="current-password"
                  autoFocus
                />
              </FormField>
              <button
                type="submit"
                disabled={unlocking || !password.trim()}
                className="faced-btn-primary w-full"
              >
                {unlocking ? "Checking..." : "Continue"}
              </button>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/" className="underline hover:text-[var(--ph-blue)]">
                  Back to FACED encoding
                </Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ph-page-bg min-h-full">
      <header className="ph-app-header">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="flex items-start gap-4">
            <BrandEmblem size={56} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                Verify & export
              </h1>
              <p className="ph-subtitle mt-2 max-w-xl text-sm">
                Check duplicates before encoding, or download synced records by
                municipality and barangay.
              </p>
            </div>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="verify-tabs" role="tablist" aria-label="Verify tools">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "search"}
            className={`verify-tab ${activeTab === "search" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            Duplicate check
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "export"}
            className={`verify-tab ${activeTab === "export" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("export")}
          >
            Export Excel
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "offline"}
            className={`verify-tab ${activeTab === "offline" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("offline")}
          >
            Offline data
          </button>
        </div>

        {!isOnline ? (
          <div className="ph-alert-warning">
            You are offline. Duplicate check uses downloaded data only. Export Excel requires
            internet.
          </div>
        ) : null}

        {activeTab === "search" ? (
          <>
            <section className="ph-card">
              <div className="ph-card-header">
                <h2>Who are you looking for?</h2>
              </div>
              <form onSubmit={handleSearch} className="space-y-5 p-5">
                <p className="rounded-lg bg-[var(--ph-blue-light)]/60 px-4 py-3 text-sm text-[var(--ph-blue-dark)]">
                  Tip: Start with <strong>first and last name</strong>. Add barangay or
                  birthdate to narrow results. When offline, search uses your downloaded copy
                  from the <strong>Offline data</strong> tab.
                </p>

                {cacheCount > 0 ? (
                  <p className="text-sm text-zinc-600">
                    Offline copy: <strong>{cacheCount}</strong> record(s)
                    {cacheMeta?.syncedAt
                      ? ` · last downloaded ${formatWhen(cacheMeta.syncedAt)}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-sm text-amber-800">
                    No offline copy yet. Download data in the <strong>Offline data</strong> tab
                    while online.
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="First name" required>
                    <TextInput
                      value={form.first_name}
                      onChange={(e) => updateSearchField("first_name", e.target.value)}
                      placeholder="e.g. Juan"
                      autoComplete="given-name"
                    />
                  </FormField>
                  <FormField label="Last name" required>
                    <TextInput
                      value={form.last_name}
                      onChange={(e) => updateSearchField("last_name", e.target.value)}
                      placeholder="e.g. Dela Cruz"
                      autoComplete="family-name"
                    />
                  </FormField>
                  <FormField label="Middle name">
                    <TextInput
                      value={form.middle_name}
                      onChange={(e) => updateSearchField("middle_name", e.target.value)}
                      placeholder="Optional"
                      autoComplete="additional-name"
                    />
                  </FormField>
                  <FormField label="Birthdate">
                    <TextInput
                      type="date"
                      value={form.birthdate}
                      onChange={(e) => updateSearchField("birthdate", e.target.value)}
                    />
                  </FormField>
                  <FormField label="City / Municipality">
                    <SelectInput
                      value={form.city_municipality}
                      onChange={(e) =>
                        updateSearchField("city_municipality", e.target.value)
                      }
                      options={municipalityOptions()}
                      placeholder="Any municipality"
                    />
                  </FormField>
                  <FormField label="Barangay">
                    <SelectInput
                      value={form.barangay}
                      onChange={(e) => updateSearchField("barangay", e.target.value)}
                      options={searchBarangays}
                      placeholder={
                        form.city_municipality
                          ? "Any barangay"
                          : "Select municipality first"
                      }
                      disabled={!form.city_municipality}
                    />
                  </FormField>
                </div>

                {searchError ? <div className="ph-alert-error">{searchError}</div> : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={searching}
                    className="faced-btn-primary min-w-[10rem] flex-1 sm:flex-none"
                  >
                    {searching ? "Searching..." : "Check for duplicates"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="faced-btn-secondary"
                  >
                    Clear form
                  </button>
                </div>
              </form>
            </section>

            {matches !== null ? (
              <section className="space-y-4">
                {searchSource ? (
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Searched {searchSource === "online" ? "live database" : "offline copy"}
                    {searchSource === "offline" && cacheMeta?.syncedAt
                      ? ` · downloaded ${formatWhen(cacheMeta.syncedAt)}`
                      : ""}
                  </p>
                ) : null}
                {matches.length === 0 ? (
                  <div className="verify-result verify-result--clear">
                    <div className="verify-result-icon" aria-hidden>
                      ✓
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">No match found</h2>
                      <p className="mt-1 text-sm opacity-90">
                        <strong>{queryLabel}</strong> does not appear in synced FACED
                        records{lastQuery?.barangay ? ` for ${lastQuery.barangay}` : ""}.
                      </p>
                      <p className="mt-3 text-sm font-medium">
                        You may proceed with encoding — but always confirm details with the
                        household when possible.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="verify-result verify-result--warning">
                      <div className="verify-result-icon" aria-hidden>
                        !
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">
                          {matches.length === 1
                            ? "Possible duplicate found"
                            : `${matches.length} possible duplicates found`}
                        </h2>
                        <p className="mt-1 text-sm opacity-90">
                          <strong>{queryLabel}</strong> may already be encoded. Review the
                          record(s) below before creating a new entry.
                        </p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {matches.map((match) => (
                        <li key={match.uuid} className="verify-match-card">
                          <div className="verify-match-card-header">
                            <div>
                              <p className="text-lg font-bold text-[var(--ph-blue-dark)]">
                                {match.headName}
                              </p>
                              <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-amber-800">
                                {match.matchLabel}
                              </p>
                            </div>
                            <span className="verify-match-badge">Encoded</span>
                          </div>
                          <dl className="verify-match-grid">
                            <div>
                              <dt>Birthdate</dt>
                              <dd>{formatDate(match.birthdate)}</dd>
                            </div>
                            <div>
                              <dt>Location</dt>
                              <dd>
                                {[
                                  match.barangay,
                                  match.cityMunicipality,
                                  SARANGANI_PROVINCE,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "—"}
                              </dd>
                            </div>
                            <div>
                              <dt>Date registered</dt>
                              <dd>{formatDate(match.dateRegistered)}</dd>
                            </div>
                            <div>
                              <dt>Last synced</dt>
                              <dd>{formatWhen(match.encodedAt)}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt>Enumerator</dt>
                              <dd>{match.enumeratorName || "—"}</dd>
                            </div>
                          </dl>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            ) : null}
          </>
        ) : activeTab === "export" ? (
          <section className="ph-card">
            <div className="ph-card-header">
              <h2>Export synced records</h2>
            </div>
            <form onSubmit={handleExport} className="space-y-5 p-5">
              <p className="rounded-lg bg-[var(--ph-blue-light)]/60 px-4 py-3 text-sm text-[var(--ph-blue-dark)]">
                Choose a <strong>municipality</strong> and <strong>barangay</strong> first.
                Only synced online records for that area will be included in the Excel file.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="City / Municipality" required>
                  <SelectInput
                    value={exportFilter.city_municipality}
                    onChange={(e) =>
                      updateExportField("city_municipality", e.target.value)
                    }
                    options={municipalityOptions()}
                    placeholder="Select municipality"
                  />
                </FormField>
                <FormField label="Barangay" required>
                  <SelectInput
                    value={exportFilter.barangay}
                    onChange={(e) => updateExportField("barangay", e.target.value)}
                    options={exportBarangays}
                    placeholder={
                      exportFilter.city_municipality
                        ? "Select barangay"
                        : "Select municipality first"
                    }
                    disabled={!exportFilter.city_municipality}
                  />
                </FormField>
              </div>

              {exportFilter.city_municipality && exportFilter.barangay ? (
                <div className="ph-alert-success">
                  Ready to export records for{" "}
                  <strong>
                    {exportFilter.barangay}, {exportFilter.city_municipality}
                  </strong>
                  , {SARANGANI_PROVINCE}.
                </div>
              ) : null}

              {exportError ? <div className="ph-alert-error">{exportError}</div> : null}
              {exportMessage ? (
                <div
                  className={
                    exportMessage.startsWith("Downloaded")
                      ? "ph-alert-success"
                      : "ph-alert-warning"
                  }
                >
                  {exportMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={
                    exporting ||
                    !exportFilter.city_municipality.trim() ||
                    !exportFilter.barangay.trim()
                  }
                  className="faced-btn-primary min-w-[10rem]"
                >
                  {exporting ? "Preparing Excel..." : "Download Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportFilter(emptyExportFilter);
                    setExportMessage("");
                    setExportError("");
                  }}
                  className="faced-btn-secondary"
                >
                  Clear filters
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section className="ph-card">
            <div className="ph-card-header">
              <h2>Offline verify data</h2>
            </div>
            <div className="space-y-5 p-5">
              <p className="rounded-lg bg-[var(--ph-blue-light)]/60 px-4 py-3 text-sm text-[var(--ph-blue-dark)]">
                Download the latest synced records from the database to this device. After
                that, <strong>Duplicate check</strong> works without internet.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[var(--faced-blue-border)] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Records on device
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[var(--ph-blue-dark)]">
                    {cacheCount}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--faced-blue-border)] bg-white px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
                    Last downloaded
                  </p>
                  <p className="mt-1 text-sm font-semibold text-zinc-800">
                    {cacheMeta?.syncedAt ? formatWhen(cacheMeta.syncedAt) : "Not yet downloaded"}
                  </p>
                </div>
              </div>

              {downloadProgress ? (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-600">
                    Downloading {downloadProgress.downloaded}
                    {downloadProgress.total > 0 ? ` of ${downloadProgress.total}` : ""}…
                  </p>
                  <div className="verify-progress">
                    <div
                      className="verify-progress-bar"
                      style={{
                        width:
                          downloadProgress.total > 0
                            ? `${Math.min(100, (downloadProgress.downloaded / downloadProgress.total) * 100)}%`
                            : "30%",
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {downloadError ? <div className="ph-alert-error">{downloadError}</div> : null}
              {downloadMessage ? (
                <div
                  className={
                    downloadMessage.startsWith("Downloaded")
                      ? "ph-alert-success"
                      : "ph-alert-warning"
                  }
                >
                  {downloadMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleDownloadOffline()}
                  disabled={downloading || !isOnline}
                  className="faced-btn-primary min-w-[10rem]"
                >
                  {downloading ? "Downloading…" : "Download latest data"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleClearOffline()}
                  disabled={downloading || cacheCount === 0}
                  className="faced-btn-secondary"
                >
                  Clear offline data
                </button>
              </div>

              {!isOnline ? (
                <p className="text-sm text-amber-800">
                  Connect to the internet to download or refresh offline data.
                </p>
              ) : null}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
