/** 확정 계약 키만 읽는다. 별칭 fallback·부호 추측을 늘리지 않는다. */

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

export type JournalDisplay = {
  displayKey: string | null;
  labelKo: string | null;
  direction: "debit" | "credit" | "neutral" | null;
  customerVisible: boolean;
  amountUsdt: string | null;
  amountSource: string | null;
  multiEntryPolicy: string | null;
  status: string | null;
};

export type JournalRow = {
  key: string;
  journalType: string | null;
  createdAt: string;
  display: JournalDisplay | null;
};

function readDisplay(value: unknown): JournalDisplay | null {
  const row = asRecord(value);
  if (!row) return null;
  const direction =
    row.direction === "debit" || row.direction === "credit" || row.direction === "neutral" ? row.direction : null;
  const amountUsdt = typeof row.amountUsdt === "string" && row.amountUsdt.trim() ? row.amountUsdt.trim() : null;
  return {
    displayKey: readString(row.displayKey),
    labelKo: readString(row.labelKo),
    direction,
    customerVisible: row.customerVisible === true,
    amountUsdt,
    amountSource: readString(row.amountSource),
    multiEntryPolicy: readString(row.multiEntryPolicy),
    status: readString(row.status),
  };
}

export function readJournals(data: unknown): JournalRow[] {
  const row = asRecord(data);
  const items = row && Array.isArray(row.items) ? row.items : [];
  const out: JournalRow[] = [];
  for (const [index, item] of items.entries()) {
    const journal = asRecord(item);
    if (!journal) continue;
    const display = readDisplay(journal.display);
    if (display && display.customerVisible === false) continue;
    out.push({
      key: readString(journal.id) || `journal-${index}`,
      journalType: readString(journal.journalType),
      createdAt: readString(journal.createdAt) || "",
      display,
    });
  }
  return out;
}

/** display.amountUsdt만 보여 준다. entries·부호·화살표는 추측하지 않는다. */
export function journalSingleAmount(row: JournalRow): string | null {
  return row.display?.amountUsdt ?? null;
}

export const KYC_MAX_FILE_BYTES = 5_242_880;
export const KYC_MAX_TOTAL_BYTES = 8_388_608;
export const KYC_FILE_ACCEPT =
  "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

const KYC_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]);
const KYC_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);

function kycExt(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index).toLowerCase() : "";
}

export function kycFileIssue(file: File | null): "KYC_FILE_REQUIRED" | "KYC_FILE_TOO_LARGE" | "KYC_FILE_TYPE" | null {
  if (!file) return "KYC_FILE_REQUIRED";
  if (file.size > KYC_MAX_FILE_BYTES) return "KYC_FILE_TOO_LARGE";
  const mime = file.type.trim().toLowerCase();
  const ext = kycExt(file.name);
  if (mime && !KYC_MIME.has(mime)) return "KYC_FILE_TYPE";
  if (ext && !KYC_EXT.has(ext)) return "KYC_FILE_TYPE";
  if (!mime && !ext) return "KYC_FILE_TYPE";
  return null;
}

export function kycPairIssue(
  idDoc: File | null,
  selfie: File | null,
): "KYC_ID_SELFIE_REQUIRED" | "KYC_FILE_TOO_LARGE" | "KYC_TOTAL_TOO_LARGE" | "KYC_FILE_TYPE" | null {
  if (!idDoc || !selfie) return "KYC_ID_SELFIE_REQUIRED";
  const first = kycFileIssue(idDoc);
  if (first === "KYC_FILE_TOO_LARGE" || first === "KYC_FILE_TYPE") return first;
  const second = kycFileIssue(selfie);
  if (second === "KYC_FILE_TOO_LARGE" || second === "KYC_FILE_TYPE") return second;
  if (idDoc.size + selfie.size > KYC_MAX_TOTAL_BYTES) return "KYC_TOTAL_TOO_LARGE";
  return null;
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

export type PublishedCmsItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  imageUrl: string | null;
  publishedAt: string | null;
};

/** 손님 CMS는 published 만. 초안·종료·가짜 카드를 만들지 않는다. */
export function readPublishedCms(data: unknown): PublishedCmsItem[] {
  const row = asRecord(data);
  const items = row && Array.isArray(row.items) ? row.items : [];
  const out: PublishedCmsItem[] = [];
  for (const item of items) {
    const card = asRecord(item);
    if (!card) continue;
    if (card.status != null && card.status !== "published") continue;
    const id = readString(card.id);
    const title = readString(card.title);
    if (!id || !title) continue;
    out.push({
      id,
      kind: readString(card.kind) || "",
      title,
      body: typeof card.body === "string" ? card.body : "",
      imageUrl: readString(card.imageUrl),
      publishedAt: readString(card.publishedAt),
    });
  }
  return out;
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
