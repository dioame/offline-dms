const { execSync } = require("child_process");

function sleep(ms) {
  if (process.platform === "win32") {
    try {
      execSync(`powershell -NoProfile -Command "Start-Sleep -Milliseconds ${ms}"`, {
        stdio: "ignore",
      });
      return;
    } catch {
      // fall through
    }
  }

  const end = Date.now() + ms;
  while (Date.now() < end) {
    // busy wait
  }
}

function killPid(pid) {
  const id = Number(pid);
  if (!id || Number.isNaN(id)) return false;

  try {
    if (process.platform === "win32") {
      execSync(`taskkill /F /PID ${id} /T`, { stdio: "ignore" });
    } else {
      process.kill(id, "SIGTERM");
    }
    return true;
  } catch {
    return false;
  }
}

function killPortListeners(port) {
  if (process.platform !== "win32") {
    try {
      execSync(`lsof -ti tcp:${port} | xargs kill -9 2>/dev/null || true`, {
        stdio: "ignore",
        shell: true,
      });
    } catch {
      // nothing listening
    }
    return;
  }

  try {
    const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: "utf8",
    });
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const pid = trimmed.split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      killPid(pid);
    }
  } catch {
    // port not in use
  }
}

module.exports = { killPid, killPortListeners, sleep };
