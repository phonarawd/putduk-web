"use client";

// GPT 데스크 UI 이식 - 전역 연습 상태 엔진
// 원본: _gpt_src/dist/app.js 의 state/실행 로직을 React Context로 옮긴 것.
// 숫자·문구·타이밍은 원본 그대로 유지한다.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  emptyTrial,
  getHomeRead,
  getSession,
  getTrialState,
  getWalletBuckets,
  listOpportunities,
  logout as logoutSession,
  participateOpportunity,
  readListFeed,
  readMoney,
  readTrialState,
  sessionDisplayName,
  sessionEmail,
  sessionUsername,
} from "@/lib/api";
import { MSG, toastFromError, type ToastKind } from "@/lib/messages";
import { AI_UNAVAILABLE_REPLY, conversationGreeting } from "./ai";
import { VIEW_PATHS } from "./constants";
import { allOpportunityViews, selectedOpportunity } from "./opportunities";
import { ticketState } from "./state";
import { getHydratedServerSnapshot, getServerSnapshot, getSnapshot, isHydrated, setStoreState, subscribe } from "./store";
import type {
  ActiveExecution,
  Conversation,
  Evidence,
  Gender,
  GptState,
} from "./types";

function isTerminal(status: ActiveExecution["status"]): boolean {
  return status === "success" || status === "safe_stop";
}

interface TypingState {
  conversationId: string;
  full: string;
  evidence?: Evidence[];
  revealed: number;
  started: boolean;
}

interface ToastState {
  message: string;
  kind: ToastKind;
  key: number;
}

interface CapitalModalState {
  open: boolean;
  mode: "replace" | "topup";
  selection: number;
}

type ViewName = keyof typeof VIEW_PATHS;

interface GptContextValue {
  ready: boolean;
  state: GptState;
  tickets: ReturnType<typeof ticketState>;
  opportunities: ReturnType<typeof allOpportunityViews>;
  selected: ReturnType<typeof selectedOpportunity>;

  // 인증
  sessionReady: boolean;
  reloadDesk: () => Promise<void>;
  markPasswordAuth: () => void;
  markGoogleAuth: (needsProfile: boolean, email?: string) => void;
  submitClassicSignupProfile: (fields: {
    displayName: string;
    email: string;
    birthday: string;
    gender: Gender;
    phone: string;
    benefitNews: boolean;
  }) => void;
  completeGoogleProfile: (fields: { displayName: string; birthday: string; gender: Gender; phone?: string }) => void;
  cancelGoogleOnboarding: () => void;
  logout: () => void;
  setPendingRoute: (path: string) => void;
  navigateAfterAuth: (fallback: string) => void;

  // 기회
  selectOpportunity: (id: string) => void;
  refreshQuotes: () => void;

  // 가상 자본 모달
  capitalModal: CapitalModalState;
  openCapitalModal: (mode?: "replace" | "topup", suggestedAmount?: number) => void;
  closeCapitalModal: () => void;
  setCapitalSelection: (amount: number) => void;
  confirmCapital: () => void;

  // 참여 전 확인 + 실행
  preflightOpen: boolean;
  openPreflight: () => void;
  closePreflight: () => void;
  confirmStart: () => void;
  activeExecution: ActiveExecution | null;
  celebrate: boolean;
  closeExecution: (destination: ViewName) => void;
  selectNextOpportunity: () => void;

  // 퍼뜩AI
  currentConversation: Conversation | null;
  typing: TypingState | null;
  sendAiQuestion: (question: string) => void;
  createConversation: () => void;
  selectConversation: (id: string) => void;

  // 프로필/지갑
  chooseProfileGender: (value: Gender) => void;
  toggleNotifications: () => void;
  toggleBenefitNews: () => void;
  toggleSettlementAlerts: () => void;
  toggleWalletAlerts: () => void;
  togglePreferKrwFirst: () => void;
  toggleCelebrateOn: () => void;
  resetPractice: () => void;

  // 토스트
  toast: ToastState | null;
  showToast: (message: string, kind?: ToastKind) => void;
}

const GptContext = createContext<GptContextValue | null>(null);

