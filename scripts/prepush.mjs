// 푸시 전 3분 목표: unit 전체 + 빠른 Chromium 스모크(로그인/인증 흐름 + QR)만 돈다.
// 전체 5 프로젝트·전체 route는 push마다 돌기엔 무거워 PR REQUIRED(quality job)와 nightly가 맡는다.
// 이 스모크는 파일별 변경 매핑이 아니라 고정된 두 스펙(가장 기초적인 인증 흐름 + 캔버스 렌더링 경로)이다 -
// 로컬 저사양 PC라 매 push마다 전체를 돌리지 않기로 한 의도적 축소이며, 전체는 CI에서 항상 돈다.
import { execFileSync } from "node:child_process";

const isWin = process.platform === "win32";

// pnpm은 Windows에서 .cmd라 shell 없이 execFileSync로 못 띄운다. shell:true+배열 인자 조합은
// Node가 DEP0190을 경고해 cmd.exe를 실행 파일로 직접 불러 배열 인자를 그대로 넘긴다.
function run(pnpmArgs) {
  if (isWin) {
    execFileSync("cmd.exe", ["/d", "/s", "/c", "pnpm", ...pnpmArgs], { stdio: "inherit" });
  } else {
    execFileSync("pnpm", pnpmArgs, { stdio: "inherit" });
  }
}

console.log("[prepush] unit test");
run(["test"]);

console.log("[prepush] chromium smoke: auth + qr");
run(["exec", "playwright", "test", "--project=chromium", "e2e/tests/auth.spec.ts", "e2e/tests/qr.spec.ts"]);

console.log("[prepush] 통과");
