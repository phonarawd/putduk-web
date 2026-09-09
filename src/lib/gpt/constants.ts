export const STORAGE_KEY = "putduk-web-gpt-v2";

export const VIEW_PATHS = {
  home: "/",
  work: "/work",
  ai: "/ai",
  invite: "/invite",
  me: "/me",
} as const;

export type ViewKey = keyof typeof VIEW_PATHS;

export const GATED_PATHS = [
  "/work",
  "/invite",
  "/me",
  "/wallet/deposit",
  "/wallet/withdraw",
  "/wallet/history",
  "/wallet/usdt-guide",
  "/me/kyc",
  "/me/inbox",
  "/me/settings",
  "/me/benefits",
  "/me/membership",
  "/me/support",
  "/me/notices",
  "/me/events",
];

export const WORKSPACE_PATHS = ["/", "/work", "/ai", "/me/peotteok", "/invite", "/me"];

export const EXECUTION_STEPS = [
  { short: "자본 확인", active: "이번 업무에 사용할 운용 자본을 확인하고 있어요." },
  { short: "시세 확인", active: "공식 네트워크의 가격 조건을 다시 비교하고 있어요." },
  { short: "상품 매칭", active: "조건이 맞는 상품을 퍼뜩이 연결하고 있어요." },
  { short: "정산 준비", active: "매칭 결과와 정산 금액을 확인하고 있어요." },
  { short: "지갑 반영", active: "원금과 수익을 지갑에 반영하고 있어요." },
];
