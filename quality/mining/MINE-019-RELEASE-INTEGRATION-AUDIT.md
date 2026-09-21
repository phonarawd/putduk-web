# MINE-019 — RELEASE INTEGRATION AUDIT

Status: **AUDIT COMPLETE — CORRECTED — RELEASE BLOCKED**  
Audit date: 2026-09-21  
Correction date: 2026-09-21  
Scope: consumer/backend/admin/mining contract/database/staging release graph  
Production mutation: **NONE**

## 1. Purpose

MINE-019 freezes the exact release inputs, checks branch ancestry and API/contract parity, audits database/staging readiness, and records blockers that must be resolved before a release candidate can exist.

This audit does not ship mining to Production, change the mining contract, or apply Production migrations.

## 2. Authoritative inputs

### Consumer

- Repository: `phonarawd/putduk-web`
- PHASE18 base SHA: `a5aebf994a56a9cc10a816333aa9e23a4b4189e6`
- PHASE19 branch: `phase/mine-release-readiness-20260921`
- PHASE19 canonical verification SHA: `606802f50860a2ce56f7e34bc1bd68b602fa7ea5`

### Backend

Repository: `phonarawd/AI-Profit-OS`

| Role | Exact authority |
| --- | --- |
| production/main baseline | `ad395b4fa9f5d82c4dd2ac64d5eafa5c7ee4e8fd` |
| contract lock | `b4c1311dd042c0b5bfde8705971cf8b66df4a552` |
| **PHASE02 DB foundation closure** | `74b80fd3963047c2e97fb9ed3004dbff664743b6` |
| profit engine closure | `1d690a8ffdc0f7233f58b5693b8bd6e21da23a23` |
| user API / settlement integration / historical verifier authority | `a79826aaeb7f97b70fae881f1d423ce0f70a49fe` |
| admin API | `d6e279841aaa62b7b75f26a7b33d1768923d551b` |
| historical E2E runner tip | `3b17a54c56d67f35047db37a0624b171eb485d39` |

### Important correction: stale branch label

The branch `phase/mine-db-foundation-20260920` currently points at `50c3316eedbc8acc2c20ad7837ebe90df5a9338f`, but that commit is **not** the DB foundation closure. Its commit message is `PHASE 03: Rust 수익계산 엔진 (#236)` and it is a PHASE03 implementation commit whose parent is the real PHASE02 DB closure `74b80fd3963047c2e97fb9ed3004dbff664743b6`.

Therefore release ancestry must use exact commit meaning, not the stale branch label.

## 3. Mining contract lock

- contract version: `2026-09-20.mine-v1`
- Git blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

The exact contract blob matches the audited consumer, PHASE04/user API, admin, and historical E2E tips. No contract drift was found.

## 4. Corrected backend ancestry

| Comparison | Result | Release meaning |
| --- | --- | --- |
| DB closure `74b80f…` → profit `1d690a…` | profit ahead by 9, behind 0 | **linear**; profit contains DB foundation |
| DB closure `74b80f…` → admin `d6e279…` | admin ahead by 46, behind 0 | admin contains DB foundation and later mining work |
| profit `1d690a…` → PHASE04 `a79826…` | PHASE04 descends from profit line | user API line contains profit engine |
| PHASE04 `a79826…` → admin `d6e279…` | admin descends from PHASE04 line | admin contains user API/settlement line |
| admin `d6e279…` ↔ E2E `3b17a…` | **diverged**; merge-base `8630dbf7c197c37c9888fd66588e5976af56059c` | historical E2E tip is not a release superset of admin |
| main `ad395b…` → admin `d6e279…` | admin descends from audited main | valid backend integration base |

### Resolved: former BLOCKER-BE-ANCESTRY-01

The earlier PHASE19 version incorrectly treated `50c331…` as the DB foundation tip and therefore reported a DB/profit divergence blocker. That interpretation is withdrawn.

**Correct state:** DB foundation closure `74b80fd…` is a direct ancestor of the profit/admin line. No DB-vs-profit merge is required.

### BLOCKER-BE-ANCESTRY-02

The historical E2E tip diverges from admin at `8630dbf7c197c37c9888fd66588e5976af56059c`. It must not be promoted as a backend release candidate. A current E2E runner must be rebuilt from the integrated admin/release line.

## 5. User API parity

The contract defines 12 user mining endpoints.

Implemented by both current consumer and audited backend line:

1. `GET /api/v1/mines`
2. `GET /api/v1/mines/:mineId`
3. `GET /api/v1/mining/me/summary`
4. `GET /api/v1/mining/me/positions`
5. `GET /api/v1/mining/me/positions/:positionId`
6. `GET /api/v1/mining/me/settlements`
7. `POST /api/v1/mining/positions/start`
8. `POST /api/v1/mining/positions/:positionId/increase`
9. `POST /api/v1/mining/positions/:positionId/decrease`
10. `POST /api/v1/mining/positions/:positionId/end`

Contract-defined but absent from both audited consumer mining API surface and backend user controller:

- `GET /api/v1/mining/trial`
- `POST /api/v1/mining/trial/start`

This is a contract-completeness gap, not a consumer/backend route mismatch.

## 6. Admin API parity

The audited admin branch implements the 20 PHASE05 lifecycle/rate/position/settlement endpoints.

The following 6 contract-defined endpoints remain absent:

