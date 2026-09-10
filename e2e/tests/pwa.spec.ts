import { expect, test } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

test.use({ serviceWorkers: "allow" });

test.describe("PWA", () => {
  test("manifest 필수 필드와 아이콘", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/");
    const manifest = await page.evaluate(async () => {
      const res = await fetch("/manifest.webmanifest");
      return res.json();
    });
    expect(manifest.name).toBe("퍼뜩");
    expect(manifest.short_name).toBe("퍼뜩");
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBe("#ffffff");
    expect(manifest.background_color).toBe("#ffffff");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test("service worker가 등록되고 금융 경로를 캐시하지 않는다", async ({ page }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/");
    await expect.poll(async () => page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.scope || "")).toContain("http://127.0.0.1:4173/");
    const cachedWallet = await page.evaluate(async () => {
      const keys = await caches.keys();
      for (const key of keys) {
        const cache = await caches.open(key);
        const match = await cache.match("/wallet/deposit");
        if (match) return true;
      }
      return false;
    });
    expect(cachedWallet).toBeFalsy();
  });

  test("오프라인 금융 화면은 잔액 없이 정직하다", async ({ page, context }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/offline");
    await expect(page.getByText(MSG.offlineFinance)).toBeVisible();
    await expect(page.locator("#availableCapital, #availableUsdt, #settledProfit")).toHaveCount(0);
    await expect(page.getByText(/12\.50 USDT|18,000원/)).toHaveCount(0);
    await context.setOffline(true);
    await page.goto("/wallet/deposit").catch(() => undefined);
    await expect(page.getByText(MSG.offlineFinance)).toBeVisible();
  });
});
