import { spawn } from "node:child_process";
import path from "node:path";

export function spawnBatchPdfWorker(jobId: string, baseUrl: string): void {
  const scriptPath = path.join(process.cwd(), "scripts", "generate-faced-batch-pdf.mjs");
  const child = spawn(process.execPath, [scriptPath, jobId, baseUrl], {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
    env: process.env,
  });
  child.unref();
}
