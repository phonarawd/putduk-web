/** 백엔드 4c6f22f DTO와 같은 키만 쓴다. 합성 값이며 실제 개인정보가 아니다. */

export const API_ORIGIN = "https://api.hiptk.app";

export const USER_A = {
  userId: "00000000-0000-4000-8000-00000000000a",
  username: "qaaccounta",
  email: "qa-account-a@putduk.test",
  declaredName: "테스터갑",
  phone: "01000000001",
  birthday: "900101",
  gender: "male" as const,
};

export const USER_B = {
  userId: "00000000-0000-4000-8000-00000000000b",
  username: "qaaccountb",
  email: "qa-account-b@putduk.test",
  declaredName: "테스터을",
  phone: "01000000002",
  birthday: "910202",
  gender: "female" as const,
};

export const DEPOSIT_ADDRESS = {
  userId: USER_A.userId,
  trc20Address: "TQaDepositAddressForFixture0000001",
  derivationIndex: 0,
  qrPayload: "TQaDepositAddressForFixture0000001",
  createdAt: "2026-09-10T00:00:00.000Z",
};

export const AUTHORIZE_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?client_id=qa&redirect_uri=https%3A%2F%2Fputduk.test%2Fauth%2Foauth%2Fgoogle%2Fcallback&state=qa-state&response_type=code&scope=openid%20email";

export function sessionDto(
  user: typeof USER_A | typeof USER_B,
  onboarding: "complete" | "incomplete" = "complete",
  gender: "male" | "female" | null = null,
) {
  return {
    sessionId: `sess-${user.userId.slice(-1)}`,
    userId: user.userId,
    issuer: "ai-profit-os-nest",
    issuedAt: "2026-09-10T00:00:00.000Z",
    expiresAt: "2026-09-10T01:00:00.000Z",
    revoked: false,
    onboardingStage: onboarding === "complete" ? "B_complete" : "B_incomplete",
    email: user.email,
    username: user.username,
    declaredName: user.declaredName,
    onboarding,
    gender,
  };
}

export function googleStartDto(authorizeUrl = AUTHORIZE_URL) {
  return { ok: true, provider: "google", status: "ready", authorizeUrl };
}

export function googleCallbackDto(onboarding: "complete" | "incomplete") {
  return {
    ok: true,
    stage: "A",
    onboarding,
    session: sessionDto(USER_A, onboarding),
    accessToken: "qa-access-token",
    issuer: "ai-profit-os-nest",
  };
}

export const HOME_MONEY = {
  principalUsdt: "12.500000",
  principalKrwApprox: 18000,
  lockedUsdt: "0.000000",
  profitUsdt: "3.250000",
  withdrawableProfitUsdt: "3.250000",
  profitKrwApprox: 4700,
};

export const TRIAL_NONE = {
  grantStatus: "none",
  trialPrincipalUsdt: null,
  trialLockedUsdt: null,
  trialEligibleOpportunityIds: [],
};

export const OPPORTUNITY_LIST = {
  items: [
    {
      id: "opp-qa-1",
      assetLabel: "점검용 기회",
      category: "기회",
      requiredCapitalUsdt: "10.000000",
      requiredCapitalKrwApprox: 14500,
      pricingVersion: 1,
      expectedProfitUsdt: "0.400000",
      expectedProfitKrwApprox: 580,
    },
  ],
};

export const MEMBERSHIP = {
  membership: "sprout",
  labelKo: "새싹",
  dailyUserMatchCap: 3,
  dailyMatchesUsed: 1,
};

export const BENEFITS = {
  items: [{ missionId: "mission-qa-1", titleKo: "출석", bodyKo: "오늘 한 번" }],
};

export const KRW_GUIDE = {
  bankName: "점검은행",
  accountNumber: "000000000000",
  accountHolder: "퍼뜩점검",
  noticeKo: "입금자 이름을 맞춰 주세요",
};

