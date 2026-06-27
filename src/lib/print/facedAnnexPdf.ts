"use client";

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/print-faced.css";
import type { FacedAnnexPrintPayload } from "./facedAnnexPrintWindow";
import { assistanceMapFromRecord, membersMapFromRecord } from "./facedAnnexPrintWindow";

export const FACED_PDF_DONE = "faced-pdf-done";
export const FACED_PDF_ERROR = "faced-pdf-error";
export const FACED_PDF_PROGRESS = "faced-pdf-progress";

export type FacedPdfProgressHandler = (message: string) => void;

export { buildFacedBatchPdfFilename } from "@/lib/batch-pdf/filename";

export async function renderFacedAnnexPdf(element: HTMLElement, filename: string): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;

  await html2pdf()
    .set({
      margin: [0.15, 0.15, 0.15, 0.15],
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "in", format: "letter", orientation: "landscape" },
      pagebreak: { mode: ["css", "legacy"] },
    })
    .from(element)
    .save();
}

async function waitForLayout(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 600);
  });
}

/** Renders FACED forms in-memory (no localStorage) and downloads a PDF. */
export async function downloadFacedAnnexPdf(
  payload: FacedAnnexPrintPayload,
  options?: {
    container?: HTMLElement | null;
    onProgress?: FacedPdfProgressHandler;
  },
): Promise<void> {
  if (!payload.heads.length) {
    throw new Error("No FACED forms to download.");
  }

  const pdfFilename = payload.pdfFilename?.trim() || "FACED_Form.pdf";
  const onProgress = options?.onProgress;
  const headCount = payload.heads.length;

  onProgress?.("> Loading FACED form layout…");

  const host = document.createElement("div");
  host.className = "faced-annex-pdf-host";
  host.style.cssText =
    "width:1200px;max-width:100%;background:#fff;overflow:auto;max-height:220px";

  const worker = options?.container;
  if (worker) {
    worker.replaceChildren(host);
  } else {
    host.style.cssText =
      "position:fixed;left:-10000px;top:0;width:1200px;background:#fff;visibility:hidden";
    document.body.appendChild(host);
  }

  const root = createRoot(host);
  let cleanedUp = false;

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    root.unmount();
    host.remove();
  }

  try {
    const FacedAnnexPrintDocument = (
      await import("@/components/print/FacedAnnexPrintDocument")
    ).default;
    const membersByHead = membersMapFromRecord(payload.membersByHead);
    const assistanceByHead = assistanceMapFromRecord(payload.assistanceByHead);

    root.render(
      createElement(FacedAnnexPrintDocument, {
        heads: payload.heads,
        membersByHead,
        assistanceByHead,
        standalone: true,
      }),
    );

    await waitForLayout();

    const element = host.querySelector<HTMLElement>(".faced-print-root--standalone");
    if (!element) {
      throw new Error("Print layout not found.");
    }

    onProgress?.(`> Rendering ${headCount} FACED form(s) to PDF…`);
    onProgress?.(`> Output file: ${pdfFilename}`);
    await renderFacedAnnexPdf(element, pdfFilename);
    onProgress?.("> PDF saved to downloads.");
  } finally {
    cleanup();
  }
}
