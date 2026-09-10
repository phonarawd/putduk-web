export {
  googleAuthorizeUrl,
  readDepositAddress,
  type DepositAddressView,
  isKrwConfigNotReady,
  journalSingleAmount,
  kycFileIssue,
  kycPairIssue,
  KYC_FILE_ACCEPT,
  KYC_MAX_FILE_BYTES,
  KYC_MAX_TOTAL_BYTES,
  needsCompleteProfile,
  readBenefitItems,
  readJournals,
  readKycReason,
  readKycUiStatus,
  readKycVerified,
  readKrwInstructions,
  readMembershipView,
  shouldRotateWithdrawIntent,
  withdrawLockedMismatch,
  type BenefitItemView,
  type JournalDisplay,
  type JournalRow,
  type KycUiStatus,
  type MembershipView,
} from "./contract-readers";

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

function withSnake(keys: string[]): string[] {
  const out: string[] = [];
  for (const key of keys) {
    out.push(key);
    const snake = key.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
    if (snake !== key) out.push(snake);
  }
  return out;
}

function nest(row: Record<string, unknown> | null, key: string): Record<string, unknown> | null {
  return row ? asRecord(row[key]) : null;
}

function pickNumberFrom(rows: Array<Record<string, unknown> | null>, keys: string[]): number | null {
  const aliases = withSnake(keys);
  for (const row of rows) {
    const found = pickNumber(row, aliases);
    if (found != null) return found;
  }
  return null;
}

function pickStringFrom(rows: Array<Record<string, unknown> | null>, keys: string[]): string | null {
  const aliases = withSnake(keys);
  for (const row of rows) {
    const found = pickString(row, aliases);
    if (found) return found;
  }
  return null;
}

export function mergeApiRows(...values: unknown[]): Record<string, unknown> | null {
  const out: Record<string, unknown> = {};
  let any = false;
  for (const value of values) {
    const row = asRecord(value);
    if (!row) continue;
    any = true;
    for (const [key, item] of Object.entries(row)) {
      if (item !== undefined) out[key] = item;
    }
  }
  return any ? out : null;
}

const AUTH_NO_REFRESH = new Set([
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/signup/classic",
  "/api/v1/auth/signup/classic/verify",
  "/api/v1/auth/find-id",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/complete",
  "/api/v1/auth/email/resend",
  "/api/v1/auth/oauth/google/start",
  "/api/v1/auth/oauth/google/callback",
  "/api/v1/auth/oauth/google/complete",
]);

export class ApiError extends Error {
  readonly code: string;
  readonly pendingToken: string | null;
  readonly status: number;

  constructor(message: string, extras?: { code?: string; pendingToken?: string | null; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = extras?.code || message;
    this.pendingToken = extras?.pendingToken ?? null;
    this.status = extras?.status ?? 0;
  }
}

export function readTermsPending(error: unknown): string | null {
  return error instanceof ApiError && error.code === "TERMS_REQUIRED" ? error.pendingToken : null;
}

type ApiInit = RequestInit & { skipRefresh?: boolean };

function asImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("data:image")) return value;
  if (value.startsWith("https://") || value.startsWith("http://") || value.startsWith("/")) return value;
  return null;
}

function pickImageUrl(row: Record<string, unknown> | null): string | null {
  const keys = withSnake(["imageUrl", "artworkUrl", "svgUrl", "thumbnailUrl", "mediaUrl", "cardImageUrl", "image"]);
  const direct = asImageUrl(pickString(row, keys));
  if (direct) return direct;
  for (const key of ["card", "media", "artwork", "image"]) {
    const found = asImageUrl(pickString(nest(row, key), keys));
    if (found) return found;
  }
  return null;
}

function extractErrorToken(row: Record<string, unknown> | null, text: string): string {
  const code = pickString(row, ["code", "errorCode"]);
  if (code) return code;
  if (row && Array.isArray(row.message)) {
    const parts = row.message.map(String);
    const token = parts.find((part) => /^[A-Z][A-Z0-9_]+$/.test(part));
    if (token) return token;
    return parts.join(" ");
  }
  return pickString(row, ["message", "error", "detail"]) || text;
}

