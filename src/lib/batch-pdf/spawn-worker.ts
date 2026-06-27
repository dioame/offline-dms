import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { appendBatchPdfJobLog, patchBatchPdfJob } from "@/lib/batch-pdf/job-store";

async function failJob(jobId: string, message: string): Promise<void> {
  await appendBatchPdfJobLog(jobId, `✗ ${message}`);
  await patchBatchPdfJob(jobId, { status: "failed", error: message });
}

export async function spawnBatchPdfWorker(jobId: string, baseUrl: string): Promise<void> {
  const cwd = process.cwd();
  const scriptPath = path.join(cwd, "scripts", "generate-faced-batch-pdf.mjs");
  const cacheDir = path.join(cwd, ".puppeteer-cache");

  if (!fs.existsSync(scriptPath)) {
    const message = `Batch PDF worker script not found at ${scriptPath}. Rebuild the Electron app.`;
    await failJob(jobId, message);
    throw new Error(message);
  }

  const env = {
    ...process.env,
    PUPPETEER_CACHE_DIR: cacheDir,
    ...(process.versions.electron ? { ELECTRON_RUN_AS_NODE: "1" } : {}),
  };

  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, jobId, baseUrl], {
      detached: true,
      stdio: "ignore",
      cwd,
      env,
    });

    child.once("error", (error) => {
      void failJob(jobId, `Failed to start background worker: ${error.message}`).finally(() => {
        reject(error);
      });
    });

    child.unref();
    resolve();
  });
}
