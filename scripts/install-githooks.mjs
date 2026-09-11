// git config를 바꾸지 않고 .githooks를 .git/hooks로 복사한다.
// pnpm install의 prepare가 호출한다. .git이 없으면(아카이브 등) 조용히 끝낸다.
import { chmodSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const gitDir = join(root, ".git");
const hooksDir = join(gitDir, "hooks");
const sourceDir = join(root, ".githooks");

if (!existsSync(gitDir) || !existsSync(sourceDir)) {
  process.exit(0);
}
if (!existsSync(hooksDir)) mkdirSync(hooksDir, { recursive: true });

for (const name of ["pre-commit", "pre-push"]) {
  const from = join(sourceDir, name);
  const to = join(hooksDir, name);
  if (!existsSync(from)) continue;
  copyFileSync(from, to);
  if (process.platform !== "win32") chmodSync(to, 0o755);
}
