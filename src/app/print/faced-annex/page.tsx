"use client";

import "@/styles/print-faced.css";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FacedAnnexPrintDocument from "@/components/print/FacedAnnexPrintDocument";
import { SkeletonFormCard, SkeletonScreen } from "@/components/ui/Skeleton";
import {
  clearFacedAnnexPrintPayload,
  loadFacedAnnexPrintPayload,
  membersMapFromRecord,
  type FacedAnnexPrintPayload,
} from "@/lib/print/facedAnnexPrintWindow";

function FacedAnnexPrintContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");
  const [payload, setPayload] = useState<FacedAnnexPrintPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = loadFacedAnnexPrintPayload(jobId);
    if (!data?.heads?.length) {
      setError(
        jobId
          ? "Print session expired or missing. Go to Records, click Print FACED again, and allow pop-ups."
          : "Open print from Records — click Print FACED on a row. Do not open this page directly.",
      );
      return;
    }
    setPayload(data);
    if (data.title) {
      document.title = data.title;
    }
    setReady(true);
  }, [jobId]);

  const membersByHead = useMemo(
    () => (payload ? membersMapFromRecord(payload.membersByHead) : new Map()),
    [payload],
  );

  useEffect(() => {
    if (!ready || !payload) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 500);
    const onAfterPrint = () => {
      clearFacedAnnexPrintPayload(jobId);
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [ready, payload, jobId]);

  if (error) {
    return (
      <div className="faced-annex-print-shell">
        <div className="faced-annex-print-error">
          <p>{error}</p>
          <div
            className="faced-annex-print-toolbar-actions"
            style={{ justifyContent: "center", marginTop: "1rem" }}
          >
            <Link href="/records" className="faced-annex-print-btn faced-annex-print-btn--primary">
              Go to Records
            </Link>
            <button type="button" onClick={() => window.close()} className="faced-annex-print-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="faced-annex-print-shell no-print">
        <SkeletonScreen label="Preparing Annex A FACED forms">
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            <SkeletonFormCard fields={4} />
            <SkeletonFormCard fields={4} />
          </div>
        </SkeletonScreen>
      </div>
    );
  }

  return (
    <div className="faced-annex-print-shell">
      <div className="faced-annex-print-toolbar no-print">
        <p>
          Annex A — FACED ({payload.heads.length} family head{payload.heads.length === 1 ? "" : "s"}) — beneficiary
          &amp; social worker copies side by side
        </p>
        <div className="faced-annex-print-toolbar-actions">
          <button
            type="button"
            onClick={() => window.print()}
            className="faced-annex-print-btn faced-annex-print-btn--primary"
          >
            Print
          </button>
          <button type="button" onClick={() => window.close()} className="faced-annex-print-btn">
            Close
          </button>
        </div>
      </div>
      <FacedAnnexPrintDocument heads={payload.heads} membersByHead={membersByHead} standalone />
    </div>
  );
}

export default function FacedAnnexPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="faced-annex-print-shell no-print">
          <SkeletonScreen label="Preparing Annex A FACED forms">
            <div className="mx-auto max-w-4xl space-y-6 p-6">
              <SkeletonFormCard fields={4} />
              <SkeletonFormCard fields={4} />
            </div>
          </SkeletonScreen>
        </div>
      }
    >
      <FacedAnnexPrintContent />
    </Suspense>
  );
}
