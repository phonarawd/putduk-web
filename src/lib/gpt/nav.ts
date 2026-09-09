export function navActiveKey(pathname: string): "home" | "work" | "ai" | "invite" | "me" {
  if (pathname === "/ai" || pathname === "/me/peotteok") return "ai";
  if (pathname === "/work") return "work";
  if (pathname === "/invite") return "invite";
  if (pathname === "/me" || pathname.startsWith("/me/") || pathname.startsWith("/wallet/")) return "me";
  return "home";
}
