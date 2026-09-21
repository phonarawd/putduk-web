import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const must = (condition, message) => {
  if (!condition) throw new Error(`PHASE17_ASSERTION_FAILED: ${message}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
must(contract.version === "2026-09-20.mine-v1", "mining contract version drift");

const allowedDirectUse = new Set([
  "src/lib/gpt/GptContext.tsx",
  "src/lib/gpt/GptScopes.ts",
]);

function sourceFiles(dir) {
  const absolute = path.join(root, dir);
  const found = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = path.posix.join(dir.replaceAll("\\", "/"), entry.name);
    if (entry.isDirectory()) {
      found.push(...sourceFiles(relative));
      continue;
    }
    if (/\.(?:ts|tsx)$/.test(entry.name)) found.push(relative);
  }
  return found;
}

const offenders = sourceFiles("src").filter((relative) => {
  if (allowedDirectUse.has(relative)) return false;
  return /\buseGpt\s*\(/.test(read(relative));
});

must(
  offenders.length === 0,
  `direct useGpt() consumers remain: ${offenders.join(", ")}`,
);

const scopes = read("src/lib/gpt/GptScopes.ts");
for (const scope of ["useGptSession", "usePutdukAi", "useCommonUi", "useOpportunityFlow"]) {
  must(scopes.includes(`function ${scope}()`), `missing scoped hook ${scope}`);
}

for (const forbidden of [
  "principalUsdt",
  "principalKrw",
  "lockedUsdt",
  "lockedKrw",
  "profitUsdt",
  "profitKrw",
  "practiceUsdt",
  "practiceKrw",
  "loadMoneyRead",
]) {
  must(!scopes.includes(forbidden), `wallet money authority leaked into GptScopes: ${forbidden}`);
}

const wallet = read("src/lib/wallet/WalletContext.tsx");
must(wallet.includes("loadMoneyRead"), "WalletContext lost loadMoneyRead authority");

console.log("PHASE17_NO_DIRECT_GPT_CONSUMERS_ASSERTIONS_PASS");
