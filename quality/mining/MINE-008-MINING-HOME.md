# MINE-008 사용자 채굴 홈

- 기준일: 2026-09-21
- 상태: **CLOSED**
- Phase: **PHASE08 = COMPLETE**
- Web repo: `phonarawd/putduk-web`
- Web branch: `phase/mine-web-home-20260921`
- PHASE08 verified implementation authority: `c8568e1760693a15d98b75f6acea8ea0d2ca343d`
- PHASE07 base closure HEAD: `bf697404b7a908ea20956c534550e17073c356ca`
- Mining contract version: `2026-09-20.mine-v1`
- Production: PHASE08 구현·검증 중 변경하지 않음

## 1. SSOT 범위

Release master의 PHASE08 범위를 그대로 적용했다.

- 리셀 중심 홈 제거
- 상단: 오늘 채굴 / 운용 중 / 출금 가능
- 아래: 내 채굴장 / 최근 정산
- 하단 `기회` 사용자 표시명을 `광산`으로 교체
- `/work`는 전환 기간 내부 호환 route로 유지
- PHASE09 광산 목록·상세·운용 mutation은 구현하지 않음
- PHASE10 실시간 수익 보간은 구현하지 않음

## 2. 사용자 홈 전환

`src/app/page.tsx`를 consumer mining dashboard로 전환했다.

로그인 전:

- `PUTDUK MINE OS`
- 디지털 광산 세계관
- 서버 기준 수익·정산 authority 안내
- 로그인 / 회원가입 진입
- 리셀 업무, 시세 매칭, eBay/Amazon/KREAM 등 reseller partner wall 제거

로그인 후:

- `오늘 채굴`
  - backend summary의 `activePositionCount` 표시
- `운용 중`
  - backend summary의 `activePrincipalAmount` 표시
- `출금 가능`
  - `WalletContext.withdrawable` 표시
- `내 채굴장`
  - 진행 중 position 목록
  - server-returned `principalAmount`
  - server-returned `accruedProfitAmount`
  - `nextSettlementAt`
  - 한국어 lifecycle status
- `최근 정산`
  - 최근 3건
  - server-returned `profitAmount`
  - 한국어 settlement status
  - raw internal code 미노출

API 오류/미확인 상태에서는 금융 값을 임의 `0`으로 꾸미지 않고 `확인 필요`, `표시할 정보 없음` 등 명시적 상태를 보여 준다.

## 3. 금융 authority 경계

PHASE08 frontend는 mining business truth를 계산하지 않는다.

- `activePositionCount`는 server summary 값 사용
- `activePrincipalAmount`는 server summary 값 사용
- position `accruedProfitAmount`는 backend response를 그대로 표시
- settlement `profitAmount`는 backend response를 그대로 표시
- withdrawable은 `WalletContext` server-backed state 사용
- frontend 합산 수익 계산 없음
- frontend daily-rate 수익 계산 없음
- PHASE10 display interpolation 없음
- direct Supabase mining read 없음

금액 presentation helper는 decimal string의 표시용 천 단위 구분만 수행하며 금융 산술을 수행하지 않는다.

## 4. navigation / compatibility

사용자 visible navigation:

```text
홈 / 광산 / 퍼뜩AI / 초대 / 나
```

기존 `/work` path는 전환기 내부 호환을 위해 유지한다.

`/work`는 reseller Opportunity UI를 렌더링하지 않고:

```text
/#mine-yard
```

로 이동한다.

따라서 route compatibility를 유지하면서 사용자에게는 `기회`가 아닌 `광산`으로 표시된다.

## 5. 공통 브랜드 surface

PHASE08 범위에서 다음 공통 surface도 mining 세계관으로 갱신했다.

- Header subtitle: `MINE OS`
- Header logged-in identity: legacy resellerId 대신 scoped session display name / `광산 계정`
- Footer title: `PUTDUK MINE OS`
- Metadata title: `퍼뜩 마인 OS`
- Metadata description: 광산 운용 / 채굴 / 출금 가능 / 정산 중심
- Mineral Luxury 전용 mining home stylesheet 추가

## 6. PHASE08 assertion

검증 파일:

`quality/mining/phase08_mining_home_assertions.mjs`

주요 검증:

- home이 `useMining`, `useWallet`, `useGptSession` 사용
- `오늘 채굴 / 운용 중 / 출금 가능 / 내 채굴장 / 최근 정산` 존재
- server `activePositionCount`, `activePrincipalAmount`, `accruedProfitAmount` 사용
- reseller `OpportunitySection`, `HomeBanners`, ambassador opportunity surface 제거
- home direct Supabase 금지
- frontend parseFloat/parseInt 기반 수익 계산 금지
- nav `기회 -> 광산`
- `/work -> /#mine-yard` compatibility
- header/footer/metadata reseller brand 제거
- mining contract version 유지

