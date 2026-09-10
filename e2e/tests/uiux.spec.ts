import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MSG } from "../../src/lib/messages.ts";
import { becomeUser, openPage, resetRoutes, waitChallenge } from "../helpers/auth.ts";

async function overflowX(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

// 9개 대표 viewport. 로그인/홈 하단(footer vs mobile-nav) 회귀를 실측치로 확정한다.
const BOTTOM_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
];

type BottomRegionSnapshot = {
  footer: { visible: boolean; top: number; bottom: number; left: number; right: number; height: number; background: string } | null;
  nav: { visible: boolean; top: number; bottom: number; left: number; right: number; height: number; background: string } | null;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  innerHeight: number;
};

async function bottomRegionSnapshot(page: Page): Promise<BottomRegionSnapshot> {
  return page.evaluate(() => {
    function rectOf(el: Element | null) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const visible = cs.display !== "none" && cs.visibility !== "hidden" && !(el as HTMLElement).hidden;
      return { visible, top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, background: cs.backgroundColor };
    }
    return {
      footer: rectOf(document.querySelector("#siteFooter")),
      nav: rectOf(document.querySelector("#mobileNav")),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      innerHeight: window.innerHeight,
    };
  });
}

// 실제 렌더된 색이 CSS 변수 미해석(transparent) 없이 유효한 배경인지 확인한다.
function isResolvedColor(value: string): boolean {
  return value !== "" && value !== "rgba(0, 0, 0, 0)" && value !== "transparent";
}

