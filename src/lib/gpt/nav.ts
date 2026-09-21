export const PRIMARY_NAV_ITEMS = [
  { key: "home", label: "홈", path: "/" },
  { key: "work", label: "광산", path: "/work" },
  { key: "ai", label: "퍼뜩AI", path: "/ai" },
  { key: "invite", label: "초대", path: "/invite" },
  { key: "me", label: "나", path: "/me" },
] as const;

export type PrimaryNavKey = (typeof PRIMARY_NAV_ITEMS)[number]["key"];

export function navActiveKey(pathname: string): PrimaryNavKey {
  if (pathname === "/ai" || pathname === "/me/peotteok") return "ai";
  if (pathname === "/work" || pathname.startsWith("/work/") || pathname === "/activity") return "work";
  if (pathname === "/invite") return "invite";
  if (pathname === "/me" || pathname.startsWith("/me/") || pathname.startsWith("/wallet/")) return "me";
  return "home";
}
