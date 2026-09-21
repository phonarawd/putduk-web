"use client";

import { useGpt } from "./GptContext";

/**
 * Public session/profile surface.
 *
 * Mining/wallet code must consume their domain contexts instead of reaching
 * into the full legacy GPT state.
 */
export function useGptSession() {
  const gpt = useGpt();
  return {
    ready: gpt.ready,
    sessionReady: gpt.sessionReady,
    sessionUnreachable: gpt.sessionUnreachable,
    loggedIn: gpt.state.loggedIn,
    userId: gpt.state.userId,
    email: gpt.state.email,
    resellerId: gpt.state.resellerId,
    issuedAt: gpt.state.issuedAt,
    displayName: gpt.state.displayName,
    birthday: gpt.state.birthday,
    gender: gpt.state.gender,
    phone: gpt.state.phone,
    authMethod: gpt.state.authMethod,
    profileCompleted: gpt.state.profileCompleted,
    markPasswordAuth: gpt.markPasswordAuth,
    markGoogleAuth: gpt.markGoogleAuth,
    submitClassicSignupProfile: gpt.submitClassicSignupProfile,
    completeGoogleProfile: gpt.completeGoogleProfile,
    cancelGoogleOnboarding: gpt.cancelGoogleOnboarding,
    logout: gpt.logout,
    setPendingRoute: gpt.setPendingRoute,
    navigateAfterAuth: gpt.navigateAfterAuth,
  };
}

/** PUTDUK AI owns conversation state only; it does not own mining or wallet money. */
export function usePutdukAi() {
  const gpt = useGpt();
  return {
    conversations: gpt.state.conversations,
    activeConversationId: gpt.state.activeConversationId,
    currentConversation: gpt.currentConversation,
    typing: gpt.typing,
    sendAiQuestion: gpt.sendAiQuestion,
    createConversation: gpt.createConversation,
    selectConversation: gpt.selectConversation,
    resetConversation: gpt.resetPractice,
  };
}

/** Common UI feedback and device-local presentation preferences. */
export function useCommonUi() {
  const gpt = useGpt();
  return {
    toast: gpt.toast,
    showToast: gpt.showToast,
    notificationsEnabled: gpt.state.notificationsEnabled,
    benefitNews: gpt.state.benefitNews,
    settlementAlerts: gpt.state.settlementAlerts,
    walletAlerts: gpt.state.walletAlerts,
    preferKrwFirst: gpt.state.preferKrwFirst,
    celebrateOn: gpt.state.celebrateOn,
    chooseProfileGender: gpt.chooseProfileGender,
    toggleNotifications: gpt.toggleNotifications,
    toggleBenefitNews: gpt.toggleBenefitNews,
    toggleSettlementAlerts: gpt.toggleSettlementAlerts,
    toggleWalletAlerts: gpt.toggleWalletAlerts,
    togglePreferKrwFirst: gpt.togglePreferKrwFirst,
    toggleCelebrateOn: gpt.toggleCelebrateOn,
  };
}

/**
 * Opportunity/trial/execution/record surface.
 *
 * Values here are server-derived opportunity/trial/trade state owned by the
 * GPT desk flow. Wallet balances are intentionally excluded; WalletContext
 * remains the consumer money authority.
 */
export function useOpportunityFlow() {
  const gpt = useGpt();
  return {
    trial: gpt.state.trial,
    feed: gpt.state.feed,
    selectedId: gpt.state.selectedId,
    trades: gpt.state.trades,
    recordsError: gpt.state.recordsError,
    deskReady: gpt.state.deskReady,
    selected: gpt.selected,
    opportunities: gpt.opportunities,
    selectOpportunity: gpt.selectOpportunity,
    refreshQuotes: gpt.refreshQuotes,
    preflightOpen: gpt.preflightOpen,
    openPreflight: gpt.openPreflight,
    closePreflight: gpt.closePreflight,
    confirmStart: gpt.confirmStart,
    activeExecution: gpt.activeExecution,
    celebrate: gpt.celebrate,
    closeExecution: gpt.closeExecution,
    selectNextOpportunity: gpt.selectNextOpportunity,
  };
}
