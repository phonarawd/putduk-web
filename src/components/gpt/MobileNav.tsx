"use client";

import { useRouter } from "next/navigation";
import {
  PRIMARY_NAV_ITEMS,
  navActiveKey,
  type PrimaryNavKey,
} from "@/lib/gpt/nav";
import { useAppSurface } from "@/lib/gpt/useAppSurface";

const NAV_ICONS: Record<PrimaryNavKey, string | null> = {
  home: "⌂",
  work: "◆",
  activity: "↗",
  wallet: "₩",
  ai: null,
  me: "●",
};

export function MobileNav() {
  const router = useRouter();
  const { pathname, showNav } = useAppSurface();
  const current = navActiveKey(pathname);

  return (
    <nav id="mobileNav" className="mobile-nav" aria-label="퍼뜩 주요 메뉴" hidden={!showNav}>
      {PRIMARY_NAV_ITEMS.map((item) => {
        const icon = NAV_ICONS[item.key];

        return (
          <button
            key={item.key}
            type="button"
            className={"mobile-nav-button" + (current === item.key ? " is-active" : "")}
            aria-current={current === item.key ? "page" : undefined}
            aria-label={`${item.label} 화면으로 이동`}
            onClick={() => router.push(item.path)}
          >
            {icon ? (
              <span aria-hidden="true">{icon}</span>
            ) : (
              <span className="mobile-nav-logo" aria-hidden="true">
                <img src="/putduk-mark.svg" alt="" />
              </span>
            )}
            <b>{item.label}</b>
          </button>
        );
      })}
    </nav>
  );
}
