const express = require("express");
const path = require("path");
const { loadConfig, ROOT } = require("./config");
const { listUseCases, getUseCase } = require("./usecases");
const {
  startRun,
  listRuns,
  getRun,
  getScreenshotPath,
  loadHistoryFromDisk,
} = require("./runner");

const app = express();
const PORT = Number(process.env.PORT || 3780);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(ROOT, "public")));
app.use("/docs", express.static(path.join(ROOT, "docs")));

loadHistoryFromDisk();

app.get("/api/health", (_req, res) => {
  const config = loadConfig();
  res.json({
    ok: true,
    appName: config.appName,
    appId: config.appId,
    dryRun: Boolean(config.dryRun),
    autoRunOnOpen: Boolean(config.autoRunOnOpen),
    autoRunUseCaseId: config.autoRunUseCaseId,
  });
});

app.get("/api/config", (_req, res) => {
  const config = loadConfig();
  res.json({
    appName: config.appName,
    appId: config.appId,
    deviceSerial: config.deviceSerial || null,
    autoRunOnOpen: Boolean(config.autoRunOnOpen),
    autoRunUseCaseId: config.autoRunUseCaseId,
    dryRun: Boolean(config.dryRun),
  });
});

app.get("/api/usecases", (_req, res) => {
  res.json({ useCases: listUseCases() });
});

app.get("/api/usecases/:id", (req, res) => {
  const uc = getUseCase(req.params.id);
  if (!uc) return res.status(404).json({ error: "Use case not found" });
  res.json(uc);
});

app.get("/api/runs", (_req, res) => {
  res.json({ runs: listRuns() });
});

app.get("/api/runs/:id", (req, res) => {
  const run = getRun(req.params.id);
  if (!run) return res.status(404).json({ error: "Run not found" });
  res.json(run);
});

app.get("/api/runs/:id/screenshot", (req, res) => {
  const file = getScreenshotPath(req.params.id);
  if (!file) return res.status(404).json({ error: "Screenshot not found" });
  res.sendFile(file);
});

app.post("/api/runs", async (req, res) => {
  try {
    const useCaseId = req.body?.useCaseId;
    if (!useCaseId) {
      return res.status(400).json({ error: "useCaseId is required" });
    }
    const config = loadConfig();
    const run = await startRun(useCaseId, config);
    res.status(202).json(run);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(ROOT, "public", "index.html"));
});

app.listen(PORT, () => {
  const config = loadConfig();
  console.log(`EasySource tester listening on http://127.0.0.1:${PORT}`);
  console.log(`App: ${config.appName} (${config.appId})`);
  console.log(`Mode: ${config.dryRun ? "DRY RUN" : "REAL DEVICE"}`);
  console.log(
    `Auto-run on open: ${config.autoRunOnOpen ? `yes (${config.autoRunUseCaseId})` : "no"}`
  );
});
