import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const requireText = (source, needle, label) => {
  if (!source.includes(needle)) throw new Error(`PHASE12 assertion failed: ${label}`);
};
const forbidText = (source, needle, label) => {
  if (source.includes(needle)) throw new Error(`PHASE12 assertion failed: ${label}`);
};
const forbidPattern = (source, pattern, label) => {
  if (pattern.test(source)) throw new Error(`PHASE12 assertion failed: ${label}`);
};

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
if (contract.contractVersion !== "2026-09-20.mine-v1") {
  throw new Error("PHASE12 assertion failed: mining contract version drift");
}

const walletContext = read("src/lib/wallet/WalletContext.tsx");
for (const token of [
  "loadMoneyRead",
  "hasMoneyValues",
  "hasValues:",
  "balance:",
  "withdrawable:",
  "trial:",
  "refresh: () => Promise<void>",
  "void refresh();",
]) {
  requireText(walletContext, token, `WalletContext authority surface ${token}`);
}
forbidText(walletContext.toLowerCase(), "supabase", "WalletContext must not access Supabase directly");

const me = read("src/app/me/page.tsx");
requireText(me, "useWallet()", "/me must consume WalletContext");
requireText(me, "useGptSession()", "/me must consume scoped session state");
requireText(me, "useCommonUi()", "/me must consume scoped common UI state");
forbidText(me, "loadMoneyRead", "/me must not own a duplicate wallet money reader");
forbidText(me, "type MoneyRead", "/me must not own wallet response state");
forbidText(me, "useGpt()", "/me must not reach through the full legacy context");
forbidText(me, "wallet.refresh()", "/me initial wallet refresh lifecycle must remain in WalletContext");

const walletStrip = read("src/components/gpt/WalletSummaryStrip.tsx");
requireText(walletStrip, "useWallet()", "wallet summary must consume WalletContext");
forbidText(walletStrip, "loadMoneyRead", "wallet summary must not own a duplicate money reader");
forbidText(walletStrip, "type MoneyRead", "wallet summary must not own wallet response state");
forbidText(walletStrip, "wallet.refresh()", "wallet summary refresh lifecycle must remain in WalletContext");
forbidText(walletStrip.toLowerCase(), "supabase", "wallet summary must not access Supabase");

const withdraw = read("src/app/wallet/withdraw/page.tsx");
for (const token of [
  "useWallet()",
  "wallet.withdrawable.profitUsdt",
  "wallet.withdrawable.profitKrw",
  "await wallet.refresh()",
]) {
  requireText(withdraw, token, `withdraw wallet authority ${token}`);
}
requireText(withdraw, "useCommonUi()", "withdraw must use scoped common UI state");
forbidText(withdraw, "loadMoneyRead", "withdraw must not own a duplicate wallet money reader");
forbidText(withdraw, "summary.profitAmount", "mining liability profit must never become withdrawable balance");
forbidText(withdraw, "mining.summary", "withdraw must not derive balance from mining summary");

const deposit = read("src/app/wallet/deposit/page.tsx");
requireText(deposit, "WalletSummaryStrip", "deposit must keep the shared wallet authority summary");
requireText(deposit, "useCommonUi()", "deposit must use scoped common UI state");
forbidText(deposit, "loadMoneyRead", "deposit must not own a duplicate wallet money reader");

const miningContext = read("src/lib/mining/MiningContext.tsx");
requireText(miningContext, "refreshWallet", "mining mutations must retain wallet resync");
requireText(
  miningContext,
  "await Promise.all([refresh(), refreshWallet()])",
  "successful mining mutation must resync mining and wallet server state",
);

const miningHome = read("src/components/mining/MiningHome.tsx");
requireText(miningHome, "wallet.withdrawable.profitKrw", "home withdrawable must come from WalletContext");
requireText(miningHome, "wallet.withdrawable.profitUsdt", "home withdrawable USDT must come from WalletContext");
requireText(miningHome, "mining.summary?.activePrincipalAmount", "active mining principal must remain mining server truth");
forbidText(miningHome, "mining.summary?.profitAmount", "mining summary profit must not be mapped to withdrawable");

const walletSurfaces = [me, walletStrip, withdraw, deposit].join("\n");
forbidPattern(
  walletSurfaces,
  /settlements\.(?:sort|toSorted|reduce)\s*\(/,
  "wallet surfaces must not aggregate or reorder mining settlements",
);
forbidPattern(
  walletSurfaces,
  /(?:activePrincipalAmount|principalAmount)[^\n]*\+[^\n]*(?:profitUsdt|withdrawable|wallet)/,
  "wallet and mining principal must not be arithmetically combined",
);
forbidText(walletSurfaces.toLowerCase(), "supabase", "consumer money surfaces must not access Supabase directly");
forbidText(walletSurfaces, "/api/v1/admin/", "consumer money surfaces must not call admin endpoints");

console.log("PHASE12_MINING_WALLET_ALIGNMENT_ASSERTIONS_PASS");