function assertNoOverflowAndSaneBottom(snap: BottomRegionSnapshot, label: string) {
  expect(snap.scrollWidth - snap.clientWidth, `${label} 가로 넘침`).toBeLessThanOrEqual(1);
  expect(snap.footer && snap.nav ? !(snap.footer.visible && snap.nav.visible) : true, `${label} 푸터/하단탭 동시 노출`).toBeTruthy();
  if (snap.footer?.visible) {
    expect(snap.footer.right - snap.clientWidth, `${label} 푸터 가로 잘림`).toBeLessThanOrEqual(1);
    expect(snap.footer.left, `${label} 푸터 좌측 잘림`).toBeGreaterThanOrEqual(-1);
    expect(snap.footer.height, `${label} 푸터 높이 비정상`).toBeGreaterThan(0);
    expect(isResolvedColor(snap.footer.background), `${label} 푸터 배경색 미해석`).toBeTruthy();
  }
  if (snap.nav?.visible) {
    expect(snap.nav.bottom - snap.innerHeight, `${label} 하단탭 화면 밖으로 잘림`).toBeLessThanOrEqual(1);
    expect(snap.nav.right - snap.clientWidth, `${label} 하단탭 가로 잘림`).toBeLessThanOrEqual(1);
    expect(snap.nav.left, `${label} 하단탭 좌측 잘림`).toBeGreaterThanOrEqual(-1);
    expect(isResolvedColor(snap.nav.background), `${label} 하단탭 배경색 미해석`).toBeTruthy();
  }
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

  test("48. 9개 viewport에서 로그인·홈·404·오프라인 하단 영역 회귀가 없다", async ({ page }) => {
    test.slow();
    const evidence: Record<string, BottomRegionSnapshot> = {};
    const shotDir = path.join("quality", "artifacts", "footer-regression");
    await mkdir(shotDir, { recursive: true });

    for (const viewport of BOTTOM_VIEWPORTS) {
      const tag = `${viewport.width}x${viewport.height}`;
      await page.setViewportSize(viewport);

      await test.step(`${tag} 공개 화면(로그인/가입/404/오프라인)`, async () => {
        await openPage(page, { user: "none" });
        await page.goto("/login");
        await expect(page.locator("#siteFooter")).toBeVisible();
        evidence[`${tag}/login`] = await bottomRegionSnapshot(page);

        await page.goto("/signup");
        await expect(page.locator("#siteFooter")).toBeVisible();
        evidence[`${tag}/signup`] = await bottomRegionSnapshot(page);

        await page.goto("/putduk-qa-no-such-route");
        await expect(page.locator("#siteFooter")).toBeVisible();
        evidence[`${tag}/404`] = await bottomRegionSnapshot(page);

        await page.goto("/offline");
        await expect(page.getByText(MSG.offlineFinance)).toBeVisible();
        evidence[`${tag}/offline`] = await bottomRegionSnapshot(page);

        await resetRoutes(page);
      });

      await test.step(`${tag} 로그인 후 워크스페이스(홈/기회/나)`, async () => {
        await openPage(page, { user: "a" });
        await becomeUser(page);
        evidence[`${tag}/me`] = await bottomRegionSnapshot(page);

        await page.goto("/");
        await expect(page.locator("#siteFooter")).toBeHidden();
        evidence[`${tag}/home-logged-in`] = await bottomRegionSnapshot(page);

        await page.goto("/work");
        await expect(page.locator("#siteFooter")).toBeHidden();
        evidence[`${tag}/work`] = await bottomRegionSnapshot(page);

        await resetRoutes(page);
      });
    }

    await writeFile(path.join(shotDir, "measurements.json"), JSON.stringify(evidence, null, 2), "utf8");

    for (const [label, snap] of Object.entries(evidence)) {
      assertNoOverflowAndSaneBottom(snap, label);
    }

    // 같은 surface(공개 vs 워크스페이스)라면 viewport가 달라도 배경색은 항상 같아야 한다 (배경 단절 회귀 방지).
    const publicBackgrounds = new Set(
      Object.entries(evidence)
        .filter(([label]) => label.endsWith("/login") || label.endsWith("/signup") || label.endsWith("/404"))
        .map(([, snap]) => snap.footer?.background)
        .filter(Boolean),
    );
    expect([...publicBackgrounds], "공개 화면 푸터 배경색이 viewport마다 달라짐").toHaveLength(1);

    // 로그인/가입 푸터 높이는 같은 viewport 안에서 24px 이상 벌어지면 안 된다 (기존 38-40번과 같은 기준을 전 viewport로 확장).
    for (const viewport of BOTTOM_VIEWPORTS) {
      const tag = `${viewport.width}x${viewport.height}`;
      const loginFooter = evidence[`${tag}/login`].footer;
      const signupFooter = evidence[`${tag}/signup`].footer;
      const notFoundFooter = evidence[`${tag}/404`].footer;
      expect(loginFooter && signupFooter && Math.abs(loginFooter.height - signupFooter.height) < 24, `${tag} 로그인 vs 가입 푸터 높이차`).toBeTruthy();
      expect(loginFooter && notFoundFooter && Math.abs(loginFooter.height - notFoundFooter.height) < 24, `${tag} 로그인 vs 404 푸터 높이차`).toBeTruthy();
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await resetRoutes(page);
    await openPage(page, { user: "none" });
    await page.goto("/login");
    await page.screenshot({ path: path.join(shotDir, "390x844-login.png"), fullPage: true });
    await page.goto("/putduk-qa-no-such-route");
    await page.screenshot({ path: path.join(shotDir, "390x844-404.png"), fullPage: true });
    await resetRoutes(page);
    await openPage(page, { user: "a" });
    await becomeUser(page);
    await page.goto("/");
    await page.screenshot({ path: path.join(shotDir, "390x844-home-logged-in.png"), fullPage: true });

    await page.setViewportSize({ width: 1280, height: 720 });
    await resetRoutes(page);
    await openPage(page, { user: "none" });
    await page.goto("/login");
    await page.screenshot({ path: path.join(shotDir, "1280x720-login.png"), fullPage: true });
  });

  test("49. 모바일에서 키보드가 올라와 뷰포트가 줄어도 입력이 깨지지 않는다", async ({ page }) => {
    await openPage(page, { user: "none" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await waitChallenge(page);
    const identifier = page.locator('input[name="identifier"]');
    await identifier.click();
    await identifier.fill("qa-account-a@putduk.test");

    // 가상 키보드가 뜬 상태를 흉내낸다 (뷰포트 높이만 줄어드는 실제 모바일 동작과 동일하게).
    await page.setViewportSize({ width: 390, height: 420 });
    await expect(identifier).toBeFocused();
    expect(await overflowX(page)).toBeLessThanOrEqual(1);
    await identifier.type("-more");
    await expect(identifier).toHaveValue("qa-account-a@putduk.test-more");

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('form[data-form="login"] button[type="submit"]')).toBeVisible();
  });
});
