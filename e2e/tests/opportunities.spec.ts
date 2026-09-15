import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

test("로그인 후 기회 목록은 opportunities 응답만 그리고 eBay 레거시 70건은 다시 안 뜬다", async ({ page }) => {
  await openPage(page, { user: "a", homeReadLegacy: true });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.locator("#featuredTitle")).toHaveText("점검용 기회");
  await expect(page.getByText("eBay legacy 1")).toHaveCount(0);
  await expect(page.getByText("eBay legacy 70")).toHaveCount(0);
  await expect(page.locator("#opportunityRail .opportunity-mini")).toHaveCount(1);
});

test("빈 목록이면 상품 없음이고 샘플을 넣지 않는다", async ({ page }) => {
  await openPage(page, { user: "a", opportunities: "empty" });
  await becomeUser(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.getByText("eBay legacy")).toHaveCount(0);
  await expect(page.locator("#startMatch")).toBeHidden();
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.locator(".view-count")).toHaveText("0개");
});

test("상세 404면 목록에서 숨기고 상품 없음으로 둔다", async ({ page }) => {
  await openPage(page, { user: "a", opportunityDetail: "404" });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.locator("#featuredTitle")).toHaveCount(0);
});

test("참여 거절은 백엔드 한글 메시지와 같다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "daily-cap" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText("오늘 참여 횟수를 모두 썼어요.");
});

test("정지 거절은 백엔드 한글 메시지와 같다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "blocked" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText(MSG.matchBlocked);
});
