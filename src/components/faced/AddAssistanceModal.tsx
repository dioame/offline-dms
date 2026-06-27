"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Save, X } from "lucide-react";
import { addFamilyAssistanceRecord } from "@/lib/db";
import {
  ASSISTANCE_PROVIDER_SUGGESTIONS,
  ASSISTANCE_RECEIVED_SUGGESTIONS,
  ASSISTANCE_UNIT_SUGGESTIONS,
  createEmptyFamilyAssistanceRecord,
  type FamilyAssistanceRecordData,
  type FamilyMemberOption,
} from "@/lib/family-assistance-types";
import { FormField, SuggestionChips, TextInput } from "./FormField";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type AddAssistanceModalProps = {
  open: boolean;
  familyUuid: string;
  accessCode: string;
  memberOptions: FamilyMemberOption[];
  onClose: () => void;
  onDone: () => void;
  saveAssistance?: (data: FamilyAssistanceRecordData) => Promise<void>;
};

export default function AddAssistanceModal({
  open,
  familyUuid,
  accessCode,
  memberOptions,
  onClose,
  onDone,
  saveAssistance,
}: AddAssistanceModalProps) {
  const [form, setForm] = useState<FamilyAssistanceRecordData>(
    createEmptyFamilyAssistanceRecord(familyUuid, accessCode),
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const memberSuggestions = useMemo(
    () => memberOptions.map((option) => option.label),
    [memberOptions],
  );

  useEffect(() => {
    if (!open) return;
    setForm(createEmptyFamilyAssistanceRecord(familyUuid, accessCode));
    setMessage(null);
    setSavedCount(0);
  }, [open, familyUuid, accessCode]);

  function updateField<K extends keyof FamilyAssistanceRecordData>(
    key: K,
    value: FamilyAssistanceRecordData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  }

  function selectMemberSuggestion(label: string) {
    const match = memberOptions.find(
      (option) => option.value === label || option.label === label,
    );
    updateField("receiving_member_name", match?.value ?? label);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!form.date_provided.trim()) {
      setMessage("Please enter the date assistance was provided.");
      return;
    }
    if (!form.receiving_member_name.trim()) {
      setMessage("Please enter the receiving family member.");
      return;
    }
    if (!form.assistance_received.trim()) {
      setMessage("Please enter the assistance received.");
      return;
    }
    if (!form.provider.trim()) {
      setMessage("Please enter the provider.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        faced_record_uuid: familyUuid,
        access_code: accessCode,
      };
      if (saveAssistance) {
        await saveAssistance(payload);
      } else {
        await addFamilyAssistanceRecord(payload);
      }
      setSavedCount((count) => count + 1);
      setForm(createEmptyFamilyAssistanceRecord(familyUuid, accessCode));
      setMessage("Assistance record saved.");
    } catch {
      setMessage("Could not save assistance record. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={cn(ui.modalWide, "flex max-h-[90vh] flex-col overflow-hidden")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-assistance-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon, "shrink-0")}>
          <Gift className={ui.iconMd} aria-hidden />
          <h3 id="add-assistance-title">Add assistance provided</h3>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className={cn(ui.modalBody, "min-h-0 flex-1 overflow-y-auto")}>
            {savedCount > 0 ? (
              <div className={ui.alertSuccess}>
                {savedCount} assistance record{savedCount === 1 ? "" : "s"} saved for this family.
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField label="Date provided" required>
                <TextInput
                  type="date"
                  value={form.date_provided}
                  onChange={(e) => updateField("date_provided", e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Receiving family member" required className="sm:col-span-2">
                <TextInput
                  value={form.receiving_member_name}
                  onChange={(e) => updateField("receiving_member_name", e.target.value)}
                  placeholder="Family member name"
                  required
                />
                <SuggestionChips
                  suggestions={memberSuggestions}
                  onSelect={selectMemberSuggestion}
                />
              </FormField>

              <FormField label="Assistance received" required className="sm:col-span-2 lg:col-span-3">
                <TextInput
                  value={form.assistance_received}
                  onChange={(e) => updateField("assistance_received", e.target.value)}
                  placeholder="e.g. Family Food Pack"
                  required
                />
                <SuggestionChips
                  suggestions={ASSISTANCE_RECEIVED_SUGGESTIONS}
                  onSelect={(value) => updateField("assistance_received", value)}
                />
              </FormField>

              <FormField label="Unit">
                <TextInput
                  value={form.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  placeholder="e.g. box, pack, pcs, set"
                />
                <SuggestionChips
                  suggestions={ASSISTANCE_UNIT_SUGGESTIONS}
                  onSelect={(value) => updateField("unit", value)}
                />
              </FormField>

              <FormField label="Quantity">
                <TextInput
                  value={form.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  placeholder="e.g. 2"
                  inputMode="decimal"
                />
              </FormField>

              <FormField label="Cost of assistance">
                <TextInput
                  value={form.cost_of_assistance}
                  onChange={(e) => updateField("cost_of_assistance", e.target.value)}
                  placeholder="e.g. 1500"
                  inputMode="decimal"
                />
              </FormField>

              <FormField label="Provider" required>
                <TextInput
                  value={form.provider}
                  onChange={(e) => updateField("provider", e.target.value)}
                  placeholder="e.g. DSWD, LGU, NGO"
                  required
                />
                <SuggestionChips
                  suggestions={ASSISTANCE_PROVIDER_SUGGESTIONS}
                  onSelect={(value) => updateField("provider", value)}
                />
              </FormField>
            </div>

            {message ? (
              <p
                className={`mt-4 text-sm ${message.includes("saved") ? "text-emerald-700" : "text-red-600"}`}
                role="status"
              >
                {message}
              </p>
            ) : null}
          </div>

          <div className={cn(ui.modalActions, "shrink-0 flex-col sm:flex-row")}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}
            >
              <X className={ui.iconSm} aria-hidden />
              Close
            </button>
            <button
              type="button"
              onClick={onDone}
              disabled={saving}
              className={cn(ui.btnSecondary, "w-full sm:w-auto")}
            >
              Done
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(ui.btnPrimary, ui.withIcon, "w-full sm:w-auto")}
            >
              {saving ? (
                <>
                  <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                  Saving...
                </>
              ) : (
                <>
                  <Save className={ui.iconSm} aria-hidden />
                  Save assistance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
