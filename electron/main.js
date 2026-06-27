const { app, BrowserWindow, session, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const { killPid, killPortListeners } = require("./process-utils");

// Electron uses the Windows system proxy for WebSocket; that breaks local HMR.
app.commandLine.appendSwitch("no-proxy-server");

const PORT = 3000;
const HOST = "127.0.0.1";
const DEV_SESSION_PARTITION = "dev-offline-dms";
const PID_FILE = path.join(__dirname, "..", ".electron-dev.pid");
const LOADING_URL = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>Offline DMS</title></head>
  <body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0038A8;color:#fff;font-family:Segoe UI,sans-serif">
    <p style="font-size:1.125rem">Starting Offline DMS…</p>
  </body>
</html>
`)}`;

let serverProcess = null;
let serverSpawnedByApp = false;
let mainWindow = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
}

function getLogPath() {
  return path.join(app.getPath("userData"), "offline-dms.log");
}

function appendLog(message) {
  try {
    fs.appendFileSync(
      getLogPath(),
      `[${new Date().toISOString()}] ${message}\n`,
    );
  } catch {
    // ignore logging failures
  }
}

function showStartupError(error) {
  const message = error instanceof Error ? error.message : String(error);
  appendLog(`Startup error: ${message}`);
  console.error("[electron] Failed to start:", error);

  if (app.isPackaged) {
    dialog.showErrorBox(
      "Offline DMS could not start",
      `${message}\n\nDetails were saved to:\n${getLogPath()}`,
    );
  }
}

function writePidFile() {
  if (app.isPackaged) return;

  fs.writeFileSync(
    PID_FILE,
    JSON.stringify({
      electronPid: process.pid,
      serverPid: serverProcess?.pid ?? null,
    }),
  );
}

function clearPidFile() {
  try {
    fs.unlinkSync(PID_FILE);
  } catch {
    // ignore
  }
}

function getDevSession() {
  return session.fromPartition(DEV_SESSION_PARTITION, { cache: false });
}

async function prepareDevSession() {
  const ses = getDevSession();
  await ses.setProxy({ mode: "direct" });
  await ses.clearStorageData({
    storages: ["serviceworkers", "cachestorage"],
  });
  await ses.clearCache();
}

function probeHmrUpgrade() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: "/_next/webpack-hmr?id=electron-probe",
        method: "GET",
        headers: {
          Connection: "Upgrade",
          Upgrade: "websocket",
          "Sec-WebSocket-Version": "13",
          "Sec-WebSocket-Key": "dGhlIHNhbXBsZSBub25jZQ==",
        },
      },
      (res) => {
        resolve(res.statusCode === 101);
        res.resume();
      },
    );

    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function waitForHttpServer(maxAttempts = 120) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      const req = http.get(`http://${HOST}:${PORT}`, () => {
        req.destroy();
        resolve();
      });
      req.on("error", () => {
        attempts += 1;
        if (attempts >= maxAttempts) {
          reject(
            new Error(
              `The app server did not start on port ${PORT}. Close other apps using port ${PORT} and try again.`,
            ),
          );
          return;
        }
        setTimeout(check, 500);
      });
    };

    check();
  });
}

function attachServerLogging(child, label) {
  child.stdout?.on("data", (chunk) => {
    const text = chunk.toString();
    appendLog(`[${label}] ${text}`);
    if (!app.isPackaged) process.stdout.write(`[${label}] ${text}`);
  });
  child.stderr?.on("data", (chunk) => {
    const text = chunk.toString();
    appendLog(`[${label}] ${text}`);
    if (!app.isPackaged) process.stderr.write(`[${label}] ${text}`);
  });
}

function startDevServer() {
  const projectRoot = path.join(__dirname, "..");
  const nextBin = path.join(
    projectRoot,
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );

  serverProcess = spawn(
    process.execPath,
    [nextBin, "dev", "--webpack", "-H", HOST, "-p", String(PORT)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        NODE_ENV: "development",
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: "pipe",
      windowsHide: true,
    },
  );

  attachServerLogging(serverProcess, "next");
  serverProcess.on("error", (error) => {
    appendLog(`Failed to start Next.js dev server: ${error.message}`);
  });

  serverSpawnedByApp = true;
  writePidFile();
  return waitForHttpServer();
}

