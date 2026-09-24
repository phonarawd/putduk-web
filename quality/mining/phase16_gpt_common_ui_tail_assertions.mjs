import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE16 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE16 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE16 assertion failed: mining contract version drift");
}

for (const file of ["src/app/me/kyc/page.tsx", "src/app/me/support/page.tsx"]) {
  const source = read(file);
  forbidText(source, "@/lib/gpt/GptContext", `${file} must not import full GptContext`);
  forbidText(source, "useGpt()", `${file} must not call full useGpt`);
  requireText(source, "useCommonUi()", `${file} must consume useCommonUi`);
  requireText(source, "showToast", `${file} must retain scoped toast feedback`);
}

const kyc = read("src/app/me/kyc/page.tsx");
for (const token of ["getKycStatus", "submitKyc", "kycPairIssue", "kycFileIssue", "readKycUiStatus"]) {
  requireText(kyc, token, `KYC behavior must retain ${token}`);
}

const support = read("src/app/me/support/page.tsx");
requireText(support, "MSG.supportNeed", "support empty-message validation must remain");
requireText(support, "MSG.featureSoon", "support not-yet-available feedback must remain");

const scopes = read("src/lib/gpt/GptScopes.ts");
for (const token of ["principalUsdt", "principalKrw", "lockedUsdt", "lockedKrw", "profitUsdt", "profitKrw", "practiceUsdt", "practiceKrw", "loadMoneyRead"]) {
  forbidText(scopes, token, `GptScopes must not own wallet money: ${token}`);
}

const walletContext = read("src/lib/wallet/WalletContext.tsx");
requireText(walletContext, "loadMoneyRead", "WalletContext must remain money authority");

console.log("PHASE16_GPT_COMMON_UI_TAIL_ASSERTIONS_PASS");
