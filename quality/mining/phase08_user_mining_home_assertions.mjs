import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE08 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE08 assertion failed: ${label}`);
};
const forbidPattern = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`PHASE08 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE08 assertion failed: mining contract version drift");
}
for (const [name, expected] of Object.entries({
  listMines: "/api/v1/mines",
  getMyMiningSummary: "/api/v1/mining/me/summary",
  listMyPositions: "/api/v1/mining/me/positions",
  listMySettlements: "/api/v1/mining/me/settlements",
})) {
  if (contract.userApi?.[name]?.path !== expected) {
    throw new Error(`PHASE08 assertion failed: locked user route ${name}`);
  }
}

const page = read("src/app/page.tsx");
requireText(page, "MiningHome", "home must render MiningHome");
requireText(page, "useGptSession", "home must use scoped session hook");
forbidText(page, "OpportunitySection", "resale OpportunitySection must leave home");
forbidText(page, "principalSuggestion", "legacy reseller suggestion must leave home");
forbidText(page, "리셀", "resale wording must leave home");

const home = read("src/components/mining/MiningHome.tsx");
for (const label of ["오늘 채굴", "운용 중", "출금 가능", "내 채굴장", "최근 정산"]) {
  requireText(home, label, `required mining-home label ${label}`);
}
for (const token of [
  "useMining",
  "useWallet",
  "useGptSession",
  "accruedProfitAmount",
  "summary?.activePrincipalAmount",
  "activePositionCount",
  "withdrawable.profitKrw",
  "settlements",
  "positions",
  '"광산별 확인"',
]) {
  requireText(home, token, `server-backed home binding ${token}`);
}
forbidText(home, "summary?.profitAmount", "cumulative wallet profit must not be mislabeled as today mining");
forbidText(home.toLowerCase(), "supabase", "mining home must not access Supabase directly");
forbidText(home, "OpportunitySection", "mining home must not depend on reseller opportunities");
forbidText(home, "useGpt()", "mining home must not reach legacy full GptContext");
forbidPattern(home, /(?:profitAmount|accruedProfitAmount|activePrincipalAmount)\s*[+*\/\-]/, "home must not calculate server mining money");
forbidPattern(home, /\b(?:reduce|Math\.round|Math\.floor|Math\.ceil)\s*\([^\n]*(?:profit|principal)/i, "home must not aggregate or round mining authority values");

const nav = read("src/lib/gpt/nav.ts");
requireText(nav, '{ key: "work", label: "광산", path: "/work" }', "user nav must display 광산 while retaining compatibility path");
forbidText(nav, 'label: "기회"', "legacy 기회 nav label must be removed");

const miningApi = read("src/lib/mining/api.ts");
for (const route of [
  "/api/v1/mines",
  "/api/v1/mining/me/summary",
  "/api/v1/mining/me/positions",
  "/api/v1/mining/me/settlements",
]) {
  requireText(miningApi, route, `locked mining route ${route}`);
}
forbidText(miningApi.toLowerCase(), "supabase", "mining API client must not access Supabase directly");

console.log("PHASE08_USER_MINING_HOME_ASSERTIONS_PASS");
