import type { ChatMessage, Evidence } from "./types";

export function conversationGreeting(): ChatMessage {
  return {
    role: "assistant",
    text: "궁금한 내용을 입력해 주세요. 확인된 숫자만 말씀드리고, 출금이나 참여는 대신하지 않아요.",
    evidence: [
      { label: "홈에서 기회 보기", route: "/" },
      { label: "내 지갑 보기", route: "/me" },
    ],
    createdAt: new Date().toISOString(),
  };
}

const DEEP_LINKS: Record<string, Evidence> = {
  "/": { label: "홈에서 기회 보기", route: "/" },
  "/me": { label: "내 지갑 보기", route: "/me" },
  "/me/benefits": { label: "혜택 보기", route: "/me/benefits" },
  "/me/invite": { label: "친구 초대 보기", route: "/invite" },
  "/invite": { label: "친구 초대 보기", route: "/invite" },
  "/me/kyc": { label: "본인확인 시작", route: "/me/kyc" },
  "/me/support": { label: "고객지원 보기", route: "/me/support" },
  "/me/wallet/withdraw": { label: "출금 화면 열기", route: "/wallet/withdraw" },
  "/wallet/withdraw": { label: "출금 화면 열기", route: "/wallet/withdraw" },
  "/wallet/deposit": { label: "입금 화면 열기", route: "/wallet/deposit" },
  "/wallet/usdt-guide": { label: "테더 준비 보기", route: "/wallet/usdt-guide" },
};

export function evidenceFromDeepLink(deepLink: string | null): Evidence[] {
  if (!deepLink || !deepLink.startsWith("/") || deepLink.startsWith("//")) return [];
  const found = DEEP_LINKS[deepLink];
  return found ? [found] : [];
}
