# MINE-011 — Mining Activity / Settlement History

- Date: 2026-09-21
- State: CLOSED
- Phase: PHASE11 COMPLETE
- Branch: `phase/mine-activity-history-20260921`
- Verified implementation SHA: `31a2882c32d36fd0a8e29ab77692187e94e7d878`
- Base closure SHA: `b0090185412d2bf456feeed68a789eac2aa800d4` (PHASE10)
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

## Scope closed

PHASE11 adds a user-facing mining activity/history surface at `/activity` using the existing backend mining read contract.

Implemented:

- `/activity` inside the existing application workspace.
- Read-only mining settlement history from `MiningContext.settlements`.
- Read-only mining position history from `MiningContext.positions`.
- `/work` entry link: `채굴 활동 보기`.
- Mining navigation state remains active for `/work`, `/work/*`, and `/activity`.
- Logged-out activity state routes the user to login without issuing any mining mutation.
- Logged-in refresh uses the existing `MiningContext.refresh()` path.

## Server-authority boundary

The frontend remains a display consumer only.

- Settlement data comes through `GET /api/v1/mining/me/settlements` via `listMyMiningSettlements()` and `MiningContext`.
- The activity screen does not call `apiFetch` directly.
- No direct Supabase mining access exists in the activity screen.
- No admin mining endpoint is used.
- The settlement array is not sorted, re-sorted, reduced, or aggregated in the activity screen; backend ordering is preserved.
- Settlement `profitAmount` is displayed per server item and is not recalculated or summed in the frontend.
- Position principal/status values are displayed from server position objects and are not reconstructed from events.
- Mining live-profit interpolation introduced in PHASE10 is not used to create settlement/history truth.

Backend read semantics verified from the mining read service:

- settlement list order: `period_end DESC, id DESC`;
- for `LEDGER_POSTED`, backend `profitAmount` is the credited ledger-posted amount;
- for other settlement states, backend `profitAmount` is the calculated amount returned by the API;
- `settlementId`, `positionId`, `status`, `periodStartAt`, `periodEndAt`, `assetCode`, and `ledgerJournalId` are displayed from the backend response.

## Canonical verification

Retired non-production verifier service:

- service: `putduk-mine-phase04-contract-verify`
- service ID: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- canonical deploy: `dep-daohkeajnfac7390q5q0`
- exact web SHA: `31a2882c32d36fd0a8e29ab77692187e94e7d878`

Actual canonical results:

- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE11_VERIFY_HEAD=31a2882c32d36fd0a8e29ab77692187e94e7d878`
- `PHASE11_INSTALL_PASS`
- `PHASE11_MINING_ACTIVITY_HISTORY_ASSERTIONS_PASS`
- `PHASE11_TYPEGEN_PASS`
- `PHASE11_TYPECHECK_PASS`
- lint: `0 errors / 15 warnings` (existing repository warning baseline; no new PHASE11 lint error)
- tests: `21 passed / 0 failed`
- `PHASE11_TEST_PASS`
- Next.js: `16.3.4`
- production build: `36/36` static pages generated
- route output includes `○ /activity`
- `PHASE11_BUILD_PASS`
- `PHASE11_VERIFY_OK`
- Render: `Build successful`

Runtime/toolchain observed in canonical gate:

- Node.js `22.14.0`
- pnpm `11.4.0`
- packages installed: `+840`

## Verifier recovery

After canonical verification, the verifier branch was force-restored to its historical authority SHA:

- historical SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daohlqgae00c73cil0c0`
- exact historical checkout confirmed
- `VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- recovery deploy state: `live`

## Environment impact

- Production: untouched
- Staging: untouched
- Database: untouched
- Mining contract: unchanged
- GitHub Actions quota-failed runs: not rerun

## Closure

`MINE-011 = CLOSED`

`PHASE11 = COMPLETE`