function startStandaloneServer() {
  const standaloneDir = app.isPackaged
    ? path.join(process.resourcesPath, "standalone")
    : path.join(__dirname, "..", ".next", "standalone");

  const serverScript = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverScript)) {
    throw new Error(
      `Standalone server not found at ${serverScript}. Run "npm run electron:build" first.`,
    );
  }

  let serverLog = "";

  return new Promise((resolve, reject) => {
    let settled = false;

    serverProcess = spawn(process.execPath, [serverScript], {
      cwd: standaloneDir,
      env: {
        ...process.env,
        PORT: String(PORT),
        HOSTNAME: HOST,
        NODE_ENV: "production",
        ELECTRON_RUN_AS_NODE: "1",
      },
      stdio: "pipe",
      windowsHide: true,
    });
    serverSpawnedByApp = true;

    const captureLog = (chunk) => {
      serverLog += chunk.toString();
      appendLog(`[standalone] ${chunk.toString()}`);
      if (!app.isPackaged) process.stdout.write(`[standalone] ${chunk}`);
    };

    serverProcess.stdout?.on("data", captureLog);
    serverProcess.stderr?.on("data", captureLog);
    serverProcess.on("error", (error) => {
      reject(new Error(`Failed to start app server: ${error.message}`));
    });
    serverProcess.on("exit", (code, signal) => {
      if (settled) return;
      if (code === 0 || signal === "SIGTERM" || signal === "SIGINT") return;
      reject(
        new Error(
          `App server exited unexpectedly (code ${code ?? "null"}, signal ${signal ?? "null"}).\n${serverLog}`,
        ),
      );
    });

    waitForHttpServer()
      .then(() => {
        settled = true;
        resolve();
      })
      .catch((error) => {
        reject(
          new Error(
            `${error.message}${serverLog ? `\n\nServer log:\n${serverLog}` : ""}`,
          ),
        );
      });
  });
}

async function ensureDevServer() {
  if (await probeHmrUpgrade()) return;

  let httpUp = false;
  try {
    await waitForHttpServer(2);
    httpUp = true;
  } catch {
    httpUp = false;
  }

  if (httpUp) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (await probeHmrUpgrade()) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error(
      `Port ${PORT} is in use by a non-dev server. Stop it and run electron:dev again.`,
    );
  }

  await startDevServer();
}

function showWindow(window) {
  if (window.isDestroyed()) return;
  window.center();
  if (window.isMinimized()) window.restore();
  window.show();
  window.focus();
}

function createBrowserWindow(isDev) {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Offline DMS",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: isDev ? DEV_SESSION_PARTITION : undefined,
      disableBlinkFeatures: isDev ? "ServiceWorker" : undefined,
    },
  });

  window.once("ready-to-show", () => {
    showWindow(window);
  });

  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  return window;
}

async function showLoadingScreen(window) {
  await window.loadURL(LOADING_URL);
  showWindow(window);
}

async function loadAppUrl(window, url) {
  await window.loadURL(url);
  showWindow(window);
}

async function createWindow() {
  const isDev = !app.isPackaged;
  mainWindow = createBrowserWindow(isDev);

  await showLoadingScreen(mainWindow);

  if (isDev) {
    getDevSession();
    await prepareDevSession();
    await ensureDevServer();
    await loadAppUrl(mainWindow, `http://${HOST}:${PORT}`);
    mainWindow.webContents.openDevTools({ mode: "bottom" });
  } else {
    await startStandaloneServer();
    await loadAppUrl(mainWindow, `http://${HOST}:${PORT}`);
  }
}

function stopServer() {
  if (!serverSpawnedByApp) return;

  const pid = serverProcess?.pid;
  if (pid) {
    killPid(pid);
  } else if (serverProcess) {
    serverProcess.kill();
  }

  serverProcess = null;
  serverSpawnedByApp = false;
  killPortListeners(PORT);
  killPortListeners(3001);
}

if (gotSingleInstanceLock) {
  app.on("second-instance", () => {
    if (mainWindow) showWindow(mainWindow);
  });

  app.whenReady().then(() => {
    if (!app.isPackaged) writePidFile();
    return createWindow();
  }).catch((error) => {
    showStartupError(error);
    app.quit();
  });

  app.on("window-all-closed", () => {
    stopServer();
    clearPidFile();
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        showStartupError(error);
        app.quit();
      });
    } else if (mainWindow) {
      showWindow(mainWindow);
    }
  });

  app.on("before-quit", () => {
    stopServer();
    clearPidFile();
  });
}
