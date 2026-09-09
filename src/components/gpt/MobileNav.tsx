"use client";

import { useRouter } from "next/navigation";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

const NAV_ITEMS = [
  { key: "home", label: "홈", path: "/", icon: "⌂" },
  { key: "work", label: "기회", path: "/work", icon: "✓" },
  { key: "ai", label: "퍼뜩AI", path: "/ai", icon: null },
  { key: "invite", label: "초대", path: "/invite", icon: "＋" },
  { key: "me", label: "나", path: "/me", icon: "●" },
] as const;

function activeKey(pathname: string): string {
  if (pathname === "/ai" || pathname === "/me/peotteok") return "ai";
  if (pathname === "/work") return "work";
  if (pathname === "/invite") return "invite";
  if (pathname === "/me") return "me";
  return "home";
}

export function MobileNav() {
  const router = useRouter();
  const { pathname, showNav } = useAppSurface();
  const current = activeKey(pathname);

  return (
    <nav id="mobileNav" className="mobile-nav" aria-label="모바일 주요 메뉴" hidden={!showNav}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={"mobile-nav-button" + (current === item.key ? " is-active" : "")}
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
