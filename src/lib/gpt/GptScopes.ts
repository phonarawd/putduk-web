"use client";

import { useGpt } from "./GptContext";

/**
 * PHASE07 public session surface.
 *
 * GptContext still carries legacy reseller-desk state for compatibility while
 * PHASE08+ moves screens onto domain contexts. New mining/wallet code should
 * consume this scoped hook instead of reaching into the full legacy state.
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
    displayName: gpt.state.displayName,
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

/** PUTDUK AI owns conversation state only; it does not own mining money. */
export function usePutdukAi() {
  const gpt = useGpt();
  return {
    currentConversation: gpt.currentConversation,
    typing: gpt.typing,
    sendAiQuestion: gpt.sendAiQuestion,
    createConversation: gpt.createConversation,
    selectConversation: gpt.selectConversation,
    resetConversation: gpt.resetPractice,
  };
}

/** Common UI feedback/settings that are shared across domain screens. */
export function useCommonUi() {
  const gpt = useGpt();
  return {
    toast: gpt.toast,
    showToast: gpt.showToast,
    chooseProfileGender: gpt.chooseProfileGender,
    toggleNotifications: gpt.toggleNotifications,
    toggleBenefitNews: gpt.toggleBenefitNews,
    toggleSettlementAlerts: gpt.toggleSettlementAlerts,
    toggleWalletAlerts: gpt.toggleWalletAlerts,
    togglePreferKrwFirst: gpt.togglePreferKrwFirst,
    toggleCelebrateOn: gpt.toggleCelebrateOn,
  };
}
