const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const BATCH_PDF_PACKAGES = ["puppeteer", "pdf-lib"];

function parsePackageName(name) {
  if (name.startsWith("@")) {
    const [scope, pkg] = name.split("/");
    return [scope, pkg];
  }
  return [name];
}

function packageDir(modulesRoot, name) {
  return path.join(modulesRoot, ...parsePackageName(name));
}

function collectPackageTree(modulesRoot, packageName, collected = new Set()) {
  if (collected.has(packageName)) return collected;

  const dir = packageDir(modulesRoot, packageName);
  const manifestPath = path.join(dir, "package.json");
  if (!fs.existsSync(manifestPath)) return collected;

  collected.add(packageName);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const dep of Object.keys({
    ...manifest.dependencies,
    ...manifest.optionalDependencies,
  })) {
    collectPackageTree(modulesRoot, dep, collected);
  }

  return collected;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function ensureBatchPdfPackages(projectRoot, standaloneRoot) {
  const srcModules = path.join(projectRoot, "node_modules");
  const destModules = path.join(standaloneRoot, "node_modules");
  const packages = new Set();

  for (const pkg of BATCH_PDF_PACKAGES) {
    collectPackageTree(srcModules, pkg, packages);
  }

  for (const pkg of packages) {
    const src = packageDir(srcModules, pkg);
    const dest = packageDir(destModules, pkg);
    if (!fs.existsSync(src)) {
      throw new Error(`Missing ${pkg} in project node_modules. Run npm install.`);
    }
    if (!fs.existsSync(dest)) {
      copyDir(src, dest);
      console.log(`Copied ${pkg} -> ${path.relative(projectRoot, dest)}`);
    }
  }
}

function ensureBatchPdfWorkerScript(projectRoot, standaloneRoot) {
  const scriptSrc = path.join(projectRoot, "scripts", "generate-faced-batch-pdf.mjs");
  const scriptDest = path.join(standaloneRoot, "scripts", "generate-faced-batch-pdf.mjs");

  if (!fs.existsSync(scriptSrc)) {
    throw new Error("Missing scripts/generate-faced-batch-pdf.mjs");
  }

  fs.mkdirSync(path.dirname(scriptDest), { recursive: true });
  fs.copyFileSync(scriptSrc, scriptDest);
  console.log(`Copied batch PDF worker -> ${path.relative(projectRoot, scriptDest)}`);
}

function ensurePuppeteerBrowserCache(projectRoot, standaloneRoot) {
  const cacheDir = path.join(standaloneRoot, ".puppeteer-cache");
  const installScript = path.join(projectRoot, "node_modules", "puppeteer", "install.mjs");

  if (!fs.existsSync(installScript)) {
    throw new Error("Missing puppeteer/install.mjs. Run npm install.");
  }

  fs.mkdirSync(cacheDir, { recursive: true });

  console.log("Installing Puppeteer browser into standalone bundle (one-time per build)…");
  execSync(`node "${installScript}"`, {
    cwd: projectRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR: cacheDir,
    },
  });
}

function ensureBatchPdfBundle(projectRoot, standaloneRoot, { installBrowser = true } = {}) {
  ensureBatchPdfWorkerScript(projectRoot, standaloneRoot);
  ensureBatchPdfPackages(projectRoot, standaloneRoot);
  if (installBrowser) {
    ensurePuppeteerBrowserCache(projectRoot, standaloneRoot);
  }
}

function verifyBatchPdfBundle(standaloneRoot) {
  const scriptPath = path.join(standaloneRoot, "scripts", "generate-faced-batch-pdf.mjs");
  const puppeteerPath = packageDir(path.join(standaloneRoot, "node_modules"), "puppeteer");
  const pdfLibPath = packageDir(path.join(standaloneRoot, "node_modules"), "pdf-lib");
  const cacheDir = path.join(standaloneRoot, ".puppeteer-cache");

  const missing = [];
  if (!fs.existsSync(scriptPath)) missing.push("scripts/generate-faced-batch-pdf.mjs");
  if (!fs.existsSync(puppeteerPath)) missing.push("node_modules/puppeteer");
  if (!fs.existsSync(pdfLibPath)) missing.push("node_modules/pdf-lib");
  if (!fs.existsSync(cacheDir)) missing.push(".puppeteer-cache");

  if (missing.length > 0) {
    throw new Error(`Batch PDF bundle incomplete: ${missing.join(", ")}`);
  }
}

module.exports = {
  BATCH_PDF_PACKAGES,
  collectPackageTree,
  copyDir,
  ensureBatchPdfBundle,
  ensureBatchPdfPackages,
  ensureBatchPdfWorkerScript,
  ensurePuppeteerBrowserCache,
  packageDir,
  verifyBatchPdfBundle,
};
