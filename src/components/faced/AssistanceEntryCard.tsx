import type { ReactNode } from "react";
import type { FamilyAssistanceRecordData, FamilyMemberOption } from "@/lib/family-assistance-types";
import {
  ASSISTANCE_PROVIDER_SUGGESTIONS,
  ASSISTANCE_RECEIVED_SUGGESTIONS,
  ASSISTANCE_UNIT_SUGGESTIONS,
} from "@/lib/family-assistance-types";
import { Trash2 } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { todayDateInputValue } from "@/lib/faced-types";
import { TextInput } from "./FormField";

type AssistanceEntryCardProps = {
  entry: FamilyAssistanceRecordData;
  index: number;
  memberOptions: FamilyMemberOption[];
  memberSuggestions: string[];
  canRemove: boolean;
  onChange: (field: keyof FamilyAssistanceRecordData, value: string) => void;
  onRemove: () => void;
};

const compactInput = cn(ui.input, "py-1.5 text-sm");
const compactChip = cn(
  "rounded border border-faced-blue-border bg-ph-blue-light px-1.5 py-0.5",
  "text-[0.625rem] font-semibold leading-tight text-ph-blue transition hover:bg-white",
);

function CompactField({
  label,
  required = false,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <span className="mb-0.5 block text-[0.625rem] font-semibold uppercase tracking-wide text-gray-600">
        {label}
        {required ? <span className="text-ph-red"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

function CompactChips({
  suggestions,
  onSelect,
  className,
}: {
  suggestions: readonly string[];
  onSelect: (value: string) => void;
  className?: string;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className={cn("mt-1 flex flex-wrap gap-1", className)}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect(suggestion)}
          className={compactChip}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export default function AssistanceEntryCard({
  entry,
  index,
  memberOptions,
  memberSuggestions,
  canRemove,
  onChange,
  onRemove,
}: AssistanceEntryCardProps) {
  function selectMemberSuggestion(label: string) {
    const match = memberOptions.find(
      (option) => option.value === label || option.label === label,
    );
    onChange("receiving_member_name", match?.value ?? label);
  }

  return (
    <article className="rounded-lg border border-faced-blue-border/80 bg-white px-2.5 py-2 shadow-sm">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[0.625rem] font-extrabold uppercase tracking-wider text-ph-blue">
          Entry #{index + 1}
        </span>
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold text-ph-red transition hover:bg-ph-red-light"
            aria-label={`Remove entry ${index + 1}`}
          >
            <Trash2 className="h-3 w-3" aria-hidden />
            Remove
          </button>
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <CompactField label="Date" required>
            <TextInput
              type="date"
              value={entry.date_provided}
              onChange={(e) => onChange("date_provided", e.target.value)}
              max={todayDateInputValue()}
              className={compactInput}
              required
            />
          </CompactField>

          <CompactField label="Member" required>
            <TextInput
              value={entry.receiving_member_name}
              onChange={(e) => onChange("receiving_member_name", e.target.value)}
              placeholder="Family member"
              className={compactInput}
              required
            />
            <CompactChips suggestions={memberSuggestions} onSelect={selectMemberSuggestion} />
          </CompactField>
        </div>

        <div className="space-y-1">
          <CompactField label="Assistance" required>
            <TextInput
              value={entry.assistance_received}
              onChange={(e) => onChange("assistance_received", e.target.value)}
              placeholder="e.g. Family Food Pack"
              className={compactInput}
              required
            />
          </CompactField>
          <CompactChips
            suggestions={ASSISTANCE_RECEIVED_SUGGESTIONS}
            onSelect={(value) => onChange("assistance_received", value)}
            className="mt-0"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <CompactField label="Unit">
            <TextInput
              value={entry.unit}
              onChange={(e) => onChange("unit", e.target.value)}
              placeholder="box, pack…"
              className={compactInput}
            />
            <CompactChips
              suggestions={ASSISTANCE_UNIT_SUGGESTIONS}
              onSelect={(value) => onChange("unit", value)}
            />
          </CompactField>

          <CompactField label="Qty">
            <TextInput
              value={entry.quantity}
              onChange={(e) => onChange("quantity", e.target.value)}
              placeholder="2"
              inputMode="decimal"
              className={compactInput}
            />
          </CompactField>

          <CompactField label="Cost">
            <TextInput
              value={entry.cost_of_assistance}
              onChange={(e) => onChange("cost_of_assistance", e.target.value)}
              placeholder="1500"
              inputMode="decimal"
              className={compactInput}
            />
          </CompactField>

          <CompactField label="Provider" required>
            <TextInput
              value={entry.provider}
              onChange={(e) => onChange("provider", e.target.value)}
              placeholder="DSWD, LGU, NGO"
              className={compactInput}
              required
            />
            <CompactChips
              suggestions={ASSISTANCE_PROVIDER_SUGGESTIONS}
              onSelect={(value) => onChange("provider", value)}
            />
          </CompactField>
        </div>
      </div>
    </article>
  );
}
