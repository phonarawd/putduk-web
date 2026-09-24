import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE07 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE07 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE07 assertion failed: mining contract version drift");
}
for (const [name, expected] of Object.entries({
  listMines: "/api/v1/mines",
  getMyMiningSummary: "/api/v1/mining/me/summary",
  listMyPositions: "/api/v1/mining/me/positions",
  listMySettlements: "/api/v1/mining/me/settlements",
})) {
  if (contract.userApi?.[name]?.path !== expected) {
    throw new Error(`PHASE07 assertion failed: locked user route ${name}`);
  }
}

const types = read("src/lib/mining/types.ts");
for (const status of [
  "NEW_POSITIONS_PAUSED",
  "DECREASE_PENDING",
  "END_PENDING",
  "LEDGER_POSTED",
  "REVIEW_REQUIRED",
]) {
  requireText(types, `\"${status}\"`, `locked status ${status}`);
}
for (const field of [
  "mines: MineView[]",
  "positions: MiningPosition[]",
  "liveProfit: LiveProfitSnapshot",
  "settlements: MiningSettlement[]",
]) {
  requireText(types, field, `MiningState field ${field}`);
}

const miningApi = read("src/lib/mining/api.ts");
for (const route of [
  "/api/v1/mines",
  "/api/v1/mining/me/summary",
  "/api/v1/mining/me/positions",
  "/api/v1/mining/me/settlements",
]) {
  requireText(miningApi, route, `mining client route ${route}`);
}
forbidText(miningApi, "/api/v1/admin/", "user web must not call mining admin routes");
forbidText(miningApi.toLowerCase(), "supabase", "user web mining client must not access Supabase directly");
requireText(miningApi, "createLiveProfitSnapshot", "live-profit snapshot adapter");
requireText(miningApi, "accruedProfitAmount", "server-authoritative accrued profit field");

const miningContext = read("src/lib/mining/MiningContext.tsx");
for (const token of [
  "useGptSession",
  "listMines",
  "getMyMiningSummary",
  "listMyMiningPositions",
  "listMyMiningSettlements",
  "createLiveProfitSnapshot",
]) {
  requireText(miningContext, token, `MiningContext ${token}`);
}
forbidText(miningContext.toLowerCase(), "supabase", "MiningContext must not access Supabase directly");

const walletContext = read("src/lib/wallet/WalletContext.tsx");
for (const token of [
  "balance:",
  "deposit:",
  "withdrawable:",
  "withdrawal:",
  "loadMoneyRead",
  "useGptSession",
]) {
  requireText(walletContext, token, `WalletContext ${token}`);
}

const scopes = read("src/lib/gpt/GptScopes.ts");
for (const hook of ["useGptSession", "usePutdukAi", "useCommonUi"]) {
  requireText(scopes, `function ${hook}`, `Gpt scoped hook ${hook}`);
}
requireText(scopes, "PUTDUK AI owns conversation state only", "AI ownership boundary");

const providers = read("src/lib/gpt/AppProviders.tsx");
for (const provider of ["GptProvider", "WalletProvider", "MiningProvider"]) {
  requireText(providers, provider, `provider composition ${provider}`);
}

const layout = read("src/app/layout.tsx");
requireText(layout, "AppProviders", "root layout domain provider boundary");
forbidText(layout, "<GptProvider>", "root layout must not bypass AppProviders");

console.log("PHASE07_WEB_STATE_ASSERTIONS_PASS");
