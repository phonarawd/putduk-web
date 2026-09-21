import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE10 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE10 assertion failed: ${label}`);
};
const forbidPattern = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`PHASE10 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE10 assertion failed: mining contract version drift");
}

const api = read("src/lib/mining/api.ts");
requireText(api, "createLiveProfitSnapshot", "server live snapshot builder must remain present");
requireText(api, "accruedProfitAmount: position.accruedProfitAmount", "snapshot must copy server accrued profit");
requireText(api, "currentDailyRate: position.currentDailyRate", "snapshot must copy server rate");
requireText(api, "baselineAt: position.baselineAt", "snapshot must copy server baseline");
forbidPattern(
  api,
  /accruedProfitAmount\s*[:=][^\n]*(?:principalAmount|currentDailyRate)\s*[+*\/\-]/,
  "domain API snapshot must not calculate mining profit",
);

const presentation = read("src/lib/mining/presentation.ts");
for (const token of [
  "MINING_LIVE_TICK_MS = 1_000",
  "MINING_LIVE_RESYNC_MS = 30_000",
  "MINING_LIVE_MAX_INTERPOLATION_MS = 90_000",
  "DECIMAL_FACTOR = 10n ** BigInt(DECIMAL_SCALE)",
  "baselineMs > syncedMs",
  "nextSettlementMs",
  "Math.min(",
  "MINING_LIVE_MAX_INTERPOLATION_MS",
  "principalScaled * rateScaled * elapsedMs",
  "DECIMAL_FACTOR * MS_PER_DAY",
  "serverScaled + incrementalScaled",
  'source: "interpolated"',
  "Server responses remain authoritative",
]) {
  requireText(presentation, token, `bounded presentation rule ${token}`);
}
forbidText(presentation, "apiFetch(", "presentation math must not call backend directly");
forbidText(presentation.toLowerCase(), "supabase", "presentation math must not access Supabase");
forbidText(presentation, "setPositions(", "presentation math must never mutate mining domain state");
forbidText(presentation, "setSummary(", "presentation math must never mutate mining summary");
forbidText(presentation, "refreshWallet", "presentation math must never mutate wallet state");

const clock = read("src/lib/mining/useMiningPresentationClock.ts");
requireText(clock, "MINING_LIVE_TICK_MS", "presentation clock must use locked tick cadence");
requireText(clock, "document.visibilityState", "presentation clock must wake on visible tab");

const context = read("src/lib/mining/MiningContext.tsx");
for (const token of [
  "MINING_LIVE_RESYNC_MS",
  "const syncLivePositions = async () =>",
  "document.visibilityState !== \"visible\"",
  "mutationLockRef.current",
  "const nextPositions = await listMyMiningPositions()",
  "setPositions(nextPositions)",
  "setSyncedAt(new Date().toISOString())",
  "window.setInterval",
]) {
  requireText(context, token, `silent server resync ${token}`);
}
requireText(
  context,
  "Keep the last authoritative server snapshot",
  "silent resync failure must preserve last server snapshot",
);
forbidText(context.toLowerCase(), "supabase", "MiningContext must not access Supabase directly");

const home = read("src/components/mining/MiningHome.tsx");
for (const token of [
  "useMiningPresentationClock",
  "presentLiveMiningProfit",
  "activePresentation",
  'source === "interpolated"',
  "표시용 예상",
  "실제 수익·정산·출금 가능 금액은 서버 응답이 기준입니다.",
  '"광산별 확인"',
]) {
  requireText(home, token, `mining home live presentation ${token}`);
}
forbidText(home, "summary.profitAmount", "home must not use cumulative wallet liability as live profit");
forbidPattern(
  home,
  /positions\.(?:reduce|map)\([^\n]*(?:accruedProfitAmount|currentDailyRate)[^\n]*[+*\/\-]/,
  "home must not aggregate mining truth across positions",
);

const detail = read("src/components/mining/MineDetail.tsx");
for (const token of [
  "useMiningPresentationClock",
  "presentLiveMiningProfit",
  "표시용 예상",
  "실제 수익과 정산은 서버 기준",
  "서버 동기화",
]) {
  requireText(detail, token, `mine detail live presentation ${token}`);
}
forbidText(detail, "apiFetch(", "mine detail must keep using MiningContext");
forbidText(detail.toLowerCase(), "supabase", "mine detail must not access Supabase directly");
forbidText(detail, "summary.profitAmount", "mine detail must not use cumulative liability as live profit");

const presentationTest = read("src/lib/mining-presentation.test.ts");
for (const token of [
  "마지막 서버 수익 이후 짧은 구간만 보간한다",
  "90초에서 멈춘다",
  "다음 정산 경계를 넘겨 보간하지 않는다",
  "비활성 position은 서버 accruedProfitAmount를 그대로 표시한다",
]) {
  requireText(presentationTest, token, `presentation test coverage ${token}`);
}

console.log("PHASE10_LIVE_MINING_PRESENTATION_ASSERTIONS_PASS");
