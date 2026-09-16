import assert from "node:assert/strict";
import { test } from "node:test";
import {
  googleAuthorizeUrl,
  isAllowedAuthorizeUrl,
  journalSingleAmount,
  kycFileIssue,
  kycPairIssue,
  needsCompleteProfile,
  readBenefitItems,
  readJournals,
  readKycReason,
  readKycUiStatus,
  readDepositAddress,
  readKrwInstructions,
  readMembershipView,
  readPublishedCms,
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

test("원장은 items[].display만 읽고 숨김·부호를 추측하지 않는다", () => {
  const rows = readJournals({
    items: [
      {
        id: "j1",
        journalType: "deposit_usdt",
        createdAt: "2026-09-09T00:00:00.000Z",
        display: {
          displayKey: "ledger.deposit_usdt",
          labelKo: "USDT 입금",
          direction: "credit",
          customerVisible: true,
          amountUsdt: "10.000000",
          amountSource: "user_bucket_net",
          multiEntryPolicy: "single",
          status: "posted",
        },
        entries: [{ id: "e1", direction: "credit", amountUsdt: "99.000000", bucket: "principal" }],
      },
      {
        id: "j2",
        journalType: "settlement",
        createdAt: "2026-09-09T01:00:00.000Z",
        display: {
          displayKey: "ledger.settlement",
          labelKo: "정산",
          direction: "credit",
          customerVisible: true,
          amountUsdt: "3.000000",
          amountSource: "user_bucket_net",
          multiEntryPolicy: "sum_user_bucket_signed",
          status: "posted",
        },
        entries: [
          { id: "e2", direction: "debit", amountUsdt: "3.000000", bucket: "locked" },
          { id: "e3", direction: "credit", amountUsdt: "3.000000", bucket: "profit" },
        ],
      },
      {
        id: "j-hidden",
        journalType: "admin_adjust",
        createdAt: "2026-09-09T01:30:00.000Z",
        display: {
          displayKey: "ledger.admin_adjust",
          labelKo: "숨김",
          direction: "neutral",
          customerVisible: false,
          amountUsdt: "1.000000",
          amountSource: "unknown",
          multiEntryPolicy: "single",
          status: "posted",
        },
      },
      {
        id: "j-unknown",
        journalType: null,
        createdAt: "2026-09-09T02:00:00.000Z",
        display: {
          displayKey: "ledger.unknown",
          labelKo: "확인 필요",
          direction: "neutral",
          customerVisible: true,
          amountUsdt: "0.100000",
          amountSource: "unknown",
          multiEntryPolicy: "single",
          status: "posted",
        },
      },
      {
        id: "j-bare",
        journalType: "fee",
        createdAt: "2026-09-09T03:00:00.000Z",
        entries: [{ id: "e9", direction: "debit", amountUsdt: "0.500000", bucket: "profit" }],
      },
    ],
    total: 5,
    limit: 20,
    offset: 0,
  });
  assert.equal(rows.length, 4);
  assert.equal(rows[0].display?.labelKo, "USDT 입금");
  assert.equal(journalSingleAmount(rows[0]), "10.000000");
  assert.equal(journalSingleAmount(rows[1]), "3.000000");
  assert.equal(rows[2].display?.labelKo, "확인 필요");
  assert.equal(journalSingleAmount(rows[3]), null);
});

test("KYC 클라이언트는 MIME·확장자·크기만 본다", () => {
  const png = new File([new Uint8Array(12)], "a.png", { type: "image/png" });
  const face = new File([new Uint8Array(12)], "b.png", { type: "image/png" });
  assert.equal(kycFileIssue(png), null);
  assert.equal(kycPairIssue(png, face), null);
  assert.equal(kycFileIssue(new File([new Uint8Array(5_242_881)], "a.png", { type: "image/png" })), "KYC_FILE_TOO_LARGE");
  assert.equal(kycFileIssue(new File([new Uint8Array(12)], "a.pdf", { type: "application/pdf" })), "KYC_FILE_TYPE");
  assert.equal(kycPairIssue(null, face), "KYC_ID_SELFIE_REQUIRED");
  const huge = new File([new Uint8Array(4_200_000)], "a.png", { type: "image/png" });
  assert.equal(kycPairIssue(huge, huge), "KYC_TOTAL_TOO_LARGE");
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

test("입금 주소는 trc20Address와 qrPayload만 읽는다", () => {
  const found = readDepositAddress({
    userId: "00000000-0000-4000-8000-00000000000a",
    trc20Address: "TQaDepositAddressForFixture0000001",
    derivationIndex: 0,
    qrPayload: "TQaDepositAddressForFixture0000001",
    createdAt: "2026-09-10T00:00:00.000Z",
  });
  assert.equal(found?.address, "TQaDepositAddressForFixture0000001");
  assert.equal(found?.qrPayload, "TQaDepositAddressForFixture0000001");
  assert.equal(readDepositAddress({ address: "TlegacyAliasMustNotWin00000000001" }), null);
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

test("QR은 서버 주소 문자열만 인코딩한다", async () => {
  const { default: QRCode } = await import("qrcode");
  const payload = "TQaDepositAddressForFixture0000001";
  const url = await QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: 192 });
  assert.match(url, /^data:image\/png;base64,/);
  const created = QRCode.create(payload);
  assert.ok(created.modules.size > 0);
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

test("손님 CMS는 게시된 글만 읽고 초안을 채우지 않는다", () => {
  const items = readPublishedCms({
    items: [
      { id: "n1", kind: "notice", status: "published", title: "운영 공지", body: "본문", imageUrl: null, publishedAt: "2026-09-16T00:00:00.000Z" },
      { id: "n2", kind: "notice", status: "draft", title: "초안", body: "숨김", imageUrl: null, publishedAt: null },
      { kind: "notice", status: "published", title: "번호 없음", body: "" },
    ],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0]?.id, "n1");
  assert.equal(items[0]?.title, "운영 공지");
  assert.equal(readPublishedCms({ items: [] }).length, 0);
  assert.equal(readPublishedCms({ cards: [{ title: "가짜" }] }).length, 0);
});
