"use client";

import { useRouter } from "next/navigation";
import { navActiveKey } from "@/lib/gpt/nav";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

const NAV_ITEMS = [
  { key: "home", label: "홈", path: "/", icon: "⌂" },
  { key: "work", label: "기회", path: "/work", icon: "✓" },
  { key: "ai", label: "퍼뜩AI", path: "/ai", icon: null },
  { key: "invite", label: "초대", path: "/invite", icon: "＋" },
  { key: "me", label: "나", path: "/me", icon: "●" },
] as const;

export function MobileNav() {
  const router = useRouter();
  const { pathname, showNav } = useAppSurface();
  const current = navActiveKey(pathname);

  return (
    <nav id="mobileNav" className="mobile-nav" aria-label="주요 메뉴" hidden={!showNav}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={"mobile-nav-button" + (current === item.key ? " is-active" : "")}
          aria-current={current === item.key ? "page" : undefined}
          aria-label={`${item.label} 화면으로 이동`}
          onClick={() => router.push(item.path)}
        >
          {item.icon ? (
            <span aria-hidden="true">{item.icon}</span>
          ) : (
            <span className="mobile-nav-logo" aria-hidden="true">
              <img src="/putduk-mark.svg" alt="" />
            </span>
          )}
          <b>{item.label}</b>
        </button>
      ))}
    </nav>
  );
}
