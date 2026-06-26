import type { FamilyMemberListItem } from "@/lib/records-admin";
import { formatDisplayBirthdate } from "@/lib/faced-types";
import { cn } from "@/lib/cn";

function memberLabel(member: FamilyMemberListItem): string {
  const parts: string[] = [];
  if (member.name) parts.push(member.name.trim());
  if (member.relationship) parts.push(member.relationship.trim());
  const birthdate = formatDisplayBirthdate(member.birthdate);
  if (birthdate) parts.push(birthdate);  if (member.age) parts.push(`age ${member.age}`);
  if (member.sex) {
    const sex = member.sex.trim().toUpperCase();
    if (sex === "M" || sex === "MALE") parts.push("M");
    else if (sex === "F" || sex === "FEMALE") parts.push("F");
    else parts.push(member.sex.trim());
  }
  return parts.join(" · ").toUpperCase();
}

type DuplicateFamilyMembersProps = {
  members: FamilyMemberListItem[];
  className?: string;
};

export default function DuplicateFamilyMembers({
  members,
  className,
}: DuplicateFamilyMembersProps) {
  if (members.length === 0) return null;

  return (
    <div className={cn("mt-1.5", className)}>
      <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-amber-900/70">
        Family members ({members.length})
      </p>
      <ul className="mt-1 flex flex-wrap gap-1.5">
        {members.map((member, index) => (
          <li
            key={`${member.name}-${index}`}
            className="rounded border border-amber-200/80 bg-white/70 px-1.5 py-0.5 text-xs text-zinc-700"
            title={memberLabel(member)}
          >
            {memberLabel(member)}
          </li>
        ))}
      </ul>
    </div>
  );
}
