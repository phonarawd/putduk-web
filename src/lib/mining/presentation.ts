import type {
  LiveProfitPosition,
  MineStatus,
  MiningPosition,
  PositionStatus,
  SettlementStatus,
} from "./types";

export const MINING_LIVE_TICK_MS = 1_000;
export const MINING_LIVE_RESYNC_MS = 30_000;
export const MINING_LIVE_MAX_INTERPOLATION_MS = 90_000;

const MS_PER_DAY = 86_400_000;
const MAX_PRESENTATION_FRACTION_DIGITS = 12;

type PresentationPosition = Pick<
  MiningPosition | LiveProfitPosition,
  | "status"
  | "principalAmount"
  | "currentDailyRate"
  | "accruedProfitAmount"
  | "baselineAt"
  | "nextSettlementAt"
>;

export type LiveMiningPresentation = {
  amount: string;
  source: "server" | "interpolated";
  stale: boolean;
  syncedAt: string | null;
  cappedAt: string | null;
};

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

function parsePresentationDecimal(raw: string | null | undefined): number | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatPresentationAmount(value: number): string | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const fixed = value.toFixed(MAX_PRESENTATION_FRACTION_DIGITS);
  return fixed.replace(/\.?0+$/, "") || "0";
}

function parseIsoMs(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function presentLiveMiningProfit(
  position: PresentationPosition,
  syncedAt: string | null,
  nowMs: number | null,
): LiveMiningPresentation {
  const serverAmount = position.accruedProfitAmount || "0";
  const syncedMs = parseIsoMs(syncedAt);
  const baselineMs = parseIsoMs(position.baselineAt);
  const nextSettlementMs = parseIsoMs(position.nextSettlementAt);

  if (
    position.status !== "ACTIVE" ||
    nowMs == null ||
    syncedMs == null ||
    baselineMs == null ||
    baselineMs > syncedMs ||
    nowMs <= syncedMs
  ) {
    return {
      amount: serverAmount,
      source: "server",
      stale: false,
      syncedAt,
      cappedAt: null,
    };
  }

  const serverValue = parsePresentationDecimal(serverAmount);
  const principal = parsePresentationDecimal(position.principalAmount);
  const rate = parsePresentationDecimal(position.currentDailyRate);
  if (
    serverValue == null ||
    principal == null ||
    rate == null ||
    principal <= 0 ||
    rate <= 0
  ) {
    return {
      amount: serverAmount,
      source: "server",
      stale: false,
      syncedAt,
      cappedAt: null,
    };
  }

  const rawElapsedMs = nowMs - syncedMs;
  const settlementElapsedMs =
    nextSettlementMs != null ? Math.max(0, nextSettlementMs - syncedMs) : Number.POSITIVE_INFINITY;
  const effectiveElapsedMs = Math.min(
    rawElapsedMs,
    settlementElapsedMs,
    MINING_LIVE_MAX_INTERPOLATION_MS,
  );
  const stale =
    rawElapsedMs > MINING_LIVE_MAX_INTERPOLATION_MS ||
    (nextSettlementMs != null && nowMs >= nextSettlementMs);

  if (!Number.isFinite(effectiveElapsedMs) || effectiveElapsedMs <= 0) {
    return {
      amount: serverAmount,
      source: "server",
      stale,
      syncedAt,
      cappedAt: stale && nextSettlementMs != null ? new Date(nextSettlementMs).toISOString() : null,
    };
  }

  // Presentation only: extend the latest server-computed accrued amount for a short,
  // bounded interval. This never mutates domain state or financial mutation payloads.
  const incremental = (principal * rate * effectiveElapsedMs) / MS_PER_DAY;
  const presentedAmount = formatPresentationAmount(serverValue + incremental);
  if (presentedAmount == null) {
    return {
      amount: serverAmount,
      source: "server",
      stale,
      syncedAt,
      cappedAt: null,
    };
  }

  const cappedAtMs = syncedMs + Math.floor(effectiveElapsedMs);
  return {
    amount: presentedAmount,
    source: incremental > 0 ? "interpolated" : "server",
    stale,
    syncedAt,
    cappedAt: new Date(cappedAtMs).toISOString(),
  };
}

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
