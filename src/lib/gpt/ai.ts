import { formatKrw, formatUsdt } from "./format";
import { selectedOpportunity } from "./opportunities";
import type { ChatMessage, Evidence, GptState } from "./types";

function moneyLine(usdt: number | null | undefined, krw: number | null | undefined): string {
  if (usdt != null) {
    return krw != null ? `${formatUsdt(usdt)} (${formatKrw(krw)})` : formatUsdt(usdt);
  }
  if (krw != null) return formatKrw(krw);
  return formatUsdt(0);
}

export function conversationGreeting(state: GptState, _now: number): ChatMessage {
  const opportunity = selectedOpportunity(state);
  const suggestion = opportunity.id
    ? "지금은 " + opportunity.title + "을 먼저 살펴보시는 게 좋아요."
    : "조건이 맞는 기회가 생기면 홈에서 보여 드려요.";
  return {
    role: "assistant",
    text:
      "다시 만나서 반가워요" +
      (state.displayName ? ", " + state.displayName + "님" : "") +
      "! 지금 내 예치는 " +
      formatUsdt(state.principalUsdt) +
      "이고 체험 원금은 " +
      formatUsdt(state.trial.trialPrincipalUsdt) +
      "이에요. " +
      suggestion,
    evidence: [
      { label: "이 기회 보기", route: "/" },
      { label: "잔액은 지갑 기준이에요", route: "/me" },
    ],
    createdAt: new Date().toISOString(),
  };
}

export interface AiReply {
  text: string;
  evidence: Evidence[];
}

export function buildAiReply(question: string, state: GptState, _now: number): AiReply {
  const normalized = String(question || "").trim().toLowerCase();
  const opportunity = selectedOpportunity(state);
  const remaining = state.trial.participationsRemaining;
  const principal = formatUsdt(state.principalUsdt);
  const profit = moneyLine(state.profitUsdt, state.profitKrw);
  const locked = moneyLine(state.lockedUsdt, state.lockedKrw);

  if (/바빠|응답.?없|연결|오류/.test(normalized)) {
    return {
      text: "지금은 잠시 바빠요. 조금 뒤 다시 물어봐 주세요.",
      evidence: [{ label: "홈에서 직접 확인", route: "/" }],
    };
  }
  if (/출금|빼고|인출/.test(normalized)) {
    return {
      text:
        "출금은 지갑에서 직접 해 주세요. 지금 화면에 확인되는 출금 가능 수익은 " +
        profit +
        "이에요. 체험 원금과 연습 잔액은 출금할 수 없어요.",
      evidence: [
        { label: "출금 화면 열기", route: "/wallet/withdraw" },
        { label: "잔액은 지갑 기준이에요", route: "/me" },
      ],
    };
  }
  if (/충전|입금|자본|모자|부족/.test(normalized)) {
    return {
      text: "지금 내 예치는 " + principal + "이에요. 입금은 이용료가 아니라 내 운용 자본이에요.",
      evidence: [
        { label: "입금 화면 열기", route: "/wallet/deposit" },
        { label: "이 기회 보기", route: "/" },
      ],
    };
  }
  if (/기회|오늘|수익|매칭|추천/.test(normalized)) {
    const need = opportunity.requiredUsdt != null ? formatUsdt(opportunity.requiredUsdt) : "서버가 고른 금액";
    return {
      text:
        (remaining != null ? "남은 참여는 " + remaining + "회예요. " : "") +
        (opportunity.id ? "지금 고른 " + opportunity.title + "은 " + need + "이 필요해요." : "아직 확인할 기회가 없어요."),
      evidence: [
        { label: "이 기회 보기", route: "/" },
        { label: "완료 기록 보기", route: "/me" },
      ],
    };
  }
  if (/혜택|친구|초대|코드/.test(normalized)) {
    return {
      text: "초대 횟수는 화면에서 더하지 않아요. 친구 초대 화면의 값을 그대로 보세요.",
      evidence: [{ label: "친구 초대 보기", route: "/invite" }],
    };
  }
  if (/본인|확인|신분|서류/.test(normalized)) {
    return {
      text:
        state.kycStatus === "verified"
          ? "본인확인이 끝난 상태예요. 이제 지갑에서 출금 금액을 직접 입력할 수 있어요."
          : "출금 전에 본인확인이 필요해요. 이름, 휴대폰, 생년월일만 확인하며 주민번호는 받지 않아요.",
      evidence: [
        {
          label: state.kycStatus === "verified" ? "출금 화면 열기" : "본인확인 시작",
          route: state.kycStatus === "verified" ? "/wallet/withdraw" : "/me/kyc",
        },
      ],
    };
  }
  if (/테더|usdt|트론/.test(normalized)) {
    return {
      text: "테더는 안내된 주소로만 보내 주세요. 주소 앞뒤 글자를 다시 본 뒤 직접 전송해 주세요.",
      evidence: [
        { label: "테더 준비 보기", route: "/wallet/usdt-guide" },
        { label: "입금 주소 보기", route: "/wallet/deposit" },
      ],
    };
  }
  if (/잠금|진행|하고 있|상태/.test(normalized)) {
    return {
      text: "지금 진행 중 잠금은 " + locked + "이고 내 예치는 " + principal + "이에요.",
      evidence: [
        { label: "완료 기록 보기", route: "/me" },
        { label: "잔액은 지갑 기준이에요", route: "/me" },
      ],
    };
  }
  return {
    text:
      "질문해 주신 내용을 내 데스크 기준으로 살펴봤어요. 지금 내 예치는 " +
      principal +
      ", 출금 가능 수익은 " +
      profit +
      (remaining != null ? ", 남은 참여는 " + remaining + "회" : "") +
      "예요. 저는 화면에 확인되는 숫자만 말씀드리고, 참여나 출금 버튼은 대신 누르지 않아요.",
    evidence: [
      { label: "홈에서 기회 보기", route: "/" },
      { label: "잔액은 지갑 기준이에요", route: "/me" },
    ],
  };
}
