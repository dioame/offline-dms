import os from "node:os";
import path from "node:path";

/** Writable temp root — uses OS tmpdir (e.g. /tmp on Lambda/Vercel), not read-only /var/task. */
export function getBatchPdfTempRoot(): string {
  const override = process.env.BATCH_PDF_TMP_DIR?.trim();
  if (override) return override;
  return path.join(os.tmpdir(), "offline-dms-batch-pdf");
}

export function batchPdfJobTempDir(jobId: string): string {
  return path.join(getBatchPdfTempRoot(), jobId);
}
