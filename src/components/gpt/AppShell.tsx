"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { isGatedPath } from "@/lib/gpt/constants";
import { useGpt } from "@/lib/gpt/GptContext";
import { MSG } from "@/lib/messages";
import { OfflineNotice } from "./OfflineNotice";
import { ReadyNotice } from "./ReadyNotice";
import { MobileNav } from "./MobileNav";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { Toast } from "./Toast";

// 사전점검/실행 모달은 로그인 후 실제로 열 때만 필요하다. 비로그인 공개 화면(로그인·가입 등)은
// 절대 열지 않으므로 초기 번들에서 빼고, 실제로 open 상태가 될 때만 청크를 가져온다. (로드 시점만 변경, 동작은 그대로)
const PreflightModal = dynamic(() => import("./PreflightModal").then((mod) => mod.PreflightModal), { ssr: false });
const ExecutionModal = dynamic(() => import("./ExecutionModal").then((mod) => mod.ExecutionModal), { ssr: false });

function subscribeOnline(onStoreChange: () => void) {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function readOffline(): boolean {
  return navigator.onLine === false;
}

// 로그인 필요한 경로를 지키고, 아니면 /login 으로 보낸다 (원본 GATED_PATHS 리다이렉트 그대로).
function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, sessionReady, sessionUnreachable, state, setPendingRoute, showToast } = useGpt();
  const netOffline = useSyncExternalStore(subscribeOnline, readOffline, () => false);
  const gated = isGatedPath(pathname);
  const blocked = gated && !state.loggedIn;
  const needsProfile = state.loggedIn && !state.profileCompleted && pathname !== "/auth/complete-profile";
  const offlineNow = netOffline || sessionUnreachable;

  useEffect(() => {
    if (offlineNow) return;
    if (!ready || !sessionReady) return;
    if (blocked) {
      setPendingRoute(pathname);
      showToast(MSG.loginReturn, "security");
      router.replace("/login");
      return;
    }
    if (needsProfile) {
      router.replace("/auth/complete-profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineNow, ready, sessionReady, blocked, needsProfile, pathname]);

  if (offlineNow && gated) {
    return <OfflineNotice />;
  }

  if ((!sessionReady && gated) || blocked || needsProfile) {
    return (
      <section className="route-screen shell" aria-live="polite">
        <ReadyNotice waiting title={MSG.screenWait} copy={MSG.screenWaitCopy} />
      </section>
    );
  }
  return <>{children}</>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { preflightOpen, activeExecution } = useGpt();

  return (
    <div className="app-frame">
      <div className="page-glow page-glow-one" aria-hidden="true" />
      <div className="page-glow page-glow-two" aria-hidden="true" />

      <div className="app-shell">
        <SiteHeader />
        <main>
          <AuthGate>{children}</AuthGate>
        </main>
        <SiteFooter />
      </div>

      <MobileNav />
      <Toast />
      {preflightOpen ? <PreflightModal /> : null}
      {activeExecution ? <ExecutionModal /> : null}
    </div>
  );
}
