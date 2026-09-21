import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE15 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE15 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE15 assertion failed: mining contract version drift");
}

const scopes = read("src/lib/gpt/GptScopes.ts");
for (const token of [
  "birthday: gpt.state.birthday",
  "phone: gpt.state.phone",
  "notificationsEnabled: gpt.state.notificationsEnabled",
  "benefitNews: gpt.state.benefitNews",
  "settlementAlerts: gpt.state.settlementAlerts",
  "walletAlerts: gpt.state.walletAlerts",
  "preferKrwFirst: gpt.state.preferKrwFirst",
  "celebrateOn: gpt.state.celebrateOn",
  "trades: gpt.state.trades",
  "recordsError: gpt.state.recordsError",
  "deskReady: gpt.state.deskReady",
]) {
  requireText(scopes, token, `required scoped field missing: ${token}`);
}
for (const token of [
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
  forbidText(scopes, token, `GptScopes must not become wallet money authority: ${token}`);
}

const scopedConsumers = [
  ["src/components/gpt/GoogleContinueButton.tsx", ["useCommonUi"]],
  ["src/components/gpt/RouteTop.tsx", ["useGptSession"]],
  ["src/components/gpt/RecognitionView.tsx", ["useGptSession"]],
  ["src/app/login/page.tsx", ["useGptSession", "useCommonUi"]],
  ["src/app/signup/page.tsx", ["useGptSession", "useCommonUi"]],
  ["src/app/auth/complete-profile/page.tsx", ["useGptSession", "useCommonUi"]],
  ["src/app/auth/find-id/page.tsx", ["useCommonUi"]],
  ["src/app/auth/reset-password/page.tsx", ["useCommonUi"]],
  ["src/app/auth/verify-email/page.tsx", ["useGptSession", "useCommonUi"]],
  ["src/app/invite/page.tsx", ["useCommonUi"]],
  ["src/app/me/inbox/page.tsx", ["useCommonUi"]],
  ["src/app/me/settings/page.tsx", ["useCommonUi", "usePutdukAi"]],
  ["src/app/me/records/page.tsx", ["useOpportunityFlow"]],
];

for (const [file, hooks] of scopedConsumers) {
  const source = read(file);
  forbidText(source, "@/lib/gpt/GptContext", `${file} must not import full GptContext`);
  forbidText(source, "useGpt()", `${file} must not call full useGpt`);
  for (const hook of hooks) requireText(source, `${hook}()`, `${file} must consume ${hook}`);
}

const routeTop = read("src/components/gpt/RouteTop.tsx");
requireText(routeTop, "loggedIn ? \"/me\" : \"/\"", "RouteTop fallback must retain session-aware route behavior");

const completeProfile = read("src/app/auth/complete-profile/page.tsx");
forbidText(completeProfile, "state.email", "complete-profile must use scoped email");
forbidText(completeProfile, "state.displayName", "complete-profile must use scoped displayName");
forbidText(completeProfile, "state.birthday", "complete-profile must use scoped birthday");
forbidText(completeProfile, "state.phone", "complete-profile must use scoped phone");

const inbox = read("src/app/me/inbox/page.tsx");
for (const token of ["notificationsEnabled", "settlementAlerts", "walletAlerts"]) {
  requireText(inbox, `checked={${token}}`, `inbox must use scoped setting ${token}`);
}

const settings = read("src/app/me/settings/page.tsx");
for (const token of ["preferKrwFirst", "celebrateOn", "benefitNews"]) {
  requireText(settings, `checked={${token}}`, `settings must use scoped setting ${token}`);
}
requireText(settings, "resetConversation", "settings must reset AI through PUTDUK AI scope");

const records = read("src/app/me/records/page.tsx");
forbidText(records, "state.trades", "records must use scoped trades");
forbidText(records, "state.feed", "records must use scoped feed");
forbidText(records, "state.recordsError", "records must use scoped recordsError");
forbidText(records, "state.deskReady", "records must use scoped deskReady");
requireText(records, "opportunityById(trade.opportunityId, feed)", "records must retain scoped server feed lookup");

const walletContext = read("src/lib/wallet/WalletContext.tsx");
requireText(walletContext, "loadMoneyRead", "WalletContext must remain money authority");

console.log("PHASE15_GPT_SCOPED_REMAINDER_ASSERTIONS_PASS");
