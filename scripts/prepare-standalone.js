const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
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

console.log("Standalone folder prepared for Electron.");