function ledgerDisplay(
  journalType: string | null,
  labelKo: string,
  direction: "debit" | "credit" | "neutral",
  amountUsdt: string,
  extras?: { amountSource?: string; multiEntryPolicy?: string },
) {
  return {
    displayKey: journalType ? `ledger.${journalType}` : "ledger.unknown",
    labelKo,
    direction,
    customerVisible: true,
    amountUsdt,
    amountSource: extras?.amountSource ?? "user_bucket_net",
    multiEntryPolicy: extras?.multiEntryPolicy ?? "single",
    status: "posted",
  };
}

export const LEDGER = {
  items: [
    {
      id: "j-deposit",
      journalType: "deposit_usdt",
      createdAt: "2026-09-09T00:00:00.000Z",
      referenceType: "deposit",
      referenceId: "d1",
      display: ledgerDisplay("deposit_usdt", "USDT 입금", "credit", "10.000000"),
      entries: [{ id: "e1", direction: "credit", amountUsdt: "10.000000", bucket: "principal", accountKind: "user_bucket" }],
    },
    {
      id: "j-withdraw",
      journalType: "withdraw",
      createdAt: "2026-09-09T01:00:00.000Z",
      display: ledgerDisplay("withdraw", "출금", "debit", "1.000000"),
      entries: [{ id: "e2", direction: "debit", amountUsdt: "1.000000", bucket: "profit", accountKind: "user_bucket" }],
    },
    {
      id: "j-lock",
      journalType: "participate_lock",
      createdAt: "2026-09-09T02:00:00.000Z",
      display: ledgerDisplay("participate_lock", "참여 잠금", "debit", "2.000000"),
      entries: [{ id: "e3", direction: "debit", amountUsdt: "2.000000", bucket: "principal", accountKind: "user_bucket" }],
    },
    {
      id: "j-refund",
      journalType: "withdraw_refund",
      createdAt: "2026-09-09T03:00:00.000Z",
      display: ledgerDisplay("withdraw_refund", "출금 반환", "credit", "1.000000"),
      entries: [{ id: "e4", direction: "credit", amountUsdt: "1.000000", bucket: "profit", accountKind: "user_bucket" }],
    },
    {
      id: "j-zero",
      journalType: "fee",
      createdAt: "2026-09-09T04:00:00.000Z",
      display: ledgerDisplay("fee", "수수료", "debit", "0"),
      entries: [{ id: "e5", direction: "debit", amountUsdt: "0", bucket: "profit", accountKind: "user_bucket" }],
    },
    {
      id: "j-multi",
      journalType: "settlement",
      createdAt: "2026-09-09T05:00:00.000Z",
      display: ledgerDisplay("settlement", "정산", "credit", "3.000000", { multiEntryPolicy: "sum_user_bucket_signed" }),
      entries: [
        { id: "e6", direction: "debit", amountUsdt: "3.000000", bucket: "locked", accountKind: "user_bucket" },
        { id: "e7", direction: "credit", amountUsdt: "3.000000", bucket: "profit", accountKind: "user_bucket" },
      ],
    },
    {
      id: "j-unknown",
      journalType: null,
      createdAt: "2026-09-09T06:00:00.000Z",
      display: ledgerDisplay(null, "확인 필요", "neutral", "0.100000", { amountSource: "unknown" }),
      entries: [{ id: "e8", direction: "credit", amountUsdt: "0.100000", bucket: "principal", accountKind: "user_bucket" }],
    },
  ],
  total: 7,
  limit: 20,
  offset: 0,
};

export function kycDto(kycStatus: "none" | "pending" | "approved" | "rejected", rejectReason?: string) {
  return {
    userId: USER_A.userId,
    kycStatus,
    submissionId: kycStatus === "none" ? undefined : "kyc-qa-1",
    decidedAt: kycStatus === "approved" || kycStatus === "rejected" ? "2026-09-10T00:00:00.000Z" : undefined,
    rejectReason: kycStatus === "rejected" ? rejectReason || "서류가 흐려요" : undefined,
  };
}
