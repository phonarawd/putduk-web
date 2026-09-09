import type { ReactNode } from "react";

// 홈/기회/퍼뜩AI/초대/나 다섯 개 탭 화면의 공통 바깥 래퍼. (원본 #workspace.workspace.shell 그대로)
export function WorkspaceView({ children }: { children: ReactNode }) {
  return <div className="workspace shell">{children}</div>;
}
