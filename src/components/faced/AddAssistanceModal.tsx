"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Plus, Save, TriangleAlert, X } from "lucide-react";
import { addFamilyAssistanceRecord } from "@/lib/db";
import {
  createEmptyFamilyAssistanceRecord,
  validateFamilyAssistanceRecord,
  type FamilyAssistanceRecordData,
  type FamilyMemberOption,
} from "@/lib/family-assistance-types";
import AssistanceEntryCard from "./AssistanceEntryCard";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type AddAssistanceModalProps = {
  open: boolean;
  familyUuid: string;
  accessCode: string;
  memberOptions: FamilyMemberOption[];
  onClose: () => void;
  onDone: () => void;
  saveAssistance?: (records: FamilyAssistanceRecordData[]) => Promise<void>;
};

function hasUnsavedEntries(entries: FamilyAssistanceRecordData[]): boolean {
  return entries.some((entry) =>
    [
      entry.date_provided,
      entry.receiving_member_name,
      entry.assistance_received,
      entry.unit,
      entry.quantity,
      entry.cost_of_assistance,
      entry.provider,
    ].some((value) => value.trim()),
  );
}

export default function AddAssistanceModal({
  open,
  familyUuid,
  accessCode,
  memberOptions,
  onClose,
  onDone,
  saveAssistance,
}: AddAssistanceModalProps) {
  const [entries, setEntries] = useState<FamilyAssistanceRecordData[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const memberSuggestions = useMemo(
    () => memberOptions.map((option) => option.label),
    [memberOptions],
  );

  useEffect(() => {
    if (!open) return;
    setEntries([createEmptyFamilyAssistanceRecord(familyUuid, accessCode)]);
    setMessage(null);
    setDiscardConfirmOpen(false);
  }, [open, familyUuid, accessCode]);

  function updateEntry(
    index: number,
    field: keyof FamilyAssistanceRecordData,
    value: string,
  ) {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setMessage(null);
  }

  function addEntry() {
    setEntries((prev) => {
      const template = prev[0];
      const next = createEmptyFamilyAssistanceRecord(familyUuid, accessCode);
      if (template) {
        next.date_provided = template.date_provided;
        next.receiving_member_name = template.receiving_member_name;
      }
      return [...prev, next];
    });
    setMessage(null);
  }

  function removeEntry(index: number) {
    setEntries((prev) => prev.filter((_, i) => i !== index));
    setMessage(null);
  }

  function requestClose() {
    if (!hasUnsavedEntries(entries)) {
      onClose();
      return;
    }
    setDiscardConfirmOpen(true);
  }

  function confirmDiscard() {
    setDiscardConfirmOpen(false);
    onClose();
  }

  function cancelDiscard() {
    setDiscardConfirmOpen(false);
  }

  function handleClose() {
    requestClose();
  }

  async function handleSaveAll() {
    setMessage(null);

    if (entries.length === 0) {
      setMessage("Add at least one assistance entry before saving.");
      return;
    }

    for (let index = 0; index < entries.length; index += 1) {
      const error = validateFamilyAssistanceRecord(entries[index]);
      if (error) {
        setMessage(`Entry #${index + 1}: ${error}`);
        return;
      }
    }

    const payloads = entries.map((entry) => ({
      ...entry,
      faced_record_uuid: familyUuid,
      access_code: accessCode,
    }));

    setSaving(true);
    try {
      if (saveAssistance) {
        await saveAssistance(payloads);
      } else {
        for (const payload of payloads) {
          await addFamilyAssistanceRecord(payload);
        }
      }
      onDone();
    } catch {
      setMessage("Could not save assistance records. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onClick={discardConfirmOpen || saving ? undefined : handleClose}
    >
      <div
        className={cn(ui.modalWide, "flex max-h-[90vh] flex-col overflow-hidden")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-assistance-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            ui.modalHeader,
            ui.modalHeaderInfo,
            "flex shrink-0 items-center justify-between gap-2",
          )}
        >
          <div className={cn(ui.withIcon, "min-w-0")}>
            <Gift className={ui.iconMd} aria-hidden />
            <h3 id="add-assistance-title" className="truncate">
              Add assistance provided
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={cn(
              "inline-flex shrink-0 items-center justify-center rounded-md p-1.5",
              "text-white/90 transition hover:bg-white/15 disabled:opacity-50",
            )}
            aria-label="Close"
          >
            <X className={ui.iconMd} aria-hidden />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className={cn(ui.modalBody, "min-h-0 flex-1 overflow-y-auto py-3")}>
            <p className="mb-2 text-[0.6875rem] text-zinc-500">
              Add entries below, then save all at once.
            </p>

            <div className="space-y-2">
              {entries.map((entry, index) => (
                <AssistanceEntryCard
                  key={index}
                  entry={entry}
                  index={index}
                  memberOptions={memberOptions}
                  memberSuggestions={memberSuggestions}
                  canRemove={entries.length > 1}
                  onChange={(field, value) => updateEntry(index, field, value)}
                  onRemove={() => removeEntry(index)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={addEntry}
              className={cn(
                ui.familyAddBtn,
                ui.withIcon,
                "mt-2 py-2 text-xs",
                entries.length > 0 ? "" : "",
              )}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add assistance
            </button>

            {message ? (
              <p className="mt-2 text-xs text-red-600" role="status">
                {message}
              </p>
            ) : null}
          </div>

          <div className={cn(ui.modalActions, "shrink-0 flex-col sm:flex-row")}>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}
            >
              <X className={ui.iconSm} aria-hidden />
              Close
            </button>
            <button
              type="button"
              onClick={() => void handleSaveAll()}
              disabled={saving || entries.length === 0}
              className={cn(ui.btnPrimary, ui.withIcon, "w-full sm:w-auto sm:ml-auto")}
            >
              {saving ? (
                <>
                  <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                  Saving...
                </>
              ) : (
                <>
                  <Save className={ui.iconSm} aria-hidden />
                  Save all{entries.length > 0 ? ` (${entries.length})` : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {discardConfirmOpen ? (
        <div
          className={cn(ui.modalBackdrop, "z-[60]")}
          role="presentation"
          onClick={cancelDiscard}
        >
          <div
            className={ui.modal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="assistance-discard-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={cn(ui.modalHeader, ui.modalHeaderWarning, ui.withIcon)}>
              <TriangleAlert className={ui.iconMd} aria-hidden />
              <h3 id="assistance-discard-title">Discard unsaved assistance?</h3>
            </div>
            <div className={ui.modalBody}>
              <p className="text-sm text-zinc-700">
                You have unsaved assistance entries. Close without saving?
              </p>
            </div>
            <div className={ui.modalActions}>
              <button
                type="button"
                onClick={cancelDiscard}
                className={cn(ui.btnSecondary, ui.withIcon)}
              >
                <X className={ui.iconSm} aria-hidden />
                Keep editing
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className={cn(ui.btnPrimary, ui.withIcon)}
              >
                <X className={ui.iconSm} aria-hidden />
                Close without saving
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
