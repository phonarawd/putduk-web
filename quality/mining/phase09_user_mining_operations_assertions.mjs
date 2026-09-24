import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE09 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE09 assertion failed: ${label}`);
};
const forbidPattern = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`PHASE09 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE09 assertion failed: mining contract version drift");
}
if (contract.wireRules?.mutationIdempotencyHeader !== "Idempotency-Key") {
  throw new Error("PHASE09 assertion failed: mining mutation idempotency header drift");
}

for (const [name, method, expectedPath] of [
  ["listMines", "GET", "/api/v1/mines"],
  ["getMine", "GET", "/api/v1/mines/:mineId"],
  ["startPosition", "POST", "/api/v1/mining/positions/start"],
  ["increasePosition", "POST", "/api/v1/mining/positions/:positionId/increase"],
  ["decreasePosition", "POST", "/api/v1/mining/positions/:positionId/decrease"],
  ["endPosition", "POST", "/api/v1/mining/positions/:positionId/end"],
]) {
  const route = contract.userApi?.[name];
  if (route?.method !== method || route?.path !== expectedPath) {
    throw new Error(`PHASE09 assertion failed: locked user route ${name}`);
  }
  if (method === "POST" && route?.idempotent !== true) {
    throw new Error(`PHASE09 assertion failed: mutation ${name} must remain idempotent`);
  }
}

const workPage = read("src/app/work/page.tsx");
requireText(workPage, "MineCatalog", "work route must render mine catalog");
forbidText(workPage, "OpportunitySection", "legacy opportunity catalog must leave mining route");
forbidText(workPage, "useGpt()", "mining catalog route must not use full GptContext");

const detailPage = read("src/app/work/[mineId]/page.tsx");
requireText(detailPage, "MineDetail", "mine detail route must render MineDetail");
requireText(detailPage, "useParams", "mine detail route must bind mine id");

const miningApi = read("src/lib/mining/api.ts");
for (const token of [
  'startPosition: "/api/v1/mining/positions/start"',
  '"Idempotency-Key"',
  'positionMutationRoute(positionId, "increase")',
  'positionMutationRoute(positionId, "decrease")',
  'positionMutationRoute(positionId, "end")',
  "principalAmount: input.principalAmount",
  "assetCode: input.assetCode",
]) {
  requireText(miningApi, token, `mining mutation client binding ${token}`);
}
forbidText(miningApi.toLowerCase(), "supabase", "consumer mining API must not access Supabase directly");
forbidText(miningApi, "/api/v1/admin/", "consumer mining API must not use admin mining routes");

const miningContext = read("src/lib/mining/MiningContext.tsx");
for (const token of [
  "activeMine",
  "loadMine",
  "mutationLockRef",
  "startMiningPosition",
  "increaseMiningPosition",
  "decreaseMiningPosition",
  "endMiningPosition",
  "const position = await request()",
  "upsertServerPosition",
  "await Promise.all([refresh(), refreshWallet()])",
]) {
  requireText(miningContext, token, `MiningContext operation authority ${token}`);
}
forbidText(miningContext, "apiFetch(", "MiningContext must use mining domain client instead of direct apiFetch");
forbidText(miningContext.toLowerCase(), "supabase", "MiningContext must not access Supabase directly");
forbidText(miningContext, "useGpt()", "MiningContext must keep scoped session ownership");

const catalog = read("src/components/mining/MineCatalog.tsx");
for (const label of ["광산", "최소 운용", "최대 운용", "현재 일일율 · 서버 값", "광산 보기"]) {
  requireText(catalog, label, `mine catalog label ${label}`);
}
forbidText(catalog, "OpportunitySection", "mine catalog must not render resale opportunities");
forbidText(catalog, "useGpt()", "mine catalog must not use full GptContext");

const detail = read("src/components/mining/MineDetail.tsx");
for (const token of [
  "채굴 시작",
  "금액 늘리기",
  "금액 줄이기",
  "운용 종료",
  "조건 확인",
  "FINAL CONFIRM",
  "서버 성공 응답",
  "newMiningIdempotencyKey",
  "error instanceof ApiError && error.status === 0",
  "mining.startPosition",
  "mining.increasePosition",
  "mining.decreasePosition",
  "mining.endPosition",
]) {
  requireText(detail, token, `mine detail mutation UX ${token}`);
}
forbidText(detail.toLowerCase(), "supabase", "mine detail must not access Supabase directly");
forbidText(detail, "apiFetch(", "mine detail must mutate through MiningContext");
forbidText(detail, "useGpt()", "mine detail must not use full GptContext");
forbidText(detail, "summary.profitAmount", "mine detail must not reuse cumulative liability as live profit");
forbidPattern(
  detail,
  /(?:currentDailyRate|accruedProfitAmount|principalAmount)\s*[+*\/\-]/,
  "mine detail must not calculate server mining money or rates",
);
forbidPattern(
  detail,
  /\b(?:reduce|Math\.round|Math\.floor|Math\.ceil)\s*\([^\n]*(?:profit|principal|rate)/i,
  "mine detail must not aggregate or round mining authority values",
);

console.log("PHASE09_USER_MINING_OPERATIONS_ASSERTIONS_PASS");
