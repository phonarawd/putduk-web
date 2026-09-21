import type { MineStatus, PositionStatus, SettlementStatus } from "./types";

export const MINE_STATUS_LABEL: Record<MineStatus, string> = {
  READY: "준비",
  ACTIVE: "가동",
  NEW_POSITIONS_PAUSED: "신규 운용 중지",
  PAUSED: "일시 정지",
  ENDED: "종료",
};

export const POSITION_STATUS_LABEL: Record<PositionStatus, string> = {
  START_PENDING: "시작 대기",
  ACTIVE: "운용 중",
  DECREASE_PENDING: "감액 처리 중",
  END_PENDING: "종료 처리 중",
  ENDED: "종료",
};

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatus, string> = {
  CALC_PENDING: "계산 대기",
  CALCULATED: "계산 완료",
  LEDGER_POSTED: "정산 완료",
  FAILED: "확인 필요",
  REVIEW_REQUIRED: "검토 필요",
};

export function formatAssetAmount(value: string | null | undefined, assetCode: string): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const [rawInteger, fraction] = trimmed.split(".");
  const negative = rawInteger.startsWith("-");
  const unsigned = negative ? rawInteger.slice(1) : rawInteger;
  const integer = unsigned.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const amount = `${negative ? "-" : ""}${integer}${fraction ? `.${fraction}` : ""}`;
  return `${amount} ${assetCode}`;
}

export function formatMiningTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
