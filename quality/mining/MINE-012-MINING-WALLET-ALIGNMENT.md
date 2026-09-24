# MINE-012 — Mining / Wallet Authority Alignment

- Date: 2026-09-21
- State: CLOSED
- Phase: PHASE12 COMPLETE
- Branch: `phase/mine-wallet-alignment-20260921`
- Verified implementation SHA: `28e8a062e9bb9281cbe95bc1d7d0b2acf0496b18`
- Base closure SHA: `0658d5454bcfd3e1c14497665ae7d329e53a0ab2` (PHASE11)
- Mining contract version: `2026-09-20.mine-v1`
- Mining contract blob SHA: `e7e180e1968194c12f2d720476165889877ca8dd`

## Scope closed

PHASE12 aligns consumer wallet money reads and mining state around explicit domain authorities without changing the mining contract or backend API.

Implemented:

- `WalletContext` is the single consumer authority for wallet money reads through `loadMoneyRead()`.
- `WalletContext` owns initial wallet refresh lifecycle for authenticated session changes.
- `/me` consumes wallet values only from `WalletContext`; its duplicate `loadMoneyRead()` state/effect was removed.
- `WalletSummaryStrip` consumes wallet values only from `WalletContext`; its duplicate `loadMoneyRead()` state/effect was removed.
- `/wallet/withdraw` reads withdrawable profit only from `WalletContext` and refreshes the wallet context after a successful server withdrawal mutation.
- `/wallet/deposit` and `/wallet/withdraw` use the scoped common-UI hook instead of reaching through the full legacy GPT context.
- `/me` uses scoped session/common-UI hooks instead of the full legacy GPT context.
- Mining mutations retain `Promise.all([refresh(), refreshWallet()])` so successful server mutations resynchronize both domain authorities.

## Authority boundary

The consumer frontend keeps wallet truth and mining truth separate.

Wallet authority:

- principal/deposit balance comes from `WalletContext.balance` / `WalletContext.deposit`;
- locked balance comes from `WalletContext.balance`;
- trial principal/locked values come from `WalletContext.trial`;
- withdrawable profit comes from `WalletContext.withdrawable`;
- consumer money surfaces do not call `loadMoneyRead()` directly.

Mining authority:

- active mining principal remains `MiningContext.summary.activePrincipalAmount` from the mining server read contract;
- positions, settlements, live-profit presentation, and mining summary remain owned by `MiningContext`;
- wallet withdrawable profit is not derived from mining `profitAmount` or mining summary values.

Cross-domain invariants:

- no frontend arithmetic combines mining principal/profit with wallet withdrawable balance;
- no wallet consumer surface sorts/reduces mining settlements to create wallet truth;
- no direct Supabase access exists in the PHASE12 consumer money surfaces;
- no `/api/v1/admin/` endpoint is used by consumer money surfaces;
- withdrawal KYC, step-up verification, locked amount/destination checks, and idempotency behavior remain unchanged.

## PHASE12 assertion

Added:

- `quality/mining/phase12_mining_wallet_alignment_assertions.mjs`

The assertion locks:

- mining contract version stability;
- `WalletContext` money-read and refresh lifecycle authority;
- `/me` and `WalletSummaryStrip` removal of duplicate wallet readers and mount refreshes;
- `/wallet/withdraw` use of wallet withdrawable server truth plus post-success wallet refresh;
- mining mutation resync of mining + wallet contexts;
- separation of mining principal/profit from wallet withdrawable values;
- absence of direct Supabase/admin API usage in consumer money surfaces.

## Canonical verification

Isolated non-production verifier service:

- service: `putduk-mine-phase04-contract-verify`
- service ID: `srv-dao0do8ae00c73aar74g`
- workspace: `tea-da5qqo3m8hqs73djpvvg`
- canonical deploy: `dep-daoi3k8ae00c73ck5u40`
- verifier commit: `32d6534f35cadac923158616ece3af276f063a97`
- exact web SHA: `28e8a062e9bb9281cbe95bc1d7d0b2acf0496b18`

Actual canonical results:

- `PHASE04_API_ASSERTIONS_PASS`
- `PHASE12_VERIFY_HEAD=28e8a062e9bb9281cbe95bc1d7d0b2acf0496b18`
- `PHASE12_INSTALL_PASS`
- `PHASE12_MINING_WALLET_ALIGNMENT_ASSERTIONS_PASS`
- `PHASE12_TYPEGEN_PASS`
- `PHASE12_TYPECHECK_PASS`
- lint: `0 errors / 15 warnings` (existing repository warning baseline; no PHASE12 lint error)
- tests: `21 passed / 0 failed`
- `PHASE12_TEST_PASS`
- Next.js: `16.3.4`
- production build: `36/36` static pages generated
- route output includes `○ /activity`, `○ /me`, `○ /wallet/deposit`, and `○ /wallet/withdraw`
- `PHASE12_BUILD_PASS`
- `PHASE12_VERIFY_OK`
- `PHASE04_CONTRACT_VERIFY_OK`
- Render: `Build successful`
- canonical deploy state: `live`

Runtime/toolchain observed in canonical gate:

- Node.js `22.14.0`
- pnpm `11.4.0`
- packages installed: `+840`

## Verifier recovery

After canonical verification, the temporary verifier commits were discarded by force-restoring the verifier branch to its historical authority SHA.

- historical SHA: `a79826aaeb7f97b70fae881f1d423ce0f70a49fe`
- recovery deploy: `dep-daoi4kjm8hqs73epav7g`
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
- Backend API: unchanged
- Canonical verification used only the isolated Render verifier service.

## Closure

`MINE-012 = CLOSED`

`PHASE12 = COMPLETE`
