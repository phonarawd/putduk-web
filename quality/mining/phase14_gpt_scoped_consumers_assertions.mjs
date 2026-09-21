import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE14 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE14 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE14 assertion failed: mining contract version drift");
}

const scopes = read("src/lib/gpt/GptScopes.ts");
for (const token of [
  "export function useGptSession()",
  "export function usePutdukAi()",
  "export function useCommonUi()",
  "export function useOpportunityFlow()",
  "trial: gpt.state.trial",
  "feed: gpt.state.feed",
  "selectedId: gpt.state.selectedId",
  "selected: gpt.selected",
  "opportunities: gpt.opportunities",
  "preflightOpen: gpt.preflightOpen",
  "activeExecution: gpt.activeExecution",
]) {
  requireText(scopes, token, `scoped GPT surface missing ${token}`);
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
  forbidText(scopes, token, `GptScopes must not become a wallet money authority: ${token}`);
}

const scopedConsumers = [
  ["src/components/gpt/AppShell.tsx", ["useGptSession", "useCommonUi", "useOpportunityFlow"]],
  ["src/components/gpt/SiteHeader.tsx", ["useGptSession"]],
  ["src/components/gpt/Toast.tsx", ["useCommonUi"]],
  ["src/components/gpt/AmbassadorVisual.tsx", ["useOpportunityFlow"]],
  ["src/components/gpt/OpportunitySection.tsx", ["useOpportunityFlow"]],
  ["src/components/gpt/PreflightModal.tsx", ["useOpportunityFlow"]],
  ["src/components/gpt/ExecutionModal.tsx", ["useOpportunityFlow"]],
  ["src/components/gpt/PeotteokAiView.tsx", ["usePutdukAi"]],
];

for (const [file, hooks] of scopedConsumers) {
  const source = read(file);
  forbidText(source, "@/lib/gpt/GptContext", `${file} must not import full GptContext`);
  forbidText(source, "useGpt()", `${file} must not call full useGpt`);
  for (const hook of hooks) requireText(source, `${hook}()`, `${file} must consume ${hook}`);
}

const aiView = read("src/components/gpt/PeotteokAiView.tsx");
for (const token of ["conversations", "activeConversationId", "currentConversation", "typing", "sendAiQuestion"] ) {
  requireText(scopes, `${token}:`, `usePutdukAi must expose ${token}`);
}
forbidText(aiView, "state.conversations", "AI view must not read legacy state.conversations directly");
forbidText(aiView, "state.activeConversationId", "AI view must not read legacy state.activeConversationId directly");

const opportunitySection = read("src/components/gpt/OpportunitySection.tsx");
forbidText(opportunitySection, "state.trial", "opportunity section must use scoped trial state");
forbidText(opportunitySection, "state.selectedId", "opportunity section must use scoped selectedId");
requireText(opportunitySection, "canStartOpportunity(selected, trial)", "eligibility must retain server-derived trial input");

const execution = read("src/components/gpt/ExecutionModal.tsx");
forbidText(execution, "state.feed", "execution modal must use scoped opportunity feed");
requireText(execution, "opportunityById(activeExecution.opportunityId, feed)", "execution display must retain scoped server feed lookup");

const walletContext = read("src/lib/wallet/WalletContext.tsx");
requireText(walletContext, "loadMoneyRead", "WalletContext must remain money authority");

console.log("PHASE14_GPT_SCOPED_CONSUMERS_ASSERTIONS_PASS");
