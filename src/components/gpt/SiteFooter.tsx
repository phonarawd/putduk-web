"use client";

import { useRouter } from "next/navigation";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

export function SiteFooter() {
  const router = useRouter();
  const { showFooter } = useAppSurface();

  return (
    <footer id="siteFooter" className="site-footer" hidden={!showFooter}>
      <div className="shell site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand">
            <p className="site-footer-title">퍼뜩 리셀러 데스크</p>
            <button
              type="button"
              className="site-footer-trust-link"
              aria-label="운영 정보 화면으로 이동"
              onClick={() => router.push("/legal/recognition")}
            >
              <span className="site-footer-trust-stack">
                <span className="site-footer-trust-item">
                  <i aria-hidden="true" />
                  운영 정보 확인
                </span>
                <span className="site-footer-trust-sep" aria-hidden="true">
                  ·
                </span>
                <span>서비스 운영 기준</span>
              </span>
            </button>
          </div>
          <nav className="site-footer-legal" aria-label="법적 정보">
            <button type="button" aria-label="약관과 정보 화면으로 이동" onClick={() => router.push("/legal")}>
              약관과 정보
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
}