export function GptProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // localStorage 기반 외부 스토어를 구독한다. 서버/첫 하이드레이션에는 항상 defaultState(),
  // 마운트 이후 subscribe()가 한 번 실제 값으로 갈아끼운다. (effect에서 setState를 직접 부르지 않는다)
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribe, isHydrated, getHydratedServerSnapshot);
  // setStoreState는 모듈 스코프의 안정된 함수라 의존성 배열에 넣지 않아도 된다(useState의 setter와 동일하게 취급).

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [capitalModal, setCapitalModal] = useState<CapitalModalState>({
    open: false,
    mode: "replace",
    selection: 500000,
  });
  const [preflightOpen, setPreflightOpen] = useState(false);
  const preflightOpenedAtRef = useRef(0);

  const [activeExecution, setActiveExecution] = useState<ActiveExecution | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const processedTradeRef = useRef<string | null>(null);

  const [typing, setTyping] = useState<TypingState | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const lastToastRef = useRef<{ message: string; at: number }>({ message: "", at: 0 });
  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const now = Date.now();
    if (lastToastRef.current.message === message && now - lastToastRef.current.at < 1800) {
      return;
    }
    lastToastRef.current = { message, at: now };
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ message, kind, key: now });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3400);
  }, []);

  // 1초마다 갱신되는 시각 - "시세 다시 확인 필요" 같은 신선도 상태가 시간이 지나면 저절로 바뀌도록 한다.
  const tickets = useMemo(() => ticketState(state), [state]);
  const opportunities = useMemo(() => allOpportunityViews(state), [state]);
  const selected = useMemo(() => selectedOpportunity(state), [state]);

  const reloadDesk = useCallback(async () => {
    const [home, opps, trial, buckets] = await Promise.allSettled([
      getHomeRead(),
      listOpportunities(),
      getTrialState(),
      getWalletBuckets(),
    ]);
    const homeVal = home.status === "fulfilled" ? home.value : null;
    const oppVal = opps.status === "fulfilled" ? opps.value : null;
    const trialVal = trial.status === "fulfilled" ? readTrialState(trial.value) : emptyTrial();
    const bucketVal = buckets.status === "fulfilled" ? buckets.value : null;
    const feed = readListFeed(homeVal, trialVal.trialEligibleOpportunityIds);
    const fallback = feed.length ? feed : readListFeed(oppVal, trialVal.trialEligibleOpportunityIds);
    const money = readMoney(homeVal ?? oppVal, bucketVal, trialVal);
    setStoreState((prev) => ({
      ...prev,
      trial: trialVal,
      feed: fallback,
      principalUsdt: money.principalUsdt,
      principalKrw: money.principalKrw,
      lockedUsdt: money.lockedUsdt,
      lockedKrw: money.lockedKrw,
      profitUsdt: money.profitUsdt,
      profitKrw: money.profitKrw,
      practiceUsdt: money.practiceUsdt,
      practiceKrw: money.practiceKrw,
      deskReady: true,
      selectedId: fallback.some((item) => item.id === prev.selectedId) ? prev.selectedId : fallback[0]?.id || "",
      lastRefreshAt: Date.now(),
    }));
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getSession()
      .then((data) => {
        if (cancelled) return;
        const username = sessionUsername(data);
        setStoreState((prev) => ({
          ...prev,
          loggedIn: true,
          email: sessionEmail(data) || prev.email,
          displayName: sessionDisplayName(data) || prev.displayName,
          resellerId: username || prev.resellerId,
        }));
        return reloadDesk();
      })
      .catch(() => {
        if (cancelled) return;
        setStoreState((prev) => (prev.loggedIn ? { ...prev, loggedIn: false, deskReady: false, feed: [], trial: emptyTrial() } : prev));
      })
      .finally(() => {
        if (!cancelled) setSessionReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, reloadDesk]);

  // ---------- 인증 ----------
  const markPasswordAuth = useCallback(() => {
    setStoreState((prev) => ({ ...prev, loggedIn: true, authMethod: "password", profileCompleted: true }));
    void reloadDesk();
  }, [reloadDesk]);

  const markGoogleAuth = useCallback((needsProfile: boolean, email?: string) => {
    setStoreState((prev) => ({
      ...prev,
      loggedIn: true,
      authMethod: "google",
      profileCompleted: !needsProfile,
      email: email || prev.email,
    }));
  }, []);

  // 고전(아이디) 가입 폼의 나머지 항목(표시 이름 등)은 연습 상태에만 반영한다. 로그인 처리는 이메일 인증 이후에 한다.
  const submitClassicSignupProfile = useCallback(
    (fields: { displayName: string; email: string; birthday: string; gender: Gender; phone: string; benefitNews: boolean }) => {
      setStoreState((prev) => ({
        ...prev,
        displayName: fields.displayName,
        email: fields.email,
        birthday: fields.birthday,
        gender: fields.gender,
        phone: fields.phone,
        benefitNews: fields.benefitNews,
        authMethod: "password",
        profileCompleted: true,
      }));
    },
    [],
  );

  const completeGoogleProfile = useCallback(
    (fields: { displayName: string; birthday: string; gender: Gender; phone?: string }) => {
      setStoreState((prev) => ({
        ...prev,
        displayName: fields.displayName,
        birthday: fields.birthday,
        gender: fields.gender,
        phone: fields.phone || prev.phone,
        profileCompleted: true,
        loggedIn: true,
      }));
    },
    [],
  );

  const cancelGoogleOnboarding = useCallback(() => {
    setStoreState((prev) => ({ ...prev, loggedIn: false, authMethod: "", profileCompleted: true, pendingRoute: "" }));
  }, []);

  const logout = useCallback(() => {
    logoutSession()
      .then(() => showToast(MSG.logoutOk, "success"))
      .catch((error: unknown) => {
        const payload = toastFromError(error, MSG.logoutFail);
        showToast(payload.message, payload.kind);
      });
    setStoreState((prev) => ({ ...prev, loggedIn: false, pendingRoute: "", profileCompleted: true, authMethod: "" }));
    router.push("/login");
  }, [router, showToast]);

  const setPendingRoute = useCallback((path: string) => {
    setStoreState((prev) => ({ ...prev, pendingRoute: path }));
  }, []);

  // ---------- 퍼뜩AI (sendAiQuestion 을 먼저 선언해 navigateAfterAuth 에서 참조) ----------
  const sendAiQuestion = useCallback(
    (question: string) => {
      const text = String(question || "").trim();
      if (!text) {
        showToast(MSG.aiEmpty, "warning");
        return;
      }
      if (!state.loggedIn) {
        setStoreState((prev) => ({ ...prev, pendingAiQuestion: text, pendingRoute: "/ai" }));
        showToast(MSG.aiLogin, "info");
        router.push("/login");
        return;
      }
      if (typing) {
        showToast(MSG.aiBusy, "warning");
        return;
      }
      const conversationId = state.activeConversationId;
      setStoreState((prev) => {
        const conversation = prev.conversations.find((item) => item.id === prev.activeConversationId);
        if (!conversation) return prev;
        const updated: Conversation = {
          ...conversation,
          title: conversation.title === "새 대화" ? text.slice(0, 24) : conversation.title,
          updatedAt: new Date().toISOString(),
          messages: [...conversation.messages, { role: "user", text, createdAt: new Date().toISOString() }],
        };
        return { ...prev, conversations: prev.conversations.map((item) => (item.id === updated.id ? updated : item)) };
      });
      showToast(MSG.aiWait, "warning");
      setTyping({ conversationId, full: "", revealed: 0, started: false });
      window.setTimeout(() => {
        setTyping(null);
        setStoreState((prev) => {
          const conversation = prev.conversations.find((item) => item.id === conversationId);
          if (!conversation) return prev;
          const updated: Conversation = {
            ...conversation,
            updatedAt: new Date().toISOString(),
            messages: [
              ...conversation.messages,
              { role: "assistant", text: AI_UNAVAILABLE_REPLY, createdAt: new Date().toISOString() },
            ],
          };
          return { ...prev, conversations: prev.conversations.map((item) => (item.id === updated.id ? updated : item)) };
        });
        showToast(MSG.aiSendFail, "error");
      }, 700);
    },
    [state, typing, showToast, router],
  );

  const navigateAfterAuth = useCallback(
    (fallback: string) => {
      const destination = state.pendingRoute || fallback;
      const question = state.pendingAiQuestion;
      setStoreState((prev) => ({ ...prev, pendingRoute: "", pendingAiQuestion: "" }));
      if (question) {
        router.replace("/ai");
        window.setTimeout(() => sendAiQuestion(question), 180);
      } else {
        router.replace(destination);
      }
    },
    [state.pendingRoute, state.pendingAiQuestion, router, sendAiQuestion],
  );

  // 타이핑 1단계: 520ms 대기 후 점 → 실제 타이핑 시작
  useEffect(() => {
    if (!typing || typing.started) return;
    const id = window.setTimeout(() => {
      setTyping((current) => (current && !current.started ? { ...current, started: true } : current));
    }, 520);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing?.conversationId, typing?.started]);

  // 타이핑 2단계: 13ms 간격으로 한 글자씩 노출하고, 다 끝나면 대화에 확정 반영한다.
  // revealed는 effect 시작 시점의 값(0)에서 이 콜백 스코프의 지역 변수로만 센다.
  // (setInterval 콜백 안에서 처리 - effect 본문에서 직접 setState를 부르지 않는다)
  useEffect(() => {
    if (!typing || !typing.started) return;
    const conversationId = typing.conversationId;
    const full = typing.full;
    const evidence = typing.evidence;
    let revealed = typing.revealed;
    const id = window.setInterval(() => {
      revealed += 1;
      if (revealed >= full.length) {
        window.clearInterval(id);
        setTyping(null);
        setStoreState((prev) => {
          const conversation = prev.conversations.find((item) => item.id === conversationId);
          if (!conversation) return prev;
          const message = { role: "assistant" as const, text: full, evidence, createdAt: new Date().toISOString() };
          const updated: Conversation = { ...conversation, messages: [...conversation.messages, message], updatedAt: new Date().toISOString() };
          return { ...prev, conversations: prev.conversations.map((item) => (item.id === updated.id ? updated : item)) };
        });
        return;
      }
      const nextRevealed = revealed;
      setTyping((current) => (current ? { ...current, revealed: nextRevealed } : current));
    }, 13);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typing?.conversationId, typing?.started]);

  const createConversation = useCallback(() => {
    setTyping(null);
    const id = "talk-" + Date.now().toString(36);
    setStoreState((prev) => {
      const conversation: Conversation = {
        id,
        title: "새 대화",
        updatedAt: new Date().toISOString(),
        messages: [conversationGreeting()],
      };
      return { ...prev, conversations: [conversation, ...prev.conversations].slice(0, 12), activeConversationId: id };
    });
  }, []);

  const selectConversation = useCallback((id: string) => {
    setStoreState((prev) => ({ ...prev, activeConversationId: id }));
  }, []);

  const currentConversation = useMemo(
    () => state.conversations.find((item) => item.id === state.activeConversationId) || state.conversations[0] || null,
    [state.conversations, state.activeConversationId],
  );

  // ---------- 기회 ----------
  const selectOpportunity = useCallback((id: string) => {
    setStoreState((prev) => ({ ...prev, selectedId: id }));
  }, []);

  const refreshQuotes = useCallback(() => {
    reloadDesk()
      .then(() => showToast(MSG.quoteOk, "success"))
      .catch((error: unknown) => {
        const payload = toastFromError(error, MSG.quoteFail);
        showToast(payload.message, payload.kind);
      });
  }, [reloadDesk, showToast]);

  // ---------- 가상 자본 모달 ----------
  const openCapitalModal = useCallback(() => {
    router.push("/wallet/deposit");
  }, [router]);

  const closeCapitalModal = useCallback(() => {
    setCapitalModal((prev) => ({ ...prev, open: false }));
  }, []);

  const setCapitalSelection = useCallback((amount: number) => {
    setCapitalModal((prev) => ({ ...prev, selection: amount }));
  }, []);

  const confirmCapital = useCallback(() => {
    setCapitalModal((prev) => ({ ...prev, open: false }));
    router.push("/wallet/deposit");
  }, [router]);

  // ---------- 참여 전 확인 + 실행 ----------
  const openPreflight = useCallback(() => {
    if (!state.loggedIn) {
      setStoreState((prev) => ({ ...prev, pendingRoute: "/" }));
      router.push("/login");
      return;
    }
    if (activeExecution && !isTerminal(activeExecution.status)) {
      showToast(MSG.participateBusy, "warning");
      return;
    }
    const opportunity = selectedOpportunity(state);
    if (!opportunity.id) {
      showToast(MSG.noOpportunity, "warning");
      return;
    }
    if (!opportunity.affordable) {
      showToast(MSG.notEnoughMoney, "warning");
      router.push("/wallet/deposit");
      return;
    }
    if (state.trial.participationsRemaining === 0) {
      showToast(MSG.noTickets, "warning");
      return;
    }
    preflightOpenedAtRef.current = Date.now();
    setPreflightOpen(true);
  }, [state, activeExecution, router, showToast]);

  const closePreflight = useCallback(() => setPreflightOpen(false), []);

  const confirmStart = useCallback(() => {
    const opportunity = selectedOpportunity(state);
    if (!opportunity.id) {
      setPreflightOpen(false);
      showToast(MSG.noOpportunity, "warning");
      return;
    }
    setPreflightOpen(false);
    participateOpportunity(opportunity.id)
      .then(() => {
        showToast(MSG.participateOk, "success");
        return reloadDesk();
      })
      .catch((error: unknown) => {
        const payload = toastFromError(error, MSG.participateFail);
        showToast(payload.message, payload.kind);
      });
  }, [state, reloadDesk, showToast]);

  const closeExecution = useCallback(
    (destination: ViewName) => {
      if (activeExecution && !isTerminal(activeExecution.status)) {
        showToast(MSG.waitExecution, "warning");
        return;
      }
      setActiveExecution(null);
      setCelebrate(false);
      processedTradeRef.current = null;
      router.push(VIEW_PATHS[destination]);
    },
    [activeExecution, router, showToast],
  );

  const selectNextOpportunity = useCallback(() => {
    setStoreState((prev) => {
      const currentIndex = Math.max(0, opportunities.findIndex((item) => item.id === prev.selectedId));
      const ordered = opportunities.slice(currentIndex + 1).concat(opportunities.slice(0, currentIndex + 1));
      const next = ordered.find((item) => item.affordable) || ordered[0];
      return { ...prev, selectedId: next?.id || "" };
    });
    closeExecution("home");
  }, [opportunities, closeExecution]);

  // ---------- 프로필 / 지갑 ----------
  const chooseProfileGender = useCallback(
    (value: Gender) => {
      setStoreState((prev) => ({ ...prev, gender: value }));
      showToast(value === "male" ? MSG.genderMale : MSG.genderFemale, "success");
    },
    [showToast],
  );

  const toggleNotifications = useCallback(() => {
    setStoreState((prev) => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
    showToast(!state.notificationsEnabled ? MSG.alertOn : MSG.alertOff, "info");
  }, [state.notificationsEnabled, showToast]);

  const toggleBenefitNews = useCallback(() => {
    setStoreState((prev) => ({ ...prev, benefitNews: !prev.benefitNews }));
    showToast(!state.benefitNews ? MSG.alertOn : MSG.alertOff, "info");
  }, [state.benefitNews, showToast]);

  const toggleSettlementAlerts = useCallback(() => {
    setStoreState((prev) => ({ ...prev, settlementAlerts: !prev.settlementAlerts }));
    showToast(!state.settlementAlerts ? MSG.alertOn : MSG.alertOff, "info");
  }, [state.settlementAlerts, showToast]);

  const toggleWalletAlerts = useCallback(() => {
    setStoreState((prev) => ({ ...prev, walletAlerts: !prev.walletAlerts }));
    showToast(!state.walletAlerts ? MSG.alertOn : MSG.alertOff, "info");
  }, [state.walletAlerts, showToast]);

  const togglePreferKrwFirst = useCallback(() => {
    setStoreState((prev) => ({ ...prev, preferKrwFirst: !prev.preferKrwFirst }));
    showToast(MSG.settingOn, "info");
  }, [showToast]);

  const toggleCelebrateOn = useCallback(() => {
    setStoreState((prev) => ({ ...prev, celebrateOn: !prev.celebrateOn }));
    showToast(MSG.settingOn, "info");
  }, [showToast]);

  const resetPractice = useCallback(() => {
    if (typeof window !== "undefined" && !window.confirm("퍼뜩AI 대화를 처음부터 시작할까요? 금액은 그대로 둡니다.")) {
      return;
    }
    setActiveExecution(null);
    setCelebrate(false);
    setTyping(null);
    processedTradeRef.current = null;
    setStoreState((prev) => ({
      ...prev,
      conversations: [],
      activeConversationId: "",
    }));
    showToast(MSG.chatReset, "success");
    router.replace("/");
  }, [router, showToast]);

  const value: GptContextValue = {
    ready,
    sessionReady,
    reloadDesk,
    state,
    tickets,
    opportunities,
    selected,
    markPasswordAuth,
    markGoogleAuth,
    submitClassicSignupProfile,
    completeGoogleProfile,
    cancelGoogleOnboarding,
    logout,
    setPendingRoute,
    navigateAfterAuth,
    selectOpportunity,
    refreshQuotes,
    capitalModal,
    openCapitalModal,
    closeCapitalModal,
    setCapitalSelection,
    confirmCapital,
    preflightOpen,
    openPreflight,
    closePreflight,
    confirmStart,
    activeExecution,
    celebrate,
    closeExecution,
    selectNextOpportunity,
    currentConversation,
    typing,
    sendAiQuestion,
    createConversation,
    selectConversation,
    chooseProfileGender,
    toggleNotifications,
    toggleBenefitNews,
    toggleSettlementAlerts,
    toggleWalletAlerts,
    togglePreferKrwFirst,
    toggleCelebrateOn,
    resetPractice,
    toast,
    showToast,
  };

  return <GptContext.Provider value={value}>{children}</GptContext.Provider>;
}

export function useGpt(): GptContextValue {
  const context = useContext(GptContext);
  if (!context) throw new Error("useGpt는 GptProvider 내부에서만 사용할 수 있습니다.");
  return context;
}

export { isTerminal };
