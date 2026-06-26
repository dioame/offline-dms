"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  barangayOptions,
  municipalityOptions,
  SARANGANI_MUNICIPALITIES,
} from "@/lib/sarangani-locations";
import { SkeletonScreen, SkeletonTable } from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type EcLibraryRow = {
  id: number;
  city_municipality: string;
  barangay: string;
  site_name: string;
  created_at: string;
  updated_at: string;
};

type EcLibraryPanelProps = {
  adminFetch: (path: string, init?: RequestInit) => Promise<Response>;
  onMessage: (message: string) => void;
  onError: (error: string) => void;
};

export default function EcLibraryPanel({
  adminFetch,
  onMessage,
  onError,
}: EcLibraryPanelProps) {
  const [sites, setSites] = useState<EcLibraryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterMunicipality, setFilterMunicipality] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("");
  const [search, setSearch] = useState("");
  const [formMunicipality, setFormMunicipality] = useState("");
  const [formBarangay, setFormBarangay] = useState("");
  const [siteName, setSiteName] = useState("");

  const loadSites = useCallback(async () => {
    setLoading(true);
    onError("");
    try {
      const params = new URLSearchParams();
      if (filterMunicipality.trim()) {
        params.set("city_municipality", filterMunicipality.trim());
      }
      if (filterBarangay.trim()) {
        params.set("barangay", filterBarangay.trim());
      }
      const query = params.toString();
      const res = await adminFetch(`/api/admin/ec-library${query ? `?${query}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load evacuation sites.");
      }
      setSites(data.sites || []);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to load evacuation sites.");
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filterBarangay, filterMunicipality, onError]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  useEffect(() => {
    setFilterBarangay("");
  }, [filterMunicipality]);

  useEffect(() => {
    if (!formMunicipality && SARANGANI_MUNICIPALITIES[0]) {
      setFormMunicipality(SARANGANI_MUNICIPALITIES[0]);
    }
  }, [formMunicipality]);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((site) =>
      [site.site_name, site.city_municipality, site.barangay]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [search, sites]);

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    onError("");
    onMessage("");
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/ec-library", {
        method: "POST",
        body: JSON.stringify({
          city_municipality: formMunicipality,
          barangay: formBarangay,
          site_name: siteName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add evacuation site.");
      }
      setSiteName("");
      onMessage(`Added "${data.site?.site_name ?? siteName}" to ${formBarangay}, ${formMunicipality}.`);
      await loadSites();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add evacuation site.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, label: string) {
    if (!window.confirm(`Remove "${label}" from the EC library?`)) return;
    onError("");
    onMessage("");
    setDeletingId(id);
    try {
      const res = await adminFetch("/api/admin/ec-library", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete evacuation site.");
      }
      onMessage(`Removed "${label}".`);
      await loadSites();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete evacuation site.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className={ui.card}>
        <div className={ui.sectionHeader}>Add evacuation site</div>
        <form onSubmit={(e) => void handleAdd(e)} className={cn(ui.sectionBody, "grid gap-4 sm:grid-cols-2")}>
          <label className="block">
            <span className={ui.label}>Municipality</span>
            <select
              className={cn(ui.input, "mt-1")}
              value={formMunicipality}
              onChange={(e) => {
                setFormMunicipality(e.target.value);
                setFormBarangay("");
              }}
              required
            >
              <option value="">Select municipality</option>
              {municipalityOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={ui.label}>Barangay</span>
            <select
              className={cn(ui.input, "mt-1")}
              value={formBarangay}
              onChange={(e) => setFormBarangay(e.target.value)}
              required
              disabled={!formMunicipality}
            >
              <option value="">
                {formMunicipality ? "Select barangay" : "Select municipality first"}
              </option>
              {barangayOptions(formMunicipality).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={ui.label}>Evacuation center / site name</span>
            <input
              type="text"
              className={cn(ui.input, "mt-1")}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. Barangay Covered Court"
              required
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving || !formMunicipality || !formBarangay || !siteName.trim()}
              className={cn(ui.btnPrimary, ui.withIcon)}
            >
              {saving ? (
                <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
              ) : (
                <Plus className={ui.iconSm} aria-hidden />
              )}
              Add to EC library
            </button>
          </div>
        </form>
      </section>

      <section className={ui.card}>
        <div className={cn(ui.sectionHeader, "flex flex-wrap items-center justify-between gap-2")}>
          <span>EC library ({filteredSites.length}{search ? ` of ${sites.length}` : ""})</span>
          <button
            type="button"
            onClick={() => void loadSites()}
            disabled={loading}
            className={cn("text-xs font-normal normal-case tracking-normal underline", ui.withIcon)}
          >
            <RefreshCw className={cn(ui.iconSm, loading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>
        <div className="border-b border-faced-blue-border bg-ph-blue-light/50 px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className={ui.input}
              value={filterMunicipality}
              onChange={(e) => setFilterMunicipality(e.target.value)}
            >
              <option value="">All municipalities</option>
              {municipalityOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={ui.input}
              value={filterBarangay}
              onChange={(e) => setFilterBarangay(e.target.value)}
              disabled={!filterMunicipality}
            >
              <option value="">
                {filterMunicipality ? "All barangays" : "Select municipality first"}
              </option>
              {barangayOptions(filterMunicipality).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search site, barangay, municipality..."
              className={ui.input}
            />
          </div>
        </div>

        <div className={cn(ui.sectionBody, "hidden overflow-x-auto p-0 lg:block")}>
          <table className={cn(ui.table, "w-full min-w-[720px] text-sm")}>
            <thead>
              <tr>
                <th>Municipality</th>
                <th>Barangay</th>
                <th>Evacuation site</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && sites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-0">
                    <SkeletonScreen label="Loading EC library">
                      <SkeletonTable rows={5} columns={4} />
                    </SkeletonScreen>
                  </td>
                </tr>
              ) : filteredSites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-zinc-500">
                    {sites.length === 0
                      ? "No evacuation sites in the library yet."
                      : "No sites match your filters."}
                  </td>
                </tr>
              ) : (
                filteredSites.map((site) => (
                  <tr key={site.id}>
                    <td>{site.city_municipality}</td>
                    <td>{site.barangay}</td>
                    <td className="font-medium text-slate-900">{site.site_name}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => void handleDelete(site.id, site.site_name)}
                        disabled={deletingId === site.id}
                        className={cn(ui.btnDanger, ui.withIcon, "text-sm")}
                      >
                        {deletingId === site.id ? (
                          <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                        ) : (
                          <Trash2 className={ui.iconSm} aria-hidden />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={cn(ui.sectionBody, "space-y-3 lg:hidden")}>
          {loading && sites.length === 0 ? (
            <SkeletonScreen label="Loading EC library">
              <SkeletonTable rows={4} columns={1} />
            </SkeletonScreen>
          ) : filteredSites.length === 0 ? (
            <p className="text-center text-sm text-zinc-500">
              {sites.length === 0
                ? "No evacuation sites in the library yet."
                : "No sites match your filters."}
            </p>
          ) : (
            filteredSites.map((site) => (
              <article
                key={site.id}
                className="rounded-lg border border-faced-blue-border bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{site.site_name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {site.barangay}, {site.city_municipality}
                </p>
                <button
                  type="button"
                  onClick={() => void handleDelete(site.id, site.site_name)}
                  disabled={deletingId === site.id}
                  className={cn(ui.btnDanger, ui.withIcon, "mt-3 text-sm")}
                >
                  {deletingId === site.id ? (
                    <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                  ) : (
                    <Trash2 className={ui.iconSm} aria-hidden />
                  )}
                  Remove
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
