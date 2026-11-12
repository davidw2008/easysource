const { spawn, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { ROOT } = require("./config");
const { getUseCase } = require("./usecases");

const RESULTS_DIR = path.join(ROOT, "results");

/** @type {Map<string, object>} */
const runs = new Map();

function ensureResultsDir() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function appendLog(run, line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  run.logs.push(stamped);
  fs.appendFileSync(run.logFile, stamped + "\n");
}

function updateRun(run, patch) {
  Object.assign(run, patch, { updatedAt: new Date().toISOString() });
  runs.set(run.id, run);
  persistRunMeta(run);
}

function persistRunMeta(run) {
  const meta = {
    id: run.id,
    useCaseId: run.useCaseId,
    status: run.status,
    dryRun: run.dryRun,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    finishedAt: run.finishedAt || null,
    exitCode: run.exitCode,
    error: run.error,
    screenshotRel: run.screenshotRel,
  };
  fs.writeFileSync(run.metaFile, JSON.stringify(meta, null, 2));
}

function publicRun(run) {
  return {
    id: run.id,
    useCaseId: run.useCaseId,
    title: run.title,
    status: run.status,
    dryRun: run.dryRun,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    finishedAt: run.finishedAt || null,
    exitCode: run.exitCode,
    error: run.error,
    logs: run.logs,
    screenshotUrl: run.screenshotRel
      ? `/api/runs/${run.id}/screenshot`
      : null,
  };
}

function listRuns() {
  return Array.from(runs.values())
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map(publicRun);
}

function getRun(id) {
  const run = runs.get(id);
  return run ? publicRun(run) : null;
}

function getScreenshotPath(id) {
  const run = runs.get(id);
  if (!run || !run.screenshotAbs || !fs.existsSync(run.screenshotAbs)) {
    return null;
  }
  return run.screenshotAbs;
}

function which(cmd) {
  return new Promise((resolve) => {
    execFile("bash", ["-lc", `command -v ${cmd}`], (err, stdout) => {
      if (err || !stdout.trim()) resolve(null);
      else resolve(stdout.trim());
    });
  });
}

function runCmd(bin, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      ...options,
      env: { ...process.env, ...(options.env || {}) },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
      if (options.onStdout) options.onStdout(d.toString());
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
      if (options.onStderr) options.onStderr(d.toString());
    });
    child.on("error", (err) => {
      resolve({ code: 127, stdout, stderr: stderr + "\n" + err.message });
    });
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function prepareFlow(useCase, appId, runDir) {
  const source = fs.readFileSync(useCase.flowPath, "utf8");
  // Replace first appId line so flows stay in sync with config
  const rewritten = source.replace(/^appId:\s*.*$/m, `appId: ${appId}`);
  const outPath = path.join(runDir, "flow.yaml");
  fs.writeFileSync(outPath, rewritten);
  return outPath;
}

async function dryRunFlow(run, useCase) {
  appendLog(run, `DRY RUN: simulating use case "${useCase.title}"`);
  const steps = [
    "Checking ADB device (simulated)... OK",
    `Launching ${run.appId} (simulated)... OK`,
    `Executing flow ${useCase.flow} (simulated)...`,
    "Assert visible elements (simulated)... PASS",
    "Capturing screenshot (simulated)...",
  ];
  for (const step of steps) {
    await new Promise((r) => setTimeout(r, 400));
    appendLog(run, step);
    updateRun(run, { status: "running" });
  }

  // Tiny 1x1 PNG placeholder
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64"
  );
  fs.writeFileSync(run.screenshotAbs, png);
  updateRun(run, {
    status: "passed",
    exitCode: 0,
    finishedAt: new Date().toISOString(),
    screenshotRel: path.basename(run.screenshotAbs),
  });
  appendLog(run, "DRY RUN finished: PASSED");
}

