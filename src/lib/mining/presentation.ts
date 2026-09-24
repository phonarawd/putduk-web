import type { LiveProfitPosition, MiningPosition } from "./types";

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
  // bounded interval. This is intentionally approximate and never mutates mining
  // domain state, wallet balances, settlements, or mutation payloads. Server responses
  // remain authoritative for all financial truth.
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
