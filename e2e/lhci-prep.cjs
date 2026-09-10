const API = "https://api.hiptk.app";

const session = {
  sessionId: "sess-lhci",
  userId: "00000000-0000-4000-8000-00000000000a",
  issuer: "ai-profit-os-nest",
  issuedAt: "2026-09-10T00:00:00.000Z",
  expiresAt: "2026-09-10T01:00:00.000Z",
  revoked: false,
  onboardingStage: "B_complete",
  email: "qa-account-a@putduk.test",
  username: "qaaccounta",
  declaredName: "테스터갑",
  onboarding: "complete",
};

function bodyFor(url) {
  if (url.includes("/auth/session")) return session;
  if (url.includes("/home-money-read")) {
    return { principalUsdt: "12.500000", principalKrwApprox: 18000, profitUsdt: "3.250000", profitKrwApprox: 4700 };
  }
  if (url.includes("/home-read") || url.includes("/opportunities")) {
    return { items: [{ id: "opp-qa-1", assetLabel: "점검용 기회", requiredCapitalUsdt: "10.000000", pricingVersion: 1, expectedProfitUsdt: "0.400000" }] };
  }
  if (url.includes("/trial-state")) return { grantStatus: "none", trialEligibleOpportunityIds: [] };
  if (url.includes("/membership")) return { membership: "sprout", labelKo: "새싹", dailyUserMatchCap: 3, dailyMatchesUsed: 1 };
  if (url.includes("/benefits")) return { items: [{ missionId: "mission-qa-1", titleKo: "출석", bodyKo: "오늘 한 번" }] };
  if (url.includes("/krw-deposit-instructions")) {
    return { bankName: "점검은행", accountNumber: "000000000000", accountHolder: "퍼뜩점검", noticeKo: "입금자 이름을 맞춰 주세요" };
  }
  if (url.includes("/my-deposit-address")) {
    return {
      userId: session.userId,
      trc20Address: "TQaDepositAddressForFixture0000001",
      derivationIndex: 0,
      qrPayload: "TQaDepositAddressForFixture0000001",
      createdAt: "2026-09-10T00:00:00.000Z",
    };
  }
  if (url.includes("/kyc/status")) return { userId: session.userId, kycStatus: "none" };
  if (url.includes("/ledger/journals")) return { items: [], total: 0, limit: 20, offset: 0 };
  if (url.includes("/buckets") || url.includes("/trades") || url.includes("/referral")) return { items: [] };
  return { ok: true };
}

const attached = new WeakSet();

async function attach(page) {
  if (attached.has(page)) return;
  attached.add(page);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    try {
      if (!request.url().startsWith(API)) {
        request.continue();
        return;
      }
      const origin = request.headers().origin || "http://127.0.0.1:4174";
      const headers = {
        "access-control-allow-origin": origin,
        "access-control-allow-credentials": "true",
        "access-control-allow-headers": request.headers()["access-control-request-headers"] || "content-type",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      };
      if (request.method() === "OPTIONS") {
        request.respond({ status: 204, headers });
        return;
      }
      request.respond({
        status: 200,
        contentType: "application/json",
        headers,
        body: JSON.stringify(bodyFor(request.url())),
      });
    } catch {
      /* 이미 처리된 요청은 무시한다 */
    }
  });
}

module.exports = async (browser) => {
  browser.on("targetcreated", async (target) => {
    const page = await target.page();
    if (page) await attach(page).catch(() => undefined);
  });
  for (const page of await browser.pages()) {
    await attach(page).catch(() => undefined);
  }
};
