"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GATED_PATHS } from "@/lib/gpt/constants";
import { useGpt } from "@/lib/gpt/GptContext";
import { CapitalModal } from "./CapitalModal";
import { ExecutionModal } from "./ExecutionModal";
import { MobileNav } from "./MobileNav";
import { PreflightModal } from "./PreflightModal";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { Toast } from "./Toast";

// 로그인 필요한 경로를 지키고, 아니면 /login 으로 보낸다 (원본 GATED_PATHS 리다이렉트 그대로).
function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, sessionReady, state, setPendingRoute } = useGpt();
  const gated = GATED_PATHS.includes(pathname);
  const blocked = gated && !state.loggedIn;
  const needsProfile = state.loggedIn && !state.profileCompleted && pathname !== "/auth/complete-profile";

  useEffect(() => {
    if (!ready || !sessionReady) return;
    if (blocked) {
      setPendingRoute(pathname);
      router.replace("/login");
      return;
    }
    if (needsProfile) {
      router.replace("/auth/complete-profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, sessionReady, blocked, needsProfile, pathname]);

  if ((!sessionReady && gated) || blocked || needsProfile) return null;
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />

      <SiteHeader />

      <main>
        <AuthGate>{children}</AuthGate>
      </main>

      <MobileNav />
      <SiteFooter />
      <Toast />
      <CapitalModal />
      <PreflightModal />
      <ExecutionModal />
    </>
  );
}
