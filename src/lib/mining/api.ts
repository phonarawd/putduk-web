import { apiFetch, newIdempotencyKey } from "@/lib/api";
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
  startPosition: "/api/v1/mining/positions/start",
} as const;

type ItemList<T> = { items: T[] };

type PrincipalMutationInput = {
  principalAmount: string;
  assetCode: string;
};

type StartPositionInput = PrincipalMutationInput & {
  mineId: string;
};

function asItemList<T>(value: ItemList<T> | null | undefined): ItemList<T> {
  return { items: Array.isArray(value?.items) ? value.items : [] };
}

function positionMutationRoute(positionId: string, action: "increase" | "decrease" | "end") {
  return `/api/v1/mining/positions/${encodeURIComponent(positionId)}/${action}`;
}

function idempotencyHeaders(idempotencyKey: string): HeadersInit {
  return { "Idempotency-Key": idempotencyKey };
}

export function newMiningIdempotencyKey(): string {
  return `putduk-mine-${newIdempotencyKey()}`;
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

export function startMiningPosition(
  input: StartPositionInput,
  idempotencyKey: string,
): Promise<MiningPosition> {
  return apiFetch<MiningPosition>(MINING_USER_ROUTES.startPosition, {
    method: "POST",
    headers: idempotencyHeaders(idempotencyKey),
    body: JSON.stringify({
      mineId: input.mineId,
      principalAmount: input.principalAmount,
      assetCode: input.assetCode,
    }),
  });
}

export function increaseMiningPosition(
  positionId: string,
  input: PrincipalMutationInput,
  idempotencyKey: string,
): Promise<MiningPosition> {
  return apiFetch<MiningPosition>(positionMutationRoute(positionId, "increase"), {
    method: "POST",
    headers: idempotencyHeaders(idempotencyKey),
    body: JSON.stringify({
      principalAmount: input.principalAmount,
      assetCode: input.assetCode,
    }),
  });
}

export function decreaseMiningPosition(
  positionId: string,
  input: PrincipalMutationInput,
  idempotencyKey: string,
): Promise<MiningPosition> {
  return apiFetch<MiningPosition>(positionMutationRoute(positionId, "decrease"), {
    method: "POST",
    headers: idempotencyHeaders(idempotencyKey),
    body: JSON.stringify({
      principalAmount: input.principalAmount,
      assetCode: input.assetCode,
    }),
  });
}

export function endMiningPosition(
  positionId: string,
  idempotencyKey: string,
): Promise<MiningPosition> {
  return apiFetch<MiningPosition>(positionMutationRoute(positionId, "end"), {
    method: "POST",
    headers: idempotencyHeaders(idempotencyKey),
  });
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
