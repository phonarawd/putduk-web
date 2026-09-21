import type { LiveProfitPosition, MiningPosition } from "./types";

export const MINING_LIVE_TICK_MS = 1_000;
export const MINING_LIVE_RESYNC_MS = 30_000;
export const MINING_LIVE_MAX_INTERPOLATION_MS = 90_000;

const DECIMAL_SCALE = 18;
const DECIMAL_FACTOR = 10n ** BigInt(DECIMAL_SCALE);
const MS_PER_DAY = 86_400_000n;

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

function parseDecimal18(raw: string | null | undefined): bigint | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * DECIMAL_FACTOR + BigInt(fraction.padEnd(DECIMAL_SCALE, "0"));
}

function formatDecimal18(value: bigint): string {
  const normalized = value < 0n ? 0n : value;
  const whole = normalized / DECIMAL_FACTOR;
  const fraction = (normalized % DECIMAL_FACTOR)
    .toString()
    .padStart(DECIMAL_SCALE, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
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

  const serverScaled = parseDecimal18(serverAmount);
  const principalScaled = parseDecimal18(position.principalAmount);
  const rateScaled = parseDecimal18(position.currentDailyRate);
  if (
    serverScaled == null ||
    principalScaled == null ||
    rateScaled == null ||
    principalScaled <= 0n ||
    rateScaled <= 0n
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
  // bounded interval. This value never mutates mining domain state, wallet balances,
  // settlements, or mutation payloads. Server responses remain authoritative.
  const elapsedMs = BigInt(Math.floor(effectiveElapsedMs));
  const incrementalScaled =
    (principalScaled * rateScaled * elapsedMs) / (DECIMAL_FACTOR * MS_PER_DAY);
  const cappedAtMs = syncedMs + Math.floor(effectiveElapsedMs);

  return {
    amount: formatDecimal18(serverScaled + incrementalScaled),
    source: incrementalScaled > 0n ? "interpolated" : "server",
    stale,
    syncedAt,
    cappedAt: new Date(cappedAtMs).toISOString(),
  };
}
