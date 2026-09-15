import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

const SHOT_DIR = "/opt/cursor/artifacts/screenshots";

test("로그인 후 기회 목록은 opportunities 응답만 그리고 eBay 레거시 70건은 다시 안 뜬다", async ({ page }) => {
  const oppGets: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (request.method() === "GET" && /\/api\/v1\/opportunities\/?$/.test(new URL(url).pathname)) {
      oppGets.push(url);
    }
  });
  await openPage(page, { user: "a", homeReadLegacy: true });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.locator("#featuredTitle")).toHaveText("점검용 기회");
  await expect(page.getByText("eBay legacy 1")).toHaveCount(0);
  await expect(page.getByText("eBay legacy 70")).toHaveCount(0);
  await expect(page.locator("#opportunityRail .opportunity-mini")).toHaveCount(1);
  expect(oppGets.some((url) => url.startsWith("https://api.hiptk.app/api/v1/opportunities"))).toBeTruthy();
  await page.screenshot({ path: `${SHOT_DIR}/work-operator-only.png`, fullPage: true });
});

test("빈 목록이면 상품 없음이고 샘플을 넣지 않는다", async ({ page }) => {
  await openPage(page, { user: "a", opportunities: "empty" });
  await becomeUser(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.getByText("eBay legacy")).toHaveCount(0);
  await expect(page.getByText("자동 매칭 상품")).toHaveCount(0);
  await expect(page.locator("#startMatch")).toBeHidden();
  await page.screenshot({ path: `${SHOT_DIR}/home-empty-none.png`, fullPage: true });
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.locator(".view-count")).toHaveText("0개");
  await page.screenshot({ path: `${SHOT_DIR}/work-empty-none.png`, fullPage: true });
});

test("상세 404면 목록에서 숨기고 상품 없음으로 둔다", async ({ page }) => {
  await openPage(page, { user: "a", opportunityDetail: "404" });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.locator("#featuredTitle")).toHaveCount(0);
  await page.screenshot({ path: `${SHOT_DIR}/work-detail-404.png`, fullPage: true });
});

test("지정 회원이 아니면 그 상품이 목록에 안 보인다", async ({ page }) => {
  await openPage(page, { user: "b", opportunities: "selected-a" });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.getByRole("heading", { name: "상품 없음" })).toBeVisible();
  await expect(page.getByText("점검용 기회")).toHaveCount(0);
  await page.screenshot({ path: `${SHOT_DIR}/work-not-selected-member.png`, fullPage: true });
});

test("opportunities에 레거시가 섞여 와도 operator만 그린다", async ({ page }) => {
  await openPage(page, { user: "a", opportunities: "mixed-legacy" });
  await becomeUser(page);
  await page.goto("/work");
  await expect(page.locator("#featuredTitle")).toHaveText("점검용 기회");
  await expect(page.getByText("eBay legacy")).toHaveCount(0);
  await expect(page.locator("#opportunityRail .opportunity-mini")).toHaveCount(1);
});

test("참여 성공은 백엔드 접수 문구와 같다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "ok" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText(MSG.participateOk);
  await page.screenshot({ path: `${SHOT_DIR}/work-participate-ok.png`, fullPage: true });
});

test("참여 거절은 백엔드 한글 메시지와 같다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "daily-cap" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText("오늘 참여 횟수를 모두 썼어요.");
  await page.screenshot({ path: `${SHOT_DIR}/work-daily-cap.png`, fullPage: true });
});

test("toastCode만 오면 일일 캡 문구로 보여 준다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "daily-cap-code" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText(MSG.dailyMatchCap);
});

test("정지 거절은 백엔드 한글 메시지와 같다", async ({ page }) => {
  await openPage(page, { user: "a", participate: "blocked" });
  await becomeUser(page);
  await page.goto("/work");
  await page.locator("#startMatch").click();
  await page.locator("#preflightConfirm").click();
  await expect(page.locator("#toast")).toContainText(MSG.matchBlocked);
  await page.screenshot({ path: `${SHOT_DIR}/work-match-blocked.png`, fullPage: true });
});