function toUserMessage(message: string, status?: number): string {
  if (/AUTH_REQUIRED|UNAUTHORIZED|INVALID_TOKEN|TOKEN_EXPIRED/i.test(message)) return "로그인이 필요해요.";
  if (/SIGNUP_LINK_INVALID/i.test(message)) return "인증 링크가 올바르지 않아요. 메일 속 링크를 다시 열어 주세요.";
  if (/INVALID_CREDENTIAL|INVALID_PASSWORD|LOGIN_FAILED|BAD_CREDENTIAL/i.test(message)) {
    return "입력한 정보를 다시 확인해 주세요.";
  }
  if (/FORBIDDEN|ACCESS_DENIED/i.test(message)) return "이 작업을 할 수 없어요. 다시 로그인해 주세요.";
  if (/NOT_FOUND/i.test(message)) return "아직 준비 중인 기능이에요.";
  if (status === 401) return "로그인이 필요해요.";
  if (status === 403) return "이 작업을 할 수 없어요. 다시 로그인해 주세요.";
  if (status === 404) return "아직 준비 중인 기능이에요.";
  if (status === 429) return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  if (status != null && status >= 500) return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
  if (/unauthorized|forbidden|not found|internal server|bad request|network error|request failed|invalid token|api error|timeout/i.test(message)) {
    return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
  }
  return message;
}

async function readApiError(res: Response): Promise<ApiError> {
  try {
    const text = await res.text();
    if (!text) return new ApiError(toUserMessage("", res.status), { status: res.status });
    try {
      const json = JSON.parse(text) as unknown;
      const row = asRecord(json);
      const raw = extractErrorToken(row, text);
      const pendingToken = row ? readString(row.pendingToken) : null;
      const code = /^[A-Z][A-Z0-9_]+$/.test(raw) ? raw : "";
      const message = code || toUserMessage(raw, res.status);
      return new ApiError(message, { code: code || message, pendingToken, status: res.status });
    } catch {
      const trimmed = text.trim();
      if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return new ApiError(trimmed, { code: trimmed, status: res.status });
      return new ApiError(toUserMessage(text, res.status), { status: res.status });
    }
  } catch {
    return new ApiError(toUserMessage("", res.status), { status: res.status });
  }
}

const getInflight = new Map<string, Promise<unknown>>();

async function apiFetchNetwork<T>(path: string, init?: ApiInit): Promise<T> {
  const { skipRefresh, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  const isForm = typeof FormData !== "undefined" && requestInit.body instanceof FormData;
  if (requestInit.body != null && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...requestInit,
      credentials: "include",
      cache: "no-store",
      headers,
    });
  } catch {
    throw new Error("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.");
  }

  if (res.status === 401 && !skipRefresh && !AUTH_NO_REFRESH.has(path)) {
    try {
      await apiFetch("/api/v1/auth/refresh", { method: "POST", skipRefresh: true });
      return apiFetch<T>(path, { ...init, skipRefresh: true });
    } catch {
      /* 원래 거절을 보여 준다 */
    }
  }

  if (!res.ok) {
    throw await readApiError(res);
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

export function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const joinKey = method === "GET" && init?.body == null ? `${path}::${init?.skipRefresh ? "1" : "0"}` : "";
  if (joinKey) {
    const existing = getInflight.get(joinKey);
    if (existing) return existing as Promise<T>;
  }

  const pending = apiFetchNetwork<T>(path, init).finally(() => {
    if (joinKey) getInflight.delete(joinKey);
  });
  if (joinKey) getInflight.set(joinKey, pending);
  return pending;
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idemp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function login(identifier: string, password: string, turnstileToken?: string) {
  return apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: identifier.trim(),
      password,
      ...(turnstileToken ? { turnstileToken } : {}),
    }),
  });
}

export function birthDateFromPrefix(prefix: string): string {
  if (!/^\d{6}$/.test(prefix)) return prefix;
  const yy = Number(prefix.slice(0, 2));
  const year = yy <= 26 ? 2000 + yy : 1900 + yy;
  return `${year}-${prefix.slice(2, 4)}-${prefix.slice(4, 6)}`;
}

