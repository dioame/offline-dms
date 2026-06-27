"use client";

import { SARANGANI_PROVINCE } from "@/lib/sarangani-locations";
import { formatDuplicateMatchSummary, type VerifyMatch } from "@/lib/verify-match";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import * as ui from "@/lib/ui";

type DuplicateCheckAlertProps = {
  matches: VerifyMatch[];
  source: "online" | "offline" | "local" | null;
  checking: boolean;
  canCheck: boolean;
};

function sourceLabel(source: DuplicateCheckAlertProps["source"]): string {
  if (source === "online") return "online";
  if (source === "offline") return "offline copy";
  if (source === "local") return "this device";
  return "records";
}

export default function DuplicateCheckAlert({
  matches,
  source,
  checking,
  canCheck,
}: DuplicateCheckAlertProps) {
  if (checking) {
    return (
      <div
        className={cn(ui.encodeDuplicateChecking, ui.withIcon, "sm:col-span-2")}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
        Duplicate checking in process…
      </div>
    );
  }

  if (!canCheck || matches.length === 0) {
    return null;
  }

  const visible = matches.slice(0, 2);

  return (
    <div className={cn(ui.encodeDuplicatePanel, "sm:col-span-2")}>
      <div className={ui.encodeDuplicateWarning}>
        <span className={ui.encodeDuplicateFlagIcon} aria-hidden>
          <AlertTriangle className={ui.iconSm} />
        </span>
        <p className="min-w-0 text-sm leading-snug">
          <strong>
            {matches.length === 1
              ? "Possible duplicate"
              : `${matches.length} possible duplicates`}
          </strong>
          <span className="text-amber-900/80"> · {sourceLabel(source)}</span>
        </p>
      </div>

      <ul className={ui.encodeDuplicateList}>
        {visible.map((match) => (
          <li key={match.uuid} className={ui.encodeDuplicateItem}>
            <span className="font-semibold text-ph-blue-dark">{match.headName}</span>
            <span className="text-zinc-600">
              {" "}
              — {formatDuplicateMatchSummary(match, SARANGANI_PROVINCE)}
            </span>
          </li>
        ))}
      </ul>

      {matches.length > 2 ? (
        <p className={ui.encodeDuplicateMore}>+{matches.length - 2} more match(es)</p>
      ) : null}
    </div>
  );
}
