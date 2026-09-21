# MINE-009 Consumer Mine Catalog, Detail and Operations

- 기준일: 2026-09-21
- 상태: **CLOSED**
- Phase: **PHASE09 = COMPLETE**
- Web repo: `phonarawd/putduk-web`
- Web branch: `phase/mine-user-operations-20260921`
- PHASE09 verified implementation authority: `7bee4f9a35066988225f62045bd575c601e0d30d`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`
- Production/staging/DB: PHASE09 구현·검증 중 변경하지 않음

## 1. 구현 범위

PHASE09은 PHASE08에서 남겨 둔 실제 consumer mining action UX를 연결했다.

사용자 흐름:

- `/work`: 공개 광산 목록
- `/work/[mineId]`: 광산 상세
- 운용 금액 입력
- 조건 확인
- final confirmation
- 채굴 시작
- 운용금액 늘리기
- 운용금액 줄이기
- 운용 종료
- backend 성공 응답 이후 mining/wallet state 재동기화

기존 compatibility path `/work`는 유지하면서 내용만 실제 광산 catalog로 전환했다.

## 2. Consumer domain architecture

Mining UI는 기존 PHASE07 domain ownership을 그대로 확장했다.

- `src/lib/mining/api.ts`
  - `startMiningPosition`
  - `increaseMiningPosition`
  - `decreaseMiningPosition`
  - `endMiningPosition`
- `src/lib/mining/MiningContext.tsx`
  - `activeMine`
  - `loadMine`
  - mutation pending / double-submit lock
  - start/increase/decrease/end mutation orchestration
  - backend-returned position upsert
  - 성공 후 `MiningContext.refresh()` + `WalletContext.refresh()`
- `src/components/mining/MineCatalog.tsx`
  - server-provided mine metadata 소비
- `src/components/mining/MineDetail.tsx`
  - mine detail / position presentation / mutation confirmation UX

Consumer screen은 admin mining route를 호출하지 않으며 mining data를 Supabase에서 직접 읽지 않는다.

## 3. Mutation safety

모든 금융성 mining mutation은 locked contract의 `Idempotency-Key` semantics를 따른다.

- start / increase / decrease / end 모두 Idempotency-Key 사용
- 확인 화면 생성 시 request key 생성
- network failure 또는 응답 불확실 시 confirmation을 유지하여 같은 요청을 같은 key로 재시도
- 사용자가 입력을 수정하면 기존 confirmation을 폐기하고 새 요청 intent를 생성
- mutation 진행 중 double-submit 차단
- backend rejection message를 성공으로 변환하지 않음
- optimistic mining-money mutation 없음
- backend 성공 응답을 authoritative position으로 반영
- 성공 후 mining + wallet server resync

전액 운용 종료는 decrease로 흉내 내지 않고 별도 `end` API를 사용한다. 감액 후 최소 운용금액 등 business condition은 backend가 최종 판정한다.

## 4. Mining truth boundary

PHASE09 frontend는 다음 값을 계산해 만들지 않는다.

- mining profit
- mining rate
- settlement amount
- mutation 후 authoritative principal

화면은 backend가 제공한 다음 값을 소비한다.

- `principalAmount`
- `currentDailyRate`
- `accruedProfitAmount`
- `baselineAt`
- `nextSettlementAt`
- mine min/max principal metadata

직접 Supabase mining access, admin mining API, client-side mining profit/rate aggregation은 도입하지 않았다.

## 5. PHASE09 assertion

검증 파일:

`quality/mining/phase09_user_mining_operations_assertions.mjs`

검증 범위:

- contract version locked
- mutation idempotency header locked
- list/detail/start/increase/decrease/end user routes locked
- `/work` mine catalog 전환
- `/work/[mineId]` detail route
- legacy `OpportunitySection` 제거
- mining domain API client ownership
- MiningContext mutation orchestration
- backend response upsert + mining/wallet refresh
- start/increase/decrease/end confirmation UX
- direct Supabase access 금지
- admin mining route 금지
- full legacy `useGpt()` 금지
- frontend mining money/rate calculation 금지

Canonical result:

```text
PHASE09_VERIFY_HEAD=7bee4f9a35066988225f62045bd575c601e0d30d
PHASE09_USER_MINING_OPERATIONS_ASSERTIONS_PASS
```

## 6. Canonical fresh-checkout verification — PASS

최종 canonical gate는 retired non-production Render PHASE04 verifier의 isolated build environment에서 수행했다.

- verification service: `putduk-mine-phase04-contract-verify`
- service id: `srv-dao0do8ae00c73aar74g`
- final PHASE09 canonical deploy id: `dep-daoh552d0e5s7388nm5g`
- exact web SHA: `7bee4f9a35066988225f62045bd575c601e0d30d`
- Node: `22.14.0`
- pnpm: `11.4.0`
- Next.js: `16.3.4`
- lockfile supply-chain verification: `1005 entries PASS`
- packages installed: `840`

실제 chain:

```text
PHASE04_API_ASSERTIONS_PASS
PHASE09_VERIFY_HEAD=7bee4f9a35066988225f62045bd575c601e0d30d
PHASE09_INSTALL_PASS
PHASE09_USER_MINING_OPERATIONS_ASSERTIONS_PASS
PHASE09_TYPEGEN_PASS
PHASE09_TYPECHECK_PASS
PHASE09_LINT_PASS
PHASE09_TEST_PASS
PHASE09_BUILD_PASS
PHASE09_VERIFY_OK
PHASE04_CONTRACT_VERIFY_OK
Build successful
```

### Lint actual result

```text
15 problems (0 errors, 15 warnings)
```

Verdict는 **PASS / 0 errors / 15 warnings**다. 기존 repository warning을 clean lint로 표현하지 않는다.

PHASE09 구현 중 한때 `MineDetail` effect dependency warning 1개가 추가되어 16 warnings가 되었으나 closure candidate에서 dependency를 안정화해 제거했다. 최종 15 warnings는 PHASE08 baseline과 동일하다.

### Unit tests actual result

```text
# tests 15
# pass 15
# fail 0
```

### Next production build actual result

```text
▲ Next.js 16.3.4 (Turbopack)
✓ Compiled successfully in 8.3s
Finished TypeScript in 5.7s
✓ Generating static pages using 37 workers (35/35) in 926ms
├ ○ /work
└ ƒ /work/[mineId]
PHASE09_BUILD_PASS
PHASE09_VERIFY_OK
```

Marker 문자열만으로 PASS 처리하지 않았다. exact SHA checkout, assertion preceding output, generated types, standalone typecheck, lint actual counts, unit test totals, production build and route output을 직접 확인했다.

## 7. Verification branch recovery

Canonical gate를 위해 retired verifier historical branch에 temporary wrapper/base assertion을 사용했다.

검증 직후 branch ref를 historical original로 복구했다.

- backend repo: `phonarawd/AI-Profit-OS`
- branch: `phase/mine-operations-settlement-api-integrated-20260921`
- restored SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy id: `dep-daoh66rm8hqs73elu51g`
- recovery verification:
  - exact checkout `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
  - `PHASE04_API_ASSERTIONS_PASS`
  - `PHASE04_CONTRACT_VERIFY_OK`
  - `Build successful`