export function isIsoDate(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const birth = new Date(year, month - 1, day);
  return birth.getFullYear() === year && birth.getMonth() === month - 1 && birth.getDate() === day;
}

export function isAdultBirthDate(isoDate: string, minAge = 19): boolean {
  if (!isIsoDate(isoDate)) return false;
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age >= minAge;
}

export function signup(body: {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  declaredName: string;
  birthDate: string;
  turnstileToken?: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  marketingConsent?: boolean;
  referralCode?: string;
  phoneE164?: string;
}) {
  return apiFetch("/api/v1/auth/signup/classic", {
    method: "POST",
    body: JSON.stringify({
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      password: body.password,
      passwordConfirm: body.passwordConfirm,
      declaredName: body.declaredName.trim(),
      birthDate: body.birthDate,
      ...(body.turnstileToken ? { turnstileToken: body.turnstileToken } : {}),
      termsAcceptedAt: body.termsAcceptedAt,
      privacyAcceptedAt: body.privacyAcceptedAt,
      ...(body.marketingConsent === true ? { marketingConsent: true } : {}),
      ...(body.referralCode ? { referralCode: body.referralCode } : {}),
      ...(body.phoneE164 ? { phoneE164: body.phoneE164 } : {}),
    }),
  });
}

export function resendSignupEmail(email: string, turnstileToken?: string) {
  return apiFetch("/api/v1/auth/email/resend", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      ...(turnstileToken ? { turnstileToken } : {}),
    }),
  });
}

export function findId(email: string, turnstileToken?: string) {
  return apiFetch("/api/v1/auth/find-id", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      ...(turnstileToken ? { turnstileToken } : {}),
    }),
  });
}

export function requestPasswordReset(email: string, turnstileToken?: string) {
  return apiFetch("/api/v1/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      ...(turnstileToken ? { turnstileToken } : {}),
    }),
  });
}

export function completePasswordReset(token: string, newPassword: string) {
  return apiFetch("/api/v1/auth/password-reset/complete", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
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

export function googleCallback(code: string, state: string) {
  return apiFetch<unknown>("/api/v1/auth/oauth/google/callback", {
    method: "POST",
    body: JSON.stringify({ code, state }),
  });
}

const googleCallbackMemory = new Map<string, Promise<unknown>>();

export function googleCallbackOnce(code: string, state: string) {
  const key = `${code}:${state}`;
  const existing = googleCallbackMemory.get(key);
  if (existing) return existing;
  const request = googleCallback(code, state);
  googleCallbackMemory.set(key, request);
  return request;
}

export function googleComplete(fields: {
  pendingToken: string;
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  marketingConsent?: boolean;
  referralCode?: string;
}) {
  return apiFetch<unknown>("/api/v1/auth/oauth/google/complete", {
    method: "POST",
    body: JSON.stringify({
      pendingToken: fields.pendingToken,
      termsAcceptedAt: fields.termsAcceptedAt,
      privacyAcceptedAt: fields.privacyAcceptedAt,
      ...(fields.marketingConsent === true ? { marketingConsent: true } : {}),
      ...(fields.referralCode ? { referralCode: fields.referralCode } : {}),
    }),
  });
}

export function saveProfile(fields: {
  displayName: string;
  birthDate: string;
  phoneE164: string;
  email?: string;
}) {
  return apiFetch("/api/v1/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({
      displayName: fields.displayName,
      birthDate: fields.birthDate,
      phoneE164: fields.phoneE164,
      ...(fields.email ? { email: fields.email } : {}),
    }),
  });
}

export function saveProfileGender(gender: "male" | "female") {
  return apiFetch<unknown>("/api/v1/auth/profile", {
    method: "PATCH",
    body: JSON.stringify({ gender }),
  });
}

export function readProfileGender(data: unknown): "" | "male" | "female" {
  const row = asRecord(data);
  const value = row?.gender;
  if (value === "male" || value === "female") return value;
  return "";
}

export function getSession() {
  return apiFetch<unknown>("/api/v1/auth/session");
}

