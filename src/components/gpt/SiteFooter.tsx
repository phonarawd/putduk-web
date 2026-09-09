"use client";

import { useRouter } from "next/navigation";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

export function SiteFooter() {
  const router = useRouter();
  const { showFooter } = useAppSurface();

  return (
    <footer id="siteFooter" className="site-footer" hidden={!showFooter}>
      <div className="shell">
        <span>퍼뜩 리셀러 데스크</span>
        <button type="button" onClick={() => router.push("/legal")}>
          약관과 정보
        </button>
      </div>
    </footer>
  );
}
