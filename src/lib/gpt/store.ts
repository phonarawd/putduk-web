import { conversationGreeting } from "./ai";
import {
  applyDevicePrefs,
  clearAccountStorage,
  createFreshState,
  defaultState,
  readDevicePrefs,
  readStoredState,
  writeStoredState,
} from "./state";
import type { GptState } from "./types";

type Listener = () => void;
type Updater = GptState | ((prev: GptState) => GptState);

let currentState: GptState = defaultState();
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function ensureConversation(state: GptState): GptState {
  if (state.conversations.length && state.conversations.some((item) => item.id === state.activeConversationId)) {
    return state;
  }
  if (state.conversations.length) {
    return { ...state, activeConversationId: state.conversations[0].id };
  }
  const now = Date.now();
  const id = "talk-" + now.toString(36);
  return {
    ...state,
    conversations: [
      { id, title: "새 대화", updatedAt: new Date().toISOString(), messages: [conversationGreeting()] },
    ],
    activeConversationId: id,
  };
}

const serverSnapshot: GptState = defaultState();

export function getSnapshot(): GptState {
  return currentState;
}

export function getServerSnapshot(): GptState {
  return serverSnapshot;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function getHydratedServerSnapshot(): boolean {
  return false;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    currentState = readStoredState();
    emit();
  }
  return () => {
    listeners.delete(listener);
  };
}

export function setStoreState(updater: Updater): void {
  const next = typeof updater === "function" ? (updater as (prev: GptState) => GptState)(currentState) : updater;
  currentState = next;
  writeStoredState(currentState);
  emit();
}

export function clearAccountState(): void {
  const userId = currentState.userId;
  clearAccountStorage(userId);
  currentState = applyDevicePrefs(createFreshState(), readDevicePrefs());
  writeStoredState(currentState);
  emit();
}
