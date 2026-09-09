import type { ChatMessage } from "./types";

export function conversationGreeting(): ChatMessage {
  return {
    role: "assistant",
    text: "궁금한 내용을 입력해 주세요. 답변 연결을 준비하고 있어요. 지금은 홈에서 기회와 지갑을 직접 확인해 주세요.",
    evidence: [
      { label: "홈에서 기회 보기", route: "/" },
      { label: "내 지갑 보기", route: "/me" },
    ],
    createdAt: new Date().toISOString(),
  };
}

export const AI_UNAVAILABLE_REPLY =
  "아직 퍼뜩AI 답변을 연결하는 중이에요. 질문은 이 기기에 남겨 두었고, 지금은 자동 답변을 드릴 수 없어요. 홈에서 기회와 지갑을 직접 확인해 주세요.";
