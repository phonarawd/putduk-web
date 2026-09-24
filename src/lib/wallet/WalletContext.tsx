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
import { hasMoneyValues, loadMoneyRead, type MoneyRead } from "@/lib/api";
import { useGptSession } from "@/lib/gpt/GptScopes";

interface WalletContextValue {
  ready: boolean;
  refreshing: boolean;
  error: string | null;
  hasValues: boolean;
  balance: {
    assetCode: "USDT";
    principalUsdt: number | null;
    principalKrw: number | null;
    lockedUsdt: number | null;
    lockedKrw: number | null;
  };
  deposit: {
    principalUsdt: number | null;
    principalKrw: number | null;
    practiceUsdt: number | null;
    practiceKrw: number | null;
  };
  trial: {
    principalUsdt: number | null;
    principalKrw: number | null;
    lockedUsdt: number | null;
  };
  withdrawable: {
    profitUsdt: number | null;
    profitKrw: number | null;
  };
  withdrawal: {
    assetCode: "USDT";
    availableUsdt: number | null;
    status: "idle";
  };
  refresh: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { sessionReady, loggedIn, userId } = useGptSession();
  const [money, setMoney] = useState<MoneyRead | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!sessionReady) return;
    if (!loggedIn) {
      setMoney(null);
      setError(null);
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      const next = await loadMoneyRead();
      setMoney(next);
      setError(null);
    } catch {
      setError("지갑 정보를 불러오지 못했어요.");
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

  const value = useMemo<WalletContextValue>(
    () => ({
      ready: sessionReady && (!loggedIn || money !== null || error !== null),
      refreshing,
      error,
      hasValues: money ? hasMoneyValues(money) : false,
      balance: {
        assetCode: "USDT",
        principalUsdt: money?.principalUsdt ?? null,
        principalKrw: money?.principalKrw ?? null,
        lockedUsdt: money?.lockedUsdt ?? null,
        lockedKrw: money?.lockedKrw ?? null,
      },
      deposit: {
        principalUsdt: money?.principalUsdt ?? null,
        principalKrw: money?.principalKrw ?? null,
        practiceUsdt: money?.practiceUsdt ?? null,
        practiceKrw: money?.practiceKrw ?? null,
      },
      trial: {
        principalUsdt: money?.trialPrincipalUsdt ?? null,
        principalKrw: money?.trialPrincipalKrw ?? null,
        lockedUsdt: money?.trialLockedUsdt ?? null,
      },
      withdrawable: {
        profitUsdt: money?.profitUsdt ?? null,
        profitKrw: money?.profitKrw ?? null,
      },
      withdrawal: {
        assetCode: "USDT",
        availableUsdt: money?.profitUsdt ?? null,
        status: "idle",
      },
      refresh,
    }),
    [sessionReady, loggedIn, money, error, refreshing, refresh],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet은 WalletProvider 내부에서만 사용할 수 있습니다.");
  return context;
}
