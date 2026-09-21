"use client";

import { usePathname } from "next/navigation";
import { WORKSPACE_PATHS } from "./constants";
import { useGptSession } from "./GptScopes";

// 헤더 nav·모바일 하단탭·푸터 표시 여부를 한 곳에서 계산한다. (원본 setSurface/updateHeader 로직)
export function useAppSurface() {
  const pathname = usePathname();
  const { loggedIn } = useGptSession();

  const inWorkspaceGroup =
    WORKSPACE_PATHS.includes(pathname) || pathname.startsWith("/me/") || pathname.startsWith("/wallet/");
  const isHomeIntro = pathname === "/" && !loggedIn;
  const surfaceIsWorkspace = inWorkspaceGroup && !isHomeIntro;

  return {
    pathname,
    surfaceIsWorkspace,
    showNav: surfaceIsWorkspace && loggedIn,
    showFooter: !surfaceIsWorkspace,
  };
}
