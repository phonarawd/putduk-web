import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const must = (condition, message) => {
  if (!condition) throw new Error(`PHASE19_ASSERTION_FAILED: ${message}`);
};

const contractText = read("contracts/mining/mining-contract.v1.json");
const contract = JSON.parse(contractText);
const contractBlob = crypto
  .createHash("sha1")
  .update(`blob ${Buffer.byteLength(contractText)}\0`)
  .update(contractText)
  .digest("hex");

must(contract.contractVersion === "2026-09-20.mine-v1", "mining contract version drift");
must(
  contractBlob === "e7e180e1968194c12f2d720476165889877ca8dd",
  `mining contract blob drift: ${contractBlob}`,
);

const expectedUserApi = {
  listMines: ["GET", "/api/v1/mines"],
  getMine: ["GET", "/api/v1/mines/:mineId"],
  getMyMiningSummary: ["GET", "/api/v1/mining/me/summary"],
  listMyPositions: ["GET", "/api/v1/mining/me/positions"],
  getMyPosition: ["GET", "/api/v1/mining/me/positions/:positionId"],
  startPosition: ["POST", "/api/v1/mining/positions/start"],
  increasePosition: ["POST", "/api/v1/mining/positions/:positionId/increase"],
  decreasePosition: ["POST", "/api/v1/mining/positions/:positionId/decrease"],
  endPosition: ["POST", "/api/v1/mining/positions/:positionId/end"],
  listMySettlements: ["GET", "/api/v1/mining/me/settlements"],
  getTrialStatus: ["GET", "/api/v1/mining/trial"],
  startTrial: ["POST", "/api/v1/mining/trial/start"],
};

for (const [name, [method, route]] of Object.entries(expectedUserApi)) {
  must(contract.userApi?.[name]?.method === method, `${name} method drift`);
  must(contract.userApi?.[name]?.path === route, `${name} path drift`);
}

const expectedAdminGap = {
  getTrialConfig: ["GET", "/api/v1/admin/mining/trial-config"],
  updateTrialConfig: ["PATCH", "/api/v1/admin/mining/trial-config"],
  listHighValueReviews: ["GET", "/api/v1/admin/mining/high-value-reviews"],
  getHighValueReview: ["GET", "/api/v1/admin/mining/high-value-reviews/:reviewId"],
  approveHighValueReview: ["POST", "/api/v1/admin/mining/high-value-reviews/:reviewId/approve"],
  rejectHighValueReview: ["POST", "/api/v1/admin/mining/high-value-reviews/:reviewId/reject"],
};

for (const [name, [method, route]] of Object.entries(expectedAdminGap)) {
  must(contract.adminApi?.[name]?.method === method, `${name} method drift`);
  must(contract.adminApi?.[name]?.path === route, `${name} path drift`);
}

const api = read("src/lib/mining/api.ts");
for (const fragment of [
  'mines: "/api/v1/mines"',
  'summary: "/api/v1/mining/me/summary"',
  'positions: "/api/v1/mining/me/positions"',
  'settlements: "/api/v1/mining/me/settlements"',
  'startPosition: "/api/v1/mining/positions/start"',
  'action: "increase" | "decrease" | "end"',
  '"Idempotency-Key"',
  "principalAmount: input.principalAmount",
  "assetCode: input.assetCode",
]) {
  must(api.includes(fragment), `consumer mining API guard missing: ${fragment}`);
}

must(
  !api.includes("/api/v1/mining/trial"),
  "consumer trial API appeared; update PHASE19 audit instead of leaving the gap snapshot stale",
);

const audit = read("quality/mining/MINE-019-RELEASE-INTEGRATION-AUDIT.md");
for (const marker of [
  "a5aebf994a56a9cc10a816333aa9e23a4b4189e6",
  "ad395b4fa9f5d82c4dd2ac64d5eafa5c7ee4e8fd",
  "b4c1311dd042c0b5bfde8705971cf8b66df4a552",
  "50c3316eedbc8acc2c20ad7837ebe90df5a9338f",
  "1d690a8ffdc0f7233f58b5693b8bd6e21da23a23",
  "a79826aaeb7f97b70fae881f1d423ce0f70a49fe",
  "d6e279841aaa62b7b75f26a7b33d1768923d551b",
  "3b17a54c56d67f35047db37a0624b171eb485d39",
  "74b80f999527ddb19b480e9ec0c959b4fa472d7d",
  "8630db7d9a63665dc67145aa8012a1114778f9dc",
  "BLOCKER-BE-ANCESTRY-01",
  "BLOCKER-BE-ANCESTRY-02",
  "BLOCKER-CONTRACT-COMPLETENESS-01",
  "BLOCKER-STAGING-DB-01",
  "BLOCKER-PROD-MIGRATION-01",
  "Production untouched",
]) {
  must(audit.includes(marker), `release audit marker missing: ${marker}`);
}

console.log("PHASE19_RELEASE_READINESS_ASSERTIONS_PASS");
