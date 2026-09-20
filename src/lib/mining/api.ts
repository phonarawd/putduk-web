import { apiFetch } from "@/lib/api";
import type {
  LiveProfitSnapshot,
  MineView,
  MiningPosition,
  MiningSettlement,
  MiningSummary,
} from "./types";

export const MINING_USER_ROUTES = {
  mines: "/api/v1/mines",
  summary: "/api/v1/mining/me/summary",
  positions: "/api/v1/mining/me/positions",
  settlements: "/api/v1/mining/me/settlements",
} as const;

type ItemList<T> = { items: T[] };

function asItemList<T>(value: ItemList<T> | null | undefined): ItemList<T> {
  return { items: Array.isArray(value?.items) ? value.items : [] };
}

export async function listMines(): Promise<MineView[]> {
  const data = await apiFetch<ItemList<MineView>>(MINING_USER_ROUTES.mines);
  return asItemList(data).items;
}

export function getMine(mineId: string): Promise<MineView> {
  return apiFetch<MineView>(`${MINING_USER_ROUTES.mines}/${encodeURIComponent(mineId)}`);
}

export function getMyMiningSummary(): Promise<MiningSummary> {
  return apiFetch<MiningSummary>(MINING_USER_ROUTES.summary);
}

export async function listMyMiningPositions(limit = 50): Promise<MiningPosition[]> {
  const data = await apiFetch<ItemList<MiningPosition>>(
    `${MINING_USER_ROUTES.positions}?limit=${Math.min(Math.max(Math.trunc(limit), 1), 50)}`,
  );
  return asItemList(data).items;
}

export function getMyMiningPosition(positionId: string): Promise<MiningPosition> {
  return apiFetch<MiningPosition>(
    `${MINING_USER_ROUTES.positions}/${encodeURIComponent(positionId)}`,
  );
}

export async function listMyMiningSettlements(limit = 100): Promise<MiningSettlement[]> {
  const data = await apiFetch<ItemList<MiningSettlement>>(
    `${MINING_USER_ROUTES.settlements}?limit=${Math.min(Math.max(Math.trunc(limit), 1), 100)}`,
  );
  return asItemList(data).items;
}

export function createLiveProfitSnapshot(
  positions: MiningPosition[],
  syncedAt: string | null,
): LiveProfitSnapshot {
  return {
    syncedAt,
    positions: Object.fromEntries(
      positions.map((position) => [
        position.positionId,
        {
          positionId: position.positionId,
          mineId: position.mineId,
          status: position.status,
          assetCode: position.assetCode,
          principalAmount: position.principalAmount,
          currentDailyRate: position.currentDailyRate,
          accruedProfitAmount: position.accruedProfitAmount,
          baselineAt: position.baselineAt,
          nextSettlementAt: position.nextSettlementAt,
        },
      ]),
    ),
  };
}
