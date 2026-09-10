/** 백엔드 4c6f22f에서 확인한 요청·응답 키만 읽는다. 별칭 fallback을 늘리지 않는다. */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

export function isAllowedAuthorizeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function googleAuthorizeUrl(data: unknown): string | null {
  const row = asRecord(data);
  if (!row) return null;
  const value = readString(row.authorizeUrl);
  if (!value || !isAllowedAuthorizeUrl(value)) return null;
  return value;
}

/** true=필수정보 필요, false=완료, null=필드 없음(추측하지 않음) */
export function needsCompleteProfile(data: unknown): boolean | null {
  const row = asRecord(data);
  if (!row) return null;
  if (row.onboarding === "incomplete") return true;
  if (row.onboarding === "complete") return false;
  const nested = asRecord(row.session);
  const stage = readString(row.onboardingStage) || (nested ? readString(nested.onboardingStage) : null);
  if (stage === "B_complete") return false;
  if (stage === "A" || stage === "B_incomplete") return true;
  return null;
}

export const STAGE_B_PHONE_E164 = /^\+[1-9][0-9]{7,14}$/;
export const STAGE_B_NAME_MIN = 2;
export const STAGE_B_NAME_MAX = 40;

export function isStageBPhoneE164(value: string): boolean {
  return STAGE_B_PHONE_E164.test(value);
}

export function isStageBDisplayName(value: string): boolean {
  const name = value.trim();
  return name.length >= STAGE_B_NAME_MIN && name.length <= STAGE_B_NAME_MAX;
}

export type JournalEntryView = {
  direction: "debit" | "credit" | null;
  amountUsdt: string | null;
  bucket: string | null;
};

export type JournalRow = {
  key: string;
  journalType: string | null;
  createdAt: string;
  entries: JournalEntryView[];
};

function readEntry(value: unknown): JournalEntryView | null {
  const row = asRecord(value);
  if (!row) return null;
  const direction = row.direction === "debit" || row.direction === "credit" ? row.direction : null;
  const amountUsdt = typeof row.amountUsdt === "string" && row.amountUsdt.trim() ? row.amountUsdt.trim() : null;
  const bucket = readString(row.bucket);
  return { direction, amountUsdt, bucket };
}

export function readJournals(data: unknown): JournalRow[] {
  const row = asRecord(data);
  const items = row && Array.isArray(row.items) ? row.items : [];
  const out: JournalRow[] = [];
  for (const [index, item] of items.entries()) {
    const journal = asRecord(item);
    if (!journal) continue;
    const rawEntries = Array.isArray(journal.entries) ? journal.entries : [];
    const entries = rawEntries.map(readEntry).filter((entry): entry is JournalEntryView => entry != null);
    out.push({
      key: readString(journal.id) || `journal-${index}`,
      journalType: readString(journal.journalType),
      createdAt: readString(journal.createdAt) || "",
      entries,
    });
  }
  return out;
}

/** 한 줄 축약이 안전한 단일 entry만 금액을 보여 준다. 부호·화살표는 호출부가 붙이지 않는다. */
export function journalSingleAmount(row: JournalRow): string | null {
  if (row.entries.length !== 1) return null;
  return row.entries[0].amountUsdt;
}

export type KycUiStatus = "none" | "pending" | "verified" | "rejected";

export function readKycUiStatus(data: unknown): KycUiStatus | null {
  const row = asRecord(data);
  if (!row) return null;
  const status = readString(row.kycStatus);
  if (status === "approved") return "verified";
  if (status === "pending" || status === "none" || status === "rejected") return status;
  return null;
}

export function readKycReason(data: unknown): string {
  const row = asRecord(data);
  return row ? readString(row.rejectReason) || "" : "";
}

export function readKycVerified(data: unknown): boolean {
  return readKycUiStatus(data) === "verified";
}

export type MembershipView = {
  labelKo: string;
  dailyUserMatchCap: number | null;
  dailyMatchesUsed: number | null;
};

export function readMembershipView(data: unknown): MembershipView {
  const row = asRecord(data);
  if (!row) return { labelKo: "", dailyUserMatchCap: null, dailyMatchesUsed: null };
  const cap = row.dailyUserMatchCap;
  const used = row.dailyMatchesUsed;
  return {
    labelKo: readString(row.labelKo) || "",
    dailyUserMatchCap: typeof cap === "number" && Number.isFinite(cap) ? cap : null,
    dailyMatchesUsed: typeof used === "number" && Number.isFinite(used) ? used : null,
  };
}

export type BenefitItemView = {
  missionId: string;
  titleKo: string;
  bodyKo: string;
};

export function readBenefitItems(data: unknown): BenefitItemView[] {
  const row = asRecord(data);
  const items = row && Array.isArray(row.items) ? row.items : [];
  const out: BenefitItemView[] = [];
  for (const item of items) {
    const card = asRecord(item);
    if (!card) continue;
    const titleKo = readString(card.titleKo);
    const bodyKo = readString(card.bodyKo);
    const missionId = readString(card.missionId);
    if (!titleKo || !missionId) continue;
    out.push({ missionId, titleKo, bodyKo: bodyKo || "" });
  }
  return out;
}

export type KrwGuide = {
  bankName: string | null;
  accountNumber: string | null;
  accountHolder: string | null;
  noticeKo: string | null;
};

export type DepositAddressView = {
  address: string;
  qrPayload: string;
  network: string | null;
};

/** UserDepositAddressV1 확정 키만 읽는다. 체인을 추측하지 않는다. */
export function readDepositAddress(data: unknown): DepositAddressView | null {
  const row = asRecord(data);
  if (!row) return null;
  const address = readString(row.trc20Address);
  if (!address) return null;
  return {
    address,
    qrPayload: readString(row.qrPayload) || address,
    network: readString(row.network),
  };
}

export function readKrwInstructions(data: unknown): KrwGuide | null {
  const row = asRecord(data);
  if (!row) return null;
  const bankName = readString(row.bankName);
  const accountNumber = readString(row.accountNumber);
  const accountHolder = readString(row.accountHolder);
  const noticeKo = typeof row.noticeKo === "string" ? row.noticeKo : null;
  if (!bankName && !accountNumber && !accountHolder && !noticeKo) return null;
  return { bankName, accountNumber, accountHolder, noticeKo };
}

export function isKrwConfigNotReady(error: unknown): boolean {
  const text = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  return /CONFIG_NOT_READY/i.test(text);
}

export type WithdrawIntentEvent =
  | "amount-change"
  | "destination-change"
  | "success"
  | "cancel"
  | "timeout-retry"
  | "other-error";

export function shouldRotateWithdrawIntent(event: WithdrawIntentEvent): boolean {
  return event === "amount-change" || event === "destination-change" || event === "success" || event === "cancel";
}

export function withdrawLockedMismatch(
  amount: string,
  destination: string,
  lockedAmount: string,
  lockedDestination: string,
): boolean {
  return amount !== lockedAmount || destination !== lockedDestination;
}
