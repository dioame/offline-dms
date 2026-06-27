import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { PDFDocument } from "pdf-lib";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const CHUNK_SIZE = 40;

function jobDir(jobId) {
  return path.join(root, ".tmp", "batch-pdf", jobId);
}

function jobMetaPath(jobId) {
  return path.join(jobDir(jobId), "job.json");
}

function outputPath(jobId) {
  return path.join(jobDir(jobId), "output.pdf");
}

function payloadPath(jobId) {
  return path.join(jobDir(jobId), "payload.json");
}

async function readJob(jobId) {
  const raw = await readFile(jobMetaPath(jobId), "utf8");
  return JSON.parse(raw);
}

async function writeJob(job) {
  job.updatedAt = new Date().toISOString();
  await writeFile(jobMetaPath(job.id), JSON.stringify(job, null, 2), "utf8");
}

async function appendLog(job, line) {
  job.logs = [...(job.logs ?? []), line];
  await writeJob(job);
}

function chunkCount(headCount) {
  return Math.max(1, Math.ceil(headCount / CHUNK_SIZE));
}

async function mergePdfFiles(paths, destination) {
  const merged = await PDFDocument.create();
  for (const filePath of paths) {
    const bytes = await readFile(filePath);
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }
  const pdfBytes = await merged.save();
  await writeFile(destination, pdfBytes);
}

async function main() {
  const jobId = process.argv[2];
  const baseUrl = (process.argv[3] || "http://localhost:3000").replace(/\/$/, "");

  if (!jobId) {
    console.error("Usage: node generate-faced-batch-pdf.mjs <jobId> [baseUrl]");
    process.exit(1);
  }

  const require = createRequire(import.meta.url);
  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    const job = await readJob(jobId);
    job.status = "failed";
    job.error = "puppeteer is not installed. Run: npm install puppeteer";
    await appendLog(job, "✗ puppeteer is not installed. Run: npm install puppeteer");
    await writeJob(job);
    process.exit(1);
  }

  const job = await readJob(jobId);
  const payloadRaw = await readFile(payloadPath(jobId), "utf8");
  const payload = JSON.parse(payloadRaw);
  const totalChunks = chunkCount(payload.heads.length);

  job.status = "running";
  await appendLog(job, "> Background worker started.");
  await appendLog(job, `> Processing ${payload.heads.length} record(s) in ${totalChunks} chunk(s).`);
  await writeJob(job);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const chunkPdfPaths = [];

  try {
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex += 1) {
      const page = await browser.newPage();
      page.setDefaultTimeout(600_000);
      page.setDefaultNavigationTimeout(600_000);

      const url = `${baseUrl}/print/faced-annex?serverJob=${encodeURIComponent(jobId)}&token=${encodeURIComponent(job.token)}&chunk=${chunkIndex}`;
      await appendLog(
        job,
        `> Rendering chunk ${chunkIndex + 1}/${totalChunks}…`,
      );

      await page.goto(url, { waitUntil: "networkidle0" });
      await page.waitForSelector("#faced-print-ready", { timeout: 600_000 });
      await page.emulateMediaType("print");

      const chunkPath = path.join(jobDir(jobId), `chunk-${chunkIndex}.pdf`);
      await page.pdf({
        path: chunkPath,
        format: "letter",
        landscape: true,
        printBackground: true,
        margin: { top: "0.15in", right: "0.15in", bottom: "0.15in", left: "0.15in" },
      });
      await page.close();
      chunkPdfPaths.push(chunkPath);
    }

    await appendLog(job, "> Merging PDF chunks…");
    if (chunkPdfPaths.length === 1) {
      const bytes = await readFile(chunkPdfPaths[0]);
      await writeFile(outputPath(jobId), bytes);
    } else {
      await mergePdfFiles(chunkPdfPaths, outputPath(jobId));
    }

    job.status = "complete";
    job.error = undefined;
    await appendLog(job, `✓ PDF ready: ${job.filename}`);
    await writeJob(job);
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : "PDF generation failed.";
    await appendLog(job, `✗ ${job.error}`);
    await writeJob(job);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
