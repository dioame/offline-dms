import { after } from "next/server";
import { failBatchPdfJob, runBatchPdfWorker } from "@/lib/batch-pdf/run-worker";

function isServerlessRuntime(): boolean {
  return Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );
}

export function scheduleBatchPdfWorker(jobId: string, baseUrl: string): void {
  const start = () => {
    void runBatchPdfWorker(jobId, baseUrl).catch(async (err) => {
      const message = err instanceof Error ? err.message : "PDF generation failed.";
      await failBatchPdfJob(jobId, message);
    });
  };

  if (isServerlessRuntime()) {
    after(start);
  } else {
    start();
  }
}
