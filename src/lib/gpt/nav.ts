export const PRIMARY_NAV_ITEMS = [
  { key: "home", label: "홈", path: "/" },
  { key: "work", label: "광산", path: "/work" },
  { key: "activity", label: "내 운용", path: "/activity" },
  { key: "wallet", label: "지갑", path: "/wallet/deposit" },
  { key: "ai", label: "퍼뜩AI", path: "/ai" },
  { key: "me", label: "내 정보", path: "/me" },
] as const;

export type PrimaryNavKey = (typeof PRIMARY_NAV_ITEMS)[number]["key"];

export function navActiveKey(pathname: string): PrimaryNavKey {
  if (pathname === "/ai" || pathname === "/me/peotteok") return "ai";
  if (pathname === "/work" || pathname.startsWith("/work/")) return "work";
  if (pathname === "/activity") return "activity";
  if (pathname === "/wallet" || pathname.startsWith("/wallet/")) return "wallet";
  if (pathname === "/me" || pathname.startsWith("/me/")) return "me";
  return "home";
}
