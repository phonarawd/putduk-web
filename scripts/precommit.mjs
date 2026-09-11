// 커밋 전 30초 목표: 이번에 올리는 ts/tsx 파일만 lint하고, 전체 typecheck을 돈다.
// (전체 lint는 이 저장소 규모에서 실측 약 2분 넘게 걸려 pre-commit에 못 쓴다 - eslint는 push 전이 아니라
//  변경분만 여기서, 전체 검사는 CI의 quality job이 매 PR마다 돈다.)
// git hook(.githooks/pre-commit)이 이 스크립트를 부른다. Windows cmd/PowerShell에서도 그대로 동작하도록
// 셸 문법 없이 순수 Node로 짠다.
import { execFileSync } from "node:child_process";

const isWin = process.platform === "win32";

// pnpm은 Windows에서 .cmd 배치 파일이라 execFileSync가 shell 없이는 못 띄운다(EINVAL).
// shell:true + 배열 인자를 같이 쓰면 Node가 DEP0190 경고를 내므로, cmd.exe를 직접 실행 파일로
// 불러 인자를 그대로 넘긴다(각 인자는 여전히 배열 그대로 CreateProcess에 전달돼 셸 결합이 없다).
function run(pnpmArgs) {
  if (isWin) {
    execFileSync("cmd.exe", ["/d", "/s", "/c", "pnpm", ...pnpmArgs], { stdio: "inherit" });
  } else {
    execFileSync("pnpm", pnpmArgs, { stdio: "inherit" });
  }
}

function stagedTsFiles() {
  const output = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACM"], {
    encoding: "utf8",
  });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\.(ts|tsx)$/.test(line));
}

const files = stagedTsFiles();
if (files.length > 0) {
  console.log(`[precommit] eslint 대상 ${files.length}개 파일`);
  run(["exec", "eslint", ...files]);
} else {
  console.log("[precommit] staged된 ts/tsx 없음, eslint 생략");
}

console.log("[precommit] tsc --noEmit");
run(["exec", "tsc", "--noEmit"]);
console.log("[precommit] 통과");
