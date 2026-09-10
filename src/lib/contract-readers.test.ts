import assert from "node:assert/strict";
import { test } from "node:test";
import {
  googleAuthorizeUrl,
  isAllowedAuthorizeUrl,
  journalSingleAmount,
  needsCompleteProfile,
  readBenefitItems,
  readJournals,
  readKycReason,
  readKycUiStatus,
  readKrwInstructions,
  readMembershipView,
  shouldRotateWithdrawIntent,
  withdrawLockedMismatch,
} from "./contract-readers.ts";

test("googleAuthorizeUrl는 authorizeUrl만 읽고 프로토콜을 검사한다", () => {
  assert.equal(
    googleAuthorizeUrl({ authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=s" }),
    "https://accounts.google.com/o/oauth2/v2/auth?state=s",
  );
  assert.equal(googleAuthorizeUrl({ url: "https://evil.example/x" }), null);
  assert.equal(googleAuthorizeUrl({ redirectUrl: "https://evil.example/x" }), null);
  assert.equal(googleAuthorizeUrl({ authorizationUrl: "https://evil.example/x" }), null);
  assert.equal(googleAuthorizeUrl({ authorizeUrl: "javascript:alert(1)" }), null);
  assert.equal(googleAuthorizeUrl("https://accounts.google.com/x"), null);
  assert.equal(isAllowedAuthorizeUrl("http://localhost:3000/x"), true);
});

test("needsCompleteProfile는 onboarding과 onboardingStage만 본다", () => {
  assert.equal(needsCompleteProfile({ onboarding: "incomplete" }), true);
  assert.equal(needsCompleteProfile({ onboarding: "complete" }), false);
  assert.equal(needsCompleteProfile({ session: { onboardingStage: "B_incomplete" } }), true);
  assert.equal(needsCompleteProfile({ onboardingStage: "B_complete" }), false);
  assert.equal(needsCompleteProfile({ needsProfile: true, isNewUser: true }), null);
});

test("원장은 items[].journalType과 entries만 읽는다", () => {
  const rows = readJournals({
    items: [
      {
        id: "j1",
        journalType: "deposit_usdt",
        createdAt: "2026-09-09T00:00:00.000Z",
        referenceType: "deposit",
        referenceId: "d1",
        entries: [{ id: "e1", direction: "credit", amountUsdt: "10.000000", bucket: "principal", accountKind: "user" }],
      },
      {
        id: "j2",
        journalType: "settlement",
        createdAt: "2026-09-09T01:00:00.000Z",
        entries: [
          { id: "e2", direction: "debit", amountUsdt: "3.000000", bucket: "locked" },
          { id: "e3", direction: "credit", amountUsdt: "3.000000", bucket: "profit" },
        ],
      },
    ],
    total: 2,
    limit: 20,
    offset: 0,
  });
  assert.equal(rows.length, 2);
  assert.equal(rows[0].journalType, "deposit_usdt");
  assert.equal(journalSingleAmount(rows[0]), "10.000000");
  assert.equal(journalSingleAmount(rows[1]), null);
});

test("KYC는 kycStatus와 rejectReason만 매핑한다", () => {
  assert.equal(readKycUiStatus({ kycStatus: "approved" }), "verified");
  assert.equal(readKycUiStatus({ kycStatus: "none" }), "none");
  assert.equal(readKycUiStatus({ status: "pending" }), null);
  assert.equal(readKycReason({ rejectReason: "서류가 흐려요" }), "서류가 흐려요");
  assert.equal(readKycReason({ reason: "숨긴 사유" }), "");
});

test("멤버십은 labelKo와 횟수 필드만 읽는다", () => {
  const view = readMembershipView({
    membership: "sprout",
    labelKo: "새싹",
    dailyUserMatchCap: 3,
    dailyMatchesUsed: 1,
    displayName: "가짜등급",
  });
  assert.equal(view.labelKo, "새싹");
  assert.equal(view.dailyUserMatchCap, 3);
  assert.equal(view.dailyMatchesUsed, 1);
});

test("혜택은 items[].titleKo만 연결한다", () => {
  const items = readBenefitItems({
    items: [{ missionId: "m1", titleKo: "출석", bodyKo: "오늘 한 번" }],
    rewardsEnabled: true,
  });
  assert.equal(items[0]?.titleKo, "출석");
});

test("원화 안내는 확인된 키만 읽는다", () => {
  const guide = readKrwInstructions({
    bankName: "국민",
    accountNumber: "123",
    accountHolder: "퍼뜩",
    noticeKo: "입금자명을 맞춰 주세요",
  });
  assert.equal(guide?.bankName, "국민");
  assert.equal(readKrwInstructions({ bank: "국민", account: "123" }), null);
});

test("출금 의도는 금액·주소 변경과 성공에서만 key를 바꾼다", () => {
  assert.equal(shouldRotateWithdrawIntent("amount-change"), true);
  assert.equal(shouldRotateWithdrawIntent("destination-change"), true);
  assert.equal(shouldRotateWithdrawIntent("success"), true);
  assert.equal(shouldRotateWithdrawIntent("timeout-retry"), false);
  assert.equal(shouldRotateWithdrawIntent("other-error"), false);
  assert.equal(withdrawLockedMismatch("1", "Txxx", "1", "Txxx"), false);
  assert.equal(withdrawLockedMismatch("2", "Txxx", "1", "Txxx"), true);
});
