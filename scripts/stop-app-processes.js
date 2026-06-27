const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { killPid, killPortListeners, sleep } = require("../electron/process-utils");

const projectRoot = path.join(__dirname, "..");
const pidFile = path.join(projectRoot, ".electron-dev.pid");
const PORTS = [3000, 3001];

function killProcessesMatching(marker) {
  const escaped = marker.replace(/'/g, "''");

  if (process.platform === "win32") {
    try {
      execSync(
        `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -and $_.CommandLine -like '*${escaped}*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
        { stdio: "ignore" },
      );
    } catch {
      // no matching processes
    }
    return;
  }

  try {
    execSync(`pkill -f "${marker}"`, { stdio: "ignore" });
  } catch {
    // no matching processes
  }
}

function stopAppProcesses() {
  let stopped = false;

  if (fs.existsSync(pidFile)) {
    try {
      const { electronPid, serverPid } = JSON.parse(fs.readFileSync(pidFile, "utf8"));
      if (killPid(electronPid)) stopped = true;
      if (serverPid && killPid(serverPid)) stopped = true;
    } catch {
      // ignore corrupt pid file
    }
    try {
      fs.unlinkSync(pidFile);
    } catch {
      // ignore
    }
  }

  killProcessesMatching("electron.exe");
  killProcessesMatching(projectRoot);
  killProcessesMatching(path.join(".next", "standalone"));
  killProcessesMatching("standalone\\server.js");
  killProcessesMatching("standalone/server.js");

  for (const port of PORTS) {
    killPortListeners(port);
  }

  if (stopped) {
    sleep(1500);
    console.log("[stop-app] Stopped running Offline DMS / dev server processes.");
  }
}

if (require.main === module) {
  stopAppProcesses();
}

module.exports = { killPortListeners, killPid, sleep, stopAppProcesses };
