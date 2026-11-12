const fs = require("fs");
const path = require("path");
const { ROOT } = require("./config");

const REGISTRY_PATH = path.join(ROOT, "usecases", "registry.json");

function listUseCases() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  return registry.useCases.map((uc) => {
    const flowPath = path.join(ROOT, "usecases", uc.flow);
    return {
      ...uc,
      flowExists: fs.existsSync(flowPath),
      flowPath,
    };
  });
}

function getUseCase(id) {
  return listUseCases().find((uc) => uc.id === id) || null;
}

module.exports = { listUseCases, getUseCase };
