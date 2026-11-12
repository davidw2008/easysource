const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "config", "app.json");
const LOCAL_CONFIG_PATH = path.join(ROOT, "config", "app.local.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadConfig() {
  const base = readJson(CONFIG_PATH);
  if (fs.existsSync(LOCAL_CONFIG_PATH)) {
    Object.assign(base, readJson(LOCAL_CONFIG_PATH));
  }

  // Environment overrides for CI / one-off runs
  if (process.env.APP_ID) base.appId = process.env.APP_ID;
  if (process.env.APP_NAME) base.appName = process.env.APP_NAME;
  if (process.env.DEVICE_SERIAL) base.deviceSerial = process.env.DEVICE_SERIAL;
  if (process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true") {
    base.dryRun = true;
  }
  if (process.env.DRY_RUN === "0" || process.env.DRY_RUN === "false") {
    base.dryRun = false;
  }
  if (process.env.AUTO_RUN_ON_OPEN === "1" || process.env.AUTO_RUN_ON_OPEN === "true") {
    base.autoRunOnOpen = true;
  }
  if (process.env.MAESTRO_BIN) base.maestroBin = process.env.MAESTRO_BIN;
  if (process.env.ADB_BIN) base.adbBin = process.env.ADB_BIN;

  return base;
}

module.exports = { ROOT, loadConfig };
