"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useGptSession } from "@/lib/gpt/GptScopes";
import { useWallet } from "@/lib/wallet/WalletContext";
import {
  createLiveProfitSnapshot,
  decreaseMiningPosition,
  endMiningPosition,
  getMine,
  getMyMiningSummary,
  increaseMiningPosition,
  listMines,
  listMyMiningPositions,
  listMyMiningSettlements,
  startMiningPosition,
} from "./api";
import { MINING_LIVE_RESYNC_MS } from "./presentation";
import type {
  MineView,
  MiningPosition,
  MiningSettlement,
  MiningState,
  MiningSummary,
} from "./types";

type StartPositionMutation = {
  mineId: string;
  principalAmount: string;
  assetCode: string;
  idempotencyKey: string;
};

type PrincipalPositionMutation = {
  positionId: string;
  principalAmount: string;
  assetCode: string;
  idempotencyKey: string;
};

type EndPositionMutation = {
  positionId: string;
  idempotencyKey: string;
};

interface MiningContextValue extends MiningState {
  ready: boolean;
  refreshing: boolean;
  error: string | null;
  mutationPending: string | null;
  refresh: () => Promise<void>;
  loadMine: (mineId: string) => Promise<MineView>;
  clearActiveMine: () => void;
  startPosition: (input: StartPositionMutation) => Promise<MiningPosition>;
  increasePosition: (input: PrincipalPositionMutation) => Promise<MiningPosition>;
  decreasePosition: (input: PrincipalPositionMutation) => Promise<MiningPosition>;
  endPosition: (input: EndPositionMutation) => Promise<MiningPosition>;
}

const MiningContext = createContext<MiningContextValue | null>(null);

function upsertServerPosition(current: MiningPosition[], position: MiningPosition): MiningPosition[] {
  const exists = current.some((item) => item.positionId === position.positionId);
  if (!exists) return [position, ...current];
  return current.map((item) => (item.positionId === position.positionId ? position : item));
}

