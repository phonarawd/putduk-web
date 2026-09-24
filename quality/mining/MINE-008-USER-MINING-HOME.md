# MINE-008 Consumer Mining Home

- 기준일: 2026-09-21
- 상태: **CLOSED**
- Phase: **PHASE08 = COMPLETE**
- Web repo: `phonarawd/putduk-web`
- Web branch: `phase/mine-user-home-20260921`
- PHASE08 verified implementation authority: `da8f50c6d259d3be48301d450fbb531e1d2849c5`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`
- Production: PHASE08 구현/검증 중 변경하지 않음

## 1. 구현 범위

PHASE08은 기존 consumer home의 리셀 중심 진입 경험을 mining product 중심 홈으로 전환했다.

사용자 홈 상단:

- `오늘 채굴`
- `운용 중`
- `출금 가능`

사용자 홈 하단:

- `내 채굴장`
- `최근 정산`

사용자 navigation:

- 표시명 `기회 -> 광산`
- compatibility route `/work`는 PHASE09 실제 광산 목록/상세/운용 전환 전까지 유지

비로그인 홈도 리셀/기회 중심 문구를 제거하고 mining product 설명과 로그인/회원가입 진입으로 전환했다.

PHASE08은 광산 목록/상세/신규 운용 mutation UI까지 확장하지 않았다. 해당 범위는 PHASE09에 남긴다.

## 2. Authority / data binding

PHASE07에서 분리한 domain context를 PHASE08 홈에서 직접 소비한다.

- `useMining()`
  - mining summary
  - positions
  - server-returned `accruedProfitAmount`
  - settlements
  - mine metadata
- `useWallet()`
  - withdrawable KRW/USDT
- `useGptSession()`
  - session/display name only

브라우저는 mining business truth를 새로 만들지 않는다.

- direct Supabase mining read 없음
- admin mining API 호출 없음
- frontend profit/rate/settlement 계산 없음
- locked mining contract 변경 없음

## 3. `오늘 채굴` 의미 보정

PHASE08 closure 전 backend authority를 재대조하면서 중요한 semantic guard를 확정했다.

Backend `MiningSummary.profitAmount`는 당일 발생 수익이 아니라 `mining_wallet_liability.profit_usdt`에서 읽는 누적 profit liability다. 따라서 이를 `오늘 채굴`로 표시하지 않는다.

또한 locked mining contract에는 여러 활성 포지션의 당일 수익을 aggregate해서 반환하는 별도 summary field가 없다.

PHASE08은 이 제약을 다음처럼 처리한다.

- 활성 포지션 0건: 서버 summary의 active count를 근거로 `0 USDT`
- 활성 포지션 1건: 해당 position이 서버에서 받은 `accruedProfitAmount`를 표시
- 활성 포지션 2건 이상: frontend가 값을 합산하지 않고 `광산별 확인` 표시
- 광산별 카드에는 각 position의 서버 반환 `accruedProfitAmount`를 그대로 표시

단일 활성 포지션의 `accruedProfitAmount`는 backend가 `baselineAt -> now` 구간을 profit engine으로 계산해 반환하는 current settlement-interval 값이다. UI detail도 이를 `현재 정산 구간의 서버 채굴 수익`으로 명시한다.

이 규칙으로 `오늘 채굴`에 누적 지갑수익을 잘못 붙이거나 frontend가 여러 포지션 수익을 임의 합산하는 것을 모두 방지했다.

## 4. PHASE08 assertion

검증 파일:

`quality/mining/phase08_user_mining_home_assertions.mjs`

검증 범위:

- locked mining contract version / user route
- home이 `MiningHome`을 사용
- legacy resale `OpportunitySection`, `principalSuggestion`, `리셀` 홈 잔재 금지
- 필수 UI `오늘 채굴 / 운용 중 / 출금 가능 / 내 채굴장 / 최근 정산`
- `useMining / useWallet / useGptSession` domain ownership
- server `accruedProfitAmount` binding
- `MiningSummary.profitAmount`를 today mining으로 사용하는 코드 금지
- frontend mining profit arithmetic / aggregation 금지
- direct Supabase mining access 금지
- user nav 표시명 `광산`
- locked Nest mining user API route 유지

Fresh checkout 결과:

```text
PHASE08_VERIFY_HEAD=da8f50c6d259d3be48301d450fbb531e1d2849c5
PHASE08_USER_MINING_HOME_ASSERTIONS_PASS
```

## 5. Canonical fresh-checkout verification — PASS

최종 canonical gate는 isolated retired non-production Render verifier의 build environment에서 수행했다.

- verification service: retired PHASE04 contract verifier
- service id: `srv-dao0do8ae00c73aar74g`
- final deploy id: `dep-daogk5uk1f9s73c0jntg`
- exact web SHA: `da8f50c6d259d3be48301d450fbb531e1d2849c5`
- Node: `22.14.0`
- pnpm: `11.4.0`
- install: original `pnpm-lock.yaml` + project patchedDependencies + `--frozen-lockfile`
- supply-chain lockfile verification: 1005 entries PASS
- packages installed: 840
- Next.js: `16.3.4`
- `@opennextjs/cloudflare`: `1.20.6`
- `wrangler`: `4.129.1`

실제 chain:

```text
PHASE04_API_ASSERTIONS_PASS
PHASE08_VERIFY_HEAD=da8f50c6d259d3be48301d450fbb531e1d2849c5
PHASE08_INSTALL_PASS
PHASE08_USER_MINING_HOME_ASSERTIONS_PASS
PHASE08_TYPEGEN_PASS
PHASE08_TYPECHECK_PASS
PHASE08_LINT_PASS
PHASE08_TEST_PASS
PHASE08_BUILD_PASS
PHASE08_VERIFY_OK
PHASE04_CONTRACT_VERIFY_OK
```

### Lint actual result

```text
15 problems (0 errors, 15 warnings)
```

Verdict는 **PASS / 0 errors / 15 warnings**다. 기존 warning을 clean lint로 표현하지 않는다.

### Unit tests actual result

```text
# tests 15
# pass 15
# fail 0
```

### Next production build actual result

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 7.9s
Finished TypeScript in 5.5s
✓ Generating static pages using 36 workers (35/35) in 771ms
PHASE08_BUILD_PASS
PHASE08_VERIFY_OK
```

