import { emptyTrial } from "@/lib/api";
import { ACCOUNT_STORAGE_PREFIX, DEVICE_STORAGE_KEY, STORAGE_KEY } from "./constants";
import type { Conversation, Gender, GptState } from "./types";

export type DevicePrefs = {
  notificationsEnabled: boolean;
  benefitNews: boolean;
  settlementAlerts: boolean;
  walletAlerts: boolean;
  preferKrwFirst: boolean;
  celebrateOn: boolean;
};

const DEVICE_DEFAULTS: DevicePrefs = {
  notificationsEnabled: true,
  benefitNews: false,
  settlementAlerts: true,
  walletAlerts: true,
  preferKrwFirst: true,
  celebrateOn: true,
};

export function makeResellerId(): string {
  return "";
}

export function kstDateKey(): string {
  const shifted = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function defaultState(): GptState {
  return {
    schemaVersion: 2,
    loggedIn: false,
    userId: "",
    authMethod: "",
    profileCompleted: true,
    resellerId: "",
    issuedAt: "",
    displayName: "",
    email: "",
    birthday: "",
    gender: "",
    phone: "",
    kycStatus: "not_started",
    principalUsdt: null,
    principalKrw: null,
    lockedUsdt: null,
    lockedKrw: null,
    profitUsdt: null,
    profitKrw: null,
    practiceUsdt: null,
    practiceKrw: null,
    trial: emptyTrial(),
    feed: [],
    deskReady: false,
    dailyKey: "",
    dailyBaseUsed: 0,
    dailyBonusUsed: 0,
    bonusBank: 0,
    selectedId: "",
    quoteVersion: 1,
    lastRefreshAt: 0,
    trades: [],
    recordsError: false,
    pending: null,
    deposits: [],
    withdrawals: [],
    notificationsEnabled: true,
    benefitNews: false,
    settlementAlerts: true,
    walletAlerts: true,
    preferKrwFirst: true,
    celebrateOn: true,
    conversations: [],
    activeConversationId: "",
    pendingAiQuestion: "",
    pendingRoute: "",
  };
}

export function freshIdentity() {
  return {
    issuedAt: "",
    dailyKey: kstDateKey(),
    lastRefreshAt: 0,
  };
}

export function createFreshState(): GptState {
  return { ...defaultState(), ...freshIdentity() };
}

function readJson(key: string): unknown {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readConversations(value: unknown): Conversation[] {
  return Array.isArray(value) ? (value as Conversation[]).slice(0, 12) : [];
}

export function readDevicePrefs(): DevicePrefs {
  if (typeof window === "undefined") return { ...DEVICE_DEFAULTS };
  const saved = asObject(readJson(DEVICE_STORAGE_KEY));
  const legacy = asObject(readJson(STORAGE_KEY));
  const src = saved || legacy;
  if (!src) return { ...DEVICE_DEFAULTS };
  return {
    notificationsEnabled: src.notificationsEnabled !== false,
    benefitNews: Boolean(src.benefitNews),
    settlementAlerts: src.settlementAlerts !== false,
    walletAlerts: src.walletAlerts !== false,
    preferKrwFirst: src.preferKrwFirst !== false,
    celebrateOn: src.celebrateOn !== false,
  };
}

export function writeDevicePrefs(prefs: DevicePrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 이번 방문 동안은 화면을 계속 쓸 수 있으면 충분하다.
  }
}

function accountKey(userId: string): string {
  return ACCOUNT_STORAGE_PREFIX + userId;
}

export type AccountSlice = {
  displayName: string;
  email: string;
  birthday: string;
  gender: Gender;
  phone: string;
  conversations: Conversation[];
  activeConversationId: string;
  pendingAiQuestion: string;
  pendingRoute: string;
};

function emptyAccountSlice(): AccountSlice {
  return {
    displayName: "",
    email: "",
    birthday: "",
    gender: "",
    phone: "",
    conversations: [],
    activeConversationId: "",
    pendingAiQuestion: "",
    pendingRoute: "",
  };
}

export function readAccountSlice(userId: string): AccountSlice {
  if (typeof window === "undefined" || !userId) return emptyAccountSlice();
  const saved = asObject(readJson(accountKey(userId)));
  if (!saved) return emptyAccountSlice();
  return {
    displayName: typeof saved.displayName === "string" ? saved.displayName : "",
    email: typeof saved.email === "string" ? saved.email : "",
    birthday: typeof saved.birthday === "string" ? saved.birthday : "",
    gender: "",
    phone: typeof saved.phone === "string" ? saved.phone : "",
    conversations: readConversations(saved.conversations),
    activeConversationId: typeof saved.activeConversationId === "string" ? saved.activeConversationId : "",
    pendingAiQuestion: typeof saved.pendingAiQuestion === "string" ? saved.pendingAiQuestion : "",
    pendingRoute: typeof saved.pendingRoute === "string" ? saved.pendingRoute : "",
  };
}

export function writeAccountSlice(userId: string, state: GptState): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(
      accountKey(userId),
      JSON.stringify({
        displayName: state.displayName,
        email: state.email,
        birthday: state.birthday,
        phone: state.phone,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        pendingAiQuestion: state.pendingAiQuestion,
        pendingRoute: state.pendingRoute,
      }),
    );
  } catch {
    // 이번 방문 동안은 화면을 계속 쓸 수 있으면 충분하다.
  }
}

export function clearAccountStorage(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) window.localStorage.removeItem(accountKey(userId));
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지워지지 않아도 메모리 상태는 비운다.
  }
}

export function applyDevicePrefs(state: GptState, prefs: DevicePrefs): GptState {
  return { ...state, ...prefs };
}

export function readStoredState(): GptState {
  if (typeof window === "undefined") return defaultState();
  return applyDevicePrefs(createFreshState(), readDevicePrefs());
}

export function writeStoredState(state: GptState): void {
  writeDevicePrefs({
    notificationsEnabled: state.notificationsEnabled,
    benefitNews: state.benefitNews,
    settlementAlerts: state.settlementAlerts,
    walletAlerts: state.walletAlerts,
    preferKrwFirst: state.preferKrwFirst,
    celebrateOn: state.celebrateOn,
  });
  if (state.userId) writeAccountSlice(state.userId, state);
}

export function ticketState(state: GptState) {
  const remaining = Math.max(0, Number(state.trial.participationsRemaining) || 0);
  const max = Math.max(remaining, Number(state.trial.maxParticipations) || 0);
  return {
    baseUsed: Number(state.trial.participationsUsed) || 0,
    bonusUsed: 0,
    baseRemaining: remaining,
    bonusAvailable: 0,
    remaining,
    max,
  };
}
