import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const must = (condition, message) => {
  if (!condition) throw new Error(`PHASE20_TRIAL_CLIENT_ASSERTION_FAILED: ${message}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
const api = read("src/lib/mining/api.ts");
const types = read("src/lib/mining/types.ts");
const context = read("src/lib/mining/MiningContext.tsx");

must(contract.contractVersion === "2026-09-20.mine-v1", "contract version drift");
must(contract.userApi?.getTrialStatus?.method === "GET", "trial status method drift");
must(contract.userApi?.getTrialStatus?.path === "/api/v1/mining/trial", "trial status route drift");
must(contract.userApi?.startTrial?.method === "POST", "trial start method drift");
must(contract.userApi?.startTrial?.path === "/api/v1/mining/trial/start", "trial start route drift");

must(api.includes('trial: "/api/v1/mining/trial"'), "trial status API route missing");
must(api.includes('startTrial: "/api/v1/mining/trial/start"'), "trial start API route missing");
must(api.includes("getMiningTrialStatus"), "trial status API function missing");
must(api.includes("startMiningTrial"), "trial start API function missing");
must(api.includes('headers: idempotencyHeaders(idempotencyKey)'), "trial start idempotency header missing");
must(api.includes('body: JSON.stringify({ mineId: input.mineId })'), "trial start body contract drift");

for (const marker of [
  '"NOT_STARTED"',
  '"ACTIVE"',
  '"COMPLETED"',
  '"EXPIRED"',
  "MiningTrialStatus",
  "trialSessionId",
  "accruedProfitAmount",
  "remainingParticipations",
  "trial: MiningTrialStatus | null",
]) {
  must(types.includes(marker), `trial type marker missing: ${marker}`);
}

must(context.includes("getMiningTrialStatus"), "trial status is not refreshed from server");
must(context.includes("startMiningTrial"), "trial start is not wired to context");
must(context.includes("setTrial(nextTrial)"), "authoritative trial response is not stored");
must(context.includes("getMiningTrialStatus(),"), "authenticated refresh omits trial status");
must(context.includes("setTrial(null)"), "logout refresh does not clear trial state");
must(context.includes("startTrial: (input: StartTrialMutation)"), "context trial mutation contract missing");
must(context.includes("mutationLockRef.current"), "trial mutation does not share mining mutation lock");
must(context.includes("await Promise.all([refresh(), refreshWallet()])"), "trial mutation does not resync mining and wallet state");

console.log("PHASE20_TRIAL_CLIENT_ASSERTIONS_PASS");
