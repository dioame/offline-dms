import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "docs", "user-manual.html");
const pdfPath = join(root, "docs", "Online-Offline-FACED-Application-User-Manual.pdf");

async function main() {
  const require = createRequire(import.meta.url);
  let puppeteer;

  try {
    puppeteer = require("puppeteer");
  } catch {
    console.error(
      "puppeteer not installed. Run: npm install --no-save puppeteer",
    );
    process.exit(1);
  }

  const html = readFileSync(htmlPath, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#888;text-align:center;padding:0 16mm;">
          Online/Offline Faced Application · Made by DSWD Caraga · Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });

    console.log(`PDF written: ${pdfPath} (${pdf.length} bytes)`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
