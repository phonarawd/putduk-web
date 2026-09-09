"use client";

import { usePathname } from "next/navigation";
import { WORKSPACE_PATHS } from "./constants";
import { useGpt } from "./GptContext";

// 헤더 nav·모바일 하단탭·푸터 표시 여부를 한 곳에서 계산한다. (원본 setSurface/updateHeader 로직)
export function useAppSurface() {
  const pathname = usePathname();
  const { state } = useGpt();

  const inWorkspaceGroup = WORKSPACE_PATHS.includes(pathname);
  const isHomeIntro = pathname === "/" && !state.loggedIn;
  const surfaceIsWorkspace = inWorkspaceGroup && !isHomeIntro;

  return {
    pathname,
    surfaceIsWorkspace,
    showNav: surfaceIsWorkspace && state.loggedIn,
    showFooter: !surfaceIsWorkspace,
  };
}
