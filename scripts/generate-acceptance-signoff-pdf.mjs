import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const htmlPath = join(root, "docs", "acceptance-signoff-form.html");
const pdfPath = join(root, "docs", "Acceptance-and-Signoff-Form.pdf");

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
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `
        <div style="width:100%;font-size:8px;color:#888;text-align:center;padding:0 12mm;">
          Acceptance and Signoff Form · Online/Offline Faced Application · Made by DSWD Caraga
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
