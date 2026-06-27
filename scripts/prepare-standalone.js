const fs = require("fs");
const path = require("path");
const { ensureBatchPdfBundle, verifyBatchPdfBundle } = require("./batch-pdf-bundle");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const electronStandalone = path.join(root, "electron-standalone");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

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

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function getLibsqlNativePackageName() {
  const key = `${process.platform}-${process.arch}`;
  const targets = {
    "win32-x64": "win32-x64-msvc",
    "win32-arm64": "win32-arm64-msvc",
    "darwin-x64": "darwin-x64",
    "darwin-arm64": "darwin-arm64",
    "linux-x64": "linux-x64-gnu",
    "linux-arm64": "linux-arm64-gnu",
  };
  const target = targets[key];
  return target ? `@libsql/${target}` : null;
}

function ensureLibsqlNativeModule(standaloneRoot) {
  const packageName = getLibsqlNativePackageName();
  if (!packageName) {
    console.warn(`[prepare-standalone] No libsql native target for ${process.platform}-${process.arch}`);
    return;
  }

  const [, scope, name] = packageName.match(/^(@[^/]+)\/(.+)$/) ?? [];
  const src = path.join(root, "node_modules", scope, name);
  const dest = path.join(standaloneRoot, "node_modules", scope, name);

  if (!fs.existsSync(src)) {
    throw new Error(
      `Missing ${packageName} in node_modules. Run npm install and rebuild.`,
    );
  }

  if (!fs.existsSync(dest)) {
    copyDir(src, dest);
    console.log(`Copied ${packageName} -> ${path.relative(root, dest)}`);
  }
}

if (!fs.existsSync(standalone)) {
  console.error('Missing .next/standalone. Run "npm run build" first.');
  process.exit(1);
}

if (fs.existsSync(staticSrc)) {
  copyDir(staticSrc, staticDest);
  console.log("Copied .next/static -> standalone/.next/static");
}

if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, publicDest);
  console.log("Copied public -> standalone/public");
}

const envExample = path.join(root, ".env.example");
if (fs.existsSync(envExample)) {
  fs.copyFileSync(envExample, path.join(standalone, ".env.example"));
}

const appConfig = path.join(root, "config.js");
if (fs.existsSync(appConfig)) {
  fs.copyFileSync(appConfig, path.join(standalone, "config.js"));
  console.log("Copied config.js -> standalone/config.js");
}

ensureBatchPdfBundle(root, standalone);
verifyBatchPdfBundle(standalone);

removeDir(electronStandalone);
copyDir(standalone, electronStandalone);
console.log("Copied standalone -> electron-standalone (for packaging)");

ensureLibsqlNativeModule(standalone);
ensureLibsqlNativeModule(electronStandalone);
verifyBatchPdfBundle(electronStandalone);

if (!fs.existsSync(path.join(electronStandalone, "node_modules", "next"))) {
  console.error("Missing electron-standalone/node_modules/next after copy.");
  process.exit(1);
}

console.log("Standalone folder prepared for Electron.");
