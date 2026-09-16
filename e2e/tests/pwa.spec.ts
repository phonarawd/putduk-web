import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage } from "../helpers/auth.ts";

test.use({ serviceWorkers: "allow" });

type OfflineProbe = {
  onLine: boolean;
  controlled: boolean;
  swState: string | null;
  cacheHasOffline: boolean;
  url: string;
  title: string;
  bodyText: string;
};

async function probeOffline(page: Page): Promise<OfflineProbe> {
  return page.evaluate(async () => {
    const keys = await caches.keys();
    let cacheHasOffline = false;
    for (const key of keys) {
      if (await (await caches.open(key)).match("/offline")) cacheHasOffline = true;
    }
    return {
      onLine: navigator.onLine,
      controlled: Boolean(navigator.serviceWorker.controller),
      swState: navigator.serviceWorker.controller?.state ?? null,
      cacheHasOffline,
      url: location.href,
      title: document.title,
      bodyText: (document.body?.innerText || "").slice(0, 400),
    };
  });
}

async function waitUntilSwReadyWithOfflineCache(page: Page) {
  await expect
    .poll(async () => {
      const snap = await probeOffline(page);
      return snap.controlled && snap.swState === "activated" && snap.cacheHasOffline;
    })
    .toBeTruthy();
}

function isTestOrigin(url: URL) {
  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

async function gotoGatedPathOffline(page: Page, context: BrowserContext, path: string) {
  await waitUntilSwReadyWithOfflineCache(page);
  // 오프라인인데 mock API가 세션을 성공으로 채워 로그인 화면으로 가면 안 된다.
  // Firefox setOffline은 항해를 about:neterror로 보내 SW fetch를 건너뛰고, 문구 검사를 비운다.
  // 페이지 mock만 걷고 검사 원점이 아닌 요청을 막아, 세션 실패를 연결 없음과 같게 만든다.
  await page.unrouteAll({ behavior: "ignoreErrors" }).catch(() => undefined);
  await context.route((url) => !isTestOrigin(url), (route) => route.abort());
  await expect
    .poll(async () => {
      const snap = await probeOffline(page);
      return snap.controlled && snap.cacheHasOffline;
    })
    .toBeTruthy();
  await page.goto(path, { waitUntil: "domcontentloaded" }).catch(() => undefined);
  try {
    await expect(page.getByText(MSG.offlineFinance)).toBeVisible();
  } catch (error) {
    const snap = await probeOffline(page).catch(() => null);
    throw new Error(`offline UI missing path=${path} probe=${JSON.stringify(snap)} ${(error as Error).message}`);
  }
}

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
    // 설치 가능(installability) 조건: 안드로이드/데스크톱이 요구하는 maskable 아이콘이 있어야 한다.
    const hasMaskable = manifest.icons.some((icon: { purpose?: string }) => (icon.purpose || "").includes("maskable"));
    expect(hasMaskable).toBeTruthy();
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
    await gotoGatedPathOffline(page, context, "/wallet/deposit");
    await expect(page.locator("#availableCapital, #availableUsdt, #settledProfit")).toHaveCount(0);
    await expect(page.getByText(/12\.50 USDT|18,000원/)).toHaveCount(0);
  });

  test("오프라인에서는 임의의 화면도 오프라인 안내로 대체되고 브라우저 기본 오류 화면이 뜨지 않는다", async ({ page, context }) => {
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/offline");
    await gotoGatedPathOffline(page, context, "/me/membership");
    await expect(page.locator("h1", { hasText: "새싹" })).toHaveCount(0);
  });

  test("서비스워커가 새로 활성화되면 이전 버전 캐시를 지운다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.goto("/");
    await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBeTruthy();
    // 이전 버전이 남긴 것처럼 캐시를 하나 심어 두고, 등록을 지운 뒤 새로고침해 PwaRegister가
    // 다시 register()하게 만든다 - 실제 배포 갱신과 같은 install→activate 전체 주기를 재현한다.
    await page.evaluate(async () => {
      await caches.open("putduk-static-old-version-stub");
    });
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg?.unregister();
    });
    await page.reload();
    await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 15_000 }).toBeTruthy();
    const keys = await page.evaluate(() => caches.keys());
    expect(keys).not.toContain("putduk-static-old-version-stub");
    expect(keys.every((key) => !key.startsWith("putduk-") || key.startsWith("putduk-static-putduk-web-sw-"))).toBeTruthy();
  });

  test("인증·잔액·원장·KYC·멤버십 API 응답은 어떤 캐시 이름에도 저장되지 않는다", async ({ page }) => {
    await openPage(page, { user: "a", kyc: "pending" });
    await becomeUser(page);
    for (const path of ["/me", "/wallet/withdraw", "/wallet/history", "/me/kyc", "/me/membership", "/work"]) {
      // WebKit은 이전 페이지가 완전히 자리잡기 전에 다음 goto를 부르면 "다른 내비게이션에 끊겼다"고
      // 던진다. 화면이 실제로 자리잡을 때까지(.route-screen/.workspace) 기다린 뒤 다음 경로로 넘어간다.
      await page.goto(path).catch(() => undefined);
      await page.locator(".route-screen, .workspace").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    }
    const sensitivePatterns = [/\/api\/v1\//, /\/wallet\//, /\/me(\/|$)/, /\/auth\//];
    const leaked = await page.evaluate(async () => {
      const keys = await caches.keys();
      const urls: string[] = [];
      for (const key of keys) {
        const cache = await caches.open(key);
        const requests = await cache.keys();
        urls.push(...requests.map((request) => request.url));
      }
      return urls;
    });
    const offenders = leaked.filter((url) => sensitivePatterns.some((pattern) => pattern.test(new URL(url).pathname)));
    expect(offenders, offenders.join(", ")).toEqual([]);
  });
});
