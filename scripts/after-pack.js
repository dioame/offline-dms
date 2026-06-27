const fs = require("fs");
const path = require("path");
const {
  copyDir: copyBundleDir,
  ensureBatchPdfBundle,
  verifyBatchPdfBundle,
} = require("./batch-pdf-bundle");

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

/** electron-builder skips node_modules in extraResources; copy them after pack. */
exports.default = async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  const appOutDir = context.appOutDir;
  const srcRoot = path.join(projectDir, "electron-standalone");
  const destRoot = path.join(appOutDir, "resources", "standalone");
  const srcModules = path.join(srcRoot, "node_modules");
  const destModules = path.join(destRoot, "node_modules");

  if (!fs.existsSync(srcModules)) {
    throw new Error(
      "Missing electron-standalone/node_modules. Run prepare-standalone before building.",
    );
  }

  if (!fs.existsSync(destModules)) {
    console.log("[after-pack] Copying standalone node_modules into app bundle...");
    copyDir(srcModules, destModules);
  }

  if (!fs.existsSync(path.join(destModules, "next"))) {
    throw new Error("Packaged app is missing standalone/node_modules/next.");
  }

  const nativePackage = getLibsqlNativePackageName();
  if (
    nativePackage &&
    !fs.existsSync(path.join(destModules, ...nativePackage.split("/")))
  ) {
    const srcNative = path.join(projectDir, "node_modules", ...nativePackage.split("/"));
    if (!fs.existsSync(srcNative)) {
      throw new Error(`Missing ${nativePackage} in project node_modules.`);
    }
    console.log(`[after-pack] Copying ${nativePackage} into app bundle...`);
    copyDir(srcNative, path.join(destModules, ...nativePackage.split("/")));
  }

  try {
    verifyBatchPdfBundle(destRoot);
  } catch {
    console.log("[after-pack] Batch PDF bundle missing from packaged standalone; copying now…");
    ensureBatchPdfBundle(projectDir, destRoot, { installBrowser: false });
    const srcCache = path.join(srcRoot, ".puppeteer-cache");
    const destCache = path.join(destRoot, ".puppeteer-cache");
    if (fs.existsSync(srcCache) && !fs.existsSync(destCache)) {
      copyBundleDir(srcCache, destCache);
    }
    verifyBatchPdfBundle(destRoot);
  }
};

function getLibsqlNativePackageName() {
  const key = `${process.platform}-${process.arch}`;
  const targets = {
    "win32-x64": "@libsql/win32-x64-msvc",
    "win32-arm64": "@libsql/win32-arm64-msvc",
    "darwin-x64": "@libsql/darwin-x64",
    "darwin-arm64": "@libsql/darwin-arm64",
    "linux-x64": "@libsql/linux-x64-gnu",
    "linux-arm64": "@libsql/linux-arm64-gnu",
  };
  return targets[key] ?? null;
}
