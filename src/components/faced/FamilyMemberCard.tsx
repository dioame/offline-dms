import type { FamilyMember } from "@/lib/faced-types";
import { UserMinus } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import {
  educationalAttainmentOptions,
  FAMILY_MEMBER_OCCUPATION_SUGGESTIONS,
  relationOptions,
  vulnerabilityOptions,
} from "@/lib/faced-options";
import { FormField, RadioGroup, SelectInput, SuggestionChips, TextInput } from "./FormField";

const SEX_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

type FamilyMemberCardProps = {
  member: FamilyMember;
  index: number;
  canRemove: boolean;
  onChange: (field: keyof FamilyMember, value: string) => void;
  onRemove: () => void;
};

function memberTitle(member: FamilyMember, index: number): string {
  const name = member.family_member_name.trim();
  if (name) return name;
  return `Family member ${index + 1}`;
}

export default function FamilyMemberCard({
  member,
  index,
  canRemove,
  onChange,
  onRemove,
}: FamilyMemberCardProps) {
  const hasName = Boolean(member.family_member_name.trim());
  const hasRelation = Boolean(member.relationship_to_family_head.trim());

  return (
    <article className={ui.familyCard}>
      <div className={ui.familyCardHeader}>
        <div className="min-w-0 flex-1">
          <span className={ui.familyBadge}>#{index + 1}</span>
          <h3 className={ui.familyTitle}>{memberTitle(member, index)}</h3>
          {(hasName || hasRelation) && (
            <p className={ui.familySubtitle}>
              {[member.relationship_to_family_head, member.age && `${member.age} yrs`]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className={cn(ui.familyRemove, ui.withIcon)}
            aria-label={`Remove ${memberTitle(member, index)}`}
          >
            <UserMinus className={ui.iconSm} aria-hidden />
            Remove
          </button>
        )}
      </div>

      <div className={ui.familyCardBody}>
        <FormField label="Full name" required>
          <TextInput
            value={member.family_member_name}
            onChange={(e) => onChange("family_member_name", e.target.value)}
            placeholder="Family member name"
            autoComplete="name"
          />
        </FormField>

        <FormField label="Relationship to head" required>
          <SelectInput
            value={member.relationship_to_family_head}
            onChange={(e) => onChange("relationship_to_family_head", e.target.value)}
            options={relationOptions()}
            placeholder="Select relationship"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Birthdate">
            <TextInput
              type="date"
              value={member.birthdate}
              onChange={(e) => onChange("birthdate", e.target.value)}
            />
          </FormField>
          <FormField label="Age">
            <TextInput
              type="number"
              min={0}
              max={150}
              value={member.age}
              onChange={(e) => onChange("age", e.target.value)}
              placeholder="Age"
            />
          </FormField>
        </div>

        <FormField label="Sex">
          <RadioGroup
            name={`family_member_sex_${index}`}
            options={SEX_OPTIONS}
            value={member.sex}
            onChange={(value) => onChange("sex", value)}
            spread="start"
          />
        </FormField>

        <FormField label="Highest educational attainment">
          <SelectInput
            value={member.highest_educational_attainment}
            onChange={(e) => onChange("highest_educational_attainment", e.target.value)}
            options={educationalAttainmentOptions()}
            placeholder="Select educational attainment"
          />
        </FormField>

        <FormField label="Occupation">
          <TextInput
            value={member.occupation}
            onChange={(e) => onChange("occupation", e.target.value)}
            placeholder="Occupation"
          />
          <SuggestionChips
            suggestions={FAMILY_MEMBER_OCCUPATION_SUGGESTIONS}
            onSelect={(value) => onChange("occupation", value)}
          />
        </FormField>

        <FormField label="Type of vulnerability">
          <SelectInput
            value={member.type_of_vulnerability}
            onChange={(e) => onChange("type_of_vulnerability", e.target.value)}
            options={vulnerabilityOptions()}
            placeholder="None"
          />
        </FormField>
      </div>
    </article>
  );
}