export function logout() {
  return apiFetch("/api/v1/auth/logout", { method: "POST" });
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

export function sessionUserId(data: unknown): string {
  return pickString(sessionUser(data), ["id", "userId", "uuid"]) || "";
}

export function sessionIssuedAt(data: unknown): string {
  return pickString(sessionUser(data), ["issuedAt", "cardIssuedAt"]) || "";
}

export function sessionDisplayName(data: unknown): string {
  return pickString(sessionUser(data), ["declaredName", "displayName", "name"]) || "";
}

export function sessionGender(data: unknown): "" | "male" | "female" {
  const row = asRecord(data);
  const nested = sessionUser(data);
  const value = row?.gender ?? nested?.gender;
  if (value === "male" || value === "female") return value;
  return "";
}

export function listOpportunities() {
  return apiFetch("/api/v1/opportunities");
}

export function getOpportunity(id: string) {
  return apiFetch(`/api/v1/opportunities/${id}`);
}

export function preflightOpportunity(id: string) {
  return apiFetch<unknown>(`/api/v1/opportunities/${id}/preflight`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function participateOpportunity(
  id: string,
  body: {
    opportunityId: string;
    amountUsdt: string;
    pricingVersion: number;
    minProfitUsdt: string;
    idempotencyKey: string;
    preflightToken: string;
  },
) {
  return apiFetch(`/api/v1/opportunities/${id}/participate`, {
    method: "POST",
    body: JSON.stringify({
      opportunityId: body.opportunityId,
      amountUsdt: body.amountUsdt,
      pricingVersion: body.pricingVersion,
      minProfitUsdt: body.minProfitUsdt,
      idempotencyKey: body.idempotencyKey,
      preflightToken: body.preflightToken,
    }),
  });
}

export function getHomeRead() {
  return apiFetch<unknown>("/api/v1/me/home-read");
}

export function getHomeMoneyRead() {
  return apiFetch<unknown>("/api/v1/me/home-money-read");
}

export function approxCurrentFx(body: {
  principalUsdt?: string;
  withdrawableProfitUsdt?: string;
  expectedProfitUsdt?: string;
}) {
  const payload: Record<string, string> = {};
  if (body.principalUsdt) payload.principalUsdt = body.principalUsdt;
  if (body.withdrawableProfitUsdt) payload.withdrawableProfitUsdt = body.withdrawableProfitUsdt;
  if (body.expectedProfitUsdt) payload.expectedProfitUsdt = body.expectedProfitUsdt;
  return apiFetch<unknown>("/api/v1/me/current-fx/approx", {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function executeTradeTick(id: string) {
  return apiFetch<unknown>(`/api/v1/trades/${id}/execute-tick`, { method: "POST" });
}

export function getWalletBuckets() {
  return apiFetch<unknown>("/api/v1/wallet/buckets");
}

export function readPreflightToken(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["preflightToken"]) || pickString(nest(row, "preflight"), ["preflightToken"]);
}

export function readParticipateTradeId(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["tradeId"]) || pickString(nest(row, "trade"), ["tradeId", "id"]);
}

export function readFoundUsername(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["username"]) || pickString(sessionUser(data), ["username"]);
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

export function getBenefits() {
  return apiFetch<unknown>("/api/v1/me/benefits");
}

export function getReferralMe() {
  return apiFetch<unknown>("/api/v1/referral/me");
}

export type PeotteokChatDone = {
  conversationId: string | null;
  answerText: string;
  deepLink: string | null;
  degraded: boolean;
};

export function readPeotteokDone(data: unknown): PeotteokChatDone {
  const row = asRecord(data);
  return {
    conversationId: pickString(row, ["conversation_id", "conversationId"]),
    answerText: pickString(row, ["answer_text", "answerText"]) || "",
    deepLink: pickString(row, ["deep_link", "deepLink"]),
    degraded: row?.degraded === true,
  };
}

export function readPeotteokConversationId(data: unknown): string | null {
  return pickString(asRecord(data), ["conversation_id", "conversationId"]);
}

type PeotteokSseHandlers = {
  onMeta?: (data: unknown) => void;
  onChunk?: (text: string) => void;
  onDone?: (data: unknown) => void;
};

function dispatchPeotteokSse(part: string, handlers: PeotteokSseHandlers): "ok" | "done" | "fail" {
  const lines = part.split("\n");
  let event = "message";
  let data = "";
  for (const line of lines) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return "ok";
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return "fail";
  }
  if (event === "meta") {
    handlers.onMeta?.(parsed);
    return "ok";
  }
  if (event === "chunk") {
    const text = pickString(asRecord(parsed), ["text"]) || "";
    if (text) handlers.onChunk?.(text);
    return "ok";
  }
  if (event === "done") {
    handlers.onDone?.(parsed);
    return "done";
  }
  if (event === "error") return "fail";
  return "ok";
}

export async function streamPeotteokChat(input: {
  text: string;
  conversationId?: string;
  signal?: AbortSignal;
  onMeta?: (data: unknown) => void;
  onChunk?: (text: string) => void;
  onDone?: (data: unknown) => void;
}): Promise<void> {
  const body: Record<string, unknown> = { text: input.text, stream: true };
  if (input.conversationId) body.conversationId = input.conversationId;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/me/peotteok/chat`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: input.signal,
    });
  } catch (error) {
    if (input.signal?.aborted) return;
    throw error instanceof Error && error.name === "AbortError"
      ? error
      : new Error("연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요.");
  }

  if (!res.ok) {
    throw await readApiError(res);
  }
  if (!res.body) {
    throw new Error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }

  const handlers: PeotteokSseHandlers = {
    onMeta: input.onMeta,
    onChunk: input.onChunk,
    onDone: input.onDone,
  };
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let sawDone = false;

  const take = (chunk: string): boolean => {
    buf += chunk;
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const status = dispatchPeotteokSse(part, handlers);
      if (status === "fail") return false;
      if (status === "done") {
        sawDone = true;
        return true;
      }
    }
    return true;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (buf.trim()) {
          const status = dispatchPeotteokSse(buf, handlers);
          if (status === "fail") {
            throw new Error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
          }
          if (status === "done") sawDone = true;
        }
        break;
      }
      if (!take(decoder.decode(value, { stream: true }))) {
        throw new Error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      if (sawDone) break;
    }
  } catch (error) {
    if (input.signal?.aborted || (error instanceof Error && error.name === "AbortError")) return;
    throw error;
  }

  if (!sawDone) {
    throw new Error("답변을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

export type FeedBucket = "affordable" | "nearMiss" | "lockedHigh";

export type TrialGrantStatus = "active" | "failed_fx" | "none";

export type TrialState = {
  grantStatus: TrialGrantStatus;
  trialPrincipalUsdt: number | null;
  trialLockedUsdt: number | null;
  welcomeTargetKrw: number | null;
  grantAmountUsdt: number | null;
  grantAmountKrw: number | null;
  trialPrincipalKrwApprox: number | null;
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
  imageUrl: string | null;
  requiredCapitalUsdt: string | null;
  requiredUsdt: number | null;
  requiredKrw: number | null;
  pricingVersion: number | null;
  expectedProfitUsdt: string | null;
  expectedUsdt: number | null;
  expectedKrw: number | null;
  lowMarket: string;
  highMarket: string;
  seats: number | null;
  duration: string;
};

export type MoneyRead = {
  principalUsdt: number | null;
  principalKrw: number | null;
  lockedUsdt: number | null;
  lockedKrw: number | null;
  profitUsdt: number | null;
  profitKrw: number | null;
  practiceUsdt: number | null;
  practiceKrw: number | null;
  trialPrincipalUsdt: number | null;
  trialLockedUsdt: number | null;
  trialPrincipalKrw: number | null;
};

export function emptyTrial(): TrialState {
  return {
    grantStatus: "none",
    trialPrincipalUsdt: null,
    trialLockedUsdt: null,
    welcomeTargetKrw: null,
    grantAmountUsdt: null,
    grantAmountKrw: null,
    trialPrincipalKrwApprox: null,
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
  return pickNumber(row, withSnake(["amountKrwApprox", "amountKrw", "krw", "availableKrw", "balanceKrw"]));
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
    grantStatus: asGrantStatus(inner ? inner.grantStatus ?? inner.grant_status : null),
    trialPrincipalUsdt: pickNumber(inner, withSnake(["trialPrincipalUsdt"])),
    trialLockedUsdt: pickNumber(inner, withSnake(["trialLockedUsdt"])),
    welcomeTargetKrw: pickNumber(inner, withSnake(["welcomeTargetKrw"])),
    grantAmountUsdt: pickNumber(inner, withSnake(["grantAmountUsdt"])),
    grantAmountKrw: pickNumber(inner, withSnake(["grantAmountKrw"])),
    trialPrincipalKrwApprox: pickNumber(inner, withSnake(["trialPrincipalKrwApprox"])),
    maxParticipations: pickNumber(inner, withSnake(["maxParticipations"])),
    participationsUsed: pickNumber(inner, withSnake(["participationsUsed"])),
    participationsRemaining: pickNumber(inner, withSnake(["participationsRemaining"])),
    profitCapKrw: pickNumber(inner, withSnake(["profitCapKrw"])),
    profitCreditedKrw: pickNumber(inner, withSnake(["profitCreditedKrw"])),
    profitRemainingKrw: pickNumber(inner, withSnake(["profitRemainingKrw"])),
    trialPrincipalWithdrawable: inner?.trialPrincipalWithdrawable === true,
    inviteSlotsGranted: pickNumber(inner, ["inviteSlotsGranted"]),
    trialEligibleOpportunityIds: asStringList(inner?.trialEligibleOpportunityIds),
  };
}

export function trialGrantKrw(trial: TrialState): number | null {
  if (trial.grantStatus !== "active") return null;
  return trial.grantAmountKrw ?? trial.welcomeTargetKrw ?? trial.trialPrincipalKrwApprox;
}

function parseFeedItem(item: unknown, trialIds: string[]): LiveOpportunity | null {
  const raw = asRecord(item);
  if (!raw) return null;
  const row = nest(raw, "opportunity") || raw;
  const id = pickString(row, ["id", "opportunityId"]);
  if (!id) return null;
  const title = pickString(row, ["asset_label", "assetLabel", "title", "label", "name"]) || "기회";
  const amountRows = [row, nest(row, "quote"), nest(row, "pricing"), nest(row, "amounts")];
  const requiredCapitalUsdt = pickStringFrom(amountRows, ["requiredCapitalUsdt"]);
  const requiredUsdt = pickNumberFrom(amountRows, ["requiredCapitalUsdt", "requiredUsdt"]);
  const requiredKrw = pickNumberFrom(amountRows, ["requiredCapitalKrwApprox"]);
  const pricingVersionRaw = pickNumber(row, withSnake(["pricingVersion"]));
  const pricingVersion =
    pricingVersionRaw != null && Number.isInteger(pricingVersionRaw) && pricingVersionRaw >= 1
      ? pricingVersionRaw
      : null;
  const expectedProfitUsdt = pickStringFrom(amountRows, ["expectedProfitUsdt"]);
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
    imageUrl: pickImageUrl(row),
    requiredCapitalUsdt,
    requiredUsdt,
    requiredKrw,
    pricingVersion,
    expectedProfitUsdt,
    expectedUsdt: pickNumberFrom(amountRows, ["expectedProfitUsdt", "expectedUsdt"]),
    expectedKrw: pickNumberFrom(amountRows, ["expectedProfitKrwApprox", "expectedKrw"]),
    lowMarket: pickString(row, ["lowMarket", "buyVenue", "fromMarket", "partnerLabel", "partner"]) || "",
    highMarket: pickString(row, ["highMarket", "sellVenue", "toMarket"]) || "",
    seats: pickNumberFrom(amountRows, ["seats", "remainingSeats", "openSeats"]),
    duration: pickString(row, ["duration", "eta"]) || durationFromSec(pickNumberFrom(amountRows, ["estimatedDurationSec"])),
  };
}

export function readListFeed(data: unknown, trialIds: string[] = []): LiveOpportunity[] {
  const row = asRecord(data);
  const named = row ? row.listFeed ?? row.feed : undefined;
  const source = named !== undefined ? named : data;
  return asList(source).flatMap((item) => {
    const parsed = parseFeedItem(item, trialIds);
    return parsed ? [parsed] : [];
  });
}

export function readOpportunity(data: unknown, trialIds: string[] = []): LiveOpportunity | null {
  const row = asRecord(data);
  return (
    parseFeedItem(data, trialIds) ||
    parseFeedItem(row ? row.opportunity ?? row.data ?? row.item : null, trialIds) ||
    readListFeed(data, trialIds)[0] ||
    null
  );
}

export function readPrincipalUsdt(data: unknown): number | null {
  const row = asRecord(data);
  const feed = nest(row, "listFeed") || nest(row, "feed") || row;
  return pickNumber(row, ["principalUsdt"]) ?? pickNumber(feed, ["principalUsdt"]);
}

export function readMoney(home: unknown, buckets: unknown, trial?: TrialState | null): MoneyRead {
  const money = moneyRoot(home);
  const bucketRoot = asRecord(buckets);
  const sources = [money, bucketRoot, nest(bucketRoot, "wallet"), moneyRoot(buckets)];
  const trialState = trial ?? emptyTrial();
  const read: MoneyRead = {
    principalUsdt: pickNumberFrom(sources, ["principalUsdt"]) ?? readPrincipalUsdt(home),
    principalKrw: pickNumberFrom(sources, ["principalKrwApprox", "principalKrw"]),
    lockedUsdt: pickNumberFrom(sources, ["lockedUsdt"]),
    lockedKrw: pickNumberFrom(sources, ["lockedKrwApprox", "lockedKrw"]),
    profitUsdt: pickNumberFrom(sources, ["profitUsdt", "withdrawableProfitUsdt"]),
    profitKrw: pickNumberFrom(sources, ["profitKrwApprox", "withdrawableProfitKrwApprox", "profitKrw"]),
    practiceUsdt: pickNumberFrom(sources, ["practiceUsdt"]),
    practiceKrw: pickNumberFrom(sources, ["practiceKrwApprox", "practiceKrw"]),
    trialPrincipalUsdt: pickNumberFrom(sources, ["trialPrincipalUsdt"]) ?? trialState.trialPrincipalUsdt,
    trialLockedUsdt: pickNumberFrom(sources, ["trialLockedUsdt"]) ?? trialState.trialLockedUsdt,
    trialPrincipalKrw:
      pickNumberFrom(sources, ["trialPrincipalKrwApprox"]) ?? trialGrantKrw(trialState),
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
      if (read.principalUsdt == null && usdt != null) read.principalUsdt = usdt;
      if (read.principalKrw == null && krw != null) read.principalKrw = krw;
    }
  }

  return read;
}

export async function fillMissingKrw(money: MoneyRead): Promise<MoneyRead> {
  const needPrincipal = money.principalKrw == null && money.principalUsdt != null;
  const needProfit = money.profitKrw == null && money.profitUsdt != null;
  if (!needPrincipal && !needProfit) return money;
  try {
    const approx = await approxCurrentFx({
      ...(needPrincipal && money.principalUsdt != null ? { principalUsdt: String(money.principalUsdt) } : {}),
      ...(needProfit && money.profitUsdt != null ? { withdrawableProfitUsdt: String(money.profitUsdt) } : {}),
    });
    const row = asRecord(approx);
    return {
      ...money,
      principalKrw: money.principalKrw ?? pickNumber(row, withSnake(["principalKrwApprox"])),
      profitKrw: money.profitKrw ?? pickNumber(row, withSnake(["withdrawableProfitKrwApprox"])),
    };
  } catch {
    return money;
  }
}

export async function loadMoneyRead(): Promise<MoneyRead> {
  const [home, homeMoney, buckets, trial] = await Promise.allSettled([
    getHomeRead(),
    getHomeMoneyRead(),
    getWalletBuckets(),
    getTrialState(),
  ]);
  const trialState = trial.status === "fulfilled" ? readTrialState(trial.value) : emptyTrial();
  const money = readMoney(
    mergeApiRows(
      homeMoney.status === "fulfilled" ? homeMoney.value : null,
      home.status === "fulfilled" ? home.value : null,
    ),
    buckets.status === "fulfilled" ? buckets.value : null,
    trialState,
  );
  return fillMissingKrw(money);
}

export function hasMoneyValues(money: MoneyRead): boolean {
  return (
    money.principalUsdt != null ||
    money.principalKrw != null ||
    money.lockedUsdt != null ||
    money.lockedKrw != null ||
    money.profitKrw != null ||
    money.practiceUsdt != null ||
    money.practiceKrw != null ||
    money.profitUsdt != null ||
    money.trialPrincipalUsdt != null ||
    money.trialLockedUsdt != null ||
    money.trialPrincipalKrw != null
  );
}

export function readTrades(data: unknown): Array<{
  tradeId: string;
  opportunityId: string;
  title: string;
  capitalKrw: number | null;
  settledProfitKrw: number | null;
  settledProfitUsdt: number | null;
  status: string;
  createdAt: string;
}> {
  return asList(data).flatMap((item) => {
    const raw = asRecord(item);
    if (!raw) return [];
    const row = nest(raw, "trade") || raw;
    const asset = nest(row, "asset") || nest(raw, "asset");
    const tradeId = pickString(row, ["tradeId", "id"]);
    if (!tradeId) return [];
    return [
      {
        tradeId,
        opportunityId: pickString(row, ["opportunityId", "opportunity_id"]) || "",
        title: pickString(row, ["title", "label", "name"]) || pickString(asset, ["label", "title", "name"]) || "",
        capitalKrw: pickNumber(row, withSnake(["capitalKrwApprox", "settledCapitalKrwApprox"])),
        settledProfitKrw: pickNumber(row, withSnake(["settledProfitKrwApprox", "profitKrwApprox"])),
        settledProfitUsdt: pickNumber(row, withSnake(["settledProfitUsdt", "profitUsdt"])),
        status: pickString(row, ["status", "state"]) || "",
        createdAt: pickString(row, ["createdAt", "occurredAt", "date"]) || "",
      },
    ];
  });
}

export type TradeSnapshot = {
  tradeId: string | null;
  status: string;
  capitalKrw: number | null;
  profitKrw: number | null;
  profitUsdt: number | null;
};

export function readTradeSnapshot(data: unknown): TradeSnapshot {
  const root = asRecord(data);
  const row = nest(root, "trade") || nest(root, "data") || root;
  const numberKeys = withSnake(["capitalKrwApprox", "capitalKrw", "settledCapitalKrwApprox"]);
  const profitKrwKeys = withSnake(["settledProfitKrwApprox", "settledProfitKrw", "profitKrwApprox", "profitKrw"]);
  const profitUsdtKeys = withSnake(["settledProfitUsdt", "profitUsdt"]);
  return {
    tradeId: pickString(row, ["tradeId", "id"]) || pickString(root, ["tradeId"]),
    status: pickString(row, ["status", "state"]) || pickString(root, ["status", "state"]) || "",
    capitalKrw: pickNumber(row, numberKeys) ?? pickNumber(root, numberKeys),
    profitKrw: pickNumber(row, profitKrwKeys) ?? pickNumber(root, profitKrwKeys),
    profitUsdt: pickNumber(row, profitUsdtKeys) ?? pickNumber(root, profitUsdtKeys),
  };
}

export function readTradeStatus(data: unknown): string {
  const row = asRecord(data);
  return pickString(row, ["status", "state"]) || pickString(nest(row, "trade"), ["status", "state"]) || "";
}

export function tradeIsOpen(status: string): boolean {
  const value = status.toLowerCase();
  return value === "running" || value === "pending" || value === "in_progress" || value === "open" || value === "active";
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
  return pickString(row, ["challengeId"]);
}

export function readStepUpToken(data: unknown): string | null {
  const row = asRecord(data);
  return pickString(row, ["stepUpToken"]);
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
