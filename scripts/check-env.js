#!/usr/bin/env node
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const configPath = path.join(ROOT, "config", "app.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

function cmd(bin, args) {
  try {
    return execFileSync(bin, args, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function which(name) {
  return cmd("sh", ["-c", `command -v ${name} 2>/dev/null`]);
}

const report = [];
report.push(`config.appId = ${config.appId}`);
report.push(`config.dryRun = ${config.dryRun}`);

const adb = which(config.adbBin || "adb");
report.push(adb ? `adb: ${adb}` : "adb: NOT FOUND (install Android platform-tools)");

const maestro = which(config.maestroBin || "maestro");
report.push(maestro ? `maestro: ${maestro}` : "maestro: NOT FOUND (curl -Ls \"https://get.maestro.mobile.dev\" | bash)");

if (adb) {
  const devices = cmd(adb, ["devices"]) || "";
  const lines = devices
    .split("\n")
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    report.push("devices: none connected");
  } else {
    report.push("devices:");
    lines.forEach((l) => report.push(`  - ${l}`));
  }
}

console.log(report.join("\n"));
if (!config.dryRun && (!adb || !maestro)) {
  console.log("\nHint: keep dryRun=true until adb + maestro + device are ready.");
  process.exitCode = 1;
}
