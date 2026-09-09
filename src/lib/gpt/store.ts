// GPT 데스크 UI 이식 - localStorage 연습 상태를 위한 외부 스토어
// useSyncExternalStore로 읽어서, 서버 렌더링/첫 하이드레이션에는 항상 같은 값(defaultState)을 쓰고
// 마운트 이후에만 실제 localStorage 값으로 갈아끼운다. (effect 안에서 setState를 부르지 않기 위함)

import { conversationGreeting } from "./ai";
import { defaultState, readStoredState, writeStoredState } from "./state";
import type { GptState } from "./types";

type Listener = () => void;
type Updater = GptState | ((prev: GptState) => GptState);

let currentState: GptState = defaultState();
let hydrated = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function ensureConversation(state: GptState): GptState {
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
    currentState = ensureConversation(readStoredState());
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