- `GET /api/v1/admin/mining/trial-config`
- `PATCH /api/v1/admin/mining/trial-config`
- `GET /api/v1/admin/mining/high-value-reviews`
- `GET /api/v1/admin/mining/high-value-reviews/:reviewId`
- `POST /api/v1/admin/mining/high-value-reviews/:reviewId/approve`
- `POST /api/v1/admin/mining/high-value-reviews/:reviewId/reject`

### BLOCKER-CONTRACT-COMPLETENESS-01

Resolve without weakening `2026-09-20.mine-v1`:

- user trial status/start: 2 endpoints
- admin trial config: 2 endpoints
- high-value review lifecycle: 4 endpoints

The mining foundation already contains `mine_trial_sessions` and `mine_high_value_reviews`, so the missing scope is primarily service/API/config integration rather than absence of the core trial/review tables.

## 7. Database source vs Production — corrected migration identity

Actual mining foundation migration:

`supabase/migrations/20260920134053_mining_foundation_v1.sql`

Blob at audited admin SHA:

`990117b58b323617a5fb14594fc46fbc42fa883b`

Admin controls migration:

`supabase/migrations/20260921162500_mining_admin_controls_v1.sql`

The foundation migration creates, among other mining objects:

- `mines`
- `mine_rate_versions`
- `mine_positions`
- `mine_position_events`
- `mine_accruals`
- `mine_settlements`
- `mine_trial_sessions`
- `mine_high_value_reviews`

### Production read-only audit

Production project: `PUTDUK-DATA-PRODUCTION` (`gaugwamwceqdnqdqrxqg`), status `ACTIVE_HEALTHY`.

The current Production migration list ends at `20260920205033 / stage10_task_runs_real_activity_index` and **does not contain `20260920134053_mining_foundation_v1`**. The absence is explicit even though later-numbered migrations exist; migration ordering alone must not be used as evidence of application.

No Production mining schema mutation was performed by PHASE19/PHASE20 work.

### BLOCKER-PROD-MIGRATION-01

Mining source migrations are not present in the audited Production migration history. Production rollout requires isolated rehearsal, rollback evidence, and explicit launch approval.

## 8. Staging audit

- Render service `putduk-mine-api-staging` exists and its audited live deploy used admin SHA `d6e279841aaa62b7b75f26a7b33d1768923d551b`.
- Historical PHASE06 self-test rejected the Production ref and only accepted separate staging ref `mgsytcetsiecllmhcyox`.
- The currently connected Supabase inventory exposes only Production; the historical staging ref is not currently available.
- Historical E2E tip `3b17a54…` is verifier residue, not a current real mining mutation E2E runner.

### BLOCKER-STAGING-DB-01

No currently available isolated non-Production Supabase staging project/branch has been verified.

### BLOCKER-STAGING-E2E-01

Rebuild real current-SHA mining E2E from the integrated backend line and run it only against an identity-checked isolated staging DB.

## 9. Release blocker inventory

| ID | Status | Required next evidence |
| --- | --- | --- |
| former `BLOCKER-BE-ANCESTRY-01` | **RESOLVED / AUDIT CORRECTION** | DB closure `74b80f…` verified as ancestor of profit/admin |
| `BLOCKER-BE-ANCESTRY-02` | OPEN | rebuild current E2E from integrated admin/release line |
| `BLOCKER-CONTRACT-COMPLETENESS-01` | OPEN | implement/version-scope 2 user trial + 6 admin endpoints |
| `BLOCKER-STAGING-DB-01` | OPEN | isolated non-Production DB exists and project identity is verified |
| `BLOCKER-STAGING-E2E-01` | OPEN | real mutation E2E passes on current exact SHAs |
| `BLOCKER-PROD-MIGRATION-01` | OPEN | migration rehearsal/rollback/approval complete |

## 10. Corrected next integration order

1. Create backend release-integration branch directly from admin SHA `d6e279841aaa62b7b75f26a7b33d1768923d551b`.
2. Do **not** merge `phase/mine-db-foundation-20260920`; its branch ref is stale/misleading and the real DB foundation is already in admin ancestry.
3. Implement the contract-defined trial/trial-config/high-value review completeness scope on the integration branch.
4. Rebuild current E2E from that integration SHA.
5. Provision/recover an isolated Supabase staging database and verify its project ref is not Production.
6. Apply mining migrations only to isolated staging first.
7. Run real API mutation E2E and consumer QA.
8. Freeze an exact-SHA RC only after remaining blockers close.
9. Present any Production launch/migration action separately for explicit approval.

## 11. Canonical PHASE19 verification

Canonical consumer audit implementation SHA:

`606802f50860a2ce56f7e34bc1bd68b602fa7ea5`

Verification deploy:

`dep-daojhrlg1s2s738kb6tg`

Result:

```text
PHASE19_RELEASE_READINESS_ASSERTIONS_PASS
PHASE19_TYPEGEN_PASS
PHASE19_TYPECHECK_PASS
PHASE19_LINT_PASS
PHASE19_TEST_PASS
PHASE19_BUILD_PASS
PHASE19_VERIFY_OK
```

Quality evidence:

- tests: 21 passed / 0 failed
- lint: 0 errors / 15 pre-existing warnings
- Next production build: 36/36 static pages generated

Historical verifier branch was restored to:

`a79826aaeb7f97b70fae881f1d423ce0f70a49fe`

Recovery deploy:

`dep-daojj63bc2fs73e9f280`

## 12. Safety / closure

**Production untouched.**

MINE-019 remains complete as an audit, with this correction superseding the earlier branch-label interpretation. Release is still blocked by contract completeness, staging, current E2E, and Production-migration gates.
