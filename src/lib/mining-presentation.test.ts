import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MINING_LIVE_MAX_INTERPOLATION_MS,
  presentLiveMiningProfit,
} from "./mining/presentation.ts";

const syncedAt = "2026-09-21T00:00:00.000Z";
const syncedMs = Date.parse(syncedAt);
const activePosition = {
  status: "ACTIVE" as const,
  principalAmount: "100",
  currentDailyRate: "0.01",
  accruedProfitAmount: "2",
  baselineAt: "2026-09-20T12:00:00.000Z",
  nextSettlementAt: "2026-09-22T00:00:00.000Z",
};

test("live mining presentation은 마지막 서버 수익 이후 짧은 구간만 보간한다", () => {
  const result = presentLiveMiningProfit(activePosition, syncedAt, syncedMs + 30_000);
  assert.equal(result.amount, "2.000347222222");
  assert.equal(result.source, "interpolated");
  assert.equal(result.stale, false);
});

test("live mining presentation은 stale 한도를 넘으면 90초에서 멈춘다", () => {
  const result = presentLiveMiningProfit(
    activePosition,
    syncedAt,
    syncedMs + MINING_LIVE_MAX_INTERPOLATION_MS + 30_000,
  );
  assert.equal(result.amount, "2.001041666667");
  assert.equal(result.stale, true);
});

test("live mining presentation은 다음 정산 경계를 넘겨 보간하지 않는다", () => {
  const result = presentLiveMiningProfit(
    { ...activePosition, nextSettlementAt: "2026-09-21T00:00:10.000Z" },
    syncedAt,
    syncedMs + 30_000,
  );
  assert.equal(result.amount, "2.000115740741");
  assert.equal(result.stale, true);
  assert.equal(result.cappedAt, "2026-09-21T00:00:10.000Z");
});

test("비활성 position은 서버 accruedProfitAmount를 그대로 표시한다", () => {
  const result = presentLiveMiningProfit(
    { ...activePosition, status: "ENDED" as const },
    syncedAt,
    syncedMs + 30_000,
  );
  assert.equal(result.amount, "2");
  assert.equal(result.source, "server");
});

test("유효하지 않은 rate나 server sync가 있으면 추정값을 만들지 않는다", () => {
  assert.equal(
    presentLiveMiningProfit({ ...activePosition, currentDailyRate: null }, syncedAt, syncedMs + 30_000).amount,
    "2",
  );
  assert.equal(presentLiveMiningProfit(activePosition, null, syncedMs + 30_000).amount, "2");
});

test("표시 계산이 유한하지 않으면 authoritative server amount로 되돌아간다", () => {
  const result = presentLiveMiningProfit(
    { ...activePosition, principalAmount: "999999999999999999" },
    syncedAt,
    Number.MAX_VALUE,
  );
  assert.equal(result.amount, "2");
  assert.equal(result.source, "server");
});
