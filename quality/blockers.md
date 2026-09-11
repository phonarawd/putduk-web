# BLOCKED (2026-09-11 세션 종료 시점)

작업 전 HEAD `5535bfd506f2c5122b343f720c932fb1d13b7592`. 작업 후 HEAD `dd20d2b8d8c5f20accb9eba33420a3ba1367b00a` (문서 커밋 전).
PR https://github.com/phonarawd/putduk-web/pull/1. MERGED: NO. DEPLOYED: NO.

| 항목 | 상태 | 원인 | 재개 조건 |
|---|---|---|---|
| 실 API 성별·원장 display·Google complete·KYC 한도 | BLOCKED_BACKEND (=BLOCKED_ENV) | 백엔드 PR #222 `0fa38d77a4a461ae1b20eb81d7f5a2380a9fbaf3` 재확인: state OPEN, merged false, MERGED: NO, DEPLOYED: NO. 운영 마이그레이션 미적용 | 운영 SHA + 마이그레이션 적용 후 실호출 |
| 운영 백엔드 SHA | BLOCKED_ENV (=BLOCKED_BACKEND) | `api.hiptk.app` 프로세스 SHA 미확인 (이 레포는 화면만 고쳐 확인 권한 없음) | health `gitSha` |
| Lighthouse Perf (수정 후 SHA) | NOT_RUN | 이번 세션의 제품 변경(`dd20d2b` SW v3·AuthGate 오프라인) 이후 로컬 LHCI를 돌리지 않음. 아래 숫자는 **수정 전** `5535bfd` CI 아티팩트 | 새 SHA에서 quality job 또는 로컬 `lhci autorun` 3회 |
| WebKit / Mobile Safari (수정 후 SHA) | NOT_RUN | 제품 변경 이후 로컬 미실행. 수정 후 CI `browsers`는 푸시 직후 in-progress | CI run 완료 또는 로컬 재실행 |
| Firefox (수정 후 SHA) | FIREFOX_ADVISORY / NOT_RUN | 제품 변경(세션 실패≠로그아웃, SW 캐시 문서) 이후 Firefox를 로컬에서 다시 돌리지 않음. 수정 전 `5535bfd` CI는 같은 SHA에서 browsers FAIL 후 재실행 SUCCESS(플레이크) | 새 SHA에서 Firefox 1회 이상 실제 통과/실패 기록 |
| 연속 3회 회귀 (5브라우저) | PARTIAL | 로컬 Chromium 전체 스펙 3연속 PASS(85/85). Mobile Chrome 1회 PASS, 2회는 중단(INTERRUPTED). 5브라우저×3은 로컬 저사양으로 안 함. nightly는 default 브랜치 병합 전 트리거 불가 | CI browsers+quality 완료 + nightly는 main 병합 후 |
| BrowserStack | BLOCKED_ENV | 키 없음 | 프로젝트 키 |
| 실계정·실구글·실자금·실 QR 스캔 | BLOCKED_ENV | 운영 파괴 호출 금지 | 샌드박스 계정 |
| 운영 배포·PR 머지 | BLOCKED_ENV | 이번 작업 범위 밖 | Founder 승인 |
| Pretendard 폰트 미세 렌더링 차이(회귀 아님) | 확인+허용 | GitHub Actions(Ubuntu) 320px 로그인 후 홈 15~17px, mobile-chrome 하단 nav 3px. `body{overflow-x:hidden}`이라 보이는 가로 스크롤은 없음. 허용치 이미 문서화 | Linux에서 직접 재현은 선택 |
| `pnpm audit` 8건(1 low/3 moderate/4 high) | 확인, 미수정 | 아래 분류. 업그레이드 승인 없음 | 승인 후 `@lhci/cli` / `@opennextjs/cloudflare` / `wrangler` 검토 |

## pnpm audit 분류 (2026-09-11 로컬 1회, 업그레이드 없음)

브라우저 런타임(`next` / `react` / `qrcode`) 경로에는 취약점 출력 없음. 그렇다고 나머지가 “devDep라 무해”는 아니다.

CI·품질 도구(devDependency `@lhci/cli` 전이):

- high `tmp` — `@lhci/cli` > inquirer/external-editor, `@lhci/cli` > tmp
- high `extract-zip` ×2 — `@lhci/cli` > lighthouse > puppeteer-core > `@puppeteer/browsers`
- moderate `uuid` — `@lhci/cli` > uuid
- moderate `qs` ×2 — `@lhci/cli` > express > qs
- low `tmp` — 같은 `@lhci/cli` 경로

배포 도구(프로덕션 선언 의존성 포함):

- high `sharp` — `dependencies`의 `@opennextjs/cloudflare` > wrangler > miniflare > sharp, 그리고 `devDependencies`의 `wrangler` > miniflare > sharp. 클라이언트 번들이 아니라 Cloudflare 빌드/프리뷰 경로다. 프로덕션에 선언된 패키지이므로 무시하지 않는다.
