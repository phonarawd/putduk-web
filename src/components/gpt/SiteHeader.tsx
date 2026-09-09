"use client";

import { useRouter } from "next/navigation";
import { useGpt } from "@/lib/gpt/GptContext";
import { navActiveKey } from "@/lib/gpt/nav";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

const NAV_ITEMS = [
  { key: "home", label: "홈", path: "/" },
  { key: "work", label: "기회", path: "/work" },
  { key: "ai", label: "퍼뜩AI", path: "/ai" },
  { key: "invite", label: "초대", path: "/invite" },
  { key: "me", label: "나", path: "/me" },
] as const;

export function SiteHeader() {
  const router = useRouter();
  const { state } = useGpt();
  const { pathname, showNav } = useAppSurface();
  const current = navActiveKey(pathname);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <button id="brandHome" className="brand" type="button" aria-label="홈 화면으로 이동" onClick={() => router.push("/")}>
          <span className="brand-mark" aria-hidden="true">
            <img src="/putduk-mark.svg" alt="" />
          </span>
          <span className="brand-copy">
            <b>퍼뜩</b>
            <small>리셀러 데스크</small>
          </span>
        </button>

        <nav id="desktopNav" className="desktop-nav" aria-label="주요 메뉴" hidden={!showNav}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={"nav-button" + (current === item.key ? " is-active" : "")}
              aria-current={current === item.key ? "page" : undefined}
              aria-label={`${item.label} 화면으로 이동`}
              onClick={() => router.push(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            id="headerLogin"
            className="reset-button"
            type="button"
            hidden={state.loggedIn}
            aria-label="로그인 화면으로 이동"
            onClick={() => router.push("/login")}
          >
            로그인
          </button>
          <span id="headerReseller" className="header-reseller" hidden={!state.loggedIn}>
            {state.resellerId || state.displayName || "리셀러"}
          </span>
        </div>
      </div>
    </header>
  );
}