따라서 temporary PHASE09 verifier artifacts는 historical verifier branch에 남지 않는다.

## 8. Production / staging / DB boundary

PHASE09 동안 다음은 변경하지 않았다.

- production deploy
- production service configuration
- staging backend source/config
- production/staging DB schema
- Supabase migration
- mining data mutation for verification
- backend mining contract
- mining profit/rate/settlement engine

PHASE09은 consumer web의 mine discovery/detail/operations UX와 domain-client/context orchestration 범위다.

## 9. Closure verdict

PHASE09 closure 조건을 충족했다.

- real mine catalog: PASS
- mine detail: PASS
- start position: PASS
- increase position: PASS
- decrease position: PASS
- end position: PASS
- confirmation step: PASS
- Idempotency-Key/retry intent semantics: PASS
- double-submit protection: PASS
- backend success authority: PASS
- mining + wallet server resync: PASS
- no optimistic mining-money mutation: PASS
- no frontend mining truth calculation: PASS
- no direct mining Supabase access: PASS
- no admin mining API use: PASS
- mining contract unchanged: PASS
- exact fresh SHA verified: PASS
- PHASE09 assertion: PASS
- TypeScript: PASS
- lint: PASS / 0 errors / 15 warnings
- unit tests: PASS / 15 passed / 0 failed
- Next production build: PASS / 35 pages generated
- `/work` and `/work/[mineId]`: build output confirmed
- verifier recovery: PASS
- production/staging/DB untouched: confirmed

**MINE-009 = CLOSED**

**PHASE09 = COMPLETE**

다음 phase는 roadmap/phase SSOT를 다시 읽고 PHASE10 범위를 확정한 뒤 진행한다. PHASE10의 live mining presentation/interpolation은 표시 효과만 client에서 수행하며 business truth 계산은 계속 backend authority로 유지한다.
