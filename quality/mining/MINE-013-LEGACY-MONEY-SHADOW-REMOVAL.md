# MINE-013 — Legacy Money Shadow Removal

- Date: 2026-09-21
- State: CLOSED
- Phase: PHASE13 COMPLETE
- Branch: `phase/mine-legacy-money-shadow-removal-20260921`
- Base closure SHA: `f221d94f3c2fa05855668878162d255ba545ac48` (PHASE12)
- Verified implementation SHA: `6b295b14d3be9b931de09d53af3abb74538b2ca8`
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

## Scope closed

PHASE13 removes the remaining legacy wallet-money shadow state from the GPT desk store and deletes the dead virtual-capital modal without changing the mining contract, backend API, or participation contract.

Implemented:

- `GptContext.reloadDesk()` no longer calls wallet/home money readers.
- `GptContext` no longer imports or uses `getHomeMoneyRead`, `getHomeRead`, `getWalletBuckets`, `fillMissingKrw`, `mergeApiRows`, or `readMoney`.
- The GPT store no longer declares, seeds, or writes `principalUsdt`, `principalKrw`, `lockedUsdt`, `lockedKrw`, `profitUsdt`, `profitKrw`, `practiceUsdt`, or `practiceKrw`.
- `reloadDesk()` now refreshes only opportunity feed, trial state, and trade records that belong to the GPT/opportunity desk domain.
- Dead virtual-capital state/actions were removed from `GptContext`.
- `CapitalModal.tsx` was deleted and `AppShell` no longer loads or renders it.
- The residual `capitalModal.open` presentation signal in `AmbassadorVisual` was removed after canonical typecheck exposed it.
- Opportunity eligibility remains based on server-derived feed/trial truth rather than frontend wallet arithmetic.

## Authority boundary

Wallet money authority remains `WalletContext`.

- consumer money reads continue through `WalletContext.loadMoneyRead()`;
- withdrawable profit remains `WalletContext.withdrawable`;
- the GPT desk store has no duplicated wallet principal/locked/profit/practice truth;
- the removed virtual-capital UI cannot synthesize a local money amount.

Opportunity/trial authority remains server-derived.

- `item.bucket` and `item.affordable` come from the opportunity feed/read contract;
- trial participation uses `trial.grantStatus` and `trial.participationsRemaining`;
- eligibility does not read GPT wallet-shadow principal/profit values;
- preflight, idempotent participation, trade ticks, and server result handling remain unchanged.

Mining authority remains separate.

- mining summary/positions/settlements remain owned by `MiningContext`;
- PHASE13 does not change mining contract fields or routes;
- no mining amount is converted into wallet truth in the GPT desk.

## Changed surfaces

- `src/lib/gpt/GptContext.tsx`
- `src/lib/gpt/types.ts`
- `src/lib/gpt/state.ts`
- `src/components/gpt/AppShell.tsx`
- `src/components/gpt/AmbassadorVisual.tsx`
- deleted `src/components/gpt/CapitalModal.tsx`
- added `quality/mining/phase13_legacy_money_shadow_removal_assertions.mjs`

## PHASE13 assertion

`quality/mining/phase13_legacy_money_shadow_removal_assertions.mjs` locks:

- mining contract version stability;
- absence of duplicate wallet money API reads from `GptContext`;
- absence of the eight legacy money-shadow fields in `GptState`, default state, and `GptContext` writes;
- deletion of `CapitalModal.tsx` and removal of all virtual-capital context consumers;
- server-derived opportunity/trial eligibility inputs;
- continued `WalletContext` money authority;
- recursive rejection of any `state.<legacy-money-field>` consumer under `src`.

## Canonical verification

Isolated non-production verifier service:

- service: `putduk-mine-phase04-contract-verify`
- service ID: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- successful canonical deploy: `dep-daoia9gae00c73cktjv0`
- verifier commit: `6722f504f286b5c72273db8fcd73863bdcaf5fd9`
- exact web SHA: `6b295b14d3be9b931de09d53af3abb74538b2ca8`

Successful canonical results:

- `VERIFY_HEAD=6722f504f286b5c72273db8fcd73863bdcaf5fd9`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE13_VERIFY_HEAD=6b295b14d3be9b931de09d53af3abb74538b2ca8`
- `PHASE13_INSTALL_PASS`
- `PHASE13_LEGACY_MONEY_SHADOW_REMOVAL_ASSERTIONS_PASS`
- `PHASE13_TYPEGEN_PASS`
- `PHASE13_TYPECHECK_PASS`
- lint: `0 errors / 15 warnings` (existing repository warning baseline)
- tests: `21 passed / 0 failed`
- `PHASE13_TEST_PASS`
- Next.js `16.3.4`
- production build: `36/36` static pages generated
- route output includes `○ /activity`, `○ /me`, `○ /wallet/deposit`, `○ /wallet/withdraw`, `○ /work`, and `ƒ /work/[mineId]`
- `PHASE13_BUILD_PASS`
- `PHASE13_VERIFY_OK`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- canonical deploy state: `live`

Runtime/toolchain observed:

- Node.js `22.14.0`
- pnpm `11.4.0`
- packages installed: `+840`

## Canonical inspection / correction

The first isolated candidate deploy intentionally exposed one residual consumer during full typecheck:

- first deploy: `dep-daoi97mk1f9s73c6kt1g`
- first candidate SHA: `dbac42cf7db5f134d3c5a300469d45c0eb863b70`
- assertion and type generation passed;
- typecheck found `AmbassadorVisual.tsx` still reading `capitalModal.open` only as a presentation signal;
- that stale signal was removed;
- the PHASE13 assertion was strengthened to recursively reject any remaining virtual-capital consumer;
- corrected exact SHA `6b295b14d3be9b931de09d53af3abb74538b2ca8` passed the complete canonical gate.

## Verifier recovery

After successful canonical verification, the verifier branch was force-restored to its historical authority commit.

- historical SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daoibg2d0e5s738d7mag`
- `VERIFY_HEAD=a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- recovery deploy state: `live`

## Environment impact

- Production: untouched
- Staging: untouched
- Database: untouched
- Backend API: unchanged
- Mining contract: unchanged
- Canonical verification used only the isolated Render verifier service.

## Closure

`MINE-013 = CLOSED`

`PHASE13 = COMPLETE`