Fresh checkout actual output:

```text
PHASE08_VERIFY_HEAD=c8568e1760693a15d98b75f6acea8ea0d2ca343d
PHASE08_MINING_HOME_ASSERTIONS_PASS
```

## 7. Canonical fresh-checkout verification — PASS

기존 isolated non-production Render verifier의 build environment에서 exact implementation SHA를 fresh checkout했다.

- verification service: retired PHASE04 contract verifier
- service id: `srv-dao0do8ae00c73aar74g`
- verifier deploy id: `dep-daog81qd0e5s7385dd20`
- exact web SHA: `c8568e1760693a15d98b75f6acea8ea0d2ca343d`
- Node: `22.14.0`
- pnpm: `11.4.0`
- install: original `pnpm-lock.yaml` + patchedDependencies + `--frozen-lockfile`
- packages: 840
- `@opennextjs/cloudflare`: `1.20.6`
- Next.js: `16.3.4`
- Wrangler: `4.129.1`

Actual chain:

```text
PHASE08_VERIFY_HEAD=c8568e1760693a15d98b75f6acea8ea0d2ca343d
PHASE08_MINING_HOME_ASSERTIONS_PASS
PHASE08_NODE=v22.14.0
11.4.0
PHASE08_INSTALL_PASS
PHASE08_TYPEGEN_PASS
PHASE08_TYPECHECK_PASS
PHASE08_LINT_PASS
PHASE08_TEST_PASS
PHASE08_BUILD_PASS
PHASE08_VERIFY_OK
```

Marker 단독으로 PASS 처리하지 않았다. 각 preceding command의 actual output과 성공 exit를 개별 확인했다.

### Install

```text
Packages: +840
Done in 15.8s using pnpm v11.4.0
PHASE08_INSTALL_PASS
```

Lockfile supply-chain policy 검사도 PASS했다.

### Type generation / TypeScript

```text
Generating route types...
✓ Types generated successfully
PHASE08_TYPEGEN_PASS
PHASE08_TYPECHECK_PASS
```

### Lint

```text
15 problems (0 errors, 15 warnings)
PHASE08_LINT_PASS
```

정확한 verdict는 **PASS / 0 errors / 15 warnings**다.

### Unit tests

```text
# tests 15
# pass 15
# fail 0
PHASE08_TEST_PASS
```

### Next build

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 7.3s
Finished TypeScript in 5.0s
✓ Generating static pages using 36 workers (35/35)
PHASE08_BUILD_PASS
PHASE08_VERIFY_OK
```

Render outer build도 `Build successful`을 확인했다.

## 8. Temporary verifier cleanup

PHASE08 canonical gate 직후 retired PHASE04 verifier branch를 pre-verification authority로 즉시 복원했다.

Restored branch authority:

`a79826aaeb7f97b70fae881f1d423ce0f70a49fe`

Restored PHASE04 assertion blob:

`a1f97d91ef043957ee2355645789544eeabfdf89`

PHASE08 verifier source는 historical branch에 남기지 않았다.

## 9. Production boundary

PHASE08에서 변경하지 않은 것:

- production web deploy
- production backend deploy
- production DB
- staging mining backend
- Supabase schema
- mining rate logic
- mining contract
- PHASE09 participation mutations
- PHASE10 live interpolation

구현 및 canonical verification은 phase branch와 isolated retired verifier에서만 수행했다.

## 10. Closure verdict

PHASE08 완료 조건:

- reseller-centered home removed: PASS
- 오늘 채굴 / 운용 중 / 출금 가능: PASS
- 내 채굴장 / 최근 정산: PASS
- `기회 -> 광산` user navigation: PASS
- `/work` compatibility preserved without reseller surface: PASS
- server financial authority preserved: PASS
- no direct Supabase mining read: PASS
- no frontend profit calculation authority: PASS
- exact fresh SHA verified: PASS
- PHASE08 assertion: PASS
- TypeScript: PASS
- lint: PASS / 0 errors / 15 warnings
- unit tests: PASS / 15 passed / 0 failed
- Next build: PASS
- `PHASE08_VERIFY_OK`: confirmed
- production untouched: confirmed

**MINE-008 = CLOSED**

**PHASE08 = COMPLETE**

다음 단계는 PHASE09이며, release master 규칙에 따라 별도 관리자 진행 지시 후 시작한다.
