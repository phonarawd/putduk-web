"use client";

import type { ReactNode } from "react";
import { MiningProvider } from "@/lib/mining/MiningContext";
import { WalletProvider } from "@/lib/wallet/WalletContext";
import { GptProvider } from "./GptContext";

/**
 * PHASE07 provider boundary.
 *
 * GptProvider owns session / PUTDUK AI / common UI compatibility.
 * WalletProvider owns wallet read state.
 * MiningProvider owns mine / position / live-profit / settlement read state.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GptProvider>
      <WalletProvider>
        <MiningProvider>{children}</MiningProvider>
      </WalletProvider>
    </GptProvider>
  );
}
