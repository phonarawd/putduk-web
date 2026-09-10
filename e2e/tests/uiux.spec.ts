import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage, resetRoutes, waitChallenge } from "../helpers/auth.ts";

async function overflowX(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test.describe("UI/UX 38-47", () => {
  test("38-40. 로그인과 홈 푸터·100dvh", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/login");
    await expect(page.locator("#siteFooter")).toBeVisible();
    const loginFooter = await page.locator("#siteFooter").boundingBox();
    await page.goto("/");
    await expect(page.locator("#siteFooter")).toBeVisible();
    const homeFooter = await page.locator("#siteFooter").boundingBox();
    expect(loginFooter && homeFooter && Math.abs(loginFooter.height - homeFooter.height) < 24).toBeTruthy();
    const shellHeight = await page.locator(".app-shell").evaluate((el) => el.getBoundingClientRect().height);
    expect(shellHeight).toBeGreaterThanOrEqual(page.viewportSize()!.height - 2);
    expect(await overflowX(page)).toBeLessThanOrEqual(1);
  });

  test("39. 로그인 후 홈에서는 푸터를 숨긴다", async ({ page }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/");
    await expect(page.locator("#siteFooter")).toBeHidden();
  });

  test("41. 대표 viewport에서 가로 넘침이 없다", async ({ page }) => {
    await openPage(page, { user: "none" });
    for (const viewport of [
      { width: 320, height: 568 },
      { width: 360, height: 800 },
      { width: 375, height: 812 },
      { width: 390, height: 844 },
      { width: 412, height: 915 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      expect(await overflowX(page), `${viewport.width}x${viewport.height}`).toBeLessThanOrEqual(1);
    }
  });

  test("42-43. 입금 탭 키보드와 ARIA", async ({ page }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/wallet/deposit");
    const krw = page.locator("#deposit-tab-krw");
    const usdt = page.locator("#deposit-tab-usdt");
    await expect(krw).toHaveAttribute("aria-controls", "deposit-panel-krw");
    await expect(page.locator("#deposit-panel-krw")).toHaveAttribute("aria-labelledby", "deposit-tab-krw");
    await krw.focus();
    await page.keyboard.press("ArrowRight");
    await expect(usdt).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(krw).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("End");
    await expect(usdt).toHaveAttribute("aria-selected", "true");
  });

  test("44. 제출 버튼은 진행 중 다시 누르지 못한다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/login");
    await waitChallenge(page);
    await page.locator('input[name="identifier"]').fill("qa-account-a@putduk.test");
    await page.locator('input[name="password"]').fill("password1");
    const button = page.locator('form[data-form="login"] button[type="submit"]');
    const request = page.waitForRequest((req) => req.url().includes("/api/v1/auth/login"));
    await button.click();
    await expect(button).toBeDisabled();
    await request;
  });

  test("45. 오류 후 다시 시도", async ({ page }) => {
    await openPage(page, { user: "a", ledger: "error" });
    await becomeUser(page);
    await page.goto("/wallet/history");
    await expect(page.getByText("내역을 가져오지 못했어요.")).toBeVisible();
    await page.getByRole("button", { name: MSG.withdrawPolicyRetry }).click();
    await expect(page.getByText("내역을 가져오지 못했어요.")).toBeVisible();
  });

  test("46. 빈 상태와 오류·느린 안내를 나눈다", async ({ page }) => {
    await openPage(page, { user: "a", krw: "empty" });
    await becomeUser(page);
    await page.goto("/wallet/deposit");
    await expect(page.getByText(MSG.depositGuideEmpty)).toBeVisible();
    await resetRoutes(page);
    await openPage(page, { user: "a", krw: "error" });
    await page.goto("/wallet/deposit");
    await expect(page.getByText(MSG.depositGuideFail)).toBeVisible();
  });

  test("47. 이미지 자리 예약으로 레이아웃이 크게 밀리지 않는다", async ({ page }) => {
    await openPage(page, { user: "a", depositAddress: true });
    await becomeUser(page);
    await page.goto("/wallet/deposit");
    await page.locator("#deposit-tab-usdt").click();
    const box = page.locator(".qr-preview");
    await expect(box).toBeVisible();
    const before = await box.boundingBox();
    await expect(page.locator(".deposit-qr-canvas")).toBeVisible();
    const after = await box.boundingBox();
    expect(before && after && Math.abs(before.height - after.height) < 8).toBeTruthy();
  });
});
