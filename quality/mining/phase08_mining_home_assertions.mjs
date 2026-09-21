import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const must = (condition, label) => {
  if (!condition) throw new Error(`PHASE08 assertion failed: ${label}`);
};
const contains = (source, needle, label) => must(source.includes(needle), label);
const forbids = (source, needle, label) => must(!source.includes(needle), label);

const contract = JSON.parse(read("contracts/mining/mining-contract.v1.json"));
must(contract.contractVersion === "2026-09-20.mine-v1", "mining contract version drift");

const home = read("src/app/page.tsx");
for (const token of [
  "useMining",
  "useWallet",
  "useGptSession",
  "오늘의 채굴",
  "오늘 채굴",
  "운용 중",
  "출금 가능",
  "내 채굴장",
  "최근 정산",
  "activePositionCount",
  "activePrincipalAmount",
  "accruedProfitAmount",
  "서버 기준 발생 수익",
]) {
  contains(home, token, `mining home token ${token}`);
}
for (const forbidden of [
  "OpportunitySection",
  "HomeBanners",
  "AmbassadorMoment",
  "AmbassadorHero",
  "refreshQuotes",
  "principalSuggestion",
  "리셀러 데스크",
  "오늘 기회",
  "supabase",
  "parseFloat(",
  "parseInt(",
]) {
  forbids(home, forbidden, `mining home forbidden token ${forbidden}`);
}
contains(home, "formatAssetAmount(position.accruedProfitAmount", "server accrued profit is displayed without recomputation");
contains(home, "formatAssetAmount(mining.summary?.activePrincipalAmount", "server active principal is displayed");
contains(home, "wallet.withdrawable.profitUsdt", "WalletContext withdrawable state is displayed");

const nav = read("src/lib/gpt/nav.ts");
contains(nav, '{ key: "work", label: "광산", path: "/work" }', "work nav is user-visible mining");
forbids(nav, 'label: "기회"', "opportunity nav label removed");

const work = read("src/app/work/page.tsx");
contains(work, 'router.replace("/#mine-yard")', "/work compatibility redirects to mining home");
contains(work, "광산으로 이동 중", "/work user-visible mining transition");
forbids(work, "OpportunitySection", "/work reseller opportunity surface removed");
forbids(work, "refreshQuotes", "/work reseller refresh removed");

const header = read("src/components/gpt/SiteHeader.tsx");
contains(header, "useGptSession", "header uses scoped session hook");
contains(header, "MINE OS", "header mining brand");
forbids(header, "resellerId", "header reseller identity removed");
forbids(header, "리셀러 데스크", "header reseller brand removed");

const footer = read("src/components/gpt/SiteFooter.tsx");
contains(footer, "PUTDUK MINE OS", "footer mining brand");
forbids(footer, "리셀러 데스크", "footer reseller brand removed");

const layout = read("src/app/layout.tsx");
contains(layout, 'import "@/styles/mining-home.css"', "mining home stylesheet wired");
contains(layout, 'title: "퍼뜩 마인 OS"', "mining metadata title");
forbids(layout, "리셀러 데스크", "reseller metadata removed");

const presentation = read("src/lib/mining/presentation.ts");
for (const label of ["가동", "운용 중", "정산 완료", "확인 필요", "검토 필요"]) {
  contains(presentation, `"${label}"`, `Korean mining presentation label ${label}`);
}
forbids(presentation, "eval(", "presentation helper cannot execute dynamic math");

console.log("PHASE08_MINING_HOME_ASSERTIONS_PASS");
