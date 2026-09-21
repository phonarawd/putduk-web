import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE13 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE13 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE13 assertion failed: mining contract version drift");
}

const gptContext = read("src/lib/gpt/GptContext.tsx");
for (const token of [
  "getHomeMoneyRead",
  "getHomeRead",
  "getWalletBuckets",
  "fillMissingKrw",
  "mergeApiRows",
  "readMoney",
]) {
  forbidText(gptContext, token, `GptContext must not duplicate wallet money read: ${token}`);
}
for (const token of [
  "principalUsdt:",
  "principalKrw:",
  "lockedUsdt:",
  "lockedKrw:",
  "profitUsdt:",
  "profitKrw:",
  "practiceUsdt:",
  "practiceKrw:",
]) {
  forbidText(gptContext, token, `GptContext must not write legacy money shadow state: ${token}`);
}
for (const token of [
  "CapitalModalState",
  "capitalModal",
  "openCapitalModal",
  "closeCapitalModal",
  "setCapitalSelection",
  "confirmCapital",
]) {
  forbidText(gptContext, token, `dead virtual-capital state must be removed: ${token}`);
}

const types = read("src/lib/gpt/types.ts");
const state = read("src/lib/gpt/state.ts");
for (const token of [
  "principalUsdt",
  "principalKrw",
  "lockedUsdt",
  "lockedKrw",
  "profitUsdt",
  "profitKrw",
  "practiceUsdt",
  "practiceKrw",
]) {
  forbidText(types, token, `GptState must not declare wallet shadow field: ${token}`);
  forbidText(state, token, `default legacy store must not seed wallet shadow field: ${token}`);
}

const appShell = read("src/components/gpt/AppShell.tsx");
forbidText(appShell, "CapitalModal", "AppShell must not load the dead virtual-capital modal");
forbidText(appShell, "capitalModal", "AppShell must not subscribe to dead virtual-capital state");

if (fs.existsSync(path.join(root, "src/components/gpt/CapitalModal.tsx"))) {
  throw new Error("PHASE13 assertion failed: dead CapitalModal.tsx must be deleted");
}

const opportunities = read("src/lib/gpt/opportunities.ts");
for (const token of ["item.bucket", "item.affordable", "trial.grantStatus", "trial.participationsRemaining"]) {
  requireText(opportunities, token, `opportunity eligibility must stay on server-derived feed/trial truth: ${token}`);
}
for (const token of ["principalUsdt", "principalKrw", "profitUsdt", "profitKrw"]) {
  forbidText(opportunities, token, `opportunity eligibility must not derive from wallet money: ${token}`);
}

const walletContext = read("src/lib/wallet/WalletContext.tsx");
requireText(walletContext, "loadMoneyRead", "WalletContext must remain consumer money-read authority");
requireText(walletContext, "withdrawable:", "WalletContext must retain withdrawable authority");

const srcRoot = path.join(root, "src");
const offenders = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.(?:ts|tsx)$/.test(entry.name)) continue;
    const relative = path.relative(root, full).replaceAll(path.sep, "/");
    const source = fs.readFileSync(full, "utf8");
    if (/state\.(?:principalUsdt|principalKrw|lockedUsdt|lockedKrw|profitUsdt|profitKrw|practiceUsdt|practiceKrw)\b/.test(source)) {
      offenders.push(relative);
    }
  }
}
walk(srcRoot);
if (offenders.length) {
  throw new Error(`PHASE13 assertion failed: legacy money shadow consumers remain: ${offenders.join(", ")}`);
}

console.log("PHASE13_LEGACY_MONEY_SHADOW_REMOVAL_ASSERTIONS_PASS");
