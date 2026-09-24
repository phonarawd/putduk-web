import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE11 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE11 assertion failed: ${label}`);
};
const forbidPattern = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`PHASE11 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE11 assertion failed: mining contract version drift");
}
if (contract.userApi?.listMySettlements?.path !== "/api/v1/mining/me/settlements") {
  throw new Error("PHASE11 assertion failed: settlement route drift");
}

const api = read("src/lib/mining/api.ts");
requireText(api, "listMyMiningSettlements", "settlement reader missing");
requireText(api, "MINING_USER_ROUTES.settlements", "settlement route must remain centralized");
forbidText(api.toLowerCase(), "supabase", "mining API must not access Supabase directly");

const context = read("src/lib/mining/MiningContext.tsx");
requireText(context, "listMyMiningSettlements()", "MiningContext must load server settlements");
requireText(context, "setSettlements(nextSettlements)", "MiningContext must own settlement state");

const page = read("src/app/activity/page.tsx");
requireText(page, "MiningActivity", "activity route must render MiningActivity");
requireText(page, "WorkspaceView", "activity route must remain inside app workspace");

const activity = read("src/components/mining/MiningActivity.tsx");
for (const token of [
  "useMining()",
  "mining.settlements.map",
  "mining.positions.map",
  "settlement.status",
  "settlement.profitAmount",
  "settlement.periodStartAt",
  "settlement.periodEndAt",
  "settlement.ledgerJournalId",
  "settlement.settlementId",
  "position.positionId",
  "position.principalAmount",
  "화면에서 수익을 합산하거나 정산 결과를 다시 계산하지 않습니다.",
  "backend가 반환한 순서를 그대로 유지합니다.",
]) {
  requireText(activity, token, `activity server-truth boundary ${token}`);
}
forbidText(activity, "apiFetch(", "activity component must consume MiningContext, not call API directly");
forbidText(activity.toLowerCase(), "supabase", "activity component must not access Supabase");
forbidPattern(activity, /settlements\.(?:sort|toSorted|reduce)\s*\(/, "settlements must not be re-ordered or aggregated in frontend");
forbidPattern(activity, /profitAmount[^\n]*[+*\/\-]/, "settlement profit must not be recalculated in frontend");
forbidPattern(activity, /accruedProfitAmount[^\n]*[+*\/\-]/, "live mining profit must not be recalculated in activity");

const work = read("src/app/work/page.tsx");
requireText(work, 'href="/activity"', "mine catalog must link to mining activity");

const nav = read("src/lib/gpt/nav.ts");
requireText(nav, 'pathname.startsWith("/work/")', "mine detail must retain mining nav state");
requireText(nav, 'pathname === "/activity"', "activity route must retain mining nav state");

console.log("PHASE11_MINING_ACTIVITY_HISTORY_ASSERTIONS_PASS");
