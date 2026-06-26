const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

const PORT = 3000;
const HOST = "127.0.0.1";
const DEV_SESSION_PARTITION = "dev-offline-dms";
let serverProcess = null;
let mainWindow = null;

function getDevSession() {
  return session.fromPartition(DEV_SESSION_PARTITION, { cache: false });
}

async function prepareDevSession() {
  const ses = getDevSession();
  await ses.clearStorageData({
    storages: ["serviceworkers", "cachestorage"],
  });
  await ses.clearCache();
}

function waitForServer(maxAttempts = 60) {
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
          reject(new Error(`Server did not start on port ${PORT}`));
          return;
        }
        setTimeout(check, 500);
      });
    };

    check();
  });
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
  });

  serverProcess.stdout?.on("data", (chunk) => {
    console.log("[next]", chunk.toString());
  });
  serverProcess.stderr?.on("data", (chunk) => {
    console.error("[next]", chunk.toString());
  });
  serverProcess.on("error", (error) => {
    console.error("Failed to start server:", error);
  });

  return waitForServer();
}

async function createWindow() {
  const isDev = !app.isPackaged;

  if (isDev) {
    getDevSession();
    await prepareDevSession();
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Offline DMS",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: isDev ? DEV_SESSION_PARTITION : undefined,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (isDev) {
    await waitForServer();
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    await startStandaloneServer();
  }

  await mainWindow.loadURL(`http://${HOST}:${PORT}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopServer() {
  if (!serverProcess) return;
  serverProcess.kill();
  serverProcess = null;
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  stopServer();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", stopServer);
