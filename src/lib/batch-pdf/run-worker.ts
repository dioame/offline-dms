import {
  batchPdfChunkCount,
  BATCH_PDF_CHUNK_SIZE,
  mergePdfBytes,
  readBatchPdfJob,
  saveBatchPdfJob,
} from "@/lib/batch-pdf/job-store";

type Browser = {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
};

type PuppeteerPage = {
  setDefaultTimeout(ms: number): void;
  setDefaultNavigationTimeout(ms: number): void;
  goto(url: string, options: { waitUntil: string }): Promise<unknown>;
  waitForSelector(selector: string, options: { timeout: number }): Promise<unknown>;
  emulateMediaType(type: string): Promise<void>;
  pdf(options: Record<string, unknown>): Promise<Uint8Array | Buffer>;
  close(): Promise<void>;
};

async function launchBrowser(): Promise<Browser> {
  const isServerless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT,
  );

  if (isServerless) {
    try {
      const chromium = await import("@sparticuz/chromium");
      const puppeteer = await import("puppeteer-core");
      const browser = await puppeteer.default.launch({
        args: chromium.default.args,
        executablePath: await chromium.default.executablePath(),
        headless: true,
      });
      return browser as unknown as Browser;
    } catch {
      throw new Error(
        "PDF worker requires @sparticuz/chromium and puppeteer-core in production. Install them or run the app on a Node server.",
      );
    }
  }

  try {
    const puppeteer = await import("puppeteer");
    return (await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })) as unknown as Browser;
  } catch {
    throw new Error("puppeteer is not installed. Run: npm install puppeteer");
  }
}

export async function runBatchPdfWorker(jobId: string, baseUrl: string): Promise<void> {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  let job = await readBatchPdfJob(jobId);
  if (!job) {
    throw new Error("Batch PDF job not found.");
  }
  if (job.status === "complete" || job.status === "failed") {
    return;
  }

  if (!job.payload?.heads?.length) {
    job.status = "failed";
    job.error = "Print payload missing.";
    job.logs = [...job.logs, `✗ ${job.error}`];
    await saveBatchPdfJob(job);
    return;
  }

  job.status = "running";
  const totalChunks = batchPdfChunkCount(job.payload.heads.length, BATCH_PDF_CHUNK_SIZE);
  if (job.chunkIndex === 0) {
    job.logs = [
      ...job.logs,
      "> Background worker started.",
      `> Processing ${job.payload.heads.length} record(s) in ${totalChunks} chunk(s).`,
    ];
  }
  await saveBatchPdfJob(job);

  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();

    while (job.chunkIndex < totalChunks) {
      const chunkIndex = job.chunkIndex;
      const page = await browser.newPage();
      page.setDefaultTimeout(600_000);
      page.setDefaultNavigationTimeout(600_000);

      const url = `${normalizedBase}/print/faced-annex?serverJob=${encodeURIComponent(jobId)}&token=${encodeURIComponent(job.token)}&chunk=${chunkIndex}`;
      job.logs = [...job.logs, `> Rendering chunk ${chunkIndex + 1}/${totalChunks}…`];
      await saveBatchPdfJob(job);

      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForSelector("#faced-print-ready", { timeout: 600_000 });
      await page.emulateMediaType("print");

      const pdfResult = await page.pdf({
        format: "letter",
        landscape: true,
        printBackground: true,
        margin: { top: "0.15in", right: "0.15in", bottom: "0.15in", left: "0.15in" },
      });
      await page.close();

      const chunkBytes =
        pdfResult instanceof Uint8Array ? pdfResult : new Uint8Array(pdfResult as Buffer);
      job.pdfData = await mergePdfBytes(job.pdfData, chunkBytes);
      job.chunkIndex = chunkIndex + 1;
      await saveBatchPdfJob(job);

      job = (await readBatchPdfJob(jobId))!;
    }

    job.status = "complete";
    job.error = undefined;
    job.logs = [...job.logs, `✓ PDF ready: ${job.filename}`];
    await saveBatchPdfJob(job);
  } catch (err) {
    job = (await readBatchPdfJob(jobId)) ?? job;
    job.status = "failed";
    job.error = err instanceof Error ? err.message : "PDF generation failed.";
    job.logs = [...job.logs, `✗ ${job.error}`];
    await saveBatchPdfJob(job);
    throw err;
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

export async function failBatchPdfJob(jobId: string, error: string): Promise<void> {
  const job = await readBatchPdfJob(jobId);
  if (!job) return;
  job.status = "failed";
  job.error = error;
  job.logs = [...job.logs, `✗ ${error}`];
  await saveBatchPdfJob(job);
}
