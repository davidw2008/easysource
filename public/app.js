const state = {
  config: null,
  useCases: [],
  activeRunId: null,
  pollTimer: null,
  autoStarted: false,
};

const els = {
  appMeta: document.getElementById("appMeta"),
  modeBadge: document.getElementById("modeBadge"),
  autoBadge: document.getElementById("autoBadge"),
  useCaseList: document.getElementById("useCaseList"),
  refreshBtn: document.getElementById("refreshBtn"),
  runStatus: document.getElementById("runStatus"),
  activeRun: document.getElementById("activeRun"),
  logView: document.getElementById("logView"),
  shotWrap: document.getElementById("shotWrap"),
  shotImg: document.getElementById("shotImg"),
};

async function api(path, options) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function setStatus(status) {
  els.runStatus.textContent = statusLabel(status);
  els.runStatus.className = `status ${status || "idle"}`;
}

function statusLabel(status) {
  switch (status) {
    case "queued":
      return "排隊中";
    case "running":
      return "執行中";
    case "passed":
      return "通過";
    case "failed":
      return "失敗";
    default:
      return "待命";
  }
}

function renderConfig() {
  const c = state.config;
  els.appMeta.textContent = `${c.appName} · ${c.appId}`;
  els.modeBadge.textContent = c.dryRun ? "Dry Run 模擬模式" : "真機模式";
  els.modeBadge.className = `badge ${c.dryRun ? "dry" : "live"}`;
  els.autoBadge.textContent = c.autoRunOnOpen
    ? `自動執行：${c.autoRunUseCaseId}`
    : "自動執行：關閉";
}

function renderUseCases() {
  els.useCaseList.innerHTML = "";
  for (const uc of state.useCases) {
    const li = document.createElement("li");
    li.innerHTML = `
      <p class="uc-title">${escapeHtml(uc.title)}</p>
      <p class="uc-desc">${escapeHtml(uc.description)}</p>
      <div class="uc-meta">
        <div class="tags">${(uc.tags || [])
          .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
          .join("")}</div>
        <button class="run-btn" type="button" data-id="${escapeHtml(uc.id)}">執行</button>
      </div>
    `;
    els.useCaseList.appendChild(li);
  }

  els.useCaseList.querySelectorAll(".run-btn").forEach((btn) => {
    btn.addEventListener("click", () => startUseCase(btn.dataset.id, btn));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function startUseCase(useCaseId, button) {
  if (button) button.disabled = true;
  try {
    setStatus("queued");
    els.activeRun.classList.remove("empty");
    els.activeRun.textContent = `正在啟動：${useCaseId}`;
    els.logView.textContent = "";
    els.shotWrap.classList.add("hidden");

    const run = await api("/api/runs", {
      method: "POST",
      body: JSON.stringify({ useCaseId }),
    });
    state.activeRunId = run.id;
    renderRun(run);
    pollRun(run.id);
  } catch (err) {
    setStatus("failed");
    els.activeRun.textContent = err.message;
    els.logView.textContent = err.message;
  } finally {
    if (button) button.disabled = false;
  }
}

function renderRun(run) {
  setStatus(run.status);
  const mode = run.dryRun ? "（Dry Run）" : "";
  els.activeRun.textContent = `${run.title || run.useCaseId} ${mode} · ${run.id.slice(0, 8)}`;
  els.logView.textContent = (run.logs || []).join("\n");
  els.logView.scrollTop = els.logView.scrollHeight;

  if (run.screenshotUrl && (run.status === "passed" || run.status === "failed")) {
    els.shotImg.src = `${run.screenshotUrl}?t=${Date.now()}`;
    els.shotWrap.classList.remove("hidden");
  }
}

function pollRun(id) {
  if (state.pollTimer) clearInterval(state.pollTimer);
  state.pollTimer = setInterval(async () => {
    try {
      const run = await api(`/api/runs/${id}`);
      renderRun(run);
      if (run.status === "passed" || run.status === "failed") {
        clearInterval(state.pollTimer);
        state.pollTimer = null;
      }
    } catch (err) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
      setStatus("failed");
      els.logView.textContent += `\n${err.message}`;
    }
  }, 800);
}

async function bootstrap() {
  state.config = await api("/api/config");
  const { useCases } = await api("/api/usecases");
  state.useCases = useCases;
  renderConfig();
  renderUseCases();

  // Open page → auto run configured use case once
  if (state.config.autoRunOnOpen && !state.autoStarted) {
    state.autoStarted = true;
    const id = state.config.autoRunUseCaseId || state.useCases[0]?.id;
    if (id) {
      els.activeRun.classList.remove("empty");
      els.activeRun.textContent = `頁面開啟，自動執行 ${id}…`;
      await startUseCase(id);
    }
  }
}

els.refreshBtn.addEventListener("click", () => {
  bootstrap().catch((err) => {
    els.appMeta.textContent = err.message;
  });
});

bootstrap().catch((err) => {
  els.appMeta.textContent = err.message;
  els.logView.textContent = err.message;
});
