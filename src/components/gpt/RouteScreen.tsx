import type { ReactNode } from "react";

// 공개/게이트 라우트 화면의 공통 바깥 래퍼. (원본 #routeScreen.route-screen.shell 그대로)
export function RouteScreen({ children }: { children: ReactNode }) {
  return (
    <section className="route-screen shell" aria-live="polite">
      {children}
    </section>
  );
}
