import { emptyTrial } from "@/lib/api";
import { STORAGE_KEY } from "./constants";
import type { GptState } from "./types";

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
    issuedAt: new Date().toISOString(),
    dailyKey: kstDateKey(),
    lastRefreshAt: 0,
  };
}

export function createFreshState(): GptState {
  return { ...defaultState(), ...freshIdentity() };
}

export function readStoredState(): GptState {
  if (typeof window === "undefined") return defaultState();
  const fresh: GptState = createFreshState();
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return fresh;
    return {
      ...fresh,
      schemaVersion: 2,
      loggedIn: Boolean(saved.loggedIn),
      authMethod: saved.authMethod === "google" || saved.authMethod === "password" ? saved.authMethod : "",
      profileCompleted: saved.profileCompleted !== false,
      displayName: typeof saved.displayName === "string" ? saved.displayName : "",
      email: typeof saved.email === "string" ? saved.email : "",
      birthday: typeof saved.birthday === "string" ? saved.birthday : "",
      gender: saved.gender === "male" || saved.gender === "female" ? saved.gender : "",
      phone: typeof saved.phone === "string" ? saved.phone : "",
      notificationsEnabled: saved.notificationsEnabled !== false,
      benefitNews: Boolean(saved.benefitNews),
      settlementAlerts: saved.settlementAlerts !== false,
      walletAlerts: saved.walletAlerts !== false,
      preferKrwFirst: saved.preferKrwFirst !== false,
      celebrateOn: saved.celebrateOn !== false,
      conversations: Array.isArray(saved.conversations) ? saved.conversations.slice(0, 12) : [],
      activeConversationId: typeof saved.activeConversationId === "string" ? saved.activeConversationId : "",
      pendingAiQuestion: typeof saved.pendingAiQuestion === "string" ? saved.pendingAiQuestion : "",
      pendingRoute: typeof saved.pendingRoute === "string" ? saved.pendingRoute : "",
    };
  } catch {
    return fresh;
  }
}

export function writeStoredState(state: GptState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        loggedIn: state.loggedIn,
        authMethod: state.authMethod,
        profileCompleted: state.profileCompleted,
        displayName: state.displayName,
        email: state.email,
        birthday: state.birthday,
        gender: state.gender,
        phone: state.phone,
        notificationsEnabled: state.notificationsEnabled,
        benefitNews: state.benefitNews,
        settlementAlerts: state.settlementAlerts,
        walletAlerts: state.walletAlerts,
        preferKrwFirst: state.preferKrwFirst,
        celebrateOn: state.celebrateOn,
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
