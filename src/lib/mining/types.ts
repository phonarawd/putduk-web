export type MineStatus =
  | "READY"
  | "ACTIVE"
  | "NEW_POSITIONS_PAUSED"
  | "PAUSED"
  | "ENDED";

export type PositionStatus =
  | "START_PENDING"
  | "ACTIVE"
  | "DECREASE_PENDING"
  | "END_PENDING"
  | "ENDED";

export type SettlementStatus =
  | "CALC_PENDING"
  | "CALCULATED"
  | "LEDGER_POSTED"
  | "FAILED"
  | "REVIEW_REQUIRED";

export type MiningMutationKind = "start" | "increase" | "decrease" | "end";

export interface MineView {
  mineId: string;
  status: MineStatus;
  displayName: string;
  description: string;
  assetCode: string;
  minPrincipalAmount: string | null;
  maxPrincipalAmount: string | null;
  currentDailyRate: string | null;
}

export interface MiningSummary {
  assetCode: string;
  principalAmount: string;
  profitAmount: string;
  lockedPrincipalAmount: string;
  activePrincipalAmount: string;
  activePositionCount: number;
  settledProfitAmount: string;
  lastSettledAt: string | null;
}

export interface MiningPosition {
  positionId: string;
  mineId: string;
  status: PositionStatus;
  principalAmount: string;
  assetCode: string;
  currentDailyRate: string | null;
  accruedProfitAmount: string;
  baselineAt: string | null;
  nextSettlementAt: string | null;
  endedAt: string | null;
}

export interface MiningSettlement {
  settlementId: string;
  positionId: string;
  status: SettlementStatus;
  periodStartAt: string | null;
  periodEndAt: string | null;
  profitAmount: string;
  assetCode: string;
  ledgerJournalId: string | null;
}

export interface LiveProfitPosition {
  positionId: string;
  mineId: string;
  status: PositionStatus;
  assetCode: string;
  principalAmount: string;
  currentDailyRate: string | null;
  accruedProfitAmount: string;
  baselineAt: string | null;
  nextSettlementAt: string | null;
}

export interface LiveProfitSnapshot {
  syncedAt: string | null;
  positions: Record<string, LiveProfitPosition>;
}

export interface MiningState {
  mines: MineView[];
  activeMine: MineView | null;
  positions: MiningPosition[];
  liveProfit: LiveProfitSnapshot;
  settlements: MiningSettlement[];
  summary: MiningSummary | null;
}
