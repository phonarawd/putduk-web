"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useGptSession } from "@/lib/gpt/GptScopes";
import {
  createLiveProfitSnapshot,
  getMyMiningSummary,
  listMines,
  listMyMiningPositions,
  listMyMiningSettlements,
} from "./api";
import type {
  MineView,
  MiningPosition,
  MiningSettlement,
  MiningState,
  MiningSummary,
} from "./types";

interface MiningContextValue extends MiningState {
  ready: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MiningContext = createContext<MiningContextValue | null>(null);

export function MiningProvider({ children }: { children: ReactNode }) {
  const { sessionReady, loggedIn, userId } = useGptSession();
  const [mines, setMines] = useState<MineView[]>([]);
  const [positions, setPositions] = useState<MiningPosition[]>([]);
  const [settlements, setSettlements] = useState<MiningSettlement[]>([]);
  const [summary, setSummary] = useState<MiningSummary | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!sessionReady) return;
    setRefreshing(true);
    try {
      const mineItems = await listMines();
      if (!loggedIn) {
        setMines(mineItems);
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

  useEffect(() => {
    if (!sessionReady) return;
    const timer = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [sessionReady, loggedIn, userId, refresh]);

  const liveProfit = useMemo(
    () => createLiveProfitSnapshot(positions, syncedAt),
    [positions, syncedAt],
  );

  const value = useMemo<MiningContextValue>(
    () => ({
      mines,
      positions,
      liveProfit,
      settlements,
      summary,
      ready,
      refreshing,
      error,
      refresh,
    }),
    [mines, positions, liveProfit, settlements, summary, ready, refreshing, error, refresh],
  );

  return <MiningContext.Provider value={value}>{children}</MiningContext.Provider>;
}

export function useMining(): MiningContextValue {
  const context = useContext(MiningContext);
  if (!context) throw new Error("useMining은 MiningProvider 내부에서만 사용할 수 있습니다.");
  return context;
}
