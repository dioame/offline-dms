"use client";

import "@/styles/print-faced-id.css";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FacedIdCardDocument from "@/components/print/FacedIdCardDocument";
import { SkeletonScreen } from "@/components/ui/Skeleton";
import {
  clearFacedIdPrintPayload,
  loadFacedIdPrintPayload,
  type FacedIdPrintPayload,
} from "@/lib/print/facedIdPrintWindow";

function FacedIdPrintContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("job");
  const [payload, setPayload] = useState<FacedIdPrintPayload | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = loadFacedIdPrintPayload(jobId);
    if (!data?.cards?.length) {
      setError(
        jobId
          ? "Print session expired or missing. Go to Records, click Generate FACED ID again, and allow pop-ups."
          : "Open from Records — click Generate FACED ID on a row. Do not open this page directly.",
      );
      return;
    }
    setPayload(data);
    if (data.title) {
      document.title = data.title;
    }
    setReady(true);
  }, [jobId]);

  useEffect(() => {
    if (!ready || !payload) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 500);
    const onAfterPrint = () => {
      clearFacedIdPrintPayload(jobId);
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [ready, payload, jobId]);

  if (error) {
    return (
      <div className="faced-id-print-shell">
        <div className="faced-id-print-error">
          <p>{error}</p>
          <div className="faced-id-print-toolbar-actions" style={{ justifyContent: "center", marginTop: "1rem" }}>
            <Link href="/records" className="faced-id-print-btn faced-id-print-btn--primary">
              Go to Records
            </Link>
            <button type="button" onClick={() => window.close()} className="faced-id-print-btn">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="faced-id-print-shell no-print">
        <SkeletonScreen label="Preparing FACED ID">
          <div className="mx-auto h-40 w-72 rounded-xl border border-faced-blue-border bg-white" />
        </SkeletonScreen>
      </div>
    );
  }

  return (
    <div className="faced-id-print-shell">
      <div className="faced-id-print-toolbar no-print">
        <p>
          FACED ID ({payload.cards.length} card{payload.cards.length === 1 ? "" : "s"})
        </p>
        <div className="faced-id-print-toolbar-actions">
          <button
            type="button"
            onClick={() => window.print()}
            className="faced-id-print-btn faced-id-print-btn--primary"
          >
            Print
          </button>
          <button type="button" onClick={() => window.close()} className="faced-id-print-btn">
            Close
          </button>
        </div>
      </div>
      <FacedIdCardDocument cards={payload.cards} />
    </div>
  );
}

export default function FacedIdPrintPage() {
  return (
    <Suspense
      fallback={
        <div className="faced-id-print-shell no-print">
          <SkeletonScreen label="Preparing FACED ID">
            <div className="mx-auto h-40 w-72 rounded-xl border border-faced-blue-border bg-white" />
          </SkeletonScreen>
        </div>
      }
    >
      <FacedIdPrintContent />
    </Suspense>
  );
}
