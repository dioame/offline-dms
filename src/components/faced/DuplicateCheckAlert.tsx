"use client";

import { SARANGANI_PROVINCE } from "@/lib/sarangani-locations";
import { formatDuplicateMatchSummary, type VerifyMatch } from "@/lib/verify-match";

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
  if (!canCheck) {
    return null;
  }

  if (checking) {
    return (
      <div className="encode-duplicate-flag encode-duplicate-flag--checking sm:col-span-2">
        Checking duplicates…
      </div>
    );
  }

  if (matches.length === 0) {
    return null;
  }

  const visible = matches.slice(0, 2);

  return (
    <div className="encode-duplicate-panel sm:col-span-2">
      <div className="encode-duplicate-flag encode-duplicate-flag--warning">
        <span className="encode-duplicate-flag-icon" aria-hidden>
          !
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

      <ul className="encode-duplicate-list">
        {visible.map((match) => (
          <li key={match.uuid} className="encode-duplicate-item">
            <span className="font-semibold text-[var(--ph-blue-dark)]">{match.headName}</span>
            <span className="text-zinc-600">
              {" "}
              — {formatDuplicateMatchSummary(match, SARANGANI_PROVINCE)}
            </span>
          </li>
        ))}
      </ul>

      {matches.length > 2 ? (
        <p className="encode-duplicate-more">+{matches.length - 2} more match(es)</p>
      ) : null}
    </div>
  );
}
