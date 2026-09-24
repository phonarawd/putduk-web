import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const must = (condition, message) => {
  if (!condition) throw new Error(`PHASE18_ASSERTION_FAILED: ${message}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
must(contract.contractVersion === "2026-09-20.mine-v1", "mining contract version drift");

const allowedImports = new Set([
  "src/lib/gpt/AppProviders.tsx",
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

const directImport = /(?:from\s+["'][^"']*GptContext["']|import\s*\(["'][^"']*GptContext["']\))/;
const offenders = sourceFiles("src").filter((relative) => {
  if (relative === "src/lib/gpt/GptContext.tsx" || allowedImports.has(relative)) return false;
  return directImport.test(read(relative));
});

must(
  offenders.length === 0,
  `direct GptContext imports remain outside bootstrap/facade: ${offenders.join(", ")}`,
);

for (const relative of allowedImports) {
  must(directImport.test(read(relative)), `expected GptContext boundary import missing: ${relative}`);
}

const phase17 = read("quality/mining/phase17_no_direct_gpt_consumers_assertions.mjs");
must(phase17.includes("direct useGpt() consumers remain"), "PHASE17 direct-use guard missing");

const scopes = read("src/lib/gpt/GptScopes.ts");
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

console.log("PHASE18_GPT_IMPORT_BOUNDARY_ASSERTIONS_PASS");
