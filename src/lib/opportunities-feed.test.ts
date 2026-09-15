import assert from "node:assert/strict";
import { test } from "node:test";
import { readListFeed, readOpportunity } from "./api.ts";

const operatorItem = {
  id: "opp-op-1",
  assetLabel: "운영 공개 상품",
  supplySource: "operator",
  bucket: "affordable",
  requiredCapitalUsdt: "10.000000",
  requiredCapitalKrwApprox: 14500,
  pricingVersion: 1,
  expectedProfitUsdt: "0.400000",
  expectedProfitKrwApprox: 580,
  assetImageUrl: "https://cdn.example/op.png",
};

test("기회 목록은 items만 읽고 home-read listFeed 레거시는 그리지 않는다", () => {
  const fromApi = readListFeed({ items: [operatorItem] });
  assert.equal(fromApi.length, 1);
  assert.equal(fromApi[0]?.title, "운영 공개 상품");
  assert.equal(fromApi[0]?.imageUrl, "https://cdn.example/op.png");

  const ebayHome = {
    listFeed: Array.from({ length: 70 }, (_, index) => ({
      id: `ebay-${index}`,
      title: `eBay legacy ${index + 1}`,
      supplySource: "legacy_external",
      compareReady: true,
    })),
  };
  assert.deepEqual(readListFeed(ebayHome), []);
  assert.deepEqual(readListFeed({ opportunity: { itemCount: 70, listFeed: ebayHome.listFeed } }), []);
  assert.deepEqual(readListFeed({ items: [] }), []);
});

test("legacy_external 행은 items에 있어도 그리지 않는다", () => {
  const feed = readListFeed({
    items: [
      operatorItem,
      { id: "ebay-1", title: "eBay legacy 1", supplySource: "legacy_external", compareReady: true },
    ],
  });
  assert.equal(feed.length, 1);
  assert.equal(feed[0]?.id, "opp-op-1");
});

test("상세는 item 래퍼만 읽고 목록 첫 행으로 대체하지 않는다", () => {
  const detail = readOpportunity({
    principalUsdt: "12.5",
    item: operatorItem,
  });
  assert.equal(detail?.id, "opp-op-1");
  assert.equal(detail?.title, "운영 공개 상품");
  assert.equal(readOpportunity({ items: [operatorItem, { id: "other", assetLabel: "다른 상품" }] }), null);
});
