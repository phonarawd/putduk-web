const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.hiptk.app";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const row = asRecord(value);
  if (!row) return [];
  for (const key of ["items", "data", "rows", "journals", "entries", "buckets", "results"]) {
    if (Array.isArray(row[key])) return row[key] as unknown[];
  }
  return [];
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function pickNumber(row: Record<string, unknown> | null, keys: string[]): number | null {
  if (!row) return null;
  for (const key of keys) {
    const found = readNumber(row[key]);
    if (found != null) return found;
  }
  return null;
}

function pickString(row: Record<string, unknown> | null, keys: string[]): string | null {
  if (!row) return null;
  for (const key of keys) {
    const found = readString(row[key]);
    if (found) return found;
  }
  return null;
}

function nest(row: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  return row ? asRecord(row[key]) : null;
}

function toUserMessage(message: string): string {
  if (/TURNSTILE/i.test(message)) return "지금은 가입과 로그인을 받을 수 없어요. 잠시 뒤 다시 시도해 주세요.";
  if (/AUTH_REQUIRED/i.test(message)) return "로그인이 필요해요.";
  if (/SIGNUP_LINK_INVALID/i.test(message)) return "인증 링크가 올바르지 않아요. 메일 속 링크를 다시 열어 주세요.";
  return message;
}