Marker 단독으로 PASS 처리하지 않았다. assertion, generated types, standalone typecheck, lint, unit tests, production build의 preceding command output을 모두 확인했다.

## 6. Verification branch recovery

Canonical gate를 위해 retired verifier의 historical branch assertion 파일을 일시적으로 verifier wrapper로 사용했다.

검증 완료 직후 branch ref를 historical original로 복구했다.

- branch: `phase/mine-operations-settlement-api-integrated-20260921`
- restored SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- original assertion blob: `a1f97d91ef043957ee2355645789544eeabfdf89`

Production/staging branch에는 이 verifier 작업을 적용하지 않았다.

## 7. Production / DB / API boundary

PHASE08 동안 다음은 변경하지 않았다.

- production deploy
- production DB
- staging mining backend source/config
- Supabase schema/data
- mining rate/profit engine logic
- backend user API contract
- locked mining contract

PHASE08은 consumer web home/view binding만 변경했다.

## 8. Closure verdict

PHASE08 closure 조건을 충족했다.

- resale-centric home replacement: PASS
- mining home required sections: PASS
- navigation `광산`: PASS
- domain context binding: PASS
- cumulative profit semantic mislabel prevented: PASS
- no frontend multi-position profit aggregation: PASS
- no direct mining Supabase access: PASS
- mining contract unchanged: PASS
- exact fresh SHA verified: PASS
- PHASE08 assertion: PASS
- TypeScript: PASS
- lint: PASS / 0 errors / 15 warnings
- unit tests: PASS / 15 passed / 0 failed
- Next production build: PASS / 35 pages generated
- `PHASE08_VERIFY_OK`: confirmed
- production/staging/DB untouched: confirmed

**MINE-008 = CLOSED**

**PHASE08 = COMPLETE**

PHASE09은 roadmap/phase SSOT를 다시 읽고 실제 광산 목록/상세/운용 UI 범위를 확정한 뒤 별도 phase로 시작한다.