export function MiningProvider({ children }: { children: ReactNode }) {
  const { sessionReady, loggedIn, userId } = useGptSession();
  const { refresh: refreshWallet } = useWallet();
  const [mines, setMines] = useState<MineView[]>([]);
  const [activeMine, setActiveMine] = useState<MineView | null>(null);
  const [positions, setPositions] = useState<MiningPosition[]>([]);
  const [settlements, setSettlements] = useState<MiningSettlement[]>([]);
  const [summary, setSummary] = useState<MiningSummary | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mutationPending, setMutationPending] = useState<string | null>(null);
  const mutationLockRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionReady) return;
    setRefreshing(true);
    try {
      const mineItems = await listMines();
      if (!loggedIn) {
        setMines(mineItems);
        setActiveMine((current) =>
          current ? mineItems.find((mine) => mine.mineId === current.mineId) ?? current : null,
        );
        setPositions([]);
        setSettlements([]);
        setSummary(null);
        setSyncedAt(new Date().toISOString());
        setError(null);
        setReady(true);
        return;
      }

      const [nextSummary, nextPositions, nextSettlements] = await Promise.all([
        getMyMiningSummary(),
        listMyMiningPositions(),
        listMyMiningSettlements(),
      ]);
      setMines(mineItems);
      setActiveMine((current) =>
        current ? mineItems.find((mine) => mine.mineId === current.mineId) ?? current : null,
      );
      setSummary(nextSummary);
      setPositions(nextPositions);
      setSettlements(nextSettlements);
      setSyncedAt(new Date().toISOString());
      setError(null);
      setReady(true);
    } catch {
      setError("광산 정보를 불러오지 못했어요.");
      setReady(true);
    } finally {
      setRefreshing(false);
    }
  }, [sessionReady, loggedIn]);

  const loadMine = useCallback(async (mineId: string) => {
    const mine = await getMine(mineId);
    setActiveMine(mine);
    return mine;
  }, []);

  const clearActiveMine = useCallback(() => {
    setActiveMine(null);
  }, []);

  const runMutation = useCallback(
    async (
      key: string,
      request: () => Promise<MiningPosition>,
    ): Promise<MiningPosition> => {
      if (mutationLockRef.current) {
        throw new Error("다른 채굴 요청을 처리 중이에요.");
      }
      mutationLockRef.current = key;
      setMutationPending(key);
      try {
        const position = await request();
        setPositions((current) => upsertServerPosition(current, position));
        setSyncedAt(new Date().toISOString());
        await Promise.all([refresh(), refreshWallet()]);
        return position;
      } finally {
        mutationLockRef.current = null;
        setMutationPending(null);
      }
    },
    [refresh, refreshWallet],
  );

  const startPosition = useCallback(
    (input: StartPositionMutation) =>
      runMutation(`start:${input.mineId}`, () =>
        startMiningPosition(
          {
            mineId: input.mineId,
            principalAmount: input.principalAmount,
            assetCode: input.assetCode,
          },
          input.idempotencyKey,
        ),
      ),
    [runMutation],
  );

  const increasePosition = useCallback(
    (input: PrincipalPositionMutation) =>
      runMutation(`increase:${input.positionId}`, () =>
        increaseMiningPosition(
          input.positionId,
          {
            principalAmount: input.principalAmount,
            assetCode: input.assetCode,
          },
          input.idempotencyKey,
        ),
      ),
    [runMutation],
  );

  const decreasePosition = useCallback(
    (input: PrincipalPositionMutation) =>
      runMutation(`decrease:${input.positionId}`, () =>
        decreaseMiningPosition(
          input.positionId,
          {
            principalAmount: input.principalAmount,
            assetCode: input.assetCode,
          },
          input.idempotencyKey,
        ),
      ),
    [runMutation],
  );

  const endPosition = useCallback(
    (input: EndPositionMutation) =>
      runMutation(`end:${input.positionId}`, () =>
        endMiningPosition(input.positionId, input.idempotencyKey),
      ),
    [runMutation],
  );

  useEffect(() => {
    if (!sessionReady) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionReady, loggedIn, userId, refresh]);

  useEffect(() => {
    if (!sessionReady || !loggedIn) return;
    let disposed = false;
    let inFlight = false;

    const syncLivePositions = async () => {
      if (
        disposed ||
        inFlight ||
        document.visibilityState !== "visible" ||
        mutationLockRef.current
      ) {
        return;
      }
      inFlight = true;
      try {
        const nextPositions = await listMyMiningPositions();
        if (disposed) return;
        setPositions(nextPositions);
        setSyncedAt(new Date().toISOString());
      } catch {
        // Keep the last authoritative server snapshot. Presentation interpolation is
        // bounded separately and stops when the snapshot becomes stale.
      } finally {
        inFlight = false;
      }
    };

    const timer = window.setInterval(() => {
      void syncLivePositions();
    }, MINING_LIVE_RESYNC_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void syncLivePositions();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      disposed = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sessionReady, loggedIn, userId]);

  const liveProfit = useMemo(
    () => createLiveProfitSnapshot(positions, syncedAt),
    [positions, syncedAt],
  );

  const value = useMemo<MiningContextValue>(
    () => ({
      mines,
      activeMine,
      positions,
      liveProfit,
      settlements,
      summary,
      ready,
      refreshing,
      error,
      mutationPending,
      refresh,
      loadMine,
      clearActiveMine,
      startPosition,
      increasePosition,
      decreasePosition,
      endPosition,
    }),
    [
      mines,
      activeMine,
      positions,
      liveProfit,
      settlements,
      summary,
      ready,
      refreshing,
      error,
      mutationPending,
      refresh,
      loadMine,
      clearActiveMine,
      startPosition,
      increasePosition,
      decreasePosition,
      endPosition,
    ],
  );

  return <MiningContext.Provider value={value}>{children}</MiningContext.Provider>;
}

export function useMining(): MiningContextValue {
  const context = useContext(MiningContext);
  if (!context) throw new Error("useMining은 MiningProvider 내부에서만 사용할 수 있습니다.");
  return context;
}