async function realRunFlow(run, useCase, config) {
  const adbPath = (await which(config.adbBin)) || config.adbBin;
  const maestroPath = (await which(config.maestroBin)) || config.maestroBin;

  appendLog(run, `Using adb: ${adbPath}`);
  appendLog(run, `Using maestro: ${maestroPath}`);

  const devices = await runCmd(adbPath, ["devices"], {
    onStdout: (t) => appendLog(run, t.trimEnd()),
    onStderr: (t) => appendLog(run, t.trimEnd()),
  });
  if (devices.code !== 0) {
    throw new Error(`adb devices failed (exit ${devices.code}). Is Android platform-tools installed?`);
  }

  const serials = devices.stdout
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter((l) => l.endsWith("\tdevice"))
    .map((l) => l.split("\t")[0]);

  if (serials.length === 0) {
    throw new Error("No Android device in 'device' state. Enable USB debugging and connect the phone.");
  }

  const serial = config.deviceSerial || serials[0];
  if (config.deviceSerial && !serials.includes(config.deviceSerial)) {
    throw new Error(`Configured deviceSerial ${config.deviceSerial} not found. Connected: ${serials.join(", ")}`);
  }
  appendLog(run, `Target device: ${serial}`);

  const flowPath = prepareFlow(useCase, config.appId, run.runDir);
  appendLog(run, `Prepared flow: ${flowPath}`);

  const env = {
    MAESTRO_DRIVER_STARTUP_TIMEOUT: "120000",
  };
  if (serial) env.ANDROID_SERIAL = serial;

  const args = ["test", flowPath, `--app-id=${config.appId}`];
  appendLog(run, `Running: ${maestroPath} ${args.join(" ")}`);

  const result = await runCmd(maestroPath, args, {
    cwd: run.runDir,
    env,
    onStdout: (t) => {
      t.split(/\r?\n/).filter(Boolean).forEach((line) => appendLog(run, line));
      updateRun(run, { status: "running" });
    },
    onStderr: (t) => {
      t.split(/\r?\n/).filter(Boolean).forEach((line) => appendLog(run, line));
      updateRun(run, { status: "running" });
    },
  });

  // Best-effort screenshot via adb
  const shotOnDevice = `/sdcard/easysource-shot-${run.id}.png`;
  await runCmd(adbPath, ["-s", serial, "shell", "screencap", "-p", shotOnDevice]);
  await runCmd(adbPath, ["-s", serial, "pull", shotOnDevice, run.screenshotAbs]);
  await runCmd(adbPath, ["-s", serial, "shell", "rm", shotOnDevice]);
  if (fs.existsSync(run.screenshotAbs)) {
    updateRun(run, { screenshotRel: path.basename(run.screenshotAbs) });
  }

  if (result.code === 0) {
    updateRun(run, {
      status: "passed",
      exitCode: 0,
      finishedAt: new Date().toISOString(),
    });
    appendLog(run, "Maestro finished: PASSED");
  } else {
    updateRun(run, {
      status: "failed",
      exitCode: result.code,
      finishedAt: new Date().toISOString(),
      error: `Maestro exited with code ${result.code}`,
    });
    appendLog(run, `Maestro finished: FAILED (code ${result.code})`);
  }
}

async function startRun(useCaseId, config) {
  ensureResultsDir();
  const useCase = getUseCase(useCaseId);
  if (!useCase) {
    throw new Error(`Unknown use case: ${useCaseId}`);
  }
  if (!useCase.flowExists) {
    throw new Error(`Flow file missing for use case: ${useCaseId}`);
  }

  const id = randomUUID();
  const runDir = path.join(RESULTS_DIR, id);
  fs.mkdirSync(runDir, { recursive: true });

  const run = {
    id,
    useCaseId: useCase.id,
    title: useCase.title,
    appId: config.appId,
    status: "queued",
    dryRun: Boolean(config.dryRun),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finishedAt: null,
    exitCode: null,
    error: null,
    logs: [],
    runDir,
    logFile: path.join(runDir, "run.log"),
    metaFile: path.join(runDir, "meta.json"),
    screenshotAbs: path.join(runDir, "screenshot.png"),
    screenshotRel: null,
  };

  fs.writeFileSync(run.logFile, "");
  runs.set(id, run);
  persistRunMeta(run);
  appendLog(run, `Run created for use case "${useCase.title}" (${useCase.id})`);
  appendLog(run, `Mode: ${run.dryRun ? "DRY RUN" : "REAL DEVICE"}`);

  // Fire and forget
  setImmediate(async () => {
    try {
      updateRun(run, { status: "running" });
      if (run.dryRun) {
        await dryRunFlow(run, useCase);
      } else {
        await realRunFlow(run, useCase, config);
      }
    } catch (err) {
      appendLog(run, `ERROR: ${err.message}`);
      updateRun(run, {
        status: "failed",
        exitCode: 1,
        finishedAt: new Date().toISOString(),
        error: err.message,
      });
    }
  });

  return publicRun(run);
}

function loadHistoryFromDisk() {
  ensureResultsDir();
  const dirs = fs
    .readdirSync(RESULTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const id of dirs) {
    if (runs.has(id)) continue;
    const runDir = path.join(RESULTS_DIR, id);
    const metaFile = path.join(runDir, "meta.json");
    const logFile = path.join(runDir, "run.log");
    if (!fs.existsSync(metaFile)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
      const logs = fs.existsSync(logFile)
        ? fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter(Boolean)
        : [];
      const screenshotAbs = path.join(runDir, "screenshot.png");
      runs.set(id, {
        ...meta,
        title: meta.useCaseId,
        logs,
        runDir,
        logFile,
        metaFile,
        screenshotAbs,
        screenshotRel: fs.existsSync(screenshotAbs) ? "screenshot.png" : null,
      });
    } catch {
      // ignore corrupt history
    }
  }
}

module.exports = {
  startRun,
  listRuns,
  getRun,
  getScreenshotPath,
  loadHistoryFromDisk,
  publicRun,
};
