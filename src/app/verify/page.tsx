"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import {
  FormField,
  SelectInput,
  TextInput,
} from "@/components/faced/FormField";
import {
  barangayOptions,
  municipalityOptions,
  SARANGANI_PROVINCE,
} from "@/lib/sarangani-locations";

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

const VERIFY_STORAGE_KEY = "dms_verify_password";

const emptyForm: SearchForm = {
  last_name: "",
  first_name: "",
  middle_name: "",
  birthdate: "",
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

export default function VerifyPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const [form, setForm] = useState<SearchForm>(emptyForm);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [matches, setMatches] = useState<VerifyMatch[] | null>(null);
  const [lastQuery, setLastQuery] = useState<SearchForm | null>(null);

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

  const barangays = useMemo(
    () => barangayOptions(form.city_municipality),
    [form.city_municipality],
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

  function handleLock() {
    sessionStorage.removeItem(VERIFY_STORAGE_KEY);
    setUnlocked(false);
    setMatches(null);
    setLastQuery(null);
    setForm(emptyForm);
  }

  function updateField<K extends keyof SearchForm>(key: K, value: SearchForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "city_municipality") {
        next.barangay = "";
      }
      return next;
    });
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setSearchError("");
    setSearching(true);
    setMatches(null);

    try {
      if (!form.last_name.trim() || !form.first_name.trim()) {
        throw new Error("Please enter the beneficiary's first and last name.");
      }

      const res = await verifyFetch("/api/verify/search", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setMatches(data.matches ?? []);
      setLastQuery({ ...form });
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  }

  function handleClear() {
    setForm(emptyForm);
    setMatches(null);
    setLastQuery(null);
    setSearchError("");
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
            <h1 className="mt-2 text-2xl font-bold text-white">Duplicate check</h1>
            <p className="ph-subtitle mx-auto mt-2 max-w-md text-sm">
              Verify if a beneficiary is already encoded before starting a new FACED
              entry.
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
                {unlocking ? "Checking..." : "Continue to verify"}
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
        <div className="mx-auto flex max-w-3xl flex-wrap items-start justify-between gap-4 px-4 py-6">
          <div className="flex items-start gap-4">
            <BrandEmblem size={56} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                Beneficiary duplicate check
              </h1>
              <p className="ph-subtitle mt-2 max-w-xl text-sm">
                Search synced FACED records online before encoding. A match means the
                household may already be in the system.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="faced-btn-secondary !border-white/40 !text-white hover:!bg-white/10"
            >
              FACED app
            </Link>
            <button
              type="button"
              onClick={handleLock}
              className="faced-btn-danger !border-white/40 !text-white hover:!bg-white/10"
            >
              Lock
            </button>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <section className="ph-card">
          <div className="ph-card-header">
            <h2>Who are you looking for?</h2>
          </div>
          <form onSubmit={handleSearch} className="space-y-5 p-5">
            <p className="rounded-lg bg-[var(--ph-blue-light)]/60 px-4 py-3 text-sm text-[var(--ph-blue-dark)]">
              Tip: Start with <strong>first and last name</strong>. Add barangay or
              birthdate to narrow results if you get multiple matches.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="First name" required>
                <TextInput
                  value={form.first_name}
                  onChange={(e) => updateField("first_name", e.target.value)}
                  placeholder="e.g. Juan"
                  autoComplete="given-name"
                />
              </FormField>
              <FormField label="Last name" required>
                <TextInput
                  value={form.last_name}
                  onChange={(e) => updateField("last_name", e.target.value)}
                  placeholder="e.g. Dela Cruz"
                  autoComplete="family-name"
                />
              </FormField>
              <FormField label="Middle name">
                <TextInput
                  value={form.middle_name}
                  onChange={(e) => updateField("middle_name", e.target.value)}
                  placeholder="Optional"
                  autoComplete="additional-name"
                />
              </FormField>
              <FormField label="Birthdate">
                <TextInput
                  type="date"
                  value={form.birthdate}
                  onChange={(e) => updateField("birthdate", e.target.value)}
                />
              </FormField>
              <FormField label="City / Municipality">
                <SelectInput
                  value={form.city_municipality}
                  onChange={(e) => updateField("city_municipality", e.target.value)}
                  options={municipalityOptions()}
                  placeholder="Any municipality"
                />
              </FormField>
              <FormField label="Barangay">
                <SelectInput
                  value={form.barangay}
                  onChange={(e) => updateField("barangay", e.target.value)}
                  options={barangays}
                  placeholder={
                    form.city_municipality ? "Any barangay" : "Select municipality first"
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
                onClick={handleClear}
                className="faced-btn-secondary"
              >
                Clear form
              </button>
            </div>
          </form>
        </section>

        {matches !== null ? (
          <section className="space-y-4">
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
                            {[match.barangay, match.cityMunicipality, SARANGANI_PROVINCE]
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
      </main>
    </div>
  );
}