async function readErrorMessage(res: Response): Promise<string> {
  const fallback = `${res.status} ${res.statusText}`.trim();
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const json = JSON.parse(text) as unknown;
      const row = asRecord(json);
      const message = pickString(row, ["message", "error", "detail"]);
      const raw = Array.isArray(row?.message) ? row.message.map(String).join(" ") : message || text.slice(0, 240);
      return toUserMessage(raw);
    } catch {
      return text.slice(0, 240);
    }
  } catch {
    return fallback;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (init?.body != null && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch (error: unknown) {
    const cause = error instanceof Error ? error.message : "네트워크 오류";
    throw new Error(`요청에 실패했습니다. ${cause}`);
  }

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function login(identifier: string, password: string) {
  return apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export function birthDateFromPrefix(prefix: string): string {
  if (!/^\d{6}$/.test(prefix)) return prefix;
  const yy = Number(prefix.slice(0, 2));
  const year = yy <= 26 ? 2000 + yy : 1900 + yy;
  return `${year}-${prefix.slice(2, 4)}-${prefix.slice(4, 6)}`;
}

export function signup(body: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  declaredName: string;
  birthDate: string;
  gender?: string;
  phone?: string;
  inviteCode?: string;
}) {
  return apiFetch("/api/v1/auth/signup/classic", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function verifyClassicSignup(token: string) {
  return apiFetch("/api/v1/auth/signup/classic/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function startGoogle() {
  return apiFetch<unknown>("/api/v1/auth/oauth/google/start", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function googleCallback(code: string) {
  return apiFetch<unknown>("/api/v1/auth/oauth/google/callback", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function saveProfile(name: string, gender: string, birthPrefix: string) {
  return apiFetch("/api/v1/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({ name, gender, birthPrefix }),
  });
}

export function getSession() {
  return apiFetch<unknown>("/api/v1/auth/session");
}

export function logout() {
  return apiFetch("/api/v1/auth/logout", { method: "POST" });
}

export function googleRedirectUrl(data: unknown): string | null {
  if (typeof data === "string" && data.startsWith("http")) {
    return data;
  }
  const row = asRecord(data);
  if (!row) return null;
  for (const key of ["url", "redirectUrl", "authorizationUrl"]) {
    const value = readString(row[key]);
    if (value && value.startsWith("http")) return value;
  }
  return null;
}

export function needsCompleteProfile(data: unknown): boolean {
  const row = asRecord(data);
  if (!row) return false;
  if (row.needsProfile === true || row.isNewUser === true || row.profileComplete === false) return true;
  const user = nest(row, "user") || nest(row, "session");
  if (user && (user.needsProfile === true || user.profileComplete === false || user.profileCompleted === false)) {
    return true;
  }
  return false;
}

function sessionUser(data: unknown): Record<string, unknown> | null {
  const row = asRecord(data);
  return nest(row, "user") || nest(row, "session") || nest(row, "profile") || row;
}

export function sessionEmail(data: unknown): string {
  const row = asRecord(data);
  if (!row) return "";
  return pickString(row, ["email"]) || pickString(sessionUser(data), ["email"]) || "";
}

export function sessionUsername(data: unknown): string {
  return pickString(sessionUser(data), ["username", "loginId", "handle", "resellerId"]) || "";
}

export function sessionDisplayName(data: unknown): string {
  return pickString(sessionUser(data), ["declaredName", "displayName", "name"]) || "";
}

export function listOpportunities() {
  return apiFetch("/api/v1/opportunities");
}

export function getOpportunity(id: string) {
  return apiFetch(`/api/v1/opportunities/${id}`);
}

export function participateOpportunity(id: string) {
  return apiFetch(`/api/v1/opportunities/${id}/participate`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getHomeRead() {
  return apiFetch<unknown>("/api/v1/me/home-read");
}

export function getTrialState() {
  return apiFetch<unknown>("/api/v1/me/trial-state");
}

export function listTrades() {
  return apiFetch("/api/v1/trades");
}

export function getTrade(id: string) {
  return apiFetch(`/api/v1/trades/${id}`);
}

export function getWalletBuckets() {
  return apiFetch<unknown>("/api/v1/wallet/buckets");
}

export function getHomeMoneyRead() {
  return getHomeRead();
}

export function getMyDepositAddress() {
  return apiFetch<unknown>("/api/v1/wallet/my-deposit-address");
}

export function getKrwDepositInstructions() {
  return apiFetch<unknown>("/api/v1/wallet/krw-deposit-instructions");
}

export function requestKrwDeposit(requestedAmountKrw: number, depositorName: string, idempotencyKey: string) {
  return apiFetch("/api/v1/wallet/krw-deposit-requests", {
    method: "POST",
    body: JSON.stringify({ requestedAmountKrw, depositorName, idempotencyKey }),
  });
}

export function getLedgerJournals() {
  return apiFetch<unknown>("/api/v1/me/ledger/journals");
}

export function requestWithdraw(body: {
  mode: "profit";
  asset: "USDT";
  amountUsdt: number;
  destination: string;
  idempotencyKey: string;
  stepUpToken: string;
}) {
  return apiFetch("/api/v1/wallet/withdraw", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getWithdrawStepUpPolicy() {
  return apiFetch<unknown>("/api/v1/wallet/withdraw/step-up/policy");
}

export function startWithdrawStepUp(method: "pin" | "email_otp") {
  return apiFetch<unknown>("/api/v1/wallet/withdraw/step-up/challenge", {
    method: "POST",
    body: JSON.stringify({ method }),
  });
}

export function verifyWithdrawStepUp(method: "pin" | "email_otp", code: string, challengeId?: string) {
  return apiFetch<unknown>("/api/v1/wallet/withdraw/step-up/verify", {
    method: "POST",
    body: JSON.stringify(challengeId ? { method, code, challengeId } : { method, code }),
  });
}

export function getKycStatus() {
  return apiFetch<unknown>("/api/v1/compliance/kyc/status");
}

export function submitKyc(fields: {
  legalName: string;
  phoneE164: string;
  birthDate: string;
  idDocType: string;
  idDoc: File;
  selfie: File;
}) {
  const body = new FormData();
  body.set("legalName", fields.legalName);
  body.set("phoneE164", fields.phoneE164);
  body.set("birthDate", fields.birthDate);
  body.set("idDocType", fields.idDocType);
  body.set("idDoc", fields.idDoc);
  body.set("selfie", fields.selfie);
  return apiFetch("/api/v1/compliance/kyc/submit", { method: "POST", body });
}

export function getMembership() {
  return apiFetch<unknown>("/api/v1/me/membership");
}

export function getReferralMe() {
  return apiFetch<unknown>("/api/v1/referral/me");
}

export type FeedBucket = "affordable" | "nearMiss" | "lockedHigh";

export type TrialGrantStatus = "active" | "failed_fx" | "none";

export type TrialState = {
  grantStatus: TrialGrantStatus;
  trialPrincipalUsdt: number;
  trialLockedUsdt: number;
  welcomeTargetKrw: number | null;
  grantAmountUsdt: number | null;
  grantAmountKrw: number | null;
  maxParticipations: number | null;
  participationsUsed: number | null;
  participationsRemaining: number | null;
  profitCapKrw: number | null;
  profitCreditedKrw: number | null;
  profitRemainingKrw: number | null;
  trialPrincipalWithdrawable: boolean;
  inviteSlotsGranted: number | null;
  trialEligibleOpportunityIds: string[];
};

export type LiveOpportunity = {
  id: string;
  title: string;
  category: string;
  symbol: string;
  bucket: FeedBucket | null;
  trialEligible: boolean;
  requiredUsdt: number | null;
  requiredKrw: number | null;
  expectedUsdt: number | null;
  expectedKrw: number | null;
  lowMarket: string;
  highMarket: string;
  seats: number | null;
  duration: string;
};

export type MoneyRead = {
  principalUsdt: number;
  principalKrw: number | null;
  lockedUsdt: number | null;
  lockedKrw: number | null;
  profitUsdt: number | null;
  profitKrw: number | null;
  practiceUsdt: number | null;
  practiceKrw: number | null;
  trialPrincipalUsdt: number;
  trialLockedUsdt: number;
  fxKrwPerUsdt: number | null;
};

export function emptyTrial(): TrialState {
  return {
    grantStatus: "none",
    trialPrincipalUsdt: 0,
    trialLockedUsdt: 0,
    welcomeTargetKrw: null,
    grantAmountUsdt: null,
    grantAmountKrw: null,
    maxParticipations: null,
    participationsUsed: null,
    participationsRemaining: null,
    profitCapKrw: null,
    profitCreditedKrw: null,
    profitRemainingKrw: null,
    trialPrincipalWithdrawable: false,
    inviteSlotsGranted: null,
    trialEligibleOpportunityIds: [],
  };
}

function asGrantStatus(value: unknown): TrialGrantStatus {
  return value === "active" || value === "failed_fx" || value === "none" ? value : "none";
}

function asBucket(value: unknown): FeedBucket | null {
  return value === "affordable" || value === "nearMiss" || value === "lockedHigh" ? value : null;
}

function durationFromSec(value: number | null): string {
  if (value == null || value <= 0) return "";
  if (value < 60) return `약 ${Math.round(value)}초`;
  return `약 ${Math.round(value / 60)}분`;
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter((item): item is string => Boolean(item));
}

function isPracticeName(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes("practice") || value.includes("연습");
}

function isTrialName(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes("trial") || value.includes("체험");
}

function isProfitName(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes("profit") || lower.includes("earn") || value.includes("수익");
}

function isLockedName(value: string): boolean {
  const lower = value.toLowerCase();
  return lower.includes("lock") || lower.includes("hold") || value.includes("잠금");
}

function isPrincipalName(value: string): boolean {
  const lower = value.toLowerCase();
  return (lower.includes("principal") || lower.includes("capital") || value.includes("원금") || value.includes("운용")) && !isTrialName(value);
}

function bucketLabel(row: Record<string, unknown>): string {
  return pickString(row, ["name", "label", "type", "kind", "bucket", "code", "id", "asset"]) || "";
}

function bucketKrw(row: Record<string, unknown>): number | null {
  return pickNumber(row, ["amountKrw", "krw", "availableKrw", "balanceKrw"]);
}

function bucketUsdt(row: Record<string, unknown>): number | null {
  const asset = (pickString(row, ["asset", "currency", "unit"]) || "").toUpperCase();
  const usdt = pickNumber(row, ["amountUsdt", "usdt", "availableUsdt", "balanceUsdt"]);
  if (usdt != null) return usdt;
  if (asset.includes("USDT") || asset === "USD") {
    return pickNumber(row, ["available", "balance", "amount", "qty"]);
  }
  return null;
}

function moneyRoot(home: unknown): Record<string, unknown> | null {
  const homeRow = asRecord(home);
  return nest(homeRow, "money") || nest(homeRow, "wallet") || nest(homeRow, "home") || homeRow;
}

export function readTrialState(data: unknown): TrialState {
  const row = asRecord(data);
  const inner = nest(row, "trial") || nest(row, "trialState") || row;
  return {
    grantStatus: asGrantStatus(inner ? inner.grantStatus : null),
    trialPrincipalUsdt: pickNumber(inner, ["trialPrincipalUsdt"]) ?? 0,
    trialLockedUsdt: pickNumber(inner, ["trialLockedUsdt"]) ?? 0,
    welcomeTargetKrw: pickNumber(inner, ["welcomeTargetKrw"]),
    grantAmountUsdt: pickNumber(inner, ["grantAmountUsdt"]),
    grantAmountKrw: pickNumber(inner, ["grantAmountKrw"]),
    maxParticipations: pickNumber(inner, ["maxParticipations"]),
    participationsUsed: pickNumber(inner, ["participationsUsed"]),
    participationsRemaining: pickNumber(inner, ["participationsRemaining"]),
    profitCapKrw: pickNumber(inner, ["profitCapKrw"]),
    profitCreditedKrw: pickNumber(inner, ["profitCreditedKrw"]),
    profitRemainingKrw: pickNumber(inner, ["profitRemainingKrw"]),
    trialPrincipalWithdrawable: inner?.trialPrincipalWithdrawable === true,
    inviteSlotsGranted: pickNumber(inner, ["inviteSlotsGranted"]),
    trialEligibleOpportunityIds: asStringList(inner?.trialEligibleOpportunityIds),
  };
}

function parseFeedItem(item: unknown, trialIds: string[]): LiveOpportunity | null {
  const row = asRecord(item);
  if (!row) return null;
  const id = pickString(row, ["id", "opportunityId"]);
  if (!id) return null;
  const title = pickString(row, ["asset_label", "assetLabel", "title", "label", "name"]) || "기회";
  const asset = (pickString(row, ["asset", "currency", "unit"]) || "").toUpperCase();
  let requiredUsdt = pickNumber(row, ["requiredUsdt", "amountUsdt", "minUsdt", "entryUsdt", "requiredAmountUsdt", "usdtRequired"]);
  let requiredKrw = pickNumber(row, ["requiredKrw", "amountKrw", "minKrw", "entryKrw"]);
  if (requiredUsdt == null && (asset.includes("USDT") || asset === "USD")) {
    requiredUsdt = pickNumber(row, ["required", "amount", "price", "minAmount"]);
  }
  if (requiredKrw == null && (asset.includes("KRW") || asset === "KRW")) {
    requiredKrw = pickNumber(row, ["required", "amount", "price", "minAmount"]);
  }
  const trialEligible =
    row.trial_eligible === true ||
    row.trialEligible === true ||
    trialIds.includes(id);
  return {
    id,
    title,
    category: pickString(row, ["category", "kind", "type"]) || (trialEligible ? "체험" : "기회"),
    symbol: pickString(row, ["symbol", "ticker"]) || title.slice(0, 2),
    bucket: asBucket(row.bucket),
    trialEligible,
    requiredUsdt,
    requiredKrw,
    expectedUsdt: pickNumber(row, ["expectedUsdt", "expectedProfitUsdt", "profitUsdt"]),
    expectedKrw: pickNumber(row, ["expectedKrw", "expectedProfitKrw", "expectedProfitKrwApprox", "profitKrw"]),
    lowMarket: pickString(row, ["lowMarket", "buyVenue", "fromMarket", "partnerLabel", "partner"]) || "",
    highMarket: pickString(row, ["highMarket", "sellVenue", "toMarket"]) || "",
    seats: pickNumber(row, ["seats", "remainingSeats", "openSeats"]),
    duration: pickString(row, ["duration", "eta"]) || durationFromSec(pickNumber(row, ["estimatedDurationSec"])),
  };
}

export function readListFeed(data: unknown, trialIds: string[] = []): LiveOpportunity[] {
  const row = asRecord(data);
  const feed = nest(row, "listFeed") || nest(row, "feed") || row;
  return asList(feed).flatMap((item) => {
    const parsed = parseFeedItem(item, trialIds);
    return parsed ? [parsed] : [];
  });
}

export function readPrincipalUsdt(data: unknown): number {
  const row = asRecord(data);
  const feed = nest(row, "listFeed") || nest(row, "feed") || row;
  return pickNumber(row, ["principalUsdt"]) ?? pickNumber(feed, ["principalUsdt"]) ?? 0;
}

export function readMoney(home: unknown, buckets: unknown, trial?: TrialState | null): MoneyRead {
  const money = moneyRoot(home);
  const trialState = trial ?? emptyTrial();
  const read: MoneyRead = {
    principalUsdt: readPrincipalUsdt(home),
    principalKrw: pickNumber(money, ["principalKrw", "workingPrincipalKrw"]),
    lockedUsdt: pickNumber(money, ["lockedUsdt", "holdUsdt"]),
    lockedKrw: pickNumber(money, ["lockedKrw", "holdKrw"]),
    profitKrw: pickNumber(money, ["profitKrw", "withdrawableProfitKrw", "availableProfitKrw"]),
    profitUsdt: pickNumber(money, ["profitUsdt", "availableProfitUsdt", "withdrawableUsdt", "usdtProfit"]),
    practiceUsdt: pickNumber(money, ["practiceUsdt"]),
    practiceKrw: pickNumber(money, ["practiceKrw", "practice"]),
    trialPrincipalUsdt: trialState.trialPrincipalUsdt,
    trialLockedUsdt: trialState.trialLockedUsdt,
    fxKrwPerUsdt: pickNumber(money, ["fxKrwPerUsdt", "usdtKrw", "fxRate", "krwPerUsdt"]),
  };

  for (const item of asList(buckets)) {
    const row = asRecord(item);
    if (!row) continue;
    const label = bucketLabel(row);
    const krw = bucketKrw(row);
    const usdt = bucketUsdt(row);
    if (isTrialName(label)) {
      continue;
    }
    if (isPracticeName(label)) {
      if (read.practiceUsdt == null && usdt != null) read.practiceUsdt = usdt;
      if (read.practiceKrw == null && krw != null) read.practiceKrw = krw;
      continue;
    }
    if (isProfitName(label)) {
      if (read.profitKrw == null && krw != null) read.profitKrw = krw;
      if (read.profitUsdt == null && usdt != null) read.profitUsdt = usdt;
      continue;
    }
    if (isLockedName(label)) {
      if (read.lockedKrw == null && krw != null) read.lockedKrw = krw;
      if (read.lockedUsdt == null && usdt != null) read.lockedUsdt = usdt;
      continue;
    }
    if (isPrincipalName(label)) {
      if (read.principalUsdt === 0 && usdt != null) read.principalUsdt = usdt;
      if (read.principalKrw == null && krw != null) read.principalKrw = krw;
    }
  }

  return read;
}

export function hasMoneyValues(money: MoneyRead): boolean {
  return (
    money.principalUsdt !== 0 ||
    money.principalKrw != null ||
    money.lockedUsdt != null ||
    money.lockedKrw != null ||
    money.profitKrw != null ||
    money.practiceUsdt != null ||
    money.practiceKrw != null ||
    money.profitUsdt != null ||
    money.trialPrincipalUsdt !== 0 ||
    money.trialLockedUsdt !== 0
  );
}

export function readDepositAddress(data: unknown): { address: string; network: string | null } | null {
  const row = asRecord(data);
  if (!row) {
    if (typeof data === "string" && data.trim()) return { address: data.trim(), network: null };
    return null;
  }
  const address =
    pickString(row, ["address", "depositAddress", "usdtAddress", "tronAddress"]) ||
    pickString(nest(row, "deposit"), ["address"]) ||
    pickString(nest(row, "usdt"), ["address"]);
  if (!address) return null;
  return {
    address,
    network: pickString(row, ["network", "chain", "asset"]) || pickString(nest(row, "usdt"), ["network"]),
  };
}

export function readKrwInstructions(data: unknown): { bank: string | null; account: string | null; holder: string | null; memo: string | null } | null {
  const row = asRecord(data);
  if (!row) return null;
  const inner = nest(row, "instructions") || nest(row, "account") || row;
  const bank = pickString(inner, ["bank", "bankName", "bankNameKo"]);
  const account = pickString(inner, ["account", "accountNumber", "accountNo"]);
  const holder = pickString(inner, ["holder", "accountHolder", "depositorName", "name"]);
  const memo = pickString(inner, ["memo", "message", "guide", "copy"]);
  if (!bank && !account && !holder && !memo) return null;
  return { bank, account, holder, memo };
}

export type JournalRow = {
  key: string;
  type: string;
  amountKrw: number | null;
  amountUsdt: number | null;
  status: string;
  date: string;
};

export function readJournals(data: unknown): JournalRow[] {
  return asList(data).flatMap((item, index) => {
    const row = asRecord(item);
    if (!row) return [];
    const amountKrw = pickNumber(row, ["amountKrw", "krw", "amount"]);
    const amountUsdt = pickNumber(row, ["amountUsdt", "usdt"]);
    return [
      {
        key: pickString(row, ["id", "journalId", "key"]) || `journal-${index}`,
        type: pickString(row, ["type", "kind", "title", "label"]) || "기록",
        amountKrw,
        amountUsdt,
        status: pickString(row, ["status", "state"]) || "",
        date: pickString(row, ["createdAt", "occurredAt", "date", "at"]) || "",
      },
    ];
  });
}

export function readKycVerified(data: unknown): boolean {
  const row = asRecord(data);
  if (!row) return false;
  const status = (pickString(row, ["status", "kycStatus", "state"]) || "").toLowerCase();
  return status === "verified" || status === "approved" || row.verified === true;
}

export function readStepUpMethod(data: unknown): "pin" | "email_otp" | null {
  const row = asRecord(data);
  const priority = row && Array.isArray(row.priority) ? row.priority.map(String) : [];
  if (priority.includes("pin")) return "pin";
  if (priority.includes("email_otp")) return "email_otp";
  return null;
}

export function readChallengeId(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["challengeId", "id"]) || pickString(nest(row, "challenge"), ["id", "challengeId"]);
}

export function readStepUpToken(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["stepUpToken", "token"]) || pickString(nest(row, "stepUp"), ["token", "stepUpToken"]);
}

export function readMembershipCap(data: unknown): number | null {
  const row = asRecord(data);
  const inner = nest(row, "membership") || row;
  return pickNumber(inner, ["dailyUserMatchCap", "remainingDailyMatches", "dailyMatchCap", "remaining"]);
}

export function readReferral(data: unknown): { code: string | null; link: string | null } | null {
  const row = asRecord(data);
  if (!row) return null;
  const inner = nest(row, "referral") || row;
  const code = pickString(inner, ["code", "referralCode", "inviteCode"]);
  const link = pickString(inner, ["link", "referralLink", "url", "inviteUrl"]);
  if (!code && !link) return null;
  return { code, link };
}

export function toE164(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("82") && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
}
